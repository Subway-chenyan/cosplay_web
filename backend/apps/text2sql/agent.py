import logging
import os
import re
from functools import lru_cache

import psycopg2
from django.conf import settings

from apps.text2sql.schema import ALLOWED_TABLES, RELATIONSHIPS, get_table_schema, get_tables

logger = logging.getLogger(__name__)


# --- SQL safety ---

_DANGEROUS_RE = re.compile(
    r'^\s*(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE|EXECUTE|COPY)\b',
    re.IGNORECASE,
)
_TABLE_NAME_RE = re.compile(
    r'(?:FROM|JOIN)\s+([\w]+)',
    re.IGNORECASE,
)
_CTE_NAME_RE = re.compile(
    r'(?:WITH|,)\s+([\w]+)\s+AS\s*\(',
    re.IGNORECASE,
)
_SQL_BLOCK_RE = re.compile(r'```(?:sql)?\s*(.*?)```', re.IGNORECASE | re.DOTALL)
_VALUE_CONTEXT_CACHE: str | None = None
_TRACING_CONFIGURED = False

_STATIC_VALUE_CONTEXT = """\
Domain value hints:

- awards_award.name stores award names. If the user says "金奖", "cj金奖", or "ChinaJoy金奖",
  combine `competitions_competition.name ILIKE '%ChinaJoy%'` with `awards_award.name ILIKE '%金奖%'`.
- If the user says "金龙", "金龙奖", or "金龙奖COSPLAY全国大赛", treat it as the competition
  "金龙奖COSPLAY全国大赛" and match `competitions_competition.name ILIKE '%金龙%'`;
  if sampled values do not contain 金龙, keep the predicate and allow an empty result.
- If the user says "国漫动作奖" or "动作奖", prefer award names containing both "国漫" and "动作奖",
  for example "国漫动作奖".
- If the user says "CJ", "cj", or "ChinaJoy", prefer `competitions_competition.name ILIKE '%ChinaJoy%'`.
- If the user says "国漫" or "国漫大赛", match competition, award, or tag names containing "国漫".
- tags_tag.name stores IP/style tags. For IP/style questions, join tags_videotag and tags_tag.
"""

_FEW_SHOT_SQL_EXAMPLES = """\
Few-shot SQL examples:

Question: 同时获得 ChinaJoy金奖 和 国漫动作奖 的社团有哪些？
SQLQuery:
SELECT
  g.id AS group_id,
  g.name,
  COUNT(DISTINCT ar.id) AS award_count
FROM groups_group g
JOIN awards_awardrecord ar ON ar.group_id = g.id
JOIN awards_award a ON a.id = ar.award_id
WHERE a.name ILIKE '%ChinaJoy金奖%' OR a.name ILIKE '%国漫动作奖%'
GROUP BY g.id, g.name
HAVING COUNT(DISTINCT CASE WHEN a.name ILIKE '%ChinaJoy金奖%' THEN ar.id END) > 0
   AND COUNT(DISTINCT CASE WHEN a.name ILIKE '%国漫动作奖%' THEN ar.id END) > 0
ORDER BY award_count DESC
LIMIT 50

Question: 同时获得过金龙和CJ 金奖的团队有哪些？
SQLQuery:
SELECT
  g.id AS group_id,
  g.name,
  COUNT(DISTINCT ar.id) AS award_count
FROM groups_group g
JOIN awards_awardrecord ar ON ar.group_id = g.id
JOIN awards_award a ON a.id = ar.award_id
JOIN competitions_competition c ON c.id = a.competition_id
WHERE c.name ILIKE '%金龙%'
   OR (c.name ILIKE '%ChinaJoy%' AND a.name ILIKE '%金奖%')
GROUP BY g.id, g.name
HAVING COUNT(DISTINCT CASE WHEN c.name ILIKE '%金龙%' THEN ar.id END) > 0
   AND COUNT(DISTINCT CASE WHEN c.name ILIKE '%ChinaJoy%' AND a.name ILIKE '%金奖%' THEN ar.id END) > 0
ORDER BY award_count DESC
LIMIT 50

Question: ChinaJoy 获奖最多的社团排行
SQLQuery:
SELECT
  g.id AS group_id,
  g.name,
  COUNT(ar.id) AS award_count
FROM groups_group g
JOIN awards_awardrecord ar ON ar.group_id = g.id
JOIN awards_award a ON a.id = ar.award_id
JOIN competitions_competition c ON c.id = a.competition_id
WHERE c.name ILIKE '%ChinaJoy%'
GROUP BY g.id, g.name
ORDER BY award_count DESC
LIMIT 50

Question: 原神相关的视频有哪些？
SQLQuery:
SELECT
  v.id AS video_id,
  v.title,
  v.bv_number,
  g.id AS group_id,
  g.name AS group_name
FROM videos_video v
LEFT JOIN groups_group g ON g.id = v.group_id
JOIN tags_videotag vt ON vt.video_id = v.id
JOIN tags_tag t ON t.id = vt.tag_id
WHERE t.name ILIKE '%原神%' OR v.title ILIKE '%原神%'
ORDER BY v.year DESC NULLS LAST, v.created_at DESC
LIMIT 50
"""


