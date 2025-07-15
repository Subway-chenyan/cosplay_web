from rest_framework import serializers
from .models import Video


class VideoSerializer(serializers.ModelSerializer):
    """
    视频序列化器
    """
    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True)
    duration_display = serializers.CharField(source='get_duration_display', read_only=True)
    
    class Meta:
        model = Video
        fields = [
            'id', 'bv_number', 'title', 'description', 'url', 'thumbnail',
            'duration', 'duration_display', 'resolution', 'file_size',
            'view_count', 'like_count', 'share_count',
            'upload_date', 'performance_date', 'status', 'is_featured', 'is_original',
            'uploaded_by', 'uploaded_by_username', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'view_count', 'like_count', 'share_count']


class VideoListSerializer(serializers.ModelSerializer):
    """
    视频列表序列化器
    """
    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True)
    
    class Meta:
        model = Video
        fields = [
            'id', 'bv_number', 'title', 'thumbnail', 'duration', 'view_count',
            'like_count', 'performance_date', 'uploaded_by_username', 'created_at'
        ] 