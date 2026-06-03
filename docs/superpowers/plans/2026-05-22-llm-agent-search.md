# LLM 增强 Agent 智能搜索 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有规则驱动 Agent 基础上增加 LLM 判断层，支持复杂组合查询（如"获得动作奖且获得过金奖的团队"），使用 DeepSeek 模型通过 LangGraph 条件分支编排。

**Architecture:** 保留现有规则链路作为快速路径（简单查询 <100ms），新增 LLM 分支处理复杂查询。LangGraph conditional edge 根据规则意图分类器的置信度路由：高置信度走规则 SQL 生成，低置信度走 LLM SQL 生成。LLM 分支将精简 schema 预注入 system prompt，使用 DeepSeek Chat 模型生成 SQL，经校验后执行，最后统一由 response_formatter 格式化输出。

**Tech Stack:** LangGraph StateGraph + conditional edges, langchain-openai (DeepSeek 兼容 API), Pydantic, Django DB cursor

---

## File Structure

| File | Responsibility |
|------|---------------|
| `backend/apps/text2sql/agent_workflow.py` | **Modify** — 扩展 StateGraph，增加 LLM 分支节点和条件路由 |
| `backend/apps/text2sql/llm_sql_generator.py` | **Create** — LLM SQL 生成节点：schema prompt 构建、DeepSeek 调用、SQL 提取 |
| `backend/apps/text2sql/__init__.py` | **Create** — 空文件，使 text2sql 成为合法 Python 包 |
| `backend/apps/text2sql/schema_prompt.py` | **Create** — 从 real_schema.txt 生成精简 schema 字符串，供 LLM prompt 使用 |
| `backend/apps/text2sql/tests/__init__.py` | **Create** — 测试包初始化 |
| `backend/apps/text2sql/tests/test_llm_sql_generator.py` | **Create** — LLM SQL 生成单元测试 |
| `backend/apps/text2sql/tests/test_schema_prompt.py` | **Create** — Schema prompt 构建测试 |
| `backend/apps/text2sql/tests/test_agent_workflow.py` | **Create** — 端到端 workflow 测试 |
| `backend/apps/videos/views.py` | **Modify** — 更新日志和超时配置 |

---

## 数据库 Schema 预注入 Prompt 可行性分析

**结论：可行且推荐。**

当前数据库共 5 张核心业务表（awards_award, awards_awardrecord, competitions_competition, competitions_competitionyear, groups_group, videos_video），完整 DDL 约 8.6KB。精简后（去掉外键约束、索引、默认值等 LLM 不需要的信息）预计约 2KB。

**预注入方案：**
- 从 `real_schema.txt` 提取表名、字段名、字段类型、外键关系
- 去掉 CONSTRAINT、CREATE INDEX 等信息
- 保留 1-2 行样例数据帮助 LLM 理解数据格式
- 最终 prompt 约 2-3KB，在 DeepSeek Chat 的上下文窗口内完全可忽略

**预注入优势：**
- LLM 不需要额外工具调用获取 schema（省 1 轮 API 调用）
- 减少幻觉风险（schema 是确定的）
- 降低延迟和成本

---

### Task 1: 创建精简 Schema Prompt 模块

**Files:**
- Create: `backend/apps/text2sql/schema_prompt.py`
- Test: `backend/apps/text2sql/tests/test_schema_prompt.py`
- Create: `backend/apps/text2sql/__init__.py`
- Create: `backend/apps/text2sql/tests/__init__.py`

- [ ] **Step 1: Create `backend/apps/text2sql/__init__.py`**

Empty file to make text2sql a Python package.

```python
```

- [ ] **Step 2: Create `backend/apps/text2sql/tests/__init__.py`**

Empty file to make tests a Python package.

```python
```

- [ ] **Step 3: Write the failing test for schema_prompt**

