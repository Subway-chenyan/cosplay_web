from rest_framework import serializers
from .models import Award, AwardRecord


class AwardSerializer(serializers.ModelSerializer):
    """
    奖项序列化器
    """
    competition_name = serializers.CharField(source='competition.name', read_only=True)
    
    class Meta:
        model = Award
        fields = '__all__'
        read_only_fields = ['id', 'winner_count', 'created_at', 'updated_at']


class AwardRecordSerializer(serializers.ModelSerializer):
    """
    获奖记录序列化器
    """
    award_name = serializers.CharField(source='award.name', read_only=True)
    award_level = serializers.CharField(source='award.level', read_only=True)
    competition_name = serializers.CharField(source='award.competition.name', read_only=True)
    video_title = serializers.CharField(source='video.title', read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)
    
    class Meta:
        model = AwardRecord
        fields = [
            'id', 'award', 'video', 'group', 'year', 'description', 
            'award_name', 'award_level', 'competition_name', 
            'video_title', 'group_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at'] 