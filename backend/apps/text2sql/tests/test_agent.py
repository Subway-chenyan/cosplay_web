import pytest
from apps.text2sql.agent import (
    get_schema_tool,
    execute_sql_tool,
    validate_sql_safety,
    get_last_sql_result,
    get_last_sql_query,
)

# ─── SQL safety ───

def test_validate_select_allowed():
    assert validate_sql_safety("SELECT * FROM groups_group") is True

def test_validate_select_with_join():
    assert validate_sql_safety(
        "SELECT g.id, g.name FROM groups_group g JOIN awards_awardrecord ar ON ar.group_id = g.id"
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
    assert validate_sql_safety("SELECT * FROM users_user") is False

def test_reject_disallowed_table_join():
    assert validate_sql_safety(
        "SELECT * FROM groups_group g JOIN users_user u ON u.id = g.created_by_id"
    ) is False

# ─── get_schema tool ───

def test_get_schema_tool_no_args():
    result = get_schema_tool()
    assert 'groups_group' in result
    assert len(result) > 100

def test_get_schema_tool_specific_table():
    result = get_schema_tool(table_name='groups_group')
    assert 'id' in result
    assert 'name' in result

def test_get_schema_tool_unknown_table():
    result = get_schema_tool(table_name='nonexistent')
    assert 'not found' in result.lower() or 'error' in result.lower() or 'unknown' in result.lower()

# ─── execute_sql tool ───

def test_execute_sql_rejects_dangerous():
    with pytest.raises(ValueError, match='只允许 SELECT'):
        execute_sql_tool("DELETE FROM groups_group")

def test_execute_sql_rejects_non_allowed_table():
    with pytest.raises(ValueError, match='不允许查询'):
        execute_sql_tool("SELECT * FROM users_user")

# ─── last SQL result accessors ───

def test_get_last_sql_result_initially_empty():
    assert get_last_sql_result() == []

def test_get_last_sql_query_initially_empty():
    assert get_last_sql_query() == ''
