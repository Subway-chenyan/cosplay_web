from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Q
from .models import Award, AwardRecord
from .serializers import AwardSerializer, AwardRecordSerializer


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
        serializer = self.get_serializer(records, many=True)
        return Response(serializer.data) 