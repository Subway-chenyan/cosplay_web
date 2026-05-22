from unittest import TestCase, mock

from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()


class TestText2SQLQueryEndpoint(TestCase):
    """Tests for the text2sql query API endpoint."""

    def test_query_endpoint_requires_auth(self):
        """Unauthenticated requests must be rejected with 401 or 403."""
        client = APIClient()
        response = client.post('/api/text2sql/query/', {'question': 'test'}, format='json')
        self.assertIn(response.status_code, (401, 403))

    def test_query_endpoint_rejects_empty_question(self):
        """An empty question string must be rejected with 400."""
        client = APIClient()
        user = User.objects.create_user(username='test_text2sql', password='pass123')
        client.force_authenticate(user=user)
        response = client.post('/api/text2sql/query/', {'question': ''}, format='json')
        self.assertEqual(response.status_code, 400)
        user.delete()

    @mock.patch('apps.text2sql.views.invoke_agent')
    def test_query_success_returns_expected_fields(self, mock_invoke):
        """Authenticated request with valid question returns 200 with expected keys."""
        from apps.text2sql.agent import SQLResult

        sr = SQLResult()
        sr.rows = []
        sr.sql = 'SELECT COUNT(*) FROM groups_group'
        mock_invoke.return_value = (
            '【ui_type】: mixed_text\n【answer】: 目前共有5个社团。',
            sr,
        )

        client = APIClient()
        user = User.objects.create_user(username='test_text2sql_ok', password='pass123')
        client.force_authenticate(user=user)
        response = client.post(
            '/api/text2sql/query/',
            {'question': '有多少个社团？', 'include_sql': False},
            format='json',
        )
        self.assertEqual(response.status_code, 200)
        data = response.data
        self.assertEqual(data['answer_type'], 'text2sql')
        self.assertEqual(data['ui_type'], 'mixed_text')
        self.assertIn('5个社团', data['answer'])
        self.assertEqual(data['query'], '有多少个社团？')
        self.assertIn('video_id_list', data)
        self.assertIn('group_id_list', data)
        self.assertIn('data', data)
        user.delete()
