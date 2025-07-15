from rest_framework import serializers
from .models import Group


class GroupSerializer(serializers.ModelSerializer):
    """
    社团序列化器
    """
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    
    class Meta:
        model = Group
        fields = [
            'id', 'name', 'description', 'logo', 'founded_date', 'location',
            'website', 'email', 'phone', 'weibo', 'wechat', 'qq_group', 'bilibili',
            'is_active', 'is_verified', 'is_featured', 'video_count',
            'award_count', 'created_by', 'created_by_username',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'video_count', 'award_count'] 