```python
# backend/apps/text2sql/tests/test_schema_prompt.py
import re

from apps.text2sql.schema_prompt import build_schema_prompt


def test_build_schema_prompt_contains_table_names():
    prompt = build_schema_prompt()
    for table in [
        "awards_award",
        "awards_awardrecord",
        "competitions_competition",
        "competitions_competitionyear",
        "groups_group",
        "videos_video",
    ]:
        assert table in prompt, f"Missing table: {table}"


def test_build_schema_prompt_contains_no_constraint():
    prompt = build_schema_prompt()
    assert "CONSTRAINT" not in prompt
    assert "FOREIGN KEY" not in prompt
    assert "CREATE INDEX" not in prompt


def test_build_schema_prompt_contains_field_types():
    prompt = build_schema_prompt()
    assert "UUID" in prompt or "uuid" in prompt
    assert "VARCHAR" in prompt


def test_build_schema_prompt_contains_sample_data():
    prompt = build_schema_prompt()
    assert "样例" in prompt or "sample" in prompt.lower()


def test_build_schema_prompt_under_4kb():
    prompt = build_schema_prompt()
    assert len(prompt.encode("utf-8")) < 4096, (
        f"Schema prompt too large: {len(prompt.encode('utf-8'))} bytes"
    )


def test_build_schema_prompt_contains_join_hints():
    prompt = build_schema_prompt()
    assert "award_id" in prompt
    assert "group_id" in prompt
    assert "competition_year_id" in prompt
```

- [ ] **Step 4: Run test to verify it fails**

Run: `cd backend && python manage.py test apps.text2sql.tests.test_schema_prompt -v 2`
Expected: FAIL — `ModuleNotFoundError: No module named 'apps.text2sql.schema_prompt'`

- [ ] **Step 5: Implement `schema_prompt.py`**

```python
# backend/apps/text2sql/schema_prompt.py
"""Build a compact schema prompt for LLM SQL generation."""

import os

_SCHEMA_PROMPT = None


def _load_real_schema() -> str:
    """Load real_schema.txt from the text2sql directory."""
    schema_path = os.path.join(os.path.dirname(__file__), "real_schema.txt")
    if os.path.exists(schema_path):
        with open(schema_path, encoding="utf-8") as f:
            return f.read()
    return ""


def _compact_schema(raw_ddl: str) -> str:
    """Strip DDL down to table definitions with columns, types, and sample rows only."""
    blocks = re.split(r"\n\n+", raw_ddl.strip())
    compact_parts = []

    for block in blocks:
        # Keep sample data blocks as-is (they start with /*)
        if block.strip().startswith("/*"):
            compact_parts.append(block.strip())
            continue

        # Process CREATE TABLE blocks
        if "CREATE TABLE" not in block:
            continue

        lines = []
        for line in block.strip().splitlines():
            stripped = line.strip()
            # Skip constraint definitions
            if stripped.startswith("CONSTRAINT"):
                continue
            if "FOREIGN KEY" in stripped:
                continue
            # Keep column definitions and table header
            if stripped.startswith("CREATE TABLE") or (
                stripped and not stripped.startswith(")")
            ):
                # Remove trailing commas on closing paren
                cleaned = stripped.rstrip(",")
                if cleaned.endswith(")"):
                    cleaned = cleaned + ";"
                lines.append(cleaned)

        if lines:
            compact_parts.append("\n".join(lines))

    return "\n\n".join(compact_parts)


def build_schema_prompt() -> str:
    """Build the full schema prompt string for LLM injection.

    Returns a string under ~3KB containing table DDL, sample rows,
    and join relationship hints.
    """
    global _SCHEMA_PROMPT
    if _SCHEMA_PROMPT is not None:
        return _SCHEMA_PROMPT

    raw = _load_real_schema()
    compact = _compact_schema(raw) if raw else ""

    join_hints = """
关键关系（JOIN 提示）：
- awards_awardrecord.award_id -> awards_award.id
- awards_awardrecord.group_id -> groups_group.id
- awards_awardrecord.video_id -> videos_video.id
- awards_awardrecord.competition_year_id -> competitions_competitionyear.id
- competitions_competitionyear.competition_id -> competitions_competition.id
- videos_video.group_id -> groups_group.id
- videos_video.competition_id -> competitions_competition.id
- awards_award.competition_id -> competitions_competition.id
"""

    _SCHEMA_PROMPT = f"数据库 Schema（PostgreSQL，UUID 主键）：\n\n{compact}\n{join_hints}"
    return _SCHEMA_PROMPT
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd backend && python manage.py test apps.text2sql.tests.test_schema_prompt -v 2`
Expected: All tests PASS

- [ ] **Step 7: Commit**

```bash
git add backend/apps/text2sql/__init__.py backend/apps/text2sql/schema_prompt.py backend/apps/text2sql/tests/__init__.py backend/apps/text2sql/tests/test_schema_prompt.py
git commit -m "feat(text2sql): add compact schema prompt builder for LLM SQL generation"
```

