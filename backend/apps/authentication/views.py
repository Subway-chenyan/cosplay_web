from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model
from django.conf import settings
from apps.users.serializers import UserSerializer
import json
import os

User = get_user_model()

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