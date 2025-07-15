from rest_framework import viewsets, permissions
from .models import Group, GroupMember, GroupFollower
from .serializers import GroupSerializer, GroupMemberSerializer, GroupFollowerSerializer


class GroupViewSet(viewsets.ModelViewSet):
    """
    社团视图集
    """
    queryset = Group.objects.filter(is_active=True)
    serializer_class = GroupSerializer
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user) 