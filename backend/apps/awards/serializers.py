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
    competition_name = serializers.CharField(source='award.competition.name', read_only=True)
    competition_year = serializers.IntegerField(source='competition_year.year', read_only=True)
    video_title = serializers.CharField(source='video.title', read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)
    
    class Meta:
        model = AwardRecord
        fields = [
            'id', 'award', 'video', 'group', 'competition_year', 'description', 
            'award_name', 'competition_name', 
            'video_title', 'group_name', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AwardRecordDetailSerializer(AwardRecordSerializer):
    """
    获奖记录详情序列化器，包含更多关联信息
    """
    competition_year_detail = serializers.SerializerMethodField()
    
    def get_competition_year_detail(self, obj):
        from apps.competitions.serializers import CompetitionYearSerializer
        return CompetitionYearSerializer(obj.competition_year).data
    
    class Meta(AwardRecordSerializer.Meta):
        fields = AwardRecordSerializer.Meta.fields + ['competition_year_detail']