def _strip_sql_comments(sql: str) -> str:
    return re.sub(r'--.*?(?=\r?\n|$)', '', sql)


def validate_sql_safety(sql: str) -> bool:
    """Return True if sql is a safe single-statement SELECT/CTE query on allowed tables."""
    if not sql.strip():
        return False
    clean_sql = _strip_sql_comments(sql)
    if _DANGEROUS_RE.match(clean_sql):
        return False
    stripped = clean_sql.strip().rstrip(';')
    if ';' in stripped:
        return False
    if not re.match(r'^\s*(SELECT|WITH)\b', stripped, re.IGNORECASE):
        return False
    if re.match(r'^\s*WITH\b', stripped, re.IGNORECASE) and not re.search(
        r'\)\s*SELECT\b',
        stripped,
        re.IGNORECASE | re.DOTALL,
    ):
        return False
    tables = _TABLE_NAME_RE.findall(stripped)
    cte_names = {name.lower() for name in _CTE_NAME_RE.findall(stripped)}
    bare_tables = {t.split('.')[-1].lower() for t in tables} - cte_names
    if not bare_tables:
        return True
    return bare_tables.issubset({t.lower() for t in ALLOWED_TABLES})


class SQLResult:
    """Holds the generated SQL query and its result rows."""

    __slots__ = ('rows', 'sql')

    def __init__(self):
        self.rows = []
        self.sql = ''


def create_sql_result():
    return SQLResult()


def _get_readonly_connection():
    db = settings.DATABASES['default']
    return psycopg2.connect(
        host=db['HOST'],
        port=db['PORT'] or 5432,
        dbname=db['NAME'],
        user=db['USER'],
        password=db['PASSWORD'],
        connect_timeout=5,
        options='-c default_transaction_read_only=on -c statement_timeout=5000',
    )


def get_schema_tool(table_name: str = "") -> str:
    """Return schema context for the LlamaIndex Text-to-SQL prompt."""
    if not table_name:
        tables = get_tables()
        lines = [f"  - `{t['name']}`: {t['description']}" for t in tables]
        return (
            "可用表（10张核心业务表）：\n"
            + "\n".join(lines)
            + "\n\n调用 get_schema(table_name='表名') 查看某张表的详细列信息。"
        )

    schema = get_table_schema(table_name)
    if 'error' in schema:
        return schema['error']

    col_lines = []
    for column in schema['columns']:
        parts = [f"    {column['column']} ({column['type']})"]
        if column.get('pk'):
            parts.append('[主键]')
        if column.get('fk'):
            parts.append(f"[外键 -> {column['fk']}]")
        if column.get('comment'):
            parts.append(f"- {column['comment']}")
        col_lines.append(' '.join(parts))
    return (
        f"表 `{schema['name']}`:\n  {schema['description']}\n\n"
        "列:\n" + "\n".join(col_lines)
    )


