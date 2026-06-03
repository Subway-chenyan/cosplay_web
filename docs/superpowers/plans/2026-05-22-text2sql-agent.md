# Text2SQL Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a DeepSeek-powered text2sql agent as a Django REST API endpoint, returning results compatible with the existing `AgentSearchResultPanel` frontend component.

**Architecture:** `create_deep_agent()` from `deepagents` with two custom tools (`get_schema`, `execute_sql`). The agent generates SQL from natural language, executes it against PostgreSQL, then the backend hydrates raw results into full ORM objects via existing DRF serializers and returns them in the `AgentSearchResponse` format.

**Tech Stack:** Python 3, Django 4.2, DRF, deepagents 0.6.3, langchain-siliconflow, psycopg2, DeepSeek LLM (via SiliconFlow API)

---

### Task 1: Install dependency and register Django app

**Files:**
- Modify: `backend/requirements.txt`
- Modify: `backend/cosplay_api/settings.py` (LOCAL_APPS already has `'apps.text2sql'`)
- Modify: `backend/cosplay_api/urls.py`
- Create: `backend/apps/text2sql/__init__.py`

- [ ] **Step 1: Add `deepagents` to requirements.txt**

Open `backend/requirements.txt` and add `deepagents>=0.6.0` in the langchain/AI section (after `langgraph`).

- [ ] **Step 2: Install the dependency**

Run:
```bash
cd C:/Users/Subway/cosplay_web/backend
pip install "deepagents>=0.6.0"
```

- [ ] **Step 3: Register the URL in the main router**

Open `backend/cosplay_api/urls.py`. Add a line in the urlpatterns list alongside the existing app routes:
```python
path('api/text2sql/', include('apps.text2sql.urls')),
```

- [ ] **Step 4: Verify `apps.text2sql` is in INSTALLED_APPS**

Open `backend/cosplay_api/settings.py`. Confirm `'apps.text2sql'` is in `LOCAL_APPS`. It should already be there. If not, add it.

- [ ] **Step 5: Create the app directory with `__init__.py`**

Create `backend/apps/text2sql/__init__.py` as an empty file.

- [ ] **Step 6: Commit**

```bash
git add backend/requirements.txt backend/cosplay_api/urls.py backend/cosplay_api/settings.py backend/apps/text2sql/__init__.py
git commit -m "feat(text2sql): add deepagents dependency and register app"
```

---

### Task 2: Create schema module — table metadata cache

**Files:**
- Create: `backend/apps/text2sql/schema.py`
- Test: `backend/apps/text2sql/tests/test_schema.py`

This module provides a hardcoded schema dictionary for the 10 target tables. No database queries at runtime — the schema is embedded as a Python data structure for reliability and speed.

- [ ] **Step 1: Write the failing test**

Create `backend/apps/text2sql/tests/__init__.py` (empty) and `backend/apps/text2sql/tests/test_schema.py`:

```python
from apps.text2sql.schema import get_tables, get_table_schema, ALLOWED_TABLES

def test_get_tables_returns_list_of_allowed_tables():
    tables = get_tables()
    assert isinstance(tables, list)
    assert len(tables) == 10
    # spot-check a few
    names = [t['name'] for t in tables]
    assert 'groups_group' in names
    assert 'videos_video' in names
    assert 'awards_awardrecord' in names

def test_get_table_schema_known_table():
    schema = get_table_schema('groups_group')
    assert schema['table'] == 'groups_group'
    assert any(c['column'] == 'id' for c in schema['columns'])
    assert any(c['column'] == 'name' for c in schema['columns'])
    # check FK info
    assert any('FK → groups_group' in c.get('comment', '') or c.get('fk') for c in schema['columns'])

def test_get_table_schema_unknown_table():
    schema = get_table_schema('nonexistent_table')
    assert 'error' in schema

def test_allowed_tables_is_set():
    assert isinstance(ALLOWED_TABLES, set)
    assert 'groups_group' in ALLOWED_TABLES
    assert 'forum_post' not in ALLOWED_TABLES

def test_get_table_schema_returns_descriptions():
    """Each table entry should have a description in Chinese."""
    tables = get_tables()
    for t in tables:
        assert 'description' in t
        assert isinstance(t['description'], str)
        assert len(t['description']) > 0
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
cd C:/Users/Subway/cosplay_web/backend
python manage.py test apps.text2sql.tests.test_schema -v 2
```
Expected: FAIL (ModuleNotFoundError: No module named 'apps.text2sql.schema')

- [ ] **Step 3: Implement `schema.py`**

Create `backend/apps/text2sql/schema.py`:

```python
"""Hardcoded schema metadata for the 10 text2sql target tables.

This module provides table/column info to the agent without runtime DB queries.
The schema is derived from the live database and should be updated when models change.
"""

ALLOWED_TABLES = frozenset({
    'groups_group',
    'videos_video',
    'competitions_competition',
    'competitions_competitionyear',
    'competitions_event',
    'competitions_event_videos',
    'awards_award',
    'awards_awardrecord',
    'tags_tag',
    'tags_videotag',
})

_TABLES = [
    {
        'name': 'groups_group',
        'description': '社团/团体 — 包含社团名称、地区、视频数、获奖数',
        'columns': [
            {'column': 'id', 'type': 'uuid', 'pk': True},
            {'column': 'name', 'type': 'varchar(100)', 'comment': '社团名称，唯一'},
            {'column': 'description', 'type': 'text'},
            {'column': 'logo', 'type': 'varchar', 'comment': 'logo URL'},
            {'column': 'founded_date', 'type': 'date'},
            {'column': 'province', 'type': 'varchar(50)'},
            {'column': 'city', 'type': 'varchar(50)'},
            {'column': 'location', 'type': 'varchar(100)'},
            {'column': 'website', 'type': 'varchar'},
            {'column': 'email', 'type': 'varchar'},
            {'column': 'phone', 'type': 'varchar(20)'},
            {'column': 'weibo', 'type': 'varchar'},
            {'column': 'wechat', 'type': 'varchar(50)'},
            {'column': 'qq_group', 'type': 'varchar(20)'},
            {'column': 'bilibili', 'type': 'varchar'},
            {'column': 'is_active', 'type': 'boolean'},
            {'column': 'video_count', 'type': 'integer', 'comment': '视频数(冗余计数)'},
            {'column': 'award_count', 'type': 'integer', 'comment': '获奖数(冗余计数)'},
            {'column': 'created_at', 'type': 'timestamp'},
            {'column': 'updated_at', 'type': 'timestamp'},
            {'column': 'created_by_id', 'type': 'bigint', 'fk': 'users_user.id', 'comment': 'FK → users_user'},
        ],
    },
    {
        'name': 'videos_video',
        'description': '视频 — 包含BV号、标题、缩略图、所属社团和比赛',
        'columns': [
            {'column': 'id', 'type': 'uuid', 'pk': True},
            {'column': 'bv_number', 'type': 'varchar(20)', 'comment': 'B站BV号，唯一'},
            {'column': 'title', 'type': 'varchar(255)'},
            {'column': 'description', 'type': 'text'},
            {'column': 'url', 'type': 'varchar', 'comment': '视频URL'},
            {'column': 'thumbnail', 'type': 'varchar', 'comment': '缩略图URL'},
            {'column': 'year', 'type': 'integer'},
            {'column': 'group_id', 'type': 'uuid', 'fk': 'groups_group.id', 'comment': 'FK → groups_group'},
            {'column': 'competition_id', 'type': 'uuid', 'fk': 'competitions_competition.id', 'comment': 'FK → competitions_competition'},
            {'column': 'uploaded_by_id', 'type': 'bigint', 'fk': 'users_user.id', 'comment': 'FK → users_user'},
            {'column': 'created_at', 'type': 'timestamp'},
            {'column': 'updated_at', 'type': 'timestamp'},
        ],
    },
    {
        'name': 'competitions_competition',
        'description': '比赛 — 比赛名称、描述、banner',
        'columns': [
            {'column': 'id', 'type': 'uuid', 'pk': True},
            {'column': 'name', 'type': 'varchar(100)'},
            {'column': 'description', 'type': 'text'},
            {'column': 'website', 'type': 'varchar'},
            {'column': 'banner_image', 'type': 'varchar'},
            {'column': 'banner_gradient', 'type': 'jsonb'},
            {'column': 'award_display_order', 'type': 'jsonb'},
            {'column': 'created_at', 'type': 'timestamp'},
            {'column': 'updated_at', 'type': 'timestamp'},
        ],
    },
    {
        'name': 'competitions_competitionyear',
        'description': '比赛年度 — 比赛的年份，与competition联合唯一',
        'columns': [
            {'column': 'id', 'type': 'uuid', 'pk': True},
            {'column': 'competition_id', 'type': 'uuid', 'fk': 'competitions_competition.id', 'comment': 'FK → competitions_competition, CASCADE'},
            {'column': 'year', 'type': 'integer', 'comment': '年份'},
            {'column': 'description', 'type': 'text'},
            {'column': 'created_at', 'type': 'timestamp'},
            {'column': 'updated_at', 'type': 'timestamp'},
        ],
    },
    {
        'name': 'competitions_event',
        'description': '赛事活动 — 比赛的某个阶段的赛事，关联多个视频',
        'columns': [
            {'column': 'id', 'type': 'uuid', 'pk': True},
            {'column': 'competition_id', 'type': 'uuid', 'fk': 'competitions_competition.id', 'comment': 'FK → competitions_competition, CASCADE'},
            {'column': 'start_date', 'type': 'date'},
            {'column': 'end_date', 'type': 'date'},
            {'column': 'title', 'type': 'varchar(200)'},
            {'column': 'description', 'type': 'text'},
            {'column': 'contact', 'type': 'varchar(200)'},
            {'column': 'website', 'type': 'varchar'},
            {'column': 'promotional_image', 'type': 'varchar'},
            {'column': 'region', 'type': 'varchar(100)'},
            {'column': 'stage', 'type': 'varchar(20)', 'comment': "choices: preliminary/advancing/final/''"},
            {'column': 'created_at', 'type': 'timestamp'},
            {'column': 'updated_at', 'type': 'timestamp'},
        ],
    },
    {
        'name': 'competitions_event_videos',
        'description': '赛事-视频关联表 — M2M junction',
        'columns': [
            {'column': 'id', 'type': 'integer', 'pk': True, 'comment': 'auto PK'},
            {'column': 'event_id', 'type': 'uuid', 'fk': 'competitions_event.id'},
            {'column': 'video_id', 'type': 'uuid', 'fk': 'videos_video.id'},
        ],
    },
    {
        'name': 'awards_award',
        'description': '奖项定义 — 属于某个比赛',
        'columns': [
            {'column': 'id', 'type': 'uuid', 'pk': True},
            {'column': 'competition_id', 'type': 'uuid', 'fk': 'competitions_competition.id', 'comment': 'FK → competitions_competition, CASCADE'},
            {'column': 'name', 'type': 'varchar(100)'},
            {'column': 'created_at', 'type': 'timestamp'},
            {'column': 'updated_at', 'type': 'timestamp'},
        ],
    },
    {
        'name': 'awards_awardrecord',
        'description': '获奖记录 — 连接奖项、社团、视频和比赛年度',
        'columns': [
            {'column': 'id', 'type': 'uuid', 'pk': True},
            {'column': 'award_id', 'type': 'uuid', 'fk': 'awards_award.id', 'comment': 'FK → awards_award, CASCADE'},
            {'column': 'competition_year_id', 'type': 'uuid', 'fk': 'competitions_competitionyear.id', 'comment': 'FK → competitions_competitionyear, CASCADE'},
            {'column': 'group_id', 'type': 'uuid', 'fk': 'groups_group.id', 'comment': 'FK → groups_group'},
            {'column': 'video_id', 'type': 'uuid', 'fk': 'videos_video.id', 'comment': 'FK → videos_video'},
            {'column': 'drama_name', 'type': 'varchar(200)', 'comment': '剧目标题'},
            {'column': 'description', 'type': 'text'},
            {'column': 'created_at', 'type': 'timestamp'},
            {'column': 'updated_at', 'type': 'timestamp'},
        ],
    },
    {
        'name': 'tags_tag',
        'description': '标签 — IP/风格/其他分类',
        'columns': [
            {'column': 'id', 'type': 'uuid', 'pk': True},
            {'column': 'name', 'type': 'varchar(50)'},
            {'column': 'category', 'type': 'varchar(20)', 'comment': "choices: IP/style/other"},
            {'column': 'description', 'type': 'text'},
            {'column': 'color', 'type': 'varchar(7)', 'comment': 'hex color, default #007bff'},
            {'column': 'usage_count', 'type': 'integer'},
            {'column': 'is_active', 'type': 'boolean'},
            {'column': 'is_featured', 'type': 'boolean'},
            {'column': 'created_at', 'type': 'timestamp'},
            {'column': 'updated_at', 'type': 'timestamp'},
        ],
    },
    {
        'name': 'tags_videotag',
        'description': '视频-标签关联表 — M2M junction',
        'columns': [
            {'column': 'id', 'type': 'integer', 'pk': True, 'comment': 'auto PK'},
            {'column': 'video_id', 'type': 'uuid', 'fk': 'videos_video.id'},
            {'column': 'tag_id', 'type': 'uuid', 'fk': 'tags_tag.id'},
            {'column': 'created_at', 'type': 'timestamp'},
        ],
    },
]

_TABLE_MAP = {t['name']: t for t in _TABLES}

# Relationships summary for the prompt
RELATIONSHIPS = """
## 表关系

- groups_group ← videos_video.group_id (一个社团有多个视频)
- groups_group ← awards_awardrecord.group_id (一个社团有多条获奖记录)
- competitions_competition ← competitions_competitionyear.competition_id
- competitions_competition ← competitions_event.competition_id
- competitions_competition ← awards_award.competition_id
- competitions_competitionyear ← awards_awardrecord.competition_year_id
- awards_award ← awards_awardrecord.award_id
- videos_video ← awards_awardrecord.video_id
- tags_tag → tags_videotag ← videos_video (视频与标签多对多)
- competitions_event → competitions_event_videos → videos_video (赛事与视频多对多)
"""


def get_tables():
    """Return list of all allowed tables with name and description."""
    return [{'name': t['name'], 'description': t['description']} for t in _TABLES]


def get_table_schema(table_name: str):
    """Return full column info for one table, or error dict."""
    table = _TABLE_MAP.get(table_name)
    if not table:
        return {'error': f'Table "{table_name}" not found. Available: {", ".join(_TABLE_MAP)}'}
    return table
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
cd C:/Users/Subway/cosplay_web/backend
python manage.py test apps.text2sql.tests.test_schema -v 2
```
Expected: All 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/apps/text2sql/schema.py backend/apps/text2sql/tests/
git commit -m "feat(text2sql): add schema module with table metadata cache"
```

---

### Task 3: Create prompts module

**Files:**
- Create: `backend/apps/text2sql/prompts.py`
- Test: `backend/apps/text2sql/tests/test_prompts.py`

- [ ] **Step 1: Write the failing test**

Create `backend/apps/text2sql/tests/test_prompts.py`:

```python
from apps.text2sql.prompts import SYSTEM_PROMPT

