from rest_framework import serializers
from .models import Competition


class CompetitionSerializer(serializers.ModelSerializer):
    """
    比赛序列化器
    """
    class Meta:
        model = Competition
        fields = ['id', 'name', 'description', 'website', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at'] 