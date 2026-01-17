from rest_framework import viewsets, permissions, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import ForumCategory, Post, Comment, ForumAttachment
from .serializers import ForumCategorySerializer, PostListSerializer, PostDetailSerializer, CommentSerializer, ForumAttachmentSerializer
from django.db.models import F, Count
import logging

logger = logging.getLogger(__name__)

class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.author == request.user

class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ForumCategory.objects.all()
    serializer_class = ForumCategorySerializer
    pagination_class = None

class PostViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'author']
    search_fields = ['title', 'content']
    ordering_fields = ['created_at', 'view_count']

    def get_queryset(self):
        return Post.objects.filter(is_active=True).select_related('author', 'category').annotate(comment_count=Count('comments'))

    def get_serializer_class(self):
        if self.action in ['retrieve', 'create', 'update', 'partial_update']:
            return PostDetailSerializer
        return PostListSerializer

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.view_count = F('view_count') + 1
        instance.save(update_fields=['view_count'])
        instance.refresh_from_db()
        return super().retrieve(request, *args, **kwargs)

class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    def get_queryset(self):
        return Comment.objects.filter(is_active=True).select_related('author', 'post').prefetch_related('replies')

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class AttachmentViewSet(viewsets.ModelViewSet):
    queryset = ForumAttachment.objects.all()
    serializer_class = ForumAttachmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def create(self, request, *args, **kwargs):
        # 调试日志：检查认证头
        auth_header = request.META.get('HTTP_AUTHORIZATION', 'No auth header')
        logger.info(f"Attachment upload attempt - Auth header: {auth_header[:20]}... if exists else 'None'")
        logger.info(f"User authenticated: {request.user.is_authenticated}")
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)
