from rest_framework import serializers
from .models import Tag, VideoTag


class TagSerializer(serializers.ModelSerializer):
    """
    标签序列化器
    """
    class Meta:
        model = Tag
        fields = '__all__'
        read_only_fields = ['id', 'usage_count', 'created_at', 'updated_at']


class VideoTagSerializer(serializers.ModelSerializer):
    """
    视频标签序列化器
    """
    class Meta:
        model = VideoTag
        fields = '__all__'
        read_only_fields = ['id', 'created_at'] 