def test_system_prompt_exists():
    assert isinstance(SYSTEM_PROMPT, str)
    assert len(SYSTEM_PROMPT) > 200

def test_system_prompt_contains_role():
    assert 'Cosplay' in SYSTEM_PROMPT or 'cosplay' in SYSTEM_PROMPT

def test_system_prompt_contains_term_mapping():
    assert 'groups_group' in SYSTEM_PROMPT
    assert 'videos_video' in SYSTEM_PROMPT

def test_system_prompt_contains_id_instruction():
    assert 'id' in SYSTEM_PROMPT.lower()
    # Must instruct agent to include primary keys
    assert 'SELECT' in SYSTEM_PROMPT or 'select' in SYSTEM_PROMPT

def test_system_prompt_contains_ui_type_instruction():
    assert 'ui_type' in SYSTEM_PROMPT

def test_system_prompt_contains_safety_rules():
    assert 'SELECT' in SYSTEM_PROMPT
    # Must mention safety
    assert '安全' in SYSTEM_PROMPT or '只读' in SYSTEM_PROMPT
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
cd C:/Users/Subway/cosplay_web/backend
python manage.py test apps.text2sql.tests.test_prompts -v 2
```
Expected: FAIL (ModuleNotFoundError)

- [ ] **Step 3: Implement `prompts.py`**

Create `backend/apps/text2sql/prompts.py`:

```python
from apps.text2sql.schema import RELATIONSHIPS, get_tables

_TABLE_LIST = '\n'.join(
    f"- `{t['name']}`: {t['description']}"
    for t in get_tables()
)

