from rest_framework import viewsets, permissions
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