import os
import re
import logging
import psycopg2
from django.conf import settings

from apps.text2sql.schema import get_tables, get_table_schema, ALLOWED_TABLES
from apps.text2sql.prompts import SYSTEM_PROMPT

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


def validate_sql_safety(sql: str) -> bool:
    """Return True if sql is a safe single-statement SELECT on allowed tables."""
    if not sql.strip():
        return False
    if _DANGEROUS_RE.match(sql):
        return False
    if not re.match(r'^\s*SELECT\b', sql, re.IGNORECASE):
        return False
    # Reject multi-statement SQL (semicolons allow chaining dangerous queries)
    stripped = sql.strip().rstrip(';')
    if ';' in stripped:
        return False
    tables = _TABLE_NAME_RE.findall(stripped)
    bare_tables = {t.split('.')[-1].lower() for t in tables}
    if not bare_tables:
        return True
    if not bare_tables.issubset({t.lower() for t in ALLOWED_TABLES}):
        return False
    return True


# ─── Container for SQL execution results ───
# Replaces thread-local cache to avoid cross-request data leaks.

class SQLResult:
    """Holds the most recent SQL query and its result rows."""
    __slots__ = ('rows', 'sql')
    def __init__(self):
        self.rows = []
        self.sql = ''


def create_sql_result():
    return SQLResult()


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
        dangerous_match = _DANGEROUS_RE.match(sql)
        if dangerous_match:
            raise ValueError(f"安全错误：只允许 SELECT 查询，拒绝了 {dangerous_match.group(1).upper()} 操作")
        tables = {t.split('.')[-1].lower() for t in _TABLE_NAME_RE.findall(sql)}
        disallowed = tables - {t.lower() for t in ALLOWED_TABLES}
        if disallowed:
            raise ValueError(f"安全错误：不允许查询表 {', '.join(disallowed)}。只允许查询核心业务表。")
        raise ValueError("安全错误：只允许 SELECT 查询语句。")

    stripped = sql.strip()
    # Strip trailing semicolons (safety: prevents multi-statement)
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
            # Store results in the passed container
            if _sql_result is not None:
                _sql_result.rows = [dict(zip(columns, row)) for row in rows]
                _sql_result.sql = stripped
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


# ─── Agent factory ───

_agent_instance = None


def create_agent():
    """Create and return the Deep Agent singleton."""
    global _agent_instance
    if _agent_instance is not None:
        return _agent_instance

    from deepagents import create_deep_agent

    api_key = os.environ.get('DEEPSEEK_API_KEY', '')
    model = "openai:deepseek-chat"
    os.environ.setdefault('OPENAI_API_KEY', api_key)
    os.environ.setdefault('OPENAI_API_BASE', 'https://api.siliconflow.cn/v1')

    _agent_instance = create_deep_agent(
        model=model,
        tools=[get_schema_tool, execute_sql_tool],
        system_prompt=SYSTEM_PROMPT,
    )
    logger.info("text2sql Deep Agent created with model=%s", model)
    return _agent_instance


def invoke_agent(question: str) -> tuple[str, SQLResult]:
    """Invoke the agent and return (answer_text, sql_result).

    Creates a fresh SQLResult per call so there's no cross-request state.
    """
    from functools import partial

    sql_result = create_sql_result()
    bound_execute = partial(execute_sql_tool, _sql_result=sql_result)

    agent = create_agent()
    # Rebind the tool with the per-call sql_result
    agent_with_result = create_deep_agent(
        model="openai:deepseek-chat",
        tools=[get_schema_tool, bound_execute],
        system_prompt=SYSTEM_PROMPT,
    )

    result = agent_with_result.invoke({"messages": [{"role": "user", "content": question}]})

    # Extract text
    if hasattr(result, 'messages'):
        last_msg = result.messages[-1] if result.messages else {}
        agent_text = last_msg.get('content', '') if isinstance(last_msg, dict) else str(last_msg)
    elif isinstance(result, dict):
        agent_text = result.get('content', result.get('text', str(result)))
    else:
        agent_text = str(result)

    return agent_text, sql_result
