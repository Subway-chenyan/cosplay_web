from rest_framework import viewsets, permissions, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Competition, CompetitionYear
from .serializers import CompetitionSerializer, CompetitionYearSerializer
from apps.videos.serializers import VideoSerializer
from apps.videos.models import Video
from rest_framework.pagination import PageNumberPagination
from apps.videos.pagination import LargeResultsSetPagination


class CompetitionViewSet(viewsets.ModelViewSet):
    """
    比赛视图集
    """
    queryset = Competition.objects.filter()
    serializer_class = CompetitionSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]

    @action(detail=True, methods=['get'])
    def years(self, request, pk=None):
        """获取比赛的所有年份"""
        competition = self.get_object()
        years = CompetitionYear.objects.filter(competition=competition)
        serializer = CompetitionYearSerializer(years, many=True)
        return Response(serializer.data)


class CompetitionYearVideosView(generics.ListAPIView):
    """
    获取特定比赛年份下的所有视频
    """
    serializer_class = VideoSerializer
    permission_classes = [permissions.AllowAny]
    pagination_class = LargeResultsSetPagination
    
    def get_queryset(self):
        competition_id = self.kwargs['competition_id']
        year = self.kwargs['year']
        return Video.objects.filter(
            competition_id=competition_id,
            year=year
        ).select_related('group', 'competition').prefetch_related('tags')