def execute_sql_tool(sql: str, _sql_result: SQLResult | None = None) -> str:
    """Execute a read-only SQL query after local safety validation."""
    if not validate_sql_safety(sql):
        logger.warning("text2sql rejected unsafe sql: %s", sql)
        dangerous_match = _DANGEROUS_RE.match(sql)
        if dangerous_match:
            raise ValueError(f"安全错误：只允许 SELECT 查询，拒绝了 {dangerous_match.group(1).upper()} 操作")
        tables = {t.split('.')[-1].lower() for t in _TABLE_NAME_RE.findall(sql)}
        disallowed = tables - {t.lower() for t in ALLOWED_TABLES}
        if disallowed:
            raise ValueError(f"安全错误：不允许查询表 {', '.join(sorted(disallowed))}。只允许查询核心业务表。")
        raise ValueError("安全错误：只允许单条 SELECT/WITH 查询语句。")

    stripped = sql.strip().rstrip(';')
    if not re.search(r'\bLIMIT\s+\d+\s*$', stripped, re.IGNORECASE):
        stripped += ' LIMIT 50'

    conn = None
    try:
        conn = _get_readonly_connection()
        conn.autocommit = True
        with conn.cursor() as cur:
            cur.execute(stripped)
            columns = [desc[0] for desc in cur.description]
            rows = cur.fetchall()
            row_dicts = [dict(zip(columns, row)) for row in rows]
            if _sql_result is not None:
                _sql_result.rows = row_dicts
                _sql_result.sql = stripped
            if not rows:
                return "查询结果为空（0 行）。请尝试调整查询条件。"

            col_widths = []
            for index, column in enumerate(columns):
                max_val = max((len(str(row[index])) for row in rows), default=0)
                col_widths.append(max(len(str(column)), max_val))
            header = ' | '.join(str(column).ljust(width) for column, width in zip(columns, col_widths))
            separator = '-+-'.join('-' * width for width in col_widths)
            row_lines = [
                ' | '.join(str(value).ljust(width) for value, width in zip(row, col_widths))
                for row in rows
            ]
            return f"查询到 {len(rows)} 行结果\n\n{header}\n{separator}\n" + '\n'.join(row_lines)
    except psycopg2.OperationalError as exc:
        raise ValueError(f"数据库连接失败: {exc}") from exc
    except psycopg2.errors.QueryCanceled as exc:
        raise ValueError("查询超时（超过 5 秒），请简化查询或添加更精确的 WHERE 条件。") from exc
    except Exception as exc:
        raise ValueError(f"SQL 执行错误: {exc}") from exc
    finally:
        if conn:
            conn.close()


def _ensure_api_keys():
    pass


def _provider_config() -> tuple[str, str, str]:
    provider = os.environ.get('TEXT2SQL_PROVIDER', 'deepseek')
    if provider == 'siliconflow':
        return (
            os.environ.get('SILICONFLOW_MODEL', 'Qwen/Qwen3.6-27B'),
            os.environ.get('SILICONFLOW_API_KEY', ''),
            os.environ.get('SILICONFLOW_BASE_URL', 'https://api.siliconflow.cn/v1'),
        )
    return (
        os.environ.get('DEEPSEEK_MODEL', 'deepseek-chat'),
        os.environ.get('DEEPSEEK_API_KEY', ''),
        os.environ.get('DEEPSEEK_BASE_URL', 'https://api.deepseek.com/v1'),
    )


def _configure_tracing():
    """Enable Arize AX tracing for LlamaIndex LLM calls."""
    global _TRACING_CONFIGURED
    if _TRACING_CONFIGURED:
        return

    space_id = os.environ.get('ARIZE_SPACE_ID')
    api_key = os.environ.get('ARIZE_API_KEY')
    if not space_id or not api_key:
        return

    try:
        from arize.otel import register
        from openinference.instrumentation.llama_index import LlamaIndexInstrumentor

        tp = register(
            space_id=space_id,
            api_key=api_key,
            project_name="cosdrama-text2sql",
        )
        LlamaIndexInstrumentor().instrument(tracer_provider=tp)
        _TRACING_CONFIGURED = True
        logger.info("arize tracing enabled with LlamaIndex instrumentation")
    except Exception:
        logger.exception("failed to configure Arize tracing; continuing without tracing")


