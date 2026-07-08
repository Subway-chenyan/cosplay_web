from rest_framework import viewsets, permissions, generics, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.filters import SearchFilter
from django.shortcuts import get_object_or_404
from django.db.models import Q
from datetime import datetime
from .models import Competition, CompetitionYear, Event
from .serializers import CompetitionSerializer, CompetitionYearSerializer, EventSerializer
from apps.videos.serializers import VideoSerializer
from apps.videos.models import Video
from rest_framework.pagination import PageNumberPagination
from apps.videos.pagination import LargeResultsSetPagination
from django.utils import timezone
from apps.awards.models import Award
from .entries import (
    CompetitionEntriesPagination,
    build_competition_entries,
    get_competition_filter_options,
    hydrate_competition_entries,
)


class CompetitionViewSet(viewsets.ModelViewSet):
    """
    比赛视图集
    """
    queryset = Competition.objects.filter()
    serializer_class = CompetitionSerializer
    filter_backends = [SearchFilter]
    search_fields = ['name', 'description']
    
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

    @staticmethod
    def _parse_year(raw_year):
        if raw_year in (None, ''):
            return None, None
        try:
            year = int(raw_year)
        except (TypeError, ValueError):
            return None, Response(
                {'year': ['年份必须是整数。']},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if year < 1800 or year > 2200:
            return None, Response(
                {'year': ['年份必须在 1800 到 2200 之间。']},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return year, None

    @action(detail=True, methods=['get'], url_path='entries')
    def entries(self, request, pk=None):
        competition = self.get_object()
        year, error_response = self._parse_year(request.query_params.get('year'))
        if error_response:
            return error_response

        award = None
        award_id = request.query_params.get('award')
        if award_id:
            try:
                award = Award.objects.filter(
                    id=award_id,
                    competition=competition,
                ).first()
            except (TypeError, ValueError):
                award = None
            if award is None:
                return Response(
                    {'award': ['奖项不存在或不属于当前比赛。']},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        queryset = build_competition_entries(
            competition,
            year=year,
            award=award,
        )
        paginator = CompetitionEntriesPagination()
        page = paginator.paginate_queryset(queryset, request, view=self)
        return paginator.get_paginated_response(
            hydrate_competition_entries(page)
        )

    @action(detail=True, methods=['get'], url_path='filter-options')
    def filter_options(self, request, pk=None):
        return Response(get_competition_filter_options(self.get_object()))
    
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

    @action(detail=True, methods=['get'])
    def schedule(self, request, pk=None):
        """获取比赛的完整赛程"""
        competition = self.get_object()
        events = Event.objects.filter(
            competition=competition
        ).select_related('competition').prefetch_related('videos').order_by(
            'region', 'stage', 'start_date'
        )
        serializer = EventSerializer(events, many=True)
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


class EventViewSet(viewsets.ModelViewSet):
    """
    赛事信息视图集
    """
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    search_fields = ['title', 'description', 'region', 'competition__name']
    
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
        
        # 只要赛事的 start_date 或 end_date 在该月，或者跨越该月，都算作当月的赛事
        # (start_date <= month_end AND end_date >= month_start)
        from calendar import monthrange
        import datetime
        
        _, last_day = monthrange(year, month)
        month_start = datetime.date(year, month, 1)
        month_end = datetime.date(year, month, last_day)
        
        events = Event.objects.filter(
            start_date__lte=month_end,
            end_date__gte=month_start
        ).select_related('competition').order_by('start_date')
        
        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def by_date_range(self, request):
        """按日期范围获取赛事信息"""
        start_date_str = request.query_params.get('start_date')
        end_date_str = request.query_params.get('end_date')
        
        if not start_date_str or not end_date_str:
            return Response(
                {'error': '需要提供start_date和end_date参数'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            start_date = datetime.strptime(start_date_str, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date_str, '%Y-%m-%d').date()
        except ValueError:
            return Response(
                {'error': '日期格式错误，应为YYYY-MM-DD'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        events = Event.objects.filter(
            start_date__lte=end_date,
            end_date__gte=start_date
        ).select_related('competition').order_by('start_date')

        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def active(self, request):
        """获取当前进行中或即将开始的赛事"""
        import datetime as dt
        today = dt.date.today()
        threshold = today - dt.timedelta(days=30)

        events = Event.objects.filter(
            end_date__gte=threshold
        ).select_related('competition').prefetch_related('videos').order_by(
            'competition__name', 'region', 'stage', 'start_date'
        )

        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def nearest(self, request):
        """获取按后端当前日期计算的最近一场赛事。"""
        today = timezone.localdate()
        base_queryset = Event.objects.select_related('competition').prefetch_related('videos')

        event = (
            base_queryset
            .filter(start_date__lte=today, end_date__gte=today)
            .order_by('end_date', 'start_date')
            .first()
        )

        if event is None:
            event = (
                base_queryset
                .filter(start_date__gte=today)
                .order_by('start_date', 'end_date')
                .first()
            )

        if event is None:
            event = (
                base_queryset
                .filter(end_date__lt=today)
                .order_by('-end_date', '-start_date')
                .first()
            )

        if event is None:
            return Response(None)

        serializer = self.get_serializer(event)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """获取所有未来的赛事（用于赛程页面）"""
        import datetime as dt
        today = dt.date.today()

        events = Event.objects.filter(
            start_date__gte=today
        ).select_related('competition').prefetch_related('videos').order_by(
            'competition__name', 'region', 'stage', 'start_date'
        )

        serializer = self.get_serializer(events, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def link_video(self, request, pk=None):
        """关联视频到赛事"""
        event = self.get_object()
        video_id = request.data.get('video_id')

        if not video_id:
            return Response({'error': '需要提供video_id'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            video = Video.objects.get(id=video_id)
        except Video.DoesNotExist:
            return Response({'error': '视频不存在'}, status=status.HTTP_404_NOT_FOUND)

        if event.start_date and video.year and video.year != event.start_date.year:
            return Response(
                {'error': f'视频年份{video.year}与赛事年份{event.start_date.year}不一致'},
                status=status.HTTP_400_BAD_REQUEST
            )

        event.videos.add(video)
        serializer = self.get_serializer(event)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def unlink_video(self, request, pk=None):
        """取消关联视频"""
        event = self.get_object()
        video_id = request.data.get('video_id')

        if not video_id:
            return Response({'error': '需要提供video_id'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            video = Video.objects.get(id=video_id)
        except Video.DoesNotExist:
            return Response({'error': '视频不存在'}, status=status.HTTP_404_NOT_FOUND)

        event.videos.remove(video)
        serializer = self.get_serializer(event)
        return Response(serializer.data)
