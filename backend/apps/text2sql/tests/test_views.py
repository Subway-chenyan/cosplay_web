from unittest import TestCase

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
