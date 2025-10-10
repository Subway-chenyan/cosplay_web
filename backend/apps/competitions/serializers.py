from rest_framework import serializers
from .models import Competition, CompetitionYear, Event


class CompetitionYearSerializer(serializers.ModelSerializer):
    """
    比赛年份序列化器
    """
    competition_name = serializers.CharField(source='competition.name', read_only=True)
    
    class Meta:
        model = CompetitionYear
        fields = ['id', 'competition', 'competition_name', 'year', 'description', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class EventSerializer(serializers.ModelSerializer):
    """
    赛事信息序列化器
    """
    competition_name = serializers.CharField(source='competition.name', read_only=True)
    
    class Meta:
        model = Event
        fields = [
            'id', 'date', 'competition', 'competition_name', 'title', 
            'description', 'contact', 'website', 'promotional_image',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class CompetitionSerializer(serializers.ModelSerializer):
    """
    比赛序列化器
    """
    years = CompetitionYearSerializer(many=True, read_only=True)
    events = EventSerializer(many=True, read_only=True)
    
    class Meta:
        model = Competition
        fields = [
            'id', 'name', 'description', 'website', 'years', 'events',
            'banner_image', 'banner_gradient', 'award_display_order',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']