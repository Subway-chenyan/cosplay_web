from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from django.db import transaction
from .models import Group
from .serializers import GroupSerializer
from apps.videos.models import Video
from apps.awards.models import AwardRecord


class GroupViewSet(viewsets.ModelViewSet):
    """
    社团视图集
    """
    queryset = Group.objects.filter(is_active=True)
    serializer_class = GroupSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['name', 'location', 'description']
    filterset_fields = []
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
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