def _create_llamaindex_llm():
    try:
        from llama_index.llms.openai_like import OpenAILike
    except ImportError as exc:
        raise ImportError("llama-index-llms-openai-like package is not installed.") from exc

    _ensure_api_keys()
    _configure_tracing()
    model, api_key, api_base = _provider_config()
    if not api_key:
        raise ValueError("缺少 Text2SQL LLM API Key，请配置 DEEPSEEK_API_KEY 或 SILICONFLOW_API_KEY。")
    return OpenAILike(
        model=model,
        api_key=api_key,
        api_base=api_base,
        temperature=0,
        context_window=int(os.environ.get('TEXT2SQL_CONTEXT_WINDOW', '32768')),
        timeout=float(os.environ.get('TEXT2SQL_LLM_TIMEOUT', '60')),
        is_chat_model=True,
        is_function_calling_model=False,
    )


def _create_sqlalchemy_engine():
    try:
        from sqlalchemy import create_engine
        from sqlalchemy.engine import URL
    except ImportError as exc:
        raise ImportError("SQLAlchemy package is not installed.") from exc

    db = settings.DATABASES['default']
    url = URL.create(
        "postgresql+psycopg2",
        username=db['USER'],
        password=db['PASSWORD'],
        host=db['HOST'],
        port=int(db['PORT'] or 5432),
        database=db['NAME'],
    )
    return create_engine(
        url,
        connect_args={
            "connect_timeout": 5,
            "options": "-c default_transaction_read_only=on -c statement_timeout=5000",
        },
        pool_pre_ping=True,
    )


@lru_cache(maxsize=1)
def _create_sql_database():
    """Create the official LlamaIndex SQLDatabase wrapper around PostgreSQL."""
    try:
        from llama_index.core import SQLDatabase
    except ImportError as exc:
        raise ImportError("llama-index-core package is not installed.") from exc

    return SQLDatabase(
        _create_sqlalchemy_engine(),
        include_tables=sorted(ALLOWED_TABLES),
        sample_rows_in_table_info=0,
    )


def _schema_context() -> str:
    table_details = "\n\n".join(get_schema_tool(table) for table in sorted(ALLOWED_TABLES))
    return f"{get_schema_tool()}\n\n{RELATIONSHIPS}\n\n{table_details}"


def _table_context_kwargs() -> dict[str, str]:
    value_context = _sample_column_values()
    shared = (
        "Use these table-specific notes to map Chinese user terms to exact column values. "
        "Always include UUID ids with aliases video_id, group_id, and award_record_id when relevant.\n"
        f"{value_context}"
    )
    return {
        "awards_award": (
            f"{shared}\n"
            "awards_award.name contains exact award names such as 最佳团体组金奖 or 国漫动作奖. "
            "For cj金奖/ChinaJoy金奖, join competitions_competition and require competition name ILIKE '%ChinaJoy%' "
            "plus award name ILIKE '%金奖%'."
        ),
        "awards_awardrecord": (
            f"{shared}\n"
            "Award intersection questions usually need GROUP BY group_id HAVING conditional counts, "
            "or another read-only set-intersection SQL pattern."
        ),
        "competitions_competition": (
            f"{shared}\n"
            "Competition aliases: CJ/cj usually means ChinaJoy; 金龙/金龙奖 means 金龙奖COSPLAY全国大赛 "
            "and should match competition name ILIKE '%金龙%'; 国漫 usually means names containing 国漫."
        ),
        "tags_tag": (
            f"{shared}\n"
            "tags_tag.name contains IP/style labels; join through tags_videotag for video tag search."
        ),
        "tags_videotag": "Join tags_videotag.video_id to videos_video.id and tag_id to tags_tag.id.",
        "videos_video": "Return videos_video.id AS video_id for frontend hydration.",
        "groups_group": "Return groups_group.id AS group_id for frontend hydration.",
    }