---

### Task 2: 实现 LLM SQL 生成节点

**Files:**
- Create: `backend/apps/text2sql/llm_sql_generator.py`
- Test: `backend/apps/text2sql/tests/test_llm_sql_generator.py`

- [ ] **Step 1: Write the failing test**

```python
# backend/apps/text2sql/tests/test_llm_sql_generator.py
import re
from unittest.mock import MagicMock, patch

from apps.text2sql.llm_sql_generator import (
    LLM_SQL_SYSTEM_PROMPT,
    build_llm_sql_messages,
    extract_sql_from_response,
    generate_sql_via_llm,
)


def test_extract_sql_from_response_code_block():
    text = 'Based on the query, here is the SQL:\n```sql\nSELECT * FROM awards_award;\n```'
    result = extract_sql_from_response(text)
    assert result.strip().upper().startswith("SELECT")


def test_extract_sql_from_response_plain():
    text = "SELECT id, name FROM awards_award LIMIT 10"
    result = extract_sql_from_response(text)
    assert result.strip().upper().startswith("SELECT")


def test_extract_sql_from_response_no_sql():
    text = "I cannot generate a SQL query for that."
    result = extract_sql_from_response(text)
    assert result == ""


def test_extract_sql_from_response_thinking_tag():
    text = "<think我要分析一下</think\n```sql\nSELECT 1;\n```"
    result = extract_sql_from_response(text)
    assert result.strip() == "SELECT 1;"


def test_build_llm_sql_messages_contains_schema():
    messages = build_llm_sql_messages("金奖最多的团队")
    # System message is first
    assert messages[0]["role"] == "system"
    assert "awards_award" in messages[0]["content"]
    assert "videos_video" in messages[0]["content"]


def test_build_llm_sql_messages_contains_query():
    messages = build_llm_sql_messages("获得动作奖且获得过金奖的团队")
    user_msgs = [m for m in messages if m["role"] == "user"]
    assert len(user_msgs) >= 1
    assert "获得动作奖且获得过金奖的团队" in user_msgs[-1]["content"]


def test_build_llm_sql_messages_system_prompt_rules():
    messages = build_llm_sql_messages("test")
    system_content = messages[0]["content"]
    assert "SELECT" in system_content or "select" in system_content
    assert "INSERT" in system_content or "insert" in system_content


def test_generate_sql_via_llm_with_mock():
    mock_response = MagicMock()
    mock_response.content = "```sql\nSELECT g.name FROM groups_group g LIMIT 5;\n```"

    with patch("apps.text2sql.llm_sql_generator._get_llm") as mock_llm:
        mock_llm.return_value.invoke.return_value = mock_response
        result = generate_sql_via_llm("有哪些团队")

    assert "SELECT" in result.upper()
    assert result.endswith(";") or result.endswith("\n")


def test_generate_sql_via_llm_empty_response():
    mock_response = MagicMock()
    mock_response.content = "I cannot answer this."

    with patch("apps.text2sql.llm_sql_generator._get_llm") as mock_llm:
        mock_llm.return_value.invoke.return_value = mock_response
        result = generate_sql_via_llm("test")

    assert result == ""


def test_generate_sql_via_llm_forbidden_sql():
    mock_response = MagicMock()
    mock_response.content = "```sql\nDELETE FROM awards_award;\n```"

    with patch("apps.text2sql.llm_sql_generator._get_llm") as mock_llm:
        mock_llm.return_value.invoke.return_value = mock_response
        result = generate_sql_via_llm("删掉所有数据")

    assert result == ""  # Forbidden SQL should be rejected
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && python manage.py test apps.text2sql.tests.test_llm_sql_generator -v 2`
Expected: FAIL — `ModuleNotFoundError`

- [ ] **Step 3: Implement `llm_sql_generator.py`**

