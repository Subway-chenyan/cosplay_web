from rest_framework import serializers
from .models import Group


class GroupSerializer(serializers.ModelSerializer):
    """
    社团序列化器
    """
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    # 允许 logo 字段接收字符串 URL
    logo = serializers.CharField(required=False, allow_blank=True, allow_null=True)

    class Meta:
        model = Group
        fields = [
            'id', 'name', 'description', 'logo', 'founded_date', 'province', 'city', 'location',
            'website', 'email', 'phone', 'weibo', 'wechat', 'qq_group', 'bilibili',
            'is_active', 'video_count',
            'award_count', 'created_by', 'created_by_username',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'video_count', 'award_count']

    def validate_logo(self, value):
        # 如果是字符串且不包含 "http"，则可能需要清理
        # 但既然我们使用 R2 URL，就直接返回
        return value