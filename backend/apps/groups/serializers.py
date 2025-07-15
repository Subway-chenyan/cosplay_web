from rest_framework import serializers
from .models import Group, GroupMember, GroupFollower


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
            'is_active', 'is_verified', 'is_featured', 'member_count', 'video_count',
            'performance_count', 'award_count', 'created_by', 'created_by_username',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'member_count', 'video_count', 'performance_count', 'award_count']


class GroupMemberSerializer(serializers.ModelSerializer):
    """
    社团成员序列化器
    """
    user_username = serializers.CharField(source='user.username', read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)
    
    class Meta:
        model = GroupMember
        fields = [
            'id', 'group', 'group_name', 'user', 'user_username', 'role',
            'status', 'nickname', 'bio', 'position', 'joined_at', 'left_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'joined_at', 'left_at']


class GroupFollowerSerializer(serializers.ModelSerializer):
    """
    社团关注序列化器
    """
    user_username = serializers.CharField(source='user.username', read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)
    
    class Meta:
        model = GroupFollower
        fields = [
            'id', 'group', 'group_name', 'user', 'user_username',
            'notify_new_videos', 'notify_new_performances', 'notify_awards',
            'created_at'
        ]
        read_only_fields = ['id', 'user'] 