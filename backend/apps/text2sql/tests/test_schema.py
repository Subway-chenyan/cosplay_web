"""Tests for apps.text2sql.schema module."""

from unittest import TestCase

from apps.text2sql.schema import (
    ALLOWED_TABLES,
    _TABLES,
    get_table_schema,
    get_tables,
)


class TestSchema(TestCase):
    """Tests for the hardcoded schema module."""

    def test_get_tables_returns_10_tables(self):
        """get_tables() must return exactly 10 table summaries."""
        tables = get_tables()
        self.assertEqual(len(tables), 10)
        for t in tables:
            self.assertIn("name", t)
            self.assertIn("description", t)

    def test_get_table_schema_known_table_returns_columns(self):
        """A known table must return a dict with a non-empty columns list."""
        result = get_table_schema("groups_group")
        self.assertNotIn("error", result)
        self.assertEqual(result["name"], "groups_group")
        self.assertIsInstance(result["columns"], list)
        self.assertGreater(len(result["columns"]), 0)

    def test_get_table_schema_unknown_table_returns_error(self):
        """An unknown table name must produce an error dict."""
        result = get_table_schema("does_not_exist")
        self.assertIn("error", result)
        self.assertIn("does_not_exist", result["error"])

    def test_allowed_tables_is_frozenset(self):
        """ALLOWED_TABLES must be a frozenset with exactly 10 entries."""
        self.assertIsInstance(ALLOWED_TABLES, frozenset)
        self.assertEqual(len(ALLOWED_TABLES), 10)

    def test_get_table_schema_columns_have_types(self):
        """Every column in every table must have a non-empty 'type' field."""
        for table in _TABLES:
            for col in table["columns"]:
                self.assertIn("type", col)
                self.assertTrue(col["type"])
