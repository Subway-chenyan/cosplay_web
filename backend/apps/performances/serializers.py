from rest_framework import serializers
from .models import Performance, PerformanceVideo


class PerformanceSerializer(serializers.ModelSerializer):
    """
    演出序列化器
    """
    class Meta:
        model = Performance
        fields = '__all__'
        read_only_fields = ['id', 'view_count', 'like_count', 'created_at', 'updated_at']


class PerformanceVideoSerializer(serializers.ModelSerializer):
    """
    演出视频序列化器
    """
    class Meta:
        model = PerformanceVideo
        fields = '__all__'
        read_only_fields = ['id', 'created_at'] 