import os
import re
import logging
import threading
import psycopg2
from pydantic import BaseModel, Field
from django.conf import settings

from apps.text2sql.schema import get_tables, get_table_schema, ALLOWED_TABLES
from apps.text2sql.prompts import SYSTEM_PROMPT

try:
    from langchain.agents.structured_output import ToolStrategy
except ImportError:
    ToolStrategy = None

logger = logging.getLogger(__name__)

# ─── SQL safety ───

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


def _strip_sql_comments(sql: str) -> str:
    return re.sub(r'--.*?(?=\r?\n|$)', '', sql)


def validate_sql_safety(sql: str) -> bool:
    """Return True if sql is a safe single-statement SELECT/CTE query on allowed tables."""
    if not sql.strip():
        return False
    clean_sql = _strip_sql_comments(sql)
    if _DANGEROUS_RE.match(clean_sql):
        return False
    # Reject multi-statement SQL (semicolons allow chaining dangerous queries)
    stripped = clean_sql.strip().rstrip(';')
    if ';' in stripped:
        return False
    if not re.match(r'^\s*(SELECT|WITH)\b', stripped, re.IGNORECASE):
        return False
    if re.match(r'^\s*WITH\b', stripped, re.IGNORECASE) and not re.search(r'\)\s*SELECT\b', stripped, re.IGNORECASE | re.DOTALL):
        return False
    tables = _TABLE_NAME_RE.findall(stripped)
    cte_names = {name.lower() for name in _CTE_NAME_RE.findall(stripped)}
    bare_tables = {t.split('.')[-1].lower() for t in tables} - cte_names
    if not bare_tables:
        return True
    if not bare_tables.issubset({t.lower() for t in ALLOWED_TABLES}):
        return False
    return True


# ─── Container for SQL execution results ───

class SQLResult:
    """Holds the most recent SQL query and its result rows."""
    __slots__ = ('rows', 'sql')
    def __init__(self):
        self.rows = []
        self.sql = ''


def create_sql_result():
    return SQLResult()


class Text2SQLResponse(BaseModel):
    """Structured response from the text2sql agent.

    The LLM calls a virtual submit tool with this schema as its final action.
    """
    ui_type: str = Field(
        description="UI rendering type. Must be one of: "
        "group_detail (社团详情含视频/奖项), group_list (社团列表), "
        "award_leaderboard (排行榜), video_grid (视频网格), "
        "mixed_text (纯文本统计/计数)",
    )
    title: str = Field(description="简短的中文标题，不超过50字，概括查询结果")
    natural_language_overview: str = Field(
        description="用中文自然语言回答用户的问题，概括SQL查询结果的关键信息",
    )
    video_id_list: list[str] = Field(
        default_factory=list,
        description="查询结果中涉及的视频ID列表(UUID字符串)，从SQL结果行中提取",
    )
    group_id_list: list[str] = Field(
        default_factory=list,
        description="查询结果中涉及的社团ID列表(UUID字符串)，从SQL结果行中提取",
    )
    award_record_id_list: list[str] = Field(
        default_factory=list,
        description="查询结果中涉及的获奖记录ID列表(UUID字符串)，从SQL结果行中提取",
    )



# Per-thread SQLResult, set by invoke_agent before creating the agent.
_sql_by_thread = threading.local()


def _get_thread_sql_result():
    return getattr(_sql_by_thread, 'result', None)


def _set_thread_sql_result(sr):
    _sql_by_thread.result = sr


# ─── Read-only DB connection ───

def _get_readonly_connection():
    db = settings.DATABASES['default']
    conn = psycopg2.connect(
        host=db['HOST'],
        port=db['PORT'] or 5432,
        dbname=db['NAME'],
        user=db['USER'],
        password=db['PASSWORD'],
        connect_timeout=5,
        options='-c default_transaction_read_only=on',
    )
    return conn


# ─── Tools ───

def get_schema_tool(table_name: str = "") -> str:
    """获取数据库表结构信息。"""
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
    for c in schema['columns']:
        parts = [f"    {c['column']} ({c['type']})"]
        if c.get('pk'):
            parts.append('[主键]')
        if c.get('fk'):
            parts.append(f"[外键 → {c['fk']}]")
        if c.get('comment'):
            parts.append(f"— {c['comment']}")
        col_lines.append(' '.join(parts))
    return (
        f"表 `{schema['name']}`:\n  {schema['description']}\n\n"
        "列:\n" + "\n".join(col_lines)
    )


