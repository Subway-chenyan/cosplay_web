from rest_framework import viewsets, permissions
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from .models import Group
from .serializers import GroupSerializer


class GroupViewSet(viewsets.ModelViewSet):
    """
    社团视图集
    """
    queryset = Group.objects.filter(is_active=True)
    serializer_class = GroupSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter]
    search_fields = ['name', 'location', 'description']
    filterset_fields = ['is_verified', 'is_featured']
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user) 