```python
# backend/apps/text2sql/llm_sql_generator.py
"""LLM-powered SQL generation node for the agent workflow."""

import logging
import os
import re
from typing import List, Optional

from dotenv import load_dotenv

logger = logging.getLogger(__name__)

load_dotenv()

_FORBIDDEN_SQL_RE = re.compile(
    r"\b(insert|update|delete|drop|alter|truncate|create|grant|revoke|copy|call|execute)\b",
    re.IGNORECASE,
)

LLM_SQL_SYSTEM_PROMPT = """你是一个 PostgreSQL SQL 专家。根据用户的自然语言问题，生成正确的 SQL 查询。

数据库 Schema（PostgreSQL，UUID 主键）：
{schema}

规则：
1. 只允许 SELECT 查询，禁止任何写操作（INSERT/UPDATE/DELETE/DROP 等）
2. 必须 SELECT 指定列名，不要用 SELECT *
3. 所有 UUID 字段输出时用 id::text 转为字符串
4. 使用 ILIKE 进行模糊匹配，不要用 LIKE（PostgreSQL 大小写不敏感）
5. 用 LIMIT 限制返回行数，默认不超过 100
6. JOIN 时注意外键关系，优先使用已有的 JOIN 提示
7. 如果用户问多个条件的组合查询（如"且"、"并且"、"同时"），使用子查询或 EXISTS/IN
8. 查询结果应包含足够的字段以便前端展示：视频标题、团队名称、奖项名称、赛事名称、年份等
9. 只输出 SQL，不要解释"""


def _get_llm():
    """Lazy-initialize the DeepSeek LLM via langchain-openai."""
    from langchain_openai import ChatOpenAI

    api_key = os.getenv("DEEPSEEK_API_KEY", "")
    if not api_key:
        raise RuntimeError("DEEPSEEK_API_KEY not set in environment")

    return ChatOpenAI(
        model="deepseek-chat",
        api_key=api_key,
        base_url="https://api.deepseek.com/v1",
        temperature=0,
        max_tokens=1024,
    )


def extract_sql_from_response(text: str) -> str:
    """Extract a SQL SELECT statement from LLM response text.

    Handles markdown code blocks, <think/> tags, and plain SQL.
    Returns empty string if no valid SELECT is found.
    """
    if not text:
        return ""

    # Strip <think/> tags (DeepSeek reasoning model)
    cleaned = re.sub(r"<think[^>]*>.*?</think\s*>", "", text, flags=re.DOTALL)

    # Try markdown code block first
    code_match = re.search(r"```(?:sql)?\s*\n?(.*?)```", cleaned, re.DOTALL | re.IGNORECASE)
    if code_match:
        sql = code_match.group(1).strip()
    else:
        sql = cleaned.strip()

    # Validate: must start with SELECT/WITH
    if not re.match(r"\s*(SELECT|WITH)\b", sql, re.IGNORECASE):
        return ""

    # Validate: no forbidden operations
    if _FORBIDDEN_SQL_RE.search(sql):
        logger.warning("LLM generated forbidden SQL: %s", sql[:200])
        return ""

    return sql


def build_llm_sql_messages(query: str) -> List[dict]:
    """Build the message list for LLM SQL generation."""
    from apps.text2sql.schema_prompt import build_schema_prompt

    schema = build_schema_prompt()
    system_content = LLM_SQL_SYSTEM_PROMPT.format(schema=schema)

    return [
        {"role": "system", "content": system_content},
        {
            "role": "user",
            "content": (
                f"用户查询：{query}\n\n"
                "请生成对应的 PostgreSQL SQL 查询。只输出 SQL，不要其他内容。"
            ),
        },
    ]


def generate_sql_via_llm(query: str) -> str:
    """Call DeepSeek to generate SQL for the given query.

    Returns the extracted SQL string, or empty string on failure.
    """
    try:
        llm = _get_llm()
        messages = build_llm_sql_messages(query)
        response = llm.invoke(messages)
        sql = extract_sql_from_response(response.content)

        if sql:
            logger.info(
                "LLM generated SQL for query=%r: %s",
                query[:100],
                sql[:300],
            )
        else:
            logger.warning("LLM failed to generate valid SQL for query=%r", query[:100])

        return sql

    except Exception:
        logger.exception("LLM SQL generation failed")
        return ""
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && python manage.py test apps.text2sql.tests.test_llm_sql_generator -v 2`
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/apps/text2sql/llm_sql_generator.py backend/apps/text2sql/tests/test_llm_sql_generator.py
git commit -m "feat(text2sql): add LLM SQL generation module with DeepSeek"
```

---

### Task 3: 扩展 LangGraph Workflow 增加 LLM 分支

**Files:**
- Modify: `backend/apps/text2sql/agent_workflow.py`
- Test: `backend/apps/text2sql/tests/test_agent_workflow.py`

This is the core change. The new graph structure:

```
START
  -> intent_schema_selector
  -> route_by_complexity  (NEW: conditional edge)
      |-- "rule"   -> sql_generator (existing rule-based)
      |-- "llm"    -> llm_sql_generator (NEW)
  -> sql_executor
  -> should_retry_or_format
      |-- "sql_generator" -> sql_generator
      |-- "response_formatter" -> response_formatter
  -> END