SYSTEM_PROMPT = f"""你是 Cosplay 舞台剧视频数据库的智能查询助手。你的任务是将用户的自然语言问题转换为 SQL 查询，执行查询，并用中文回答用户。

## 可用表

{_TABLE_LIST}

{RELATIONSHIPS}

## 业务术语对照

| 用户说法 | 对应表 |
|---------|--------|
| 社团/团队/剧社 | groups_group |
| 视频/作品 | videos_video |
| 比赛/赛事(定义) | competitions_competition |
| 比赛年度 | competitions_competitionyear |
| 赛事活动/场次 | competitions_event |
| 奖项(定义，如金奖/银奖) | awards_award |
| 获奖记录 | awards_awardrecord |
| 标签/IP/风格 | tags_tag |

## 工作流程

1. 先调用 `get_schema()` 了解可用表
2. 如果需要具体表结构，调用 `get_schema(table_name="xxx")` 获取列信息
3. 编写 SQL 并调用 `execute_sql(sql="YOUR_QUERY")` 执行
4. 根据查询结果用中文回答用户

## 关键规则

### 必须包含主键
所有 SELECT 查询**必须**包含相关表的 `id` 字段（UUID主键）。这是前端渲染卡片所必需的。
例如：`SELECT g.id, g.name, ... FROM groups_group g` 而不是 `SELECT g.name ...`

### 关联查询必须带 JOIN
获取社团信息时必须 JOIN groups_group；获取视频信息时必须 JOIN videos_video。
永远不要只返回 awards_awardrecord 的 id，要同时 JOIN 拿到 group.name、video.title 等。

### 只读安全
- 只生成 SELECT 语句
- 不要使用 INSERT/UPDATE/DELETE/DROP/ALTER/TRUNCATE
- 查询结果自动限制最多 50 行

### ui_type 输出规范
在回答中必须明确指定适合的 ui_type：
- `group_detail` — 用户询问某个/某些社团的详细信息、获奖、视频
- `award_leaderboard` — 用户要求排名、对比、排行榜
- `video_grid` — 用户搜索/浏览视频
- `mixed_text` — 纯数字统计、计数、简单事实

回答格式示例：
```
【ui_type】: group_detail
【answer】: XX剧社在2024年共获得5个奖项，代表作有《剧目A》。
【data_summary】: 1个社团, 3个视频, 5条获奖记录
```

## 注意事项
- PostgreSQL 语法，字符串用单引号
- LIKE 查询用 `ILIKE` 实现不区分大小写
- UUID 字段比较时用 `::text` 或直接传字符串
- 聚合查询时，GROUP BY 的列需要列出非聚合列
- 日期字段是 `date` 类型，不是 `timestamp`
"""
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
cd C:/Users/Subway/cosplay_web/backend
python manage.py test apps.text2sql.tests.test_prompts -v 2
```
Expected: All 6 tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/apps/text2sql/prompts.py backend/apps/text2sql/tests/test_prompts.py
git commit -m "feat(text2sql): add system prompt with term mapping and output format"
```

---

### Task 4: Create agent module — tools + create_deep_agent

**Files:**
- Create: `backend/apps/text2sql/agent.py`
- Test: `backend/apps/text2sql/tests/test_agent.py`

- [ ] **Step 1: Write the failing test**

Create `backend/apps/text2sql/tests/test_agent.py` (replace existing empty file):

```python
import re
import pytest
from unittest.mock import patch, MagicMock
from apps.text2sql.agent import get_schema_tool, execute_sql_tool, validate_sql_safety
from apps.text2sql.schema import ALLOWED_TABLES

# ─── SQL safety ───

def test_validate_select_allowed():
    assert validate_sql_safety("SELECT * FROM groups_group") is True

def test_validate_select_with_where():
    assert validate_sql_safety("SELECT g.name FROM groups_group g WHERE g.is_active = true") is True

def test_validate_select_with_join():
    assert validate_sql_safety(
        "SELECT g.id, g.name, COUNT(ar.id) "
        "FROM groups_group g JOIN awards_awardrecord ar ON ar.group_id = g.id "
        "GROUP BY g.id, g.name"
    ) is True

def test_reject_insert():
    assert validate_sql_safety("INSERT INTO groups_group (name) VALUES ('test')") is False

def test_reject_delete():
    assert validate_sql_safety("DELETE FROM groups_group") is False

def test_reject_drop():
    assert validate_sql_safety("DROP TABLE groups_group") is False

def test_reject_update():
    assert validate_sql_safety("UPDATE groups_group SET name = 'x'") is False

def test_reject_case_insensitive():
    assert validate_sql_safety("insert into groups_group (name) values ('test')") is False

def test_reject_disallowed_table():
    """SQL referencing tables outside ALLOWED_TABLES should be rejected."""
    sql = "SELECT * FROM users_user"
    assert validate_sql_safety(sql) is False

def test_reject_disallowed_table_join():
    sql = "SELECT * FROM groups_group g JOIN users_user u ON u.id = g.created_by_id"
    assert validate_sql_safety(sql) is False

# ─── get_schema tool ───

def test_get_schema_tool_no_args():
    result = get_schema_tool()
    assert 'groups_group' in result
    assert len(result) > 100  # should be substantial text

def test_get_schema_tool_specific_table():
    result = get_schema_tool(table_name='groups_group')
    assert 'id' in result
    assert 'name' in result
    assert 'uuid' in result

def test_get_schema_tool_unknown_table():
    result = get_schema_tool(table_name='nonexistent')
    assert 'not found' in result.lower() or 'error' in result.lower()

# ─── execute_sql tool ───

def test_execute_sql_rejects_dangerous():
    with pytest.raises(ValueError, match='只允许 SELECT'):
        execute_sql_tool("DELETE FROM groups_group")

def test_execute_sql_rejects_non_allowed_table():
    with pytest.raises(ValueError, match='不允许查询'):
        execute_sql_tool("SELECT * FROM users_user")

# ─── create_agent ───

@patch('apps.text2sql.agent.create_deep_agent')
def test_create_agent_calls_with_correct_params(mock_create):
    from apps.text2sql.agent import create_agent
    mock_agent = MagicMock()
    mock_create.return_value = mock_agent
    agent = create_agent()
    mock_create.assert_called_once()
    call_kwargs = mock_create.call_args[1]
    assert 'tools' in call_kwargs
    assert 'system_prompt' in call_kwargs
    assert len(call_kwargs['tools']) == 2
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
cd C:/Users/Subway/cosplay_web/backend
python manage.py test apps.text2sql.tests.test_agent -v 2
```
Expected: FAIL (ModuleNotFoundError)

- [ ] **Step 3: Implement `agent.py`**

Create `backend/apps/text2sql/agent.py`:

