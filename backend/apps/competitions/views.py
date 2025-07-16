from rest_framework import viewsets, permissions
from .models import Competition
from .serializers import CompetitionSerializer


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