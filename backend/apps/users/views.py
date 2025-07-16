from rest_framework import viewsets, status, permissions
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, UserRegistrationSerializer, ChangePasswordSerializer

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