```python
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
    """Return True if sql is a safe read-only query on allowed tables."""
    if not sql.strip():
        return False
    if _DANGEROUS_RE.match(sql):
        return False
    if not re.match(r'^\s*SELECT\b', sql, re.IGNORECASE):
        return False
    # Extract referenced tables and check they're all allowed
    tables = _TABLE_NAME_RE.findall(sql)
    # Strip schema prefix if present (e.g., public.groups_group)
    bare_tables = {t.split('.')[-1].lower() for t in tables}
    if not bare_tables:
        return True
    if not bare_tables.issubset({t.lower() for t in ALLOWED_TABLES}):
        return False
    return True


# ─── Read-only DB connection ───

def _get_readonly_connection():
    """Create a dedicated read-only DB connection."""
    db = settings.DATABASES['default']
    conn = psycopg2.connect(
        host=db['HOST'],
        port=db['PORT'],
        dbname=db['NAME'],
        user=db['USER'],
        password=db['PASSWORD'],
        connect_timeout=5,
        options='-c default_transaction_read_only=on',
    )
    return conn


# ─── Tools ───

def get_schema_tool(table_name: str = "") -> str:
    """获取数据库表结构信息。不传参数返回所有可用表的列表，传入表名返回该表的列详情。"""
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


def execute_sql_tool(sql: str) -> str:
    """执行只读 SQL 查询。仅允许 SELECT 语句，自动限制返回 50 行。"""
    if not validate_sql_safety(sql):
        dangerous_match = _DANGEROUS_RE.match(sql)
        if dangerous_match:
            raise ValueError(f"安全错误：只允许 SELECT 查询，拒绝了 {dangerous_match.group(1).upper()} 操作")
        # Check if it's a disallowed table
        tables = {t.split('.')[-1].lower() for t in _TABLE_NAME_RE.findall(sql)}
        disallowed = tables - {t.lower() for t in ALLOWED_TABLES}
        if disallowed:
            raise ValueError(f"安全错误：不允许查询表 {', '.join(disallowed)}。只允许查询核心业务表。")
        raise ValueError("安全错误：只允许 SELECT 查询语句。")

    # Auto-add LIMIT 50 if not present
    stripped = sql.rstrip().rstrip(';')
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
            # Format as readable text with column headers
            col_widths = [max(len(str(c)), max((len(str(row[i])) for row in rows), default=0)) for i, c in enumerate(columns)]
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
    model = f"openai:deepseek-chat"
    os.environ.setdefault('OPENAI_API_KEY', api_key)
    os.environ.setdefault('OPENAI_API_BASE', 'https://api.siliconflow.cn/v1')

    _agent_instance = create_deep_agent(
        model=model,
        tools=[get_schema_tool, execute_sql_tool],
        system_prompt=SYSTEM_PROMPT,
    )
    logger.info("text2sql Deep Agent created with model=%s", model)
    return _agent_instance
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
cd C:/Users/Subway/cosplay_web/backend
python manage.py test apps.text2sql.tests.test_agent -v 2
```
Expected: All tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/apps/text2sql/agent.py backend/apps/text2sql/tests/test_agent.py
git commit -m "feat(text2sql): add agent module with SQL tools and Deep Agent factory"
```

---

### Task 5: Create hydration module

**Files:**
- Create: `backend/apps/text2sql/hydration.py`
- Test: `backend/apps/text2sql/tests/test_hydration.py`

This module takes the raw SQL result rows (dicts with UUID columns) and the agent's `ui_type`, then uses existing DRF serializers to produce the `data` array that the frontend expects.

- [ ] **Step 1: Write the failing test**

Create `backend/apps/text2sql/tests/test_hydration.py`:

```python
from apps.text2sql.hydration import extract_ids_from_rows, HydrationError

def test_extract_ids_simple():
    """Extract group IDs from simple rows."""
    rows = [
        {'group_id': 'aaa', 'name': '社团A', 'cnt': 3},
        {'group_id': 'bbb', 'name': '社团B', 'cnt': 1},
    ]
    ids = extract_ids_from_rows(rows, {'group_id': 'uuid'})
    assert set(ids['group_id']) == {'aaa', 'bbb'}

def test_extract_ids_multiple_fields():
    """Extract both group and video IDs."""
    rows = [
        {'group_id': 'aaa', 'video_id': 'v1', 'award_record_id': 'ar1'},
        {'group_id': 'aaa', 'video_id': 'v2', 'award_record_id': 'ar2'},
    ]
    ids = extract_ids_from_rows(rows, {
        'group_id': 'uuid',
        'video_id': 'uuid',
        'award_record_id': 'uuid',
    })
    assert set(ids['group_id']) == {'aaa'}
    assert set(ids['video_id']) == {'v1', 'v2'}
    assert set(ids['award_record_id']) == {'ar1', 'ar2'}

def test_extract_ids_skips_none():
    """None/null values should be skipped."""
    rows = [
        {'group_id': 'aaa', 'video_id': None},
        {'group_id': 'bbb', 'video_id': 'v1'},
    ]
    ids = extract_ids_from_rows(rows, {'group_id': 'uuid', 'video_id': 'uuid'})
    assert set(ids['group_id']) == {'aaa', 'bbb'}
    assert set(ids['video_id']) == {'v1'}

def test_extract_ids_id_field():
    """Also handles bare 'id' field."""
    rows = [{'id': 'x1', 'name': 'test'}]
    ids = extract_ids_from_rows(rows, {'id': 'uuid'})
    assert set(ids['id']) == {'x1'}
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
cd C:/Users/Subway/cosplay_web/backend
python manage.py test apps.text2sql.tests.test_hydration -v 2
```
Expected: FAIL

- [ ] **Step 3: Implement `hydration.py`**

Create `backend/apps/text2sql/hydration.py`:

```python
"""SQL result → ORM object hydration.

Takes raw SQL rows (list of dicts) containing UUID primary keys,
fetches full objects via Django ORM, and assembles them into the
data array format expected by the frontend AgentSearchResultPanel.
"""

import logging
from collections import defaultdict

