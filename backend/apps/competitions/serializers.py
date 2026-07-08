from rest_framework import serializers
from .models import Competition, CompetitionYear, Event
from apps.videos.models import Video


class CompetitionYearSerializer(serializers.ModelSerializer):
    """
    比赛年份序列化器
    """
    competition_name = serializers.CharField(source='competition.name', read_only=True)
    
    class Meta:
        model = CompetitionYear
        fields = ['id', 'competition', 'competition_name', 'year', 'description', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class EventVideoSerializer(serializers.ModelSerializer):
    """精简的视频序列化器，用于嵌套在赛事中"""
    group_name = serializers.CharField(source='group.name', read_only=True, default='')

    class Meta:
        model = Video
        fields = ['id', 'bv_number', 'title', 'url', 'thumbnail', 'year', 'group_name']


class EventSerializer(serializers.ModelSerializer):
    competition_name = serializers.CharField(source='competition.name', read_only=True)
    videos = EventVideoSerializer(many=True, read_only=True)
    stage_display = serializers.CharField(source='get_stage_display', read_only=True)

    class Meta:
        model = Event
        fields = [
            'id', 'start_date', 'end_date', 'competition', 'competition_name',
            'title', 'description', 'contact', 'website', 'promotional_image',
            'region', 'stage', 'stage_display', 'videos',
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