def execute_sql_tool(sql: str, _sql_result: SQLResult | None = None) -> str:
    """执行只读 SQL 查询。仅允许单条 SELECT 语句，自动限制返回 50 行。"""
    if not validate_sql_safety(sql):
        logger.warning("text2sql rejected unsafe sql: %s", sql)
        dangerous_match = _DANGEROUS_RE.match(sql)
        if dangerous_match:
            raise ValueError(f"安全错误：只允许 SELECT 查询，拒绝了 {dangerous_match.group(1).upper()} 操作")
        tables = {t.split('.')[-1].lower() for t in _TABLE_NAME_RE.findall(sql)}
        disallowed = tables - {t.lower() for t in ALLOWED_TABLES}
        if disallowed:
            raise ValueError(f"安全错误：不允许查询表 {', '.join(disallowed)}。只允许查询核心业务表。")
        raise ValueError("安全错误：只允许 SELECT 查询语句。")

    stripped = sql.strip()
    stripped = stripped.rstrip(';')
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
            if not rows:
                return "查询结果为空（0行）。请尝试调整查询条件。"
            # Store in per-thread result container
            sr = _sql_result or _get_thread_sql_result()
            if sr is not None:
                sr.rows = [dict(zip(columns, row)) for row in rows]
                sr.sql = stripped
            # Format as readable text
            col_widths = []
            for i, c in enumerate(columns):
                max_val = max((len(str(row[i])) for row in rows), default=0)
                col_widths.append(max(len(str(c)), max_val))
            header = ' | '.join(str(c).ljust(w) for c, w in zip(columns, col_widths))
            separator = '-+-'.join('-' * w for w in col_widths)
            row_lines = []
            for row in rows:
                row_lines.append(' | '.join(str(v).ljust(w) for v, w in zip(row, col_widths)))
            return f"查询到 {len(rows)} 行结果:\n\n{header}\n{separator}\n" + '\n'.join(row_lines)
    except psycopg2.OperationalError as e:
        raise ValueError(f"数据库连接失败: {e}")
    except psycopg2.errors.QueryCanceled:
        raise ValueError("查询超时（超过5秒），请简化查询或添加更精确的 WHERE 条件。")
    except Exception as e:
        raise ValueError(f"SQL 执行错误: {e}")
    finally:
        if conn:
            conn.close()


# ─── LLM import ───

try:
    from deepagents import create_deep_agent as _create_deep_agent
except ImportError:
    _create_deep_agent = None

try:
    from langchain_openai import ChatOpenAI
except ImportError:
    ChatOpenAI = None

_AGENT_MODEL = "openai:deepseek-chat"
_DEEPSEEK_MODEL = "deepseek-chat"
_DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1"
_agent_instance = None


def _ensure_api_keys():
    try:
        from dotenv import load_dotenv
        load_dotenv(os.path.join(settings.BASE_DIR, '.env'))
    except Exception:
        logger.exception("failed to load backend .env for text2sql")
    provider = os.environ.get('TEXT2SQL_PROVIDER', 'deepseek')
    if provider == 'siliconflow':
        api_key = os.environ.get('SILICONFLOW_API_KEY', '')
        base_url = os.environ.get('SILICONFLOW_BASE_URL', 'https://api.siliconflow.cn/v1')
    else:
        api_key = os.environ.get('DEEPSEEK_API_KEY', '')
        base_url = _DEEPSEEK_BASE_URL
    os.environ.setdefault('OPENAI_API_KEY', api_key)
    os.environ.setdefault('OPENAI_BASE_URL', base_url)


def _create_chat_model():
    if ChatOpenAI is None:
        raise ImportError("langchain-openai package is not installed. Run: pip install langchain-openai")
    provider = os.environ.get('TEXT2SQL_PROVIDER', 'deepseek')
    if provider == 'siliconflow':
        model = os.environ.get('SILICONFLOW_MODEL', 'Qwen/Qwen3.6-27B')
        api_key = os.environ.get('SILICONFLOW_API_KEY', '')
        base_url = os.environ.get('SILICONFLOW_BASE_URL', 'https://api.siliconflow.cn/v1')
    else:
        model = _DEEPSEEK_MODEL
        api_key = os.environ.get('DEEPSEEK_API_KEY', '')
        base_url = _DEEPSEEK_BASE_URL
    return ChatOpenAI(
        model=model,
        api_key=api_key,
        base_url=base_url,
        use_responses_api=False,
        temperature=0,
    )


def create_agent():
    """Create and return the Deep Agent singleton."""
    global _agent_instance
    if _agent_instance is not None:
        return _agent_instance

    if _create_deep_agent is None:
        raise ImportError("deepagents package is not installed. Run: pip install deepagents")

    _ensure_api_keys()

    _agent_instance = _create_deep_agent(
        model=_create_chat_model(),
        tools=[get_schema_tool, execute_sql_tool],
        system_prompt=SYSTEM_PROMPT,
    )
    logger.info("text2sql Deep Agent created with model=%s", _AGENT_MODEL)
    return _agent_instance


