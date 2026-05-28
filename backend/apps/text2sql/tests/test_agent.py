from django.test import TestCase
from unittest import mock
from apps.text2sql.agent import (
    get_schema_tool,
    execute_sql_tool,
    validate_sql_safety,
    create_sql_result,
    invoke_agent,
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

    @mock.patch('apps.text2sql.agent._synthesize_answer')
    @mock.patch('apps.text2sql.agent.execute_sql_tool')
    @mock.patch('apps.text2sql.agent._generate_sql_with_llamaindex')
    def test_invoke_agent_uses_llamaindex_sql_adapter(self, mock_generate, mock_execute, mock_synthesize):
        mock_generate.return_value = (
            "SELECT g.id AS group_id, g.name FROM groups_group g ORDER BY g.name LIMIT 50"
        )
        mock_synthesize.return_value = "查询到 1 条相关结果。"

        def fill_result(sql, _sql_result=None):
            _sql_result.sql = sql
            _sql_result.rows = [{'group_id': 'group-1', 'name': '测试社团'}]
            return "查询到 1 行结果"

        mock_execute.side_effect = fill_result

        answer, sql_result, structured = invoke_agent("测试社团详情")

        self.assertEqual(answer, "查询到 1 条相关结果。")
        self.assertEqual(sql_result.sql, mock_generate.return_value)
        self.assertEqual(sql_result.rows[0]['group_id'], 'group-1')
        self.assertEqual(structured['ui_type'], 'group_detail')
        self.assertEqual(structured['group_id_list'], ['group-1'])
        mock_execute.assert_called_once()