```

- [ ] **Step 1: Write the failing test**

```python
# backend/apps/text2sql/tests/test_agent_workflow.py
from unittest.mock import MagicMock, patch

from apps.text2sql.agent_workflow import (
    AgentState,
    route_by_complexity,
    run_agent_search,
)


def test_route_by_complexity_simple_keyword():
    """Simple keyword queries should route to rule-based SQL."""
    state: AgentState = {
        "query": "金奖最多的团队",
        "intent_type": "top_gold_groups",
        "selected_schemas": ["awards_award"],
    }
    assert route_by_complexity(state) == "sql_generator"


def test_route_by_complexity_generic():
    """Generic queries should route to rule-based SQL."""
    state: AgentState = {
        "query": "火影忍者",
        "intent_type": "generic",
        "selected_schemas": ["videos_video"],
    }
    assert route_by_complexity(state) == "sql_generator"


def test_route_by_complexity_combined_conditions():
    """Combined condition queries should route to LLM."""
    state: AgentState = {
        "query": "获得动作奖且获得过金奖的团队有哪些",
        "intent_type": "generic",
        "selected_schemas": ["awards_award", "awards_awardrecord"],
    }
    assert route_by_complexity(state) == "llm_sql_generator"


def test_route_by_complexity_multi_keyword():
    """Multi-keyword queries with '且' should route to LLM."""
    state: AgentState = {
        "query": "同时获得过金奖和银奖的社团",
        "intent_type": "generic",
        "selected_schemas": ["awards_award"],
    }
    assert route_by_complexity(state) == "llm_sql_generator"


def test_route_by_complexity_complex_award():
    """Complex award queries should route to LLM."""
    state: AgentState = {
        "query": "在ChinaJoy获得过金奖的团队里，哪些还参加过其他比赛",
        "intent_type": "generic",
        "selected_schemas": ["awards_award", "competitions_competition"],
    }
    assert route_by_complexity(state) == "llm_sql_generator"


def test_run_agent_search_llm_branch():
    """End-to-end test: complex query routes through LLM branch."""
    mock_llm_sql = (
        "SELECT DISTINCT g.id::text AS group_id, g.name AS group_name "
        "FROM groups_group g "
        "WHERE EXISTS (SELECT 1 FROM awards_awardrecord ar1 "
        "  JOIN awards_award a1 ON a1.id = ar1.award_id "
        "  WHERE ar1.group_id = g.id AND a1.name ILIKE '%动作%') "
        "AND EXISTS (SELECT 1 FROM awards_awardrecord ar2 "
        "  JOIN awards_award a2 ON a2.id = ar2.award_id "
        "  WHERE ar2.group_id = g.id AND a2.name ILIKE '%金奖%') "
        "LIMIT 50;"
    )

    with patch(
        "apps.text2sql.agent_workflow.generate_sql_via_llm",
        return_value=mock_llm_sql,
    ):
        result = run_agent_search("获得动作奖且获得过金奖的团队有哪些")

    assert result["ui_type"] in ("video_grid", "group_list", "mixed_text")
    assert "query" in result
    assert result["query"] == "获得动作奖且获得过金奖的团队有哪些"
    # Should have some data or empty (depending on DB state)
    assert "data" in result