from apps.groups.serializers import GroupSerializer
from apps.groups.models import Group
from apps.videos.serializers import VideoListSerializer
from apps.videos.models import Video
from apps.awards.serializers import AwardRecordSerializer
from apps.awards.models import AwardRecord

logger = logging.getLogger(__name__)

# Column names that the agent should use for entity IDs
ID_COLUMNS = {
    'group_id': Group, 'groups_group.id': Group,
    'group': Group, 'id': None,  # 'id' is ambiguous, resolved by context
    'video_id': Video, 'videos_video.id': Video,
    'video': Video,
    'award_record_id': AwardRecord, 'awards_awardrecord.id': AwardRecord,
    'award_record': AwardRecord,
}


class HydrationError(Exception):
    pass


def extract_ids_from_rows(rows: list[dict], field_types: dict[str, str] | None = None) -> dict[str, list[str]]:
    """Extract unique non-null UUID values from rows by column name.

    Args:
        rows: List of dicts from SQL query results.
        field_types: Optional mapping of column_name → 'uuid' (type hint). Columns not in this
                     map are still scanned but their values are returned as-is.

    Returns:
        Dict mapping column_name → list of unique string values.
    """
    result = defaultdict(list)
    seen = defaultdict(set)
    for row in rows:
        for key, value in row.items():
            if value is None:
                continue
            str_val = str(value).strip()
            if not str_val:
                continue
            if str_val not in seen[key]:
                seen[key].add(str_val)
                result[key].append(str_val)
    return dict(result)


def hydrate_groups(group_ids: list[str]) -> list[dict]:
    """Fetch groups by ID and serialize them."""
    if not group_ids:
        return []
    groups = Group.objects.filter(id__in=group_ids)
    return GroupSerializer(groups, many=True).data


def hydrate_videos(video_ids: list[str]) -> list[dict]:
    """Fetch videos by ID and serialize them with tags."""
    if not video_ids:
        return []
    videos = Video.objects.filter(id__in=video_ids).prefetch_related('tags').select_related('group', 'competition')
    return VideoListSerializer(videos, many=True).data


def hydrate_award_records(award_record_ids: list[str]) -> list[dict]:
    """Fetch award records by ID and serialize them with relations."""
    if not award_record_ids:
        return []
    records = (
        AwardRecord.objects.filter(id__in=award_record_ids)
        .select_related('award__competition', 'group', 'video', 'competition_year')
    )
    return AwardRecordSerializer(records, many=True).data


def build_data_array(
    rows: list[dict],
    ui_type: str,
    answer_text: str,
) -> dict:
    """Build the data/response structure for the frontend.

    Returns a dict with: video_id_list, group_id_list, data (hydrated objects).
    """
    # Extract all UUID-like values from rows
    ids_map = extract_ids_from_rows(rows)

    # Identify which IDs are group/video/award_record
    group_ids = ids_map.get('group_id', []) or ids_map.get('group', [])
    video_ids = ids_map.get('video_id', []) or ids_map.get('video', [])
    ar_ids = ids_map.get('award_record_id', []) or ids_map.get('award_record', [])

    # Also check for bare 'id' when only one entity type is involved
    if not group_ids and not video_ids and not ar_ids:
        all_ids = ids_map.get('id', [])
        # Heuristic: if rows have 'name' but no other FK, it's likely groups
        if all_ids and rows and 'name' in rows[0] and 'bv_number' not in rows[0]:
            group_ids = all_ids
        elif all_ids and rows and 'bv_number' in rows[0]:
            video_ids = all_ids

    # Hydrate
    groups_by_id = {g['id']: g for g in hydrate_groups(group_ids)}
    videos_by_id = {v['id']: v for v in hydrate_videos(video_ids)}
    ars_by_id = {a['id']: a for a in hydrate_award_records(ar_ids)}

    # Build data array based on ui_type
    data = []

    if ui_type == 'group_detail':
        # Group rows by group_id, collect videos and award_records per group
        grouped = defaultdict(lambda: {'group': None, 'videos': [], 'award_records': []})
        for row in rows:
            gid = str(row.get('group_id', row.get('group', '')))
            if gid and gid in groups_by_id:
                grouped[gid]['group'] = groups_by_id[gid]
            vid = str(row.get('video_id', row.get('video', '')))
            if vid and vid in videos_by_id and videos_by_id[vid] not in grouped[gid]['videos']:
                grouped[gid]['videos'].append(videos_by_id[vid])
            arid = str(row.get('award_record_id', row.get('award_record', '')))
            if arid and arid in ars_by_id and ars_by_id[arid] not in grouped[gid]['award_records']:
                grouped[gid]['award_records'].append(ars_by_id[arid])
        data = list(grouped.values())

    elif ui_type == 'video_grid':
        seen_videos = set()
        for row in rows:
            vid = str(row.get('video_id', row.get('video', row.get('id', ''))))
            if vid and vid in videos_by_id and vid not in seen_videos:
                seen_videos.add(vid)
                gid = str(row.get('group_id', row.get('group', '')))
                arid = str(row.get('award_record_id', row.get('award_record', '')))
                item = {
                    'video': videos_by_id[vid],
                    'group': groups_by_id.get(gid),
                    'award_record': ars_by_id.get(arid),
                }
                data.append(item)

    elif ui_type == 'award_leaderboard':
        grouped = defaultdict(lambda: {'group': None, 'metrics': {'award_count': 0}, 'award_records': [], 'videos': []})
        for row in rows:
            gid = str(row.get('group_id', row.get('group', '')))
            if gid and gid in groups_by_id:
                grouped[gid]['group'] = groups_by_id[gid]
            count = row.get('award_count', row.get('cnt', 1))
            if isinstance(count, (int, float)):
                grouped[gid]['metrics']['award_count'] = int(count)
            arid = str(row.get('award_record_id', row.get('award_record', '')))
            if arid and arid in ars_by_id:
                grouped[gid]['award_records'].append(ars_by_id[arid])
            vid = str(row.get('video_id', row.get('video', '')))
            if vid and vid in videos_by_id:
                grouped[gid]['videos'].append(videos_by_id[vid])
        data = list(grouped.values())

    else:
        # mixed_text or unknown — return minimal structure
        data = []

    return {
        'video_id_list': list(videos_by_id.keys()),
        'group_id_list': list(groups_by_id.keys()),
        'data': data,
    }
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
cd C:/Users/Subway/cosplay_web/backend
python manage.py test apps.text2sql.tests.test_hydration -v 2
```
Expected: All 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add backend/apps/text2sql/hydration.py backend/apps/text2sql/tests/test_hydration.py
git commit -m "feat(text2sql): add hydration module for SQL result → ORM object mapping"
```

