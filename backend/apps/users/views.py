from rest_framework import viewsets, status, permissions
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.utils import timezone
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from .serializers import (
    UserSerializer, UserRegistrationSerializer, ChangePasswordSerializer,
    UserProfileUpdateSerializer, RoleApplicationSerializer,
    FeedbackSerializer, FeedbackCreateSerializer, FeedbackUpdateSerializer
)
from .models import Feedback

User = get_user_model()


class UserViewSet(viewsets.ModelViewSet):
    """
    用户视图集
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        # 检查用户是否为管理员
        if hasattr(self.request.user, 'is_admin') and self.request.user.is_admin():
            return User.objects.all()
        elif self.request.user.is_staff:
            return User.objects.all()
        return User.objects.filter(id=self.request.user.id)
    
    @action(detail=False, methods=['get'], url_path='me')
    def me(self, request):
        """获取当前用户信息"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], url_path='change-password')
    def change_password(self, request):
        """修改密码"""
        serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({'detail': '密码修改成功'}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['patch', 'put'], url_path='update-profile')
    def update_profile(self, request):
        """更新用户资料"""
        serializer = UserProfileUpdateSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response({
                'detail': '资料更新成功',
                'data': UserSerializer(request.user).data
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='apply-role')
    def apply_for_contributor(self, request):
        """申请成为贡献者"""
        serializer = RoleApplicationSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            # 更新用户申请状态
            request.user.role_application_pending = True
            request.user.role_application_reason = serializer.validated_data['reason']
            request.user.role_application_date = timezone.now()
            request.user.save()
            return Response({
                'detail': '申请已提交，请等待管理员审核'
            }, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], url_path='list-role-applications')
    def list_role_applications(self, request):
        """获取所有待审批的角色申请（仅管理员）"""
        # 权限检查
        if not request.user.is_authenticated or request.user.role != 'admin':
            return Response({'detail': '权限不足，仅管理员可访问'}, status=status.HTTP_403_FORBIDDEN)

        pending_users = User.objects.filter(
            role_application_pending=True
        ).order_by('-role_application_date')

        applications = []
        for user in pending_users:
            applications.append({
                'user_id': str(user.id),
                'username': user.username,
                'nickname': user.nickname or '',
                'email': user.email,
                'role_application_reason': user.role_application_reason,
                'role_application_date': user.role_application_date,
                'current_role': user.role,
            })

        return Response({
            'count': len(applications),
            'results': applications
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['post'], url_path='approve-role-application')
    def approve_role_application(self, request):
        """审批角色申请（仅管理员）"""
        # 权限检查
        if not request.user.is_authenticated or request.user.role != 'admin':
            return Response({'detail': '权限不足，仅管理员可访问'}, status=status.HTTP_403_FORBIDDEN)

        user_id = request.data.get('user_id')
        target_role = request.data.get('target_role')  # 'contributor', 'editor', 'admin'
        action_type = request.data.get('action', 'approve')  # 'approve' or 'reject'

        if not user_id:
            return Response({'detail': '缺少 user_id 参数'}, status=status.HTTP_400_BAD_REQUEST)

        if action_type == 'approve':
            if not target_role or target_role not in ['contributor', 'editor', 'admin']:
                return Response({'detail': '无效的目标角色'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'detail': '用户不存在'}, status=status.HTTP_404_NOT_FOUND)

        if not user.role_application_pending:
            return Response({'detail': '该用户没有待审批的申请'}, status=status.HTTP_400_BAD_REQUEST)

        if action_type == 'approve':
            # 批准申请，更新用户角色
            user.role = target_role
            user.role_application_pending = False
            user.role_application_reason = ''
            user.role_application_date = None
            user.save()
            return Response({
                'detail': f'已批准申请，用户角色已更新为 {target_role}'
            }, status=status.HTTP_200_OK)
        else:
            # 拒绝申请
            user.role_application_pending = False
            user.role_application_reason = ''
            user.role_application_date = None
            user.save()
            return Response({
                'detail': '已拒绝该申请'
            }, status=status.HTTP_200_OK)


class RegisterView(APIView):
    """
    用户注册视图
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            return Response({'message': '注册成功'}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class FeedbackViewSet(viewsets.ModelViewSet):
    """
    用户反馈视图集
    """
    queryset = Feedback.objects.all()
    serializer_class = FeedbackSerializer

    def get_authenticators(self):
        """create 操作不需要认证，其他操作需要 JWT 认证"""
        # 使用 getattr 安全地访问 action，避免初始化时的 AttributeError
        action = getattr(self, 'action', None)
        if action == 'create':
            return []
        from rest_framework_simplejwt.authentication import JWTAuthentication
        return [JWTAuthentication()]

    def get_permissions(self):
        if self.action == 'create':
            # 允许任何人提交反馈（包括未登录用户）
            return [permissions.AllowAny()]
        elif self.action in ['list', 'retrieve', 'update', 'partial_update', 'destroy']:
            # 只有管理员可以查看和管理反馈
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if user.is_authenticated and user.role == 'admin':
            return Feedback.objects.all()
        # 非管理员无法查看反馈列表
        return Feedback.objects.none()

    def get_serializer_class(self):
        if self.action == 'create':
            return FeedbackCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return FeedbackUpdateSerializer
        return FeedbackSerializer

    def create(self, request, *args, **kwargs):
        """创建反馈"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            # 如果用户已登录，关联用户
            user = request.user if request.user.is_authenticated else None
            feedback = serializer.save(user=user)
            return Response({
                'detail': '反馈提交成功，感谢您的反馈！',
                'id': feedback.id
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def list(self, request, *args, **kwargs):
        """获取反馈列表（仅管理员）"""
        if not request.user.is_authenticated or request.user.role != 'admin':
            return Response({'detail': '权限不足'}, status=status.HTTP_403_FORBIDDEN)

        queryset = self.filter_queryset(self.get_queryset())

        # 支持按状态筛选
        status_filter = request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        """获取反馈统计（仅管理员）"""
        if not request.user.is_authenticated or request.user.role != 'admin':
            return Response({'detail': '权限不足'}, status=status.HTTP_403_FORBIDDEN)

        total = Feedback.objects.count()
        pending = Feedback.objects.filter(status='pending').count()
        processing = Feedback.objects.filter(status='processing').count()
        resolved = Feedback.objects.filter(status='resolved').count()

        return Response({
            'total': total,
            'pending': pending,
            'processing': processing,
            'resolved': resolved
        })