def test_run_agent_search_llm_fallback_to_rule():
    """If LLM returns empty SQL, should fall back gracefully."""
    with patch(
        "apps.text2sql.agent_workflow.generate_sql_via_llm",
        return_value="",
    ):
        result = run_agent_search("获得动作奖且获得过金奖的团队有哪些")

    # Should not crash, should return error/mixed_text response
    assert result["ui_type"] == "mixed_text"
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && python manage.py test apps.text2sql.tests.test_agent_workflow -v 2`
Expected: FAIL — `ImportError: cannot import name 'route_by_complexity'`

- [ ] **Step 3: Modify `agent_workflow.py` — add LLM imports and routing function**

Add the following imports at the top of `agent_workflow.py`, after the existing imports (around line 15):

```python
from apps.text2sql.llm_sql_generator import generate_sql_via_llm
```

Add the routing function after `intent_schema_selector` (after line 152):

```python
def route_by_complexity(state: AgentState) -> str:
    """Decide whether to use rule-based SQL or LLM SQL generation.

    Routes to "llm_sql_generator" for complex multi-condition queries
    that the rule-based system cannot handle (e.g., "动作奖且金奖").
    Routes to "sql_generator" for all other queries.
    """
    query = state.get("query", "").strip()
    intent_type = state.get("intent_type", "generic")

    # Rule-based paths handle these well — always use rules
    if intent_type in ("top_gold_groups", "award_keyword"):
        return "sql_generator"

    # Heuristic: if the query contains conjunction patterns
    # indicating multi-condition logic, route to LLM
    conjunction_patterns = [
        r"且", r"并且", r"同时", r"而且",
        r"既.*又",
        r"的.*还",  # e.g., 获得过金奖的团队里哪些还...
    ]
    for pattern in conjunction_patterns:
        if re.search(pattern, query):
            return "llm_sql_generator"

    # If multiple distinct award keywords appear, likely complex
    award_mentions = re.findall(r"[一-鿿]{1,6}奖", query)
    if len(award_mentions) >= 2:
        return "llm_sql_generator"

    return "sql_generator"
```

- [ ] **Step 4: Add LLM SQL generator node to the workflow**

Add the `llm_sql_generator` node function after `sql_generator` (around line 343):

```python
def llm_sql_generator(state: AgentState) -> Dict[str, Any]:
    """Generate SQL using LLM for complex queries that rules can't handle."""
    query = state.get("query", "").strip()

    sql = generate_sql_via_llm(query)

    if not sql:
        # LLM failed — fall back to generic rule-based SQL
        logger.warning("LLM SQL generation returned empty, falling back to rule")
        return sql_generator(state)

    return {
        "generated_sql": sql,
        "intent_type": state.get("intent_type", "generic"),
        "sql_error": "",
    }
```

- [ ] **Step 5: Update `should_retry_or_format` to handle LLM node**

Modify `should_retry_or_format` (line 386) to handle retries from both SQL generators:

```python
def should_retry_or_format(state: AgentState) -> str:
    """After SQL execution, decide whether to retry or format results.

    For LLM-generated SQL that failed, fall back to rule-based SQL
    instead of retrying LLM (to avoid loops and save cost).
    """
    sql_error = state.get("sql_error")
    retry_count = state.get("retry_count", 0)

    if sql_error:
        # Determine which generator produced the failed SQL
        generated_by_llm = state.get("generated_by_llm", False)

        if generated_by_llm:
            # LLM SQL failed — fall back to rule-based, don't retry LLM
            return "sql_generator"

        if retry_count < 3:
            return "sql_generator"

    return "response_formatter"
```

- [ ] **Step 6: Update `llm_sql_generator` to set `generated_by_llm` flag**

Update the return dict in `llm_sql_generator`:

```python
    return {
        "generated_sql": sql,
        "intent_type": state.get("intent_type", "generic"),
        "sql_error": "",
        "generated_by_llm": True,
    }
```

- [ ] **Step 7: Add `generated_by_llm` to `AgentState`**

Update the `AgentState` TypedDict (around line 48):

```python
class AgentState(TypedDict, total=False):
    query: str
    intent_type: IntentType
    selected_schemas: List[str]
    generated_sql: str
    sql_error: str
    raw_data: List[Dict[str, Any]]
    final_response: Dict[str, Any]
    retry_count: int
    generated_by_llm: bool  # NEW: track whether SQL came from LLM
```

- [ ] **Step 8: Update `build_agent_graph` to wire the new nodes**

Replace the entire `build_agent_graph` function:

```python
def build_agent_graph():
    if StateGraph is None:
        return None

    graph = StateGraph(AgentState)
    graph.add_node("intent_schema_selector", intent_schema_selector)
    graph.add_node("sql_generator", sql_generator)
    graph.add_node("llm_sql_generator", llm_sql_generator)
    graph.add_node("sql_executor", sql_executor)
    graph.add_node("response_formatter", response_formatter)

    graph.add_edge(START, "intent_schema_selector")
    graph.add_conditional_edges(
        "intent_schema_selector",
        route_by_complexity,
        {
            "sql_generator": "sql_generator",
            "llm_sql_generator": "llm_sql_generator",
        },
    )
    graph.add_edge("sql_generator", "sql_executor")
    graph.add_edge("llm_sql_generator", "sql_executor")
    graph.add_conditional_edges(
        "sql_executor",
        should_retry_or_format,
        {
            "sql_generator": "sql_generator",
            "response_formatter": "response_formatter",
        },
    )
    graph.add_edge("response_formatter", END)
    return graph.compile()
