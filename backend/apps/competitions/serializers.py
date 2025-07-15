from rest_framework import serializers
from .models import Competition


class CompetitionSerializer(serializers.ModelSerializer):
    """
    比赛序列化器
    """
    class Meta:
        model = Competition
        fields = '__all__'
        read_only_fields = ['id', 'participant_count', 'award_count', 'created_at', 'updated_at'] 