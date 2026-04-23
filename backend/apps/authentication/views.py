from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from django.conf import settings
from django.core import signing
from django.core.signing import BadSignature, SignatureExpired
from django.db import transaction
from django.shortcuts import redirect
from django.urls import reverse
from apps.users.serializers import UserSerializer
from .models import SocialAccountLink
import json
import os
from urllib.parse import parse_qs, urlencode, urlparse, urlunparse

import requests

User = get_user_model()

QQ_AUTHORIZE_URL = 'https://graph.qq.com/oauth2.0/authorize'
QQ_TOKEN_URL = 'https://graph.qq.com/oauth2.0/token'
QQ_ME_URL = 'https://graph.qq.com/oauth2.0/me'
QQ_USER_INFO_URL = 'https://graph.qq.com/user/get_user_info'

def load_upload_config():
    """加载上传配置"""
    config_path = os.path.join(settings.BASE_DIR, 'upload_data', 'config.json')
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return {
            "upload_key": "cosplay_upload_key_2024",
            "max_file_size": 52428800,
            "allowed_extensions": [".xlsx", ".xls", ".csv"]
        }


def _is_allowed_redirect_url(url):
    """限制 OAuth 回跳地址，避免将本站 token 重定向到任意站点。"""
    if not url:
        return False

    parsed = urlparse(url)
    if parsed.scheme not in ('http', 'https') or not parsed.netloc:
        return False

    origin = f'{parsed.scheme}://{parsed.netloc}'
    return origin in settings.QQ_CONNECT_ALLOWED_REDIRECT_ORIGINS


def _build_redirect_url(base_url, params):
    parsed = urlparse(base_url)
    query = parse_qs(parsed.query, keep_blank_values=True)

    for key, value in params.items():
        if value is not None:
            query[key] = [str(value)]

    return urlunparse(parsed._replace(query=urlencode(query, doseq=True)))


def _get_login_redirect_target(request):
    callback_url = request.GET.get('next') or request.META.get('HTTP_REFERER') or ''
    if _is_allowed_redirect_url(callback_url):
        return callback_url
    return ''


def _build_qq_state(redirect_target):
    return signing.dumps(
        {'redirect_target': redirect_target},
        salt='qq-oauth-state',
    )


def _parse_qq_state(state):
    return signing.loads(
        state,
        salt='qq-oauth-state',
        max_age=600,
    )


def _get_qq_callback_url(request):
    configured_url = settings.QQ_CONNECT_CALLBACK_URL.strip()
    if configured_url:
        return configured_url
    return request.build_absolute_uri(reverse('qq-callback'))


def _get_qq_avatar(user_info):
    return (
        user_info.get('figureurl_qq_2')
        or user_info.get('figureurl_qq_1')
        or user_info.get('figureurl_2')
        or user_info.get('figureurl_1')
        or user_info.get('figureurl')
        or ''
    )


def _build_unique_username(openid):
    base_username = f'qq_{openid[:18]}'
    username = base_username
    suffix = 1

    while User.objects.filter(username=username).exists():
        username = f'{base_username}_{suffix}'
        suffix += 1

    return username


def _build_unique_email(openid):
    base_email = f'qq_{openid}@qq.connect.local'
    email = base_email
    suffix = 1

    while User.objects.filter(email=email).exists():
        email = f'qq_{openid}_{suffix}@qq.connect.local'
        suffix += 1

    return email


@transaction.atomic
def _get_or_create_qq_user(openid, user_info):
    nickname = (user_info.get('nickname') or '').strip()
    avatar_url = _get_qq_avatar(user_info)

    link = SocialAccountLink.objects.select_related('user').filter(
        provider=SocialAccountLink.PROVIDER_QQ,
        openid=openid,
    ).first()

    if link:
        user = link.user
    else:
        user = User.objects.create_user(
            username=_build_unique_username(openid),
            email=_build_unique_email(openid),
            password=None,
            nickname=nickname[:50],
            role='viewer',
        )
        user.set_unusable_password()
        user.save(update_fields=['password'])

        link = SocialAccountLink.objects.create(
            user=user,
            provider=SocialAccountLink.PROVIDER_QQ,
            openid=openid,
        )

    if nickname and user.nickname != nickname[:50]:
        user.nickname = nickname[:50]
        user.save(update_fields=['nickname'])

    updates = []
    if link.nickname != nickname[:100]:
        link.nickname = nickname[:100]
        updates.append('nickname')
    if link.avatar_url != avatar_url:
        link.avatar_url = avatar_url
        updates.append('avatar_url')
    if updates:
        link.save(update_fields=updates + ['updated_at'])

    return user