def _sample_column_values() -> str:
    """Fetch small read-only value samples so the model spells domain terms correctly."""
    global _VALUE_CONTEXT_CACHE
    if _VALUE_CONTEXT_CACHE is not None:
        return _VALUE_CONTEXT_CACHE

    queries = {
        'awards_award.name': "SELECT DISTINCT name FROM awards_award WHERE name IS NOT NULL ORDER BY name LIMIT 80",
        'competitions_competition.name': (
            "SELECT DISTINCT name FROM competitions_competition WHERE name IS NOT NULL ORDER BY name LIMIT 80"
        ),
        'tags_tag.name': (
            "SELECT name FROM tags_tag WHERE name IS NOT NULL "
            "GROUP BY name ORDER BY MAX(usage_count) DESC, name LIMIT 120"
        ),
    }
    sections = [_STATIC_VALUE_CONTEXT]
    conn = None
    try:
        conn = _get_readonly_connection()
        conn.autocommit = True
        with conn.cursor() as cur:
            for label, query in queries.items():
                cur.execute(query)
                values = [str(row[0]) for row in cur.fetchall() if row and row[0]]
                if values:
                    joined = "、".join(values)
                    sections.append(f"- `{label}` 当前常见取值：{joined}")
    except Exception:
        logger.exception("failed to sample text2sql domain values; using static context only")
    finally:
        if conn:
            conn.close()

    _VALUE_CONTEXT_CACHE = "\n".join(sections)
    return _VALUE_CONTEXT_CACHE


def _build_text_to_sql_prompt(question: str) -> str:
    return f"""你是 Cosplay 舞台剧数据库的 Text-to-SQL 助手。

请只输出一条 PostgreSQL SQL 查询，不要输出解释、Markdown 或代码块。

安全和格式要求：
- 只能生成 SELECT 或 WITH ... SELECT 查询。
- 只能查询下方列出的白名单表。
- 不允许 INSERT、UPDATE、DELETE、DROP、ALTER、TRUNCATE、CREATE、COPY。
- 查询必须包含相关实体的 UUID 主键，使用别名 video_id、group_id、award_record_id，便于后端水合卡片。
- 查询结果最多 50 行；如果需要排序，请添加合理的 ORDER BY。
- 字符串模糊匹配使用 ILIKE。

UI 意图参考：
- 社团/团队详情：优先返回 group_id，并尽量 JOIN videos_video、awards_awardrecord。
- 视频/作品列表：优先返回 video_id。
- 排行/最多/排名：返回 group_id 和统计列 award_count 或 cnt。
- 纯统计：可以返回 count，但仍须保持只读。

数据库上下文：
{_schema_context()}

列值元数据：
{_sample_column_values()}

{_FEW_SHOT_SQL_EXAMPLES}

用户问题：
{question}

SQL:"""


def _create_text_to_sql_prompt():
    try:
        from llama_index.core.prompts import PromptTemplate
    except ImportError as exc:
        raise ImportError("llama-index-core package is not installed.") from exc

    return PromptTemplate(
        f"""Given an input question, create a syntactically correct {{dialect}} SQL query.

Rules:
- Output using the exact LlamaIndex format below.
- Only generate one read-only SELECT or WITH ... SELECT statement.
- Only use tables listed in the schema.
- Do not use INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, CREATE, COPY, or multiple statements.
- Do not query all columns; choose relevant columns only.
- Include UUID ids with aliases `video_id`, `group_id`, and `award_record_id` whenever those entities are relevant.
- Use ILIKE for fuzzy Chinese/English term matching.
- Add LIMIT 50 unless the query returns a single aggregate row.
- For "同时获得A奖和B奖" style questions, use GROUP BY ... HAVING with conditional counts or an equivalent set-intersection pattern.

{_FEW_SHOT_SQL_EXAMPLES}

Only use tables listed below.
{{schema}}

Required format:
Question: Question here
SQLQuery: SQL Query to run
SQLResult: Result of the SQLQuery
Answer: Final answer here

Question: {{query_str}}
SQLQuery: """
    )


