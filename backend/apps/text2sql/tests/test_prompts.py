"""Tests for apps.text2sql.prompts module."""

from unittest import TestCase

from apps.text2sql.prompts import SYSTEM_PROMPT


class TestSystemPrompt(TestCase):
    """Tests for the SYSTEM_PROMPT constant."""

    def test_system_prompt_is_long_string(self):
        assert isinstance(SYSTEM_PROMPT, str)
        assert len(SYSTEM_PROMPT) > 500

    def test_system_prompt_contains_cosplay_role(self):
        assert 'Cosplay' in SYSTEM_PROMPT

    def test_system_prompt_contains_term_mapping(self):
        assert 'groups_group' in SYSTEM_PROMPT
        assert 'videos_video' in SYSTEM_PROMPT
        assert '社团' in SYSTEM_PROMPT

    def test_system_prompt_contains_id_instruction(self):
        assert 'id' in SYSTEM_PROMPT
        # Must instruct to include primary keys
        assert '主键' in SYSTEM_PROMPT

    def test_system_prompt_contains_ui_type(self):
        assert 'ui_type' in SYSTEM_PROMPT
        assert 'group_detail' in SYSTEM_PROMPT
        assert 'award_leaderboard' in SYSTEM_PROMPT

    def test_system_prompt_contains_safety(self):
        assert 'SELECT' in SYSTEM_PROMPT
        assert '只读' in SYSTEM_PROMPT or '只生成' in SYSTEM_PROMPT

    def test_system_prompt_contains_join_instruction(self):
        assert 'JOIN' in SYSTEM_PROMPT or 'join' in SYSTEM_PROMPT
