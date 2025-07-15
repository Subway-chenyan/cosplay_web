from rest_framework import serializers
from .models import Award, AwardRecord


class AwardSerializer(serializers.ModelSerializer):
    """
    奖项序列化器
    """
    class Meta:
        model = Award
        fields = '__all__'
        read_only_fields = ['id', 'winner_count', 'created_at', 'updated_at']


class AwardRecordSerializer(serializers.ModelSerializer):
    """
    获奖记录序列化器
    """
    class Meta:
        model = AwardRecord
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at'] 