```

- [ ] **Step 9: Update `_run_without_langgraph` fallback**

Replace the `_run_without_langgraph` function to include the LLM branch:

```python
def _run_without_langgraph(initial_state: AgentState) -> AgentState:
    state: AgentState = dict(initial_state)
    state.update(intent_schema_selector(state))

    # Route by complexity
    route = route_by_complexity(state)
    while True:
        if route == "llm_sql_generator":
            state.update(llm_sql_generator(state))
            # After LLM SQL fails, fall back to rule
            if state.get("sql_error"):
                state["generated_by_llm"] = False
                state.update(sql_generator(state))
        else:
            state.update(sql_generator(state))

        state.update(sql_executor(state))

        if not state.get("sql_error") or state.get("retry_count", 0) >= 3:
            break

        # After LLM-generated SQL fails, switch to rule-based
        if state.get("generated_by_llm"):
            state["generated_by_llm"] = False
            route = "sql_generator"

    for node in [response_formatter]:
        state.update(node(state))
    return state
```

- [ ] **Step 10: Run test to verify it passes**

Run: `cd backend && python manage.py test apps.text2sql.tests.test_agent_workflow -v 2`
Expected: All tests PASS

- [ ] **Step 11: Commit**

```bash
git add backend/apps/text2sql/agent_workflow.py backend/apps/text2sql/tests/test_agent_workflow.py
git commit -m "feat(text2sql): add LLM branch to LangGraph agent for complex queries"
```

---

### Task 4: 更新视图层日志和超时

**Files:**
- Modify: `backend/apps/videos/views.py`

- [ ] **Step 1: Update agent_search view logging**

In `backend/apps/videos/views.py`, find the `agent_search` action (around line 788) and update the log line to indicate v3:

```python
    def agent_search(self, request):
        """
        Agent智能搜索 - 使用SQL Agent进行智能查询，返回结构化结果
        支持规则引擎（简单查询）和 LLM（复杂组合查询）两条路径
        """
        search_query = request.data.get('query', '').strip()
        if not search_query:
            return Response({'error': '搜索查询不能为空'}, status=status.HTTP_400_BAD_REQUEST)

        if run_agent_search is not None:
            logger.info("agent_search v3 start query_len=%d query=%r", len(search_query), search_query[:200])
            try:
                response_payload = run_agent_search(search_query)
                return Response(response_payload)
            except Exception as e:
                logger.exception("agent_search v3 failed, falling back to legacy SQLAgent: %s", e)
```

- [ ] **Step 2: Run the full test suite**

Run: `cd backend && python manage.py test apps.text2sql.tests -v 2`
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add backend/apps/videos/views.py
git commit -m "feat(videos): update agent_search view logging for v3"
```

---

### Task 5: 手动集成测试

**Files:** None (manual testing only)

- [ ] **Step 1: Start backend and test rule-based path (unchanged)**

```bash
cd backend && .venv/Scripts/python.exe -c "
import json, urllib.request, sys
sys.stdout.reconfigure(encoding='utf-8')
data = json.dumps({'query': '金奖最多的团队'}).encode('utf-8')
req = urllib.request.Request('http://127.0.0.1:8000/api/videos/agent-search/', data=data, headers={'Content-Type': 'application/json; charset=utf-8'})
resp = urllib.request.urlopen(req, timeout=30)
result = json.loads(resp.read().decode('utf-8'))
print('ui_type:', result['ui_type'])
print('title:', result['title'])
print('data count:', len(result.get('data', [])))
assert result['ui_type'] == 'award_leaderboard', f'Expected award_leaderboard, got {result[\"ui_type\"]}'
print('PASS: rule-based path works')
"
```

- [ ] **Step 2: Test LLM path (complex query)**

