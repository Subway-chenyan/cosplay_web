from rest_framework import viewsets, permissions, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from django.db import transaction
from .models import Award, AwardRecord
from .serializers import AwardSerializer, AwardRecordSerializer, AwardRecordDetailSerializer
from apps.groups.models import Group
from apps.videos.models import Video
from apps.videos.serializers import VideoSerializer


class AwardViewSet(viewsets.ModelViewSet):
    """
    奖项视图集
    """
    queryset = Award.objects.all()
    serializer_class = AwardSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]

    @action(detail=False, methods=['get'])
    def by_competition(self, request):
        """
        获取指定比赛的所有奖项
        """
        competition_id = request.query_params.get('competition')
        if not competition_id:
            return Response(
                {'error': 'competition parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        awards = Award.objects.filter(competition_id=competition_id)
        serializer = self.get_serializer(awards, many=True)
        return Response(serializer.data)


class AwardRecordViewSet(viewsets.ModelViewSet):
    """
    获奖记录视图集
    """
    queryset = AwardRecord.objects.all()
    serializer_class = AwardRecordSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]

    @action(detail=False, methods=['get'])
    def by_competition(self, request):
        """
        获取指定比赛的所有获奖记录
        """
        competition_id = request.query_params.get('competition')
        if not competition_id:
            return Response(
                {'error': 'competition parameter is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # 获取该比赛的所有奖项ID
        award_ids = Award.objects.filter(competition_id=competition_id).values_list('id', flat=True)
        
        # 获取这些奖项的所有获奖记录
        records = AwardRecord.objects.filter(award_id__in=award_ids)
        serializer = AwardRecordDetailSerializer(records, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def update_group_award_counts(self, request):
        """
        手动更新所有社团的获奖数量统计
        """
        try:
            with transaction.atomic():
                groups = Group.objects.all()
                updated_count = 0
                
                for group in groups:
                    # 计算获奖数量
                    award_count = AwardRecord.objects.filter(group=group).count()
                    
                    # 更新统计信息
                    group.award_count = award_count
                    group.save(update_fields=['award_count'])
                    
                    updated_count += 1
                
                return Response({
                    'message': f'成功更新 {updated_count} 个社团的获奖数量统计',
                    'updated_count': updated_count
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            return Response({
                'error': f'更新获奖数量统计失败: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def update_group_award_count(self, request, pk=None):
        """
        更新指定社团的获奖数量统计
        """
        try:
            group_id = request.data.get('group_id')
            if not group_id:
                return Response({
                    'error': 'group_id parameter is required'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                group = Group.objects.get(id=group_id)
            except Group.DoesNotExist:
                return Response({
                    'error': f'社团ID {group_id} 不存在'
                }, status=status.HTTP_404_NOT_FOUND)
            
            with transaction.atomic():
                # 计算获奖数量
                award_count = AwardRecord.objects.filter(group=group).count()
                
                # 更新统计信息
                group.award_count = award_count
                group.save(update_fields=['award_count'])
                
                return Response({
                    'message': f'成功更新社团 {group.name} 的获奖数量统计',
                    'group_name': group.name,
                    'award_count': award_count
                }, status=status.HTTP_200_OK)
                
        except Exception as e:
            return Response({
                'error': f'更新社团获奖数量统计失败: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class AwardVideosView(generics.ListAPIView):
    """
    获取指定奖项的所有获奖视频
    """
    serializer_class = VideoSerializer
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        award_id = self.kwargs['award_id']
        competition_year_id = self.kwargs.get('competition_year_id')
        
        # 获取该奖项的所有获奖记录对应的视频
        award_records = AwardRecord.objects.filter(award_id=award_id)
        
        if competition_year_id:
            award_records = award_records.filter(competition_year_id=competition_year_id)
        
        video_ids = award_records.values_list('video_id', flat=True)
        return Video.objects.filter(
            id__in=video_ids
        ).select_related('group', 'competition').prefetch_related('tags')