def _extract_agent_text(result) -> str:
    messages = None
    if hasattr(result, 'messages'):
        messages = result.messages
    elif isinstance(result, dict):
        messages = result.get('messages')

    if messages:
        last_msg = messages[-1]
        if isinstance(last_msg, dict):
            return last_msg.get('content', '')
        return getattr(last_msg, 'content', str(last_msg))

    if isinstance(result, dict):
        return result.get('content', result.get('text', str(result)))
    return str(result)


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

    # Heuristic: bare 'id' column — infer entity type from other columns in the row
    if not output['video_id_list'] and not output['group_id_list'] and not output['award_record_id_list']:
        if bare_id_values and rows:
            cols = set(rows[0].keys())
            if 'bv_number' in cols or 'thumbnail' in cols:
                output['video_id_list'] = list(dict.fromkeys(bare_id_values))
            elif 'drama_name' in cols:
                output['award_record_id_list'] = list(dict.fromkeys(bare_id_values))
            elif 'name' in cols and 'title' not in cols:
                # groups have 'name'; videos have 'title'; award_records have 'drama_name'
                output['group_id_list'] = list(dict.fromkeys(bare_id_values))

    return output


def _build_structured_output(question: str, agent_text: str, sql_result: SQLResult) -> dict:
    """Fallback: build structured output by parsing agent text + extracting IDs from SQL rows."""
    row_ids = _extract_ids_from_sql_rows(sql_result.rows)

    ui_type_match = re.search(r'【ui_type】\s*:\s*(\w+)', agent_text, re.IGNORECASE)
    answer_match = re.search(r'【answer】\s*:\s*(.+?)(?=【|$)', agent_text, re.IGNORECASE | re.DOTALL)
    title_match = re.search(r'【title】\s*:\s*(.+?)(?=【|$)', agent_text, re.IGNORECASE | re.DOTALL)

    ui_type = ui_type_match.group(1).strip().lower() if ui_type_match else 'mixed_text'
    answer = answer_match.group(1).strip() if answer_match else agent_text.strip()
    title = title_match.group(1).strip() if title_match else answer[:50].replace('\n', ' ')

    return {
        'ui_type': ui_type,
        'title': title,
        'natural_language_overview': answer,
        'video_id_list': row_ids['video_id_list'],
        'group_id_list': row_ids['group_id_list'],
        'award_record_id_list': row_ids['award_record_id_list'],
    }


def _merge_structured_with_row_ids(
    structured: Text2SQLResponse,
    row_ids: dict[str, list[str]],
) -> dict:
    """Merge LLM-structured IDs with SQL-extracted IDs (LLM primary, SQL supplement)."""
    def _merge_unique(*lists):
        merged = []
        seen = set()
        for lst in lists:
            for v in lst or []:
                if v and v not in seen:
                    seen.add(v)
                    merged.append(v)
        return merged

    return {
        'ui_type': structured.ui_type,
        'title': structured.title,
        'natural_language_overview': structured.natural_language_overview,
        'video_id_list': _merge_unique(structured.video_id_list, row_ids.get('video_id_list', [])),
        'group_id_list': _merge_unique(structured.group_id_list, row_ids.get('group_id_list', [])),
        'award_record_id_list': _merge_unique(structured.award_record_id_list, row_ids.get('award_record_id_list', [])),
    }


def invoke_agent(question: str) -> tuple[str, SQLResult, dict]:
    """Invoke the agent and return (answer_text, sql_result, structured_output)."""
    if _create_deep_agent is None:
        raise ImportError("deepagents package is not installed. Run: pip install deepagents")

    _ensure_api_keys()

    sql_result = SQLResult()

    def execute_sql_for_request(sql: str) -> str:
        return execute_sql_tool(sql, _sql_result=sql_result)

    execute_sql_for_request.__name__ = 'execute_sql_tool'
    execute_sql_for_request.__doc__ = execute_sql_tool.__doc__

    kwargs = {
        'model': _create_chat_model(),
        'tools': [get_schema_tool, execute_sql_for_request],
        'system_prompt': SYSTEM_PROMPT,
    }
    if ToolStrategy is not None:
        kwargs['response_format'] = ToolStrategy(Text2SQLResponse)

    agent = _create_deep_agent(**kwargs)
    result = agent.invoke({"messages": [{"role": "user", "content": question}]})

    # Extract structured_response from agent state
    structured_response = None
    if isinstance(result, dict):
        structured_response = result.get("structured_response")
    elif hasattr(result, 'structured_response'):
        structured_response = result.structured_response

    agent_text = _extract_agent_text(result)

    if isinstance(structured_response, Text2SQLResponse):
        row_ids = _extract_ids_from_sql_rows(sql_result.rows)
        structured_output = _merge_structured_with_row_ids(structured_response, row_ids)
    else:
        logger.warning("text2sql structured_response is None, falling back to regex parsing")
        structured_output = _build_structured_output(question, agent_text, sql_result)

    return agent_text, sql_result, structured_output