---

### Task 6: Create serializers and views

**Files:**
- Create: `backend/apps/text2sql/serializers.py`
- Create: `backend/apps/text2sql/views.py`
- Create: `backend/apps/text2sql/urls.py`
- Test: `backend/apps/text2sql/tests/test_views.py`

- [ ] **Step 1: Write the failing test**

Create `backend/apps/text2sql/tests/test_views.py`:

```python
from rest_framework.test import APIClient
from django.urls import reverse

def test_query_endpoint_requires_auth():
    """Unauthenticated requests should be rejected (JWT required)."""
    client = APIClient()
    url = '/api/text2sql/query/'
    response = client.post(url, {'question': 'test'}, format='json')
    # JWT is required; AllowAny would return 200. We expect 401.
    assert response.status_code in (401, 403)

def test_query_endpoint_rejects_empty_question():
    """Empty question should return 400."""
    from rest_framework.test import force_authenticate
    from django.contrib.auth import get_user_model
    User = get_user_model()
    client = APIClient()
    user = User.objects.create_user(username='test_user', password='pass')
    client.force_authenticate(user=user)
    response = client.post('/api/text2sql/query/', {'question': ''}, format='json')
    assert response.status_code == 400
    user.delete()
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
cd C:/Users/Subway/cosplay_web/backend
python manage.py test apps.text2sql.tests.test_views -v 2
```
Expected: FAIL (URL not found or import error)

- [ ] **Step 3: Implement serializers, views, and urls**

Create `backend/apps/text2sql/serializers.py`:

```python
from rest_framework import serializers


class Text2SQLQuerySerializer(serializers.Serializer):
    question = serializers.CharField(min_length=1, max_length=500, help_text="自然语言查询问题")
    include_sql = serializers.BooleanField(default=False, help_text="是否在响应中返回生成的SQL")
```

Create `backend/apps/text2sql/views.py`:

```python
import re
import logging
import time

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .serializers import Text2SQLQuerySerializer
from .agent import create_agent
from .hydration import build_data_array

logger = logging.getLogger(__name__)

UI_TYPE_RE = re.compile(r'【ui_type】\s*:\s*(\w+)', re.IGNORECASE)
ANSWER_RE = re.compile(r'【answer】\s*:\s*(.+?)(?=【|$)', re.IGNORECASE | re.DOTALL)


def _parse_agent_response(text: str) -> dict:
    """Extract ui_type and answer from the agent's structured output."""
    ui_match = UI_TYPE_RE.search(text)
    answer_match = ANSWER_RE.search(text)
    return {
        'ui_type': ui_match.group(1).strip().lower() if ui_match else 'mixed_text',
        'answer': answer_match.group(1).strip() if answer_match else text.strip(),
    }


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def query(request):
    """
    Text2SQL 查询端点 — 用自然语言查询 Cosplay 数据库。
    """
    serializer = Text2SQLQuerySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    question = serializer.validated_data['question']
    include_sql = serializer.validated_data['include_sql']

    logger.info("text2sql query from user=%s len=%d q=%r",
                request.user.id, len(question), question[:200])

    try:
        agent = create_agent()
        t0 = time.time()
        result = agent.invoke({"messages": [{"role": "user", "content": question}]})
        elapsed = time.time() - t0
        logger.info("text2sql agent completed in %.1fs", elapsed)
    except Exception as e:
        logger.exception("text2sql agent invoke failed: %s", e)
        return Response(
            {'error': f'AI 查询服务暂不可用，请稍后重试: {str(e)}'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    # Extract the agent's final text response
    # Deep Agent returns messages; the last assistant message is the answer
    if hasattr(result, 'messages'):
        last_msg = result.messages[-1] if result.messages else {}
        agent_text = last_msg.get('content', '') if isinstance(last_msg, dict) else str(last_msg)
    elif isinstance(result, dict):
        agent_text = result.get('content', result.get('text', str(result)))
    else:
        agent_text = str(result)

    if not agent_text:
        return Response({'error': 'AI 未返回有效回答'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    # Parse structured output
    parsed = _parse_agent_response(agent_text)
    ui_type = parsed['ui_type']
    answer = parsed['answer']

    # Build title/summary from answer (first sentence or first 50 chars)
    title = answer[:50].replace('\n', ' ')
    summary = answer

    # For now, return a text-only response.
    # The hydration (ORM fetch) is triggered when the agent's SQL results contain entity IDs.
    # The agent text itself may contain the SQL in a code block; extract it for debug.
    sql_match = re.search(r'```sql\n(.*?)\n```', agent_text, re.DOTALL)
    generated_sql = sql_match.group(1).strip() if sql_match else ''

    response_data = {
        'answer': answer,
        'query': question,
        'answer_type': 'text2sql',
        'ui_type': ui_type,
        'title': title,
        'summary': summary,
        'text': answer,
        'video_id_list': [],
        'group_id_list': [],
        'data': [],
        'sections': [],
    }

    if include_sql and generated_sql:
        response_data['sql'] = generated_sql
        response_data['debug'] = {'generated_sql': generated_sql}

    return Response(response_data, status=status.HTTP_200_OK)
```

Create `backend/apps/text2sql/urls.py`:

```python
from django.urls import path
from . import views

urlpatterns = [
    path('query/', views.query, name='text2sql-query'),
]
```

- [ ] **Step 4: Run tests to verify they pass**

