from rest_framework import serializers
from .models import Competition, CompetitionYear


class CompetitionYearSerializer(serializers.ModelSerializer):
    """
    比赛年份序列化器
    """
    competition_name = serializers.CharField(source='competition.name', read_only=True)
    
    class Meta:
        model = CompetitionYear
        fields = ['id', 'competition', 'competition_name', 'year', 'description', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class CompetitionSerializer(serializers.ModelSerializer):
    """
    比赛序列化器
    """
    years = CompetitionYearSerializer(many=True, read_only=True)
    
    class Meta:
        model = Competition
        fields = [
            'id', 'name', 'description', 'website', 'years', 
            'banner_image', 'banner_gradient', 'award_display_order',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']