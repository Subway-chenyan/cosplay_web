"""Tests for apps.text2sql.hydration module."""

from unittest import TestCase

from apps.text2sql.hydration import extract_ids_from_rows, HydrationError


class TestExtractIdsFromRows(TestCase):
    """Tests for the extract_ids_from_rows helper function."""

    def test_extract_ids_simple(self):
        rows = [
            {'group_id': 'aaa', 'name': '社团A', 'cnt': 3},
            {'group_id': 'bbb', 'name': '社团B', 'cnt': 1},
        ]
        ids = extract_ids_from_rows(rows)
        assert set(ids['group_id']) == {'aaa', 'bbb'}
        assert set(ids['name']) == {'社团A', '社团B'}

    def test_extract_ids_multiple_fields(self):
        rows = [
            {'group_id': 'aaa', 'video_id': 'v1', 'award_record_id': 'ar1'},
            {'group_id': 'aaa', 'video_id': 'v2', 'award_record_id': 'ar2'},
        ]
        ids = extract_ids_from_rows(rows)
        assert set(ids['group_id']) == {'aaa'}
        assert set(ids['video_id']) == {'v1', 'v2'}
        assert set(ids['award_record_id']) == {'ar1', 'ar2'}

    def test_extract_ids_skips_none(self):
        rows = [
            {'group_id': 'aaa', 'video_id': None},
            {'group_id': 'bbb', 'video_id': 'v1'},
        ]
        ids = extract_ids_from_rows(rows)
        assert set(ids['group_id']) == {'aaa', 'bbb'}
        assert set(ids['video_id']) == {'v1'}

    def test_extract_ids_deduplicates(self):
        rows = [
            {'group_id': 'aaa'},
            {'group_id': 'aaa'},
            {'group_id': 'bbb'},
        ]
        ids = extract_ids_from_rows(rows)
        assert ids['group_id'] == ['aaa', 'bbb']

    def test_extract_ids_empty_rows(self):
        ids = extract_ids_from_rows([])
        assert ids == {}