Run:
```bash
cd C:/Users/Subway/cosplay_web/backend
python manage.py test apps.text2sql.tests.test_views -v 2
```
Expected: Both tests PASS

- [ ] **Step 5: Verify the URL is accessible**

Run:
```bash
cd C:/Users/Subway/cosplay_web/backend
python manage.py show_urls 2>/dev/null | grep text2sql || python -c "
from django.urls import reverse, resolve
print(resolve('/api/text2sql/query/'))
"
```
Expected: Resolves to the `query` view.

- [ ] **Step 6: Commit**

```bash
git add backend/apps/text2sql/serializers.py backend/apps/text2sql/views.py backend/apps/text2sql/urls.py backend/apps/text2sql/tests/test_views.py
git commit -m "feat(text2sql): add API endpoint, serializers, and URL routing"
```

---

### Task 7: Wire up hydration in the view

This task connects the agent's SQL execution results with the ORM hydration pipeline so the response includes full data objects for the frontend cards.

**Files:**
- Modify: `backend/apps/text2sql/views.py`

- [ ] **Step 1: Modify the view to capture and hydrate SQL results**

The current agent flow is: user question → agent invokes tools (get_schema, execute_sql) internally → agent returns final text answer. The problem is that `create_deep_agent().invoke()` returns the final message text, not the intermediate tool call results.

**Strategy:** We need to capture what the agent queried. Two approaches:

**Chosen approach:** Use the agent's response to extract a summary answer. For hydration, we modify `execute_sql_tool` to also store the last query results in a thread-local variable, which the view can then read after `invoke()` returns.

Add the following to `backend/apps/text2sql/agent.py` — a module-level cache for the last SQL results:

```python
# At the top of agent.py, add:
import threading

_last_sql_result = threading.local()


def get_last_sql_result():
    """Return the cached SQL result rows from the most recent execute_sql_tool call."""
    return getattr(_last_sql_result, 'rows', [])


def get_last_sql_query():
    """Return the cached SQL query string from the most recent execute_sql_tool call."""
    return getattr(_last_sql_result, 'sql', '')
```

Then modify `execute_sql_tool` to store results:

```python
def execute_sql_tool(sql: str) -> str:
    # ... existing validation code ...

    # After the SELECT query executes and rows are fetched, add:
    _last_sql_result.rows = [dict(zip(columns, row)) for row in rows]
    _last_sql_result.sql = stripped

    # ... rest of the function (format as text and return) ...
```

Then modify `backend/apps/text2sql/views.py` to use the cached results:

```python
from .agent import create_agent, get_last_sql_result, get_last_sql_query

# In the query() view, after agent.invoke():
    sql_rows = get_last_sql_result()
    generated_sql = get_last_sql_query()

    # Build hydrated data if we have SQL results with entity IDs
    if sql_rows:
        from .hydration import build_data_array
        hydrated = build_data_array(sql_rows, ui_type, answer)
        response_data['video_id_list'] = hydrated['video_id_list']
        response_data['group_id_list'] = hydrated['group_id_list']
        response_data['data'] = hydrated['data']

    if include_sql and generated_sql:
        response_data['sql'] = generated_sql
        response_data['debug'] = {'generated_sql': generated_sql}
```

- [ ] **Step 2: Run all tests**

Run:
```bash
cd C:/Users/Subway/cosplay_web/backend
python manage.py test apps.text2sql -v 2
```
Expected: All tests PASS

- [ ] **Step 3: Commit**

```bash
git add backend/apps/text2sql/agent.py backend/apps/text2sql/views.py
git commit -m "feat(text2sql): wire up SQL result hydration for frontend card rendering"
```

---

### Task 8: Add throttling and rate limiting

**Files:**
- Modify: `backend/cosplay_api/settings.py` (REST_FRAMEWORK section)

- [ ] **Step 1: Add throttle class for text2sql**

In `backend/cosplay_api/settings.py`, find the `REST_FRAMEWORK` dict and add to `DEFAULT_THROTTLE_RATES`:

```python
'TEXT2SQL': '3/min',
```

- [ ] **Step 2: Apply throttle to the view**

In `backend/apps/text2sql/views.py`, update the decorators:

```python
from rest_framework.throttling import UserRateThrottle

class Text2SQLThrottle(UserRateThrottle):
    scope = 'text2sql'

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@throttle_classes([Text2SQLThrottle])
def query(request):
    ...
```

- [ ] **Step 3: Run all tests**

Run:
```bash
cd C:/Users/Subway/cosplay_web/backend
python manage.py test apps.text2sql -v 2
```
Expected: All tests PASS

- [ ] **Step 4: Commit**

```bash
git add backend/cosplay_api/settings.py backend/apps/text2sql/views.py
git commit -m "feat(text2sql): add rate limiting (3 requests/min per user)"
```

---

### Task 9: Manual integration test

**Files:** None (manual testing only)

- [ ] **Step 1: Start the Django dev server**

```bash
cd C:/Users/Subway/cosplay_web/backend
python manage.py runserver
```

- [ ] **Step 2: Test with curl (authenticated)**

First get a JWT token (login or use existing), then:

```bash
curl -X POST http://localhost:8000/api/text2sql/query/ \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"question": "目前有多少个社团？", "include_sql": true}'
```

Expected: Response with `answer`, `sql`, and `ui_type: "mixed_text"`.

```bash
curl -X POST http://localhost:8000/api/text2sql/query/ \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"question": "列出2024年获奖最多的3个社团", "include_sql": true}'
```

Expected: Response with `ui_type: "award_leaderboard"`, `data` containing hydrated group objects with `id`.

- [ ] **Step 3: Verify SQL safety**

```bash
curl -X POST http://localhost:8000/api/text2sql/query/ \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"question": "删除所有社团"}'
```

Expected: Agent either refuses or the execute_sql tool rejects non-SELECT SQL.

- [ ] **Step 4: Final commit**

If all manual tests pass, no code changes needed. If bugs were found, fix and commit.