```bash
cd backend && .venv/Scripts/python.exe -c "
import json, urllib.request, sys
sys.stdout.reconfigure(encoding='utf-8')
data = json.dumps({'query': '获得动作奖且获得过金奖的团队有哪些'}).encode('utf-8')
req = urllib.request.Request('http://127.0.0.1:8000/api/videos/agent-search/', data=data, headers={'Content-Type': 'application/json; charset=utf-8'})
resp = urllib.request.urlopen(req, timeout=60)
result = json.loads(resp.read().decode('utf-8'))
print('ui_type:', result['ui_type'])
print('title:', result['title'])
print('summary:', result.get('summary', '')[:100])
print('data count:', len(result.get('data', [])))
print('debug:', json.dumps(result.get('debug', {}), ensure_ascii=False)[:500])
print('PASS: LLM path works')
"
```

- [ ] **Step 3: Test LLM fallback (LLM SQL fails, falls back to rule)**

```bash
cd backend && .venv/Scripts/python.exe -c "
import json, urllib.request, sys
sys.stdout.reconfigure(encoding='utf-8')
# Query with conjunction but simple enough that fallback works
data = json.dumps({'query': '在ChinaJoy获得金奖的团队还参加过哪些其他比赛'}).encode('utf-8')
req = urllib.request.Request('http://127.0.0.1:8000/api/videos/agent-search/', data=data, headers={'Content-Type': 'application/json; charset=utf-8'})
resp = urllib.request.urlopen(req, timeout=60)
result = json.loads(resp.read().decode('utf-8'))
print('ui_type:', result['ui_type'])
print('Did not crash - PASS')
"
```

---

### Task 6: 前端增加 LLM 搜索关键词触发

**Files:**
- Modify: `src/pages/HomePage.tsx`

- [ ] **Step 1: Update `handleSearch` to also trigger agent for conjunction patterns**

In `src/pages/HomePage.tsx`, find the `handleSearch` function (around line 224). Update `shouldUseAgent` to also match conjunction patterns:

```typescript
  const handleSearch = async () => {
    const trimmed = inputValue.trim()
    const shouldUseAgent = trimmed.length > 0 && (
      trimmed.includes('奖') ||
      trimmed.includes('获奖') ||
      trimmed.includes('最多') ||
      trimmed.includes('团队') ||
      trimmed.includes('社团') ||
      /且|并且|同时|而且|既.*又/.test(trimmed) ||
      (trimmed.match(/[一-鿿]{1,6}奖/g) || []).length >= 2
    )

    if (shouldUseAgent) {
      setIsAgentLoading(true)
      try {
        const results = await agentService.search(inputValue)
        setAgentResults(results)
      } catch (error) {
        console.error('Agent搜索失败:', error)
        dispatch(setSearchQuery(inputValue) as any)
        dispatch(setCurrentPage(1) as any)
        setAgentResults(null)
      } finally {
        setIsAgentLoading(false)
      }
    } else {
      dispatch(setSearchQuery(inputValue) as any)
      dispatch(setCurrentPage(1) as any)
      setAgentResults(null)
    }
  }
```

- [ ] **Step 2: Start frontend and verify**

Run: `cd cosplay_web && npx vite --port 3001`
Open http://localhost:3001 and test:
1. Type "获得动作奖且获得过金奖的团队" → should show "正在智能搜索中..."
2. Type "金奖最多的团队" → should show "正在智能搜索中..."
3. Type "火影忍者" → should do normal search

- [ ] **Step 3: Commit**

```bash
git add src/pages/HomePage.tsx
git commit -m "feat(frontend): add conjunction pattern triggers for agent search"
```

---

## Graph Visualization (After Changes)

```
                    START
                      |
                      v
            intent_schema_selector
                      |
                      v
              route_by_complexity
               /            \
          "rule"          "llm"
            /                \
           v                  v
    sql_generator     llm_sql_generator
           \                /
            v              v
            sql_executor
                |
                v
       should_retry_or_format
         /            \
   sql_generator   response_formatter
   (retry/fallback)      |
                        v
                       END
```

**Key design decisions:**
1. LLM 分支失败后回退到规则引擎（不是重试 LLM），节省成本和延迟
2. 规则引擎仍然处理 3 种已知 intent（top_gold_groups, award_keyword, generic 简单查询），保证零延迟
3. Schema 预注入 prompt，LLM 只需 1 轮调用即可生成 SQL
4. `generated_by_llm` flag 让重试逻辑区分 SQL 来源
