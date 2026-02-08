from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from django.db import transaction
from django.db.models import Count
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
from .models import Group
from .serializers import GroupSerializer
from .cache_utils import GroupCacheManager
from apps.videos.models import Video
from apps.awards.models import AwardRecord
from apps.videos.serializers import VideoSerializer
from apps.videos.pagination import LargeResultsSetPagination


from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

class GroupViewSet(viewsets.ModelViewSet):
    """
    社团视图集
    """
    queryset = Group.objects.filter(is_active=True)
    serializer_class = GroupSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    pagination_class = LargeResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['name', 'province', 'city', 'location', 'description']
    filterset_fields = ['province', 'city', 'is_active']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]
    
    @method_decorator(cache_page(60 * 10))  # 缓存10分钟
    def list(self, request, *args, **kwargs):
        """
        获取社团列表，添加缓存优化
        """
        return super().list(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
        # 清除相关缓存
        GroupCacheManager.clear_all_group_cache()
    
    def perform_update(self, serializer):
        super().perform_update(serializer)
        # 清除相关缓存
        GroupCacheManager.clear_all_group_cache()
    
    def perform_destroy(self, instance):
        super().perform_destroy(instance)
        # 清除相关缓存
        GroupCacheManager.clear_all_group_cache()
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def update_statistics(self, request):
        """
        手动更新所有社团的统计信息
        """
        try:
            with transaction.atomic():
                groups = Group.objects.all()
                updated_count = 0
                
                for group in groups:
                    # 计算视频数量
                    video_count = Video.objects.filter(group=group).count()
                    
                    # 计算获奖数量
                    award_count = AwardRecord.objects.filter(group=group).count()
                    
                    # 更新统计信息
                    group.video_count = video_count
                    group.award_count = award_count
                    group.save(update_fields=['video_count', 'award_count'])
                    
                    updated_count += 1
                
                return Response({
                    'message': f'成功更新 {updated_count} 个社团的统计信息',
                    'updated_count': updated_count
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            return Response({
                'error': f'更新统计信息失败: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def update_group_statistics(self, request, pk=None):
        """
        更新指定社团的统计信息
        """
        try:
            group = self.get_object()
            
            with transaction.atomic():
                # 计算视频数量
                video_count = Video.objects.filter(group=group).count()
                
                # 计算获奖数量
                award_count = AwardRecord.objects.filter(group=group).count()
                
                # 更新统计信息
                group.video_count = video_count
                group.award_count = award_count
                group.save(update_fields=['video_count', 'award_count'])
                
                return Response({
                    'message': f'成功更新社团 {group.name} 的统计信息',
                    'group_name': group.name,
                    'video_count': video_count,
                    'award_count': award_count
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            return Response({
                'error': f'更新社团统计信息失败: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    @method_decorator(cache_page(60 * 15))  # 缓存15分钟
    def by_province(self, request):
        """
        按省份统计社团数量
        """
        try:
            province_stats = Group.objects.filter(is_active=True).exclude(
                province__isnull=True
            ).exclude(
                province__exact=''
            ).values('province').annotate(
                count=Count('id')
            ).order_by('-count')
            
            return Response({
                'province_stats': list(province_stats)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'获取省份统计失败: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'])
    @method_decorator(cache_page(60 * 15))  # 缓存15分钟
    def by_city(self, request):
        """
        按城市统计社团数量
        """
        try:
            province = request.query_params.get('province', None)
            queryset = Group.objects.filter(is_active=True).exclude(
                city__isnull=True
            ).exclude(
                city__exact=''
            )
            
            if province:
                queryset = queryset.filter(province=province)
            
            city_stats = queryset.values('province', 'city').annotate(
                count=Count('id')
            ).order_by('province', '-count')
            
            return Response({
                'city_stats': list(city_stats)
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'error': f'获取城市统计失败: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def clear_cache(self, request):
        """
        清除社团相关缓存
        """
        cache_type = request.data.get('type', 'all')
        
        try:
            if cache_type == 'all':
                success = GroupCacheManager.clear_all_group_cache()
                message = '已清除所有社团相关缓存'
            elif cache_type == 'province':
                success = GroupCacheManager.clear_province_cache()
                message = '已清除省份统计缓存'
            elif cache_type == 'city':
                province = request.data.get('province')
                success = GroupCacheManager.clear_city_cache(province)
                message = f'已清除城市统计缓存 (省份: {province or "全部"})'
            elif cache_type == 'list':
                success = GroupCacheManager.clear_group_list_cache()
                message = '已清除社团列表缓存'
            else:
                return Response({
                    'error': '无效的缓存类型'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if success:
                return Response({
                    'message': message
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': '清除缓存失败'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            return Response({
                'error': f'清除缓存失败: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def warm_cache(self, request):
        """
        预热缓存
        """
        try:
            success = GroupCacheManager.warm_up_cache()
            if success:
                return Response({
                    'message': '缓存预热完成'
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': '缓存预热失败'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        except Exception as e:
            return Response({
                'error': f'缓存预热失败: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def cache_info(self, request):
        """
        获取缓存信息
        """
        try:
            info = GroupCacheManager.get_cache_info()
            return Response(info, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': f'获取缓存信息失败: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GroupVideosView(generics.ListAPIView):
    """
    获取指定社团的所有视频
    """
    serializer_class = VideoSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        group_id = self.kwargs['group_id']
        return Video.objects.filter(
            group_id=group_id
        ).select_related('group', 'competition').prefetch_related('tags')