def _issue_tokens(user):
    refresh = RefreshToken.for_user(user)
    return {
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }


def _redirect_oauth_result(redirect_target='', extra_params=None):
    extra_params = extra_params or {}

    if _is_allowed_redirect_url(redirect_target):
        return redirect(_build_redirect_url(redirect_target, extra_params))

    if extra_params.get('error'):
        return Response(extra_params, status=status.HTTP_400_BAD_REQUEST)

    return Response(
        {'detail': 'QQ 登录成功，但未配置前端回调地址'},
        status=status.HTTP_200_OK,
    )


def _fetch_json(url, params):
    response = requests.get(url, params=params, timeout=10)
    response.raise_for_status()
    return response.json()


def _fetch_qq_access_token(code, redirect_uri):
    response = requests.get(
        QQ_TOKEN_URL,
        params={
            'grant_type': 'authorization_code',
            'client_id': settings.QQ_CONNECT_APP_ID,
            'client_secret': settings.QQ_CONNECT_APP_KEY,
            'code': code,
            'redirect_uri': redirect_uri,
            'fmt': 'json',
        },
        timeout=10,
    )
    response.raise_for_status()
    data = response.json()

    if 'access_token' not in data:
        raise ValueError(data.get('error_description') or '获取 access token 失败')

    return data['access_token']


class LoginView(APIView):
    """
    用户登录视图
    """
    permission_classes = []
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response({'error': '用户名和密码不能为空'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = authenticate(username=username, password=password)
        if user:
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': UserSerializer(user).data
            })
        
        return Response({'error': '用户名或密码错误'}, status=status.HTTP_401_UNAUTHORIZED)


class LogoutView(APIView):
    """
    用户登出视图
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh_token')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({'message': '登出成功'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class RefreshView(APIView):
    """
    刷新令牌视图
    """
    permission_classes = []
    
    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return Response({'error': 'refresh token是必需的'}, status=status.HTTP_400_BAD_REQUEST)
            
            token = RefreshToken(refresh_token)
            return Response({
                'access': str(token.access_token),
            })
        except Exception as e:
            return Response({'error': '无效的refresh token'}, status=status.HTTP_401_UNAUTHORIZED)


class MeView(APIView):
    """
    获取当前用户信息
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class QQLoginView(APIView):
    """
    发起 QQ OAuth 登录。
    """
    permission_classes = []

    def get(self, request):
        redirect_target = _get_login_redirect_target(request)
        if not settings.QQ_CONNECT_APP_ID:
            return _redirect_oauth_result(redirect_target, {
                'error': 'qq_not_configured',
                'detail': 'QQ 登录尚未配置，请先在 .env 中填写 QQ_CONNECT_APP_ID',
            })

        state = _build_qq_state(redirect_target)

        authorize_url = f'{QQ_AUTHORIZE_URL}?{urlencode({
            "response_type": "code",
            "client_id": settings.QQ_CONNECT_APP_ID,
            "redirect_uri": _get_qq_callback_url(request),
            "state": state,
            "scope": settings.QQ_CONNECT_SCOPE,
        })}'
        return redirect(authorize_url)


