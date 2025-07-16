from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    用户序列化器
    """
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'role',
            'is_active', 'date_joined', 'last_login',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login', 'created_at', 'updated_at']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    用户注册序列化器
    """
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password2', 'first_name', 'last_name']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError("密码不一致")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user


class ChangePasswordSerializer(serializers.Serializer):
    """
    修改密码序列化器
    """
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(required=True, write_only=True, min_length=8)
    new_password2 = serializers.CharField(required=True, write_only=True)
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError("新密码不一致")
        return attrs
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("原密码错误")
        return value 