"""Tests for apps.text2sql.prompts module."""

from unittest import TestCase

from apps.text2sql.prompts import SYSTEM_PROMPT


class TestSystemPrompt(TestCase):
    """Tests for the SYSTEM_PROMPT compatibility constant."""

    def test_system_prompt_is_long_string(self):
        self.assertIsInstance(SYSTEM_PROMPT, str)
        self.assertGreater(len(SYSTEM_PROMPT), 400)

    def test_system_prompt_contains_cosplay_role(self):
        self.assertIn('Cosplay', SYSTEM_PROMPT)

    def test_system_prompt_contains_term_mapping(self):
        self.assertIn('groups_group', SYSTEM_PROMPT)
        self.assertIn('videos_video', SYSTEM_PROMPT)
        self.assertIn('社团', SYSTEM_PROMPT)

    def test_system_prompt_contains_id_instruction(self):
        self.assertIn('id', SYSTEM_PROMPT)
        self.assertIn('主键', SYSTEM_PROMPT)

    def test_system_prompt_contains_ui_type(self):
        self.assertIn('ui_type', SYSTEM_PROMPT)
        self.assertIn('group_detail', SYSTEM_PROMPT)
        self.assertIn('award_leaderboard', SYSTEM_PROMPT)

    def test_system_prompt_contains_safety(self):
        self.assertIn('SELECT', SYSTEM_PROMPT)
        self.assertIn('只读', SYSTEM_PROMPT)

    def test_system_prompt_contains_join_instruction(self):
        self.assertIn('JOIN', SYSTEM_PROMPT)
