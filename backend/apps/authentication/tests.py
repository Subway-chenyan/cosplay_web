from urllib.parse import parse_qs, urlparse

from django.test import SimpleTestCase, override_settings
from django.urls import reverse


class QQLoginViewTests(SimpleTestCase):
    @override_settings(
        QQ_CONNECT_APP_ID='test-app-id',
        QQ_CONNECT_APP_KEY='',
        QQ_CONNECT_CALLBACK_URL='https://www.cosdrama.cn/api/auth/qq/callback',
        QQ_CONNECT_SCOPE='get_user_info',
        QQ_CONNECT_ALLOWED_REDIRECT_ORIGINS=[
            'https://www.cosdrama.cn',
            'https://cosdrama.cn',
        ],
    )
    def test_qq_login_redirects_to_authorize_without_requiring_app_key(self):
        response = self.client.get(
            reverse('qq-login'),
            {'next': 'https://www.cosdrama.cn/login/qq/callback'},
        )

        self.assertEqual(response.status_code, 302)
        location = response['Location']
        parsed = urlparse(location)
        params = parse_qs(parsed.query)

        self.assertEqual('https://graph.qq.com/oauth2.0/authorize', f'{parsed.scheme}://{parsed.netloc}{parsed.path}')
        self.assertEqual(params['response_type'], ['code'])
        self.assertEqual(params['client_id'], ['test-app-id'])
        self.assertEqual(params['redirect_uri'], ['https://www.cosdrama.cn/api/auth/qq/callback'])
        self.assertEqual(params['scope'], ['get_user_info'])
        self.assertIn('state', params)