class QQCallbackView(APIView):
    """
    处理 QQ OAuth 回调并签发本站 JWT。
    """
    permission_classes = []

    def get(self, request):
        state = request.GET.get('state', '')
        code = request.GET.get('code')
        error = request.GET.get('error')
        error_description = request.GET.get('error_description')
        redirect_target = ''

        try:
            parsed_state = _parse_qq_state(state)
            redirect_target = parsed_state.get('redirect_target', '')
        except SignatureExpired:
            return _redirect_oauth_result('', {
                'error': 'state_expired',
                'detail': 'QQ 登录已超时，请重新发起登录',
            })
        except BadSignature:
            return _redirect_oauth_result('', {
                'error': 'invalid_state',
                'detail': 'QQ 登录状态校验失败，请重试',
            })

        if error:
            return _redirect_oauth_result(redirect_target, {
                'error': error,
                'detail': error_description or 'QQ 登录已取消或授权失败',
            })

        if not code:
            return _redirect_oauth_result(redirect_target, {
                'error': 'missing_code',
                'detail': 'QQ 登录回调缺少授权码',
            })

        if not settings.QQ_CONNECT_APP_ID or not settings.QQ_CONNECT_APP_KEY:
            return _redirect_oauth_result(redirect_target, {
                'error': 'qq_not_configured',
                'detail': 'QQ 登录尚未完整配置，请先在 .env 中填写 QQ_CONNECT_APP_ID 和 QQ_CONNECT_APP_KEY',
            })

        try:
            redirect_uri = _get_qq_callback_url(request)
            access_token = _fetch_qq_access_token(code, redirect_uri)
            openid_payload = _fetch_json(QQ_ME_URL, {
                'access_token': access_token,
                'fmt': 'json',
            })
            openid = openid_payload.get('openid')
            if not openid:
                raise ValueError('未获取到 openid')

            user_info = _fetch_json(QQ_USER_INFO_URL, {
                'access_token': access_token,
                'oauth_consumer_key': settings.QQ_CONNECT_APP_ID,
                'openid': openid,
                'fmt': 'json',
            })
            if user_info.get('ret') not in (0, '0', None):
                raise ValueError(user_info.get('msg') or '获取 QQ 用户信息失败')

            user = _get_or_create_qq_user(openid, user_info)
            tokens = _issue_tokens(user)
            return _redirect_oauth_result(redirect_target, {
                **tokens,
                'provider': 'qq',
            })
        except requests.RequestException:
            return _redirect_oauth_result(redirect_target, {
                'error': 'qq_request_failed',
                'detail': 'QQ 登录请求失败，请稍后重试',
            })
        except ValueError as exc:
            return _redirect_oauth_result(redirect_target, {
                'error': 'qq_login_failed',
                'detail': str(exc),
            })
        except Exception:
            return _redirect_oauth_result(redirect_target, {
                'error': 'server_error',
                'detail': 'QQ 登录处理失败，请联系管理员',
            })


class VerifyManagementKeyView(APIView):
    """
    验证管理密钥
    """
    permission_classes = []
    
    def post(self, request):
        management_key = request.data.get('management_key')
        
        if not management_key:
            return Response({
                'valid': False,
                'message': '管理密钥不能为空'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 从配置文件中获取上传密钥，与数据导入页面使用相同的密钥
        config = load_upload_config()
        expected_key = config.get('upload_key')
        
        if management_key == expected_key:
            # 创建一个临时用户token用于管理操作
            try:
                # 尝试获取管理员用户，如果不存在则创建
                admin_user, created = User.objects.get_or_create(
                    username='admin_management',
                    defaults={
                        'is_staff': True,
                        'is_superuser': True,
                        'email': 'admin@management.local'
                    }
                )
                
                refresh = RefreshToken.for_user(admin_user)
                return Response({
                    'valid': True,
                    'message': '管理密钥验证成功',
                    'token': str(refresh.access_token)
                }, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({
                    'valid': False,
                    'message': f'创建管理token失败: {str(e)}'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            return Response({
                'valid': False,
                'message': '管理密钥错误'
            }, status=status.HTTP_401_UNAUTHORIZED)


class R2SignView(APIView):
    """
    获取R2上传签名
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        import boto3
        from botocore.config import Config
        from django.conf import settings

        file_name = request.data.get('file_name')
        file_type = request.data.get('file_type')
        folder = request.data.get('folder', 'uploads')

        if not file_name or not file_type:
            return Response({'error': '需要file_name和file_type'}, status=status.HTTP_400_BAD_REQUEST)

        # 确保文件名安全
        import time
        safe_name = f"{int(time.time())}_{file_name.replace(' ', '_')}"
        key = f"{folder}/{safe_name}"

        try:
            s3_client = boto3.client('s3',
                endpoint_url=settings.AWS_S3_ENDPOINT_URL,
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                config=Config(signature_version='s3v4'),
                region_name=settings.AWS_S3_REGION_NAME
            )

            # 生成预签名URL
            presigned_url = s3_client.generate_presigned_url('put_object',
                Params={
                    'Bucket': settings.AWS_STORAGE_BUCKET_NAME,
                    'Key': key,
                    'ContentType': file_type,
                },
                ExpiresIn=3600
            )

            # 如果配置了自定义域名，返回自定义域名的访问URL
            if settings.AWS_S3_CUSTOM_DOMAIN:
                public_url = f"https://{settings.AWS_S3_CUSTOM_DOMAIN}/{key}"
            else:
                # 否则使用R2默认URL
                # 注意：这里可能需要根据实际情况调整
                public_url = f"{settings.AWS_S3_ENDPOINT_URL}/{settings.AWS_STORAGE_BUCKET_NAME}/{key}"

            return Response({
                'upload_url': presigned_url,
                'public_url': public_url,
                'key': key
            })

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
