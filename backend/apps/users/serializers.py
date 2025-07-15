from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import UserProfile, UserSetting

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    用户序列化器
    """
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'role',
            'avatar', 'bio', 'website', 'location', 'theme', 'language', 'timezone',
            'video_count', 'favorite_count', 'is_active', 'date_joined', 'last_login',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'date_joined', 'last_login', 'created_at', 'updated_at']


class UserProfileSerializer(serializers.ModelSerializer):
    """
    用户资料序列化器
    """
    user_username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = UserProfile
        fields = [
            'id', 'user', 'user_username', 'birth_date', 'gender', 'phone',
            'wechat', 'qq', 'interests', 'favorite_games', 'favorite_characters',
            'cosplay_experience', 'skills', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserSettingSerializer(serializers.ModelSerializer):
    """
    用户设置序列化器
    """
    class Meta:
        model = UserSetting
        fields = [
            'id', 'user', 'email_notifications', 'new_video_notifications',
            'comment_notifications', 'profile_public', 'show_email',
            'show_real_name', 'auto_play_videos', 'default_video_quality',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    用户注册序列化器
    """
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name']
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("密码不一致")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user 