def _select_tables_for_question(question: str) -> list[str]:
    q = question.lower()
    selected: set[str] = set()

    if any(token in q for token in ['社团', '团队', '剧社', 'group']):
        selected.add('groups_group')
    if any(token in q for token in ['视频', '作品', 'bv', 'b站', 'video']):
        selected.update({'videos_video', 'groups_group'})
    if any(token in q for token in ['奖', '获奖', '排行', '排名', '最多', 'china', 'chinajoy', 'cj', '国漫']):
        selected.update({
            'awards_award',
            'awards_awardrecord',
            'groups_group',
            'videos_video',
            'competitions_competition',
            'competitions_competitionyear',
        })
    if any(token in q for token in ['标签', 'ip', '风格']):
        selected.update({'tags_tag', 'tags_videotag', 'videos_video', 'groups_group'})
    if any(token in q for token in ['赛事', '比赛', '活动', '场次', '地区', '城市']):
        selected.update({
            'competitions_competition',
            'competitions_competitionyear',
            'competitions_event',
            'competitions_event_videos',
            'videos_video',
        })

    if not selected:
        selected.update(ALLOWED_TABLES)

    return sorted(selected)


def _create_nlsql_query_engine(sql_only: bool = True, tables: list[str] | None = None):
    try:
        from llama_index.core.embeddings import MockEmbedding
        from llama_index.core.query_engine import NLSQLTableQueryEngine
    except ImportError as exc:
        raise ImportError("llama-index-core package is not installed.") from exc

    selected_tables = tables or sorted(ALLOWED_TABLES)
    return NLSQLTableQueryEngine(
        sql_database=_create_sql_database(),
        llm=_create_llamaindex_llm(),
        text_to_sql_prompt=_create_text_to_sql_prompt(),
        context_query_kwargs=_table_context_kwargs(),
        tables=selected_tables,
        synthesize_response=False,
        sql_only=sql_only,
        embed_model=MockEmbedding(embed_dim=1),
    )


def _extract_sql(text: str) -> str:
    block = _SQL_BLOCK_RE.search(text)
    if block:
        text = block.group(1)
    text = text.strip()
    sql_match = re.search(r'\b(WITH|SELECT)\b.*', text, re.IGNORECASE | re.DOTALL)
    if not sql_match:
        return text
    sql = sql_match.group(0).strip()
    return sql.rstrip(';')


def _generate_sql_with_llamaindex(question: str) -> str:
    query_engine = _create_nlsql_query_engine(sql_only=True, tables=_select_tables_for_question(question))
    response = query_engine.query(question)
    metadata_sql = getattr(response, 'metadata', {}).get('sql_query') if hasattr(response, 'metadata') else None
    return _extract_sql(metadata_sql or str(response))


def _extract_ids_from_sql_rows(rows: list[dict]) -> dict[str, list[str]]:
    aliases = {
        'video': {'video', 'video_id', 'v_id', 'videos_video_id'},
        'group': {'group', 'group_id', 'g_id', 'groups_group_id'},
        'award_record': {'award_record', 'award_record_id', 'ar_id', 'record_id', 'awards_awardrecord_id'},
    }
    output = {'video_id_list': [], 'group_id_list': [], 'award_record_id_list': []}
    seen = {key: set() for key in output}
    bare_id_values = []

    for row in rows:
        for key, value in row.items():
            if value is None:
                continue
            normalized = key.lower()
            target = None
            if normalized in aliases['video'] or normalized.endswith('_video_id'):
                target = 'video_id_list'
            elif normalized in aliases['group'] or normalized.endswith('_group_id'):
                target = 'group_id_list'
            elif normalized in aliases['award_record'] or normalized.endswith('_award_record_id'):
                target = 'award_record_id_list'
            elif normalized == 'id':
                bare_id_values.append(str(value))
                continue
            if not target:
                continue
            string_value = str(value)
            if string_value and string_value not in seen[target]:
                seen[target].add(string_value)
                output[target].append(string_value)

    if not any(output.values()) and bare_id_values and rows:
        cols = set(rows[0].keys())
        if 'bv_number' in cols or 'thumbnail' in cols:
            output['video_id_list'] = list(dict.fromkeys(bare_id_values))
        elif 'drama_name' in cols:
            output['award_record_id_list'] = list(dict.fromkeys(bare_id_values))
        elif 'name' in cols and 'title' not in cols:
            output['group_id_list'] = list(dict.fromkeys(bare_id_values))

    return output


def _choose_ui_type(question: str, rows: list[dict], row_ids: dict[str, list[str]]) -> str:
    q = question.lower()
    if any(token in q for token in ['排行', '排名', '最多', 'top', 'leaderboard']):
        return 'award_leaderboard'
    if any(token in q for token in ['多少', '几个', '数量', 'count', '统计']) and not any(row_ids.values()):
        return 'mixed_text'
    if any(token in q for token in ['视频', '作品', 'bv', 'b站']):
        return 'video_grid'
    if any(token in q for token in ['社团', '团队', '剧社', '详情']):
        return 'group_detail'
    if row_ids.get('video_id_list') and not row_ids.get('group_id_list'):
        return 'video_grid'
    if row_ids.get('group_id_list'):
        return 'group_list' if len(row_ids['group_id_list']) > 1 else 'group_detail'
    if rows:
        return 'mixed_text'
    return 'mixed_text'


def _title_for(question: str, ui_type: str) -> str:
    cleaned = re.sub(r'\s+', ' ', question).strip()
    if cleaned:
        return cleaned[:50]
    labels = {
        'award_leaderboard': '获奖排行',
        'video_grid': '视频搜索结果',
        'group_detail': '社团详情',
        'group_list': '社团列表',
        'mixed_text': '查询结果',
    }
    return labels.get(ui_type, '查询结果')


def _fallback_answer(question: str, rows: list[dict], sql_text: str) -> str:
    if not rows:
        return "没有查询到符合条件的结果。"
    if len(rows) == 1 and len(rows[0]) == 1:
        value = next(iter(rows[0].values()))
        return f"查询结果为：{value}。"
    return f"查询到 {len(rows)} 条相关结果。"


def _synthesize_answer(question: str, sql_text: str, rows: list[dict]) -> str:
    try:
        llm = _create_llamaindex_llm()
        preview = rows[:20]
        prompt = (
            "请基于用户问题、SQL 和查询结果，用简洁中文回答。"
            "不要编造查询结果中没有的信息。\n\n"
            f"用户问题：{question}\n"
            f"SQL：{sql_text}\n"
            f"查询结果：{preview}\n"
        )
        answer = str(llm.complete(prompt)).strip()
        return answer or _fallback_answer(question, rows, sql_text)
    except Exception:
        logger.exception("llamaindex answer synthesis failed")
        return _fallback_answer(question, rows, sql_text)


def _build_structured_output(question: str, answer: str, sql_result: SQLResult) -> dict:
    row_ids = _extract_ids_from_sql_rows(sql_result.rows)
    ui_type = _choose_ui_type(question, sql_result.rows, row_ids)
    return {
        'ui_type': ui_type,
        'title': _title_for(question, ui_type),
        'natural_language_overview': answer,
        'video_id_list': row_ids['video_id_list'],
        'group_id_list': row_ids['group_id_list'],
        'award_record_id_list': row_ids['award_record_id_list'],
    }


def invoke_agent(question: str) -> tuple[str, SQLResult, dict]:
    """Generate SQL via LlamaIndex, execute it locally, and return structured output."""
    sql_result = SQLResult()
    generated_sql = _generate_sql_with_llamaindex(question)
    if not validate_sql_safety(generated_sql):
        raise ValueError(f"LlamaIndex 生成了不安全或不受支持的 SQL: {generated_sql}")

    execute_sql_tool(generated_sql, _sql_result=sql_result)
    answer = _synthesize_answer(question, sql_result.sql, sql_result.rows)
    structured_output = _build_structured_output(question, answer, sql_result)
    return answer, sql_result, structured_output
