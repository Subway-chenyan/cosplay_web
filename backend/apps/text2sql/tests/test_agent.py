from django.test import TestCase
from unittest import mock
from apps.text2sql.agent import (
    get_schema_tool,
    execute_sql_tool,
    validate_sql_safety,
    create_sql_result,
    _get_thread_sql_result,
    _set_thread_sql_result,
)


class TestSQLSafety(TestCase):
    def test_validate_select_allowed(self):
        self.assertTrue(validate_sql_safety("SELECT * FROM groups_group"))

    def test_validate_select_with_join(self):
        self.assertTrue(validate_sql_safety(
            "SELECT g.id, g.name FROM groups_group g JOIN awards_awardrecord ar ON ar.group_id = g.id"
        ))

    def test_reject_insert(self):
        self.assertFalse(validate_sql_safety("INSERT INTO groups_group (name) VALUES ('test')"))

    def test_reject_delete(self):
        self.assertFalse(validate_sql_safety("DELETE FROM groups_group"))

    def test_reject_drop(self):
        self.assertFalse(validate_sql_safety("DROP TABLE groups_group"))

    def test_reject_update(self):
        self.assertFalse(validate_sql_safety("UPDATE groups_group SET name = 'x'"))

    def test_reject_case_insensitive(self):
        self.assertFalse(validate_sql_safety("insert into groups_group (name) values ('test')"))

    def test_reject_disallowed_table(self):
        self.assertFalse(validate_sql_safety("SELECT * FROM users_user"))

    def test_reject_disallowed_table_join(self):
        self.assertFalse(validate_sql_safety(
            "SELECT * FROM groups_group g JOIN users_user u ON u.id = g.created_by_id"
        ))

    def test_reject_multi_statement(self):
        self.assertFalse(validate_sql_safety("SELECT * FROM groups_group; SELECT * FROM users_user"))

    def test_reject_multi_statement_with_whitespace(self):
        self.assertFalse(validate_sql_safety("SELECT 1 ; SELECT * FROM users_user"))

    def test_allow_trailing_semicolon(self):
        self.assertTrue(validate_sql_safety("SELECT * FROM groups_group;"))


class TestGetSchemaTool(TestCase):
    def test_no_args_returns_table_list(self):
        result = get_schema_tool()
        self.assertIn('groups_group', result)
        self.assertGreater(len(result), 100)

    def test_specific_table_returns_columns(self):
        result = get_schema_tool(table_name='groups_group')
        self.assertIn('id', result)
        self.assertIn('name', result)

    def test_unknown_table_returns_error(self):
        result = get_schema_tool(table_name='nonexistent')
        self.assertTrue(
            'not found' in result.lower() or 'error' in result.lower() or 'unknown' in result.lower()
        )


class TestExecuteSQLTool(TestCase):
    def test_rejects_dangerous(self):
        with self.assertRaises(ValueError):
            execute_sql_tool("DELETE FROM groups_group")

    def test_rejects_non_allowed_table(self):
        with self.assertRaises(ValueError):
            execute_sql_tool("SELECT * FROM users_user")


class TestSQLResult(TestCase):
    def test_initially_empty(self):
        sr = create_sql_result()
        self.assertEqual(sr.rows, [])
        self.assertEqual(sr.sql, '')

    def test_thread_sql_result_isolation(self):
        """Different threads get independent SQLResult containers."""
        _set_thread_sql_result(None)
        self.assertIsNone(_get_thread_sql_result())
        sr = create_sql_result()
        _set_thread_sql_result(sr)
        self.assertIs(_get_thread_sql_result(), sr)
        _set_thread_sql_result(None)
        self.assertIsNone(_get_thread_sql_result())
