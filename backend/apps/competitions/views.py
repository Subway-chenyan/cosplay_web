from rest_framework import viewsets, permissions, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from datetime import datetime
from .models import Competition, CompetitionYear, Event
from .serializers import CompetitionSerializer, CompetitionYearSerializer, EventSerializer
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
        """
        根据操作类型设置权限
        读取操作允许匿名访问，写入操作需要认证
        """
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
    
    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAuthenticated])
    def update_config(self, request, pk=None):
        """更新比赛配置"""
        competition = self.get_object()
        
        # 获取配置数据
        config_data = request.data.get('config', {})
        
        # 更新banner配置
        banner_background = config_data.get('bannerBackground')
        if banner_background:
            if banner_background.get('type') == 'image':
                competition.banner_image = banner_background.get('value', '')
                competition.banner_gradient = []
            elif banner_background.get('type') in ['gradient', 'color']:
                competition.banner_image = ''
                competition.banner_gradient = [banner_background]
        
        # 更新奖项排序配置
        award_order = config_data.get('awardOrder')
        if award_order:
            competition.award_display_order = award_order
        
        competition.save()
        
        serializer = self.get_serializer(competition)
        return Response({
            'message': '配置更新成功',
            'competition': serializer.data
        })
    
    @action(detail=True, methods=['get'])
    def config(self, request, pk=None):
        """获取比赛配置"""
        competition = self.get_object()
        
        # 构建配置数据
        config = {}
        
        # Banner配置
        if competition.banner_image:
            config['bannerBackground'] = {
                'type': 'image',
                'value': competition.banner_image
            }
        elif competition.banner_gradient:
            gradient_config = competition.banner_gradient[0] if competition.banner_gradient else {}
            config['bannerBackground'] = gradient_config
        
        # 奖项排序配置
        if competition.award_display_order:
            config['awardOrder'] = competition.award_display_order
        
        return Response({
            'config': config,
            'competition': self.get_serializer(competition).data
        })


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


class EventViewSet(viewsets.ModelViewSet):
    """
    赛事信息视图集
    """
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]
    
    @action(detail=False, methods=['get'])
    def by_month(self, request):
        """按月份获取赛事信息"""
        year = request.query_params.get('year')
        month = request.query_params.get('month')
        
        if not year or not month:
            return Response(
                {'error': '需要提供year和month参数'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            year = int(year)
            month = int(month)
        except ValueError:
            return Response(
                {'error': 'year和month必须是数字'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        events = Event.objects.filter(
            date__year=year,
            date__month=month
        ).select_related('competition').order_by('date')
        
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_date_range(self, request):
        """按日期范围获取赛事信息"""
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        if not start_date or not end_date:
            return Response(
                {'error': '需要提供start_date和end_date参数'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': '日期格式错误，应为YYYY-MM-DD'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        events = Event.objects.filter(
            date__range=[start_date, end_date]
        ).select_related('competition').order_by('date')
        
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)