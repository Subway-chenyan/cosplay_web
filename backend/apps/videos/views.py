from django.shortcuts import get_object_or_404
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q

from .models import Video, VideoFavorite, VideoRating, VideoComment
from .serializers import (
    VideoSerializer, VideoListSerializer, VideoFavoriteSerializer,
    VideoRatingSerializer, VideoCommentSerializer
)
from .filters import VideoFilter


class VideoViewSet(viewsets.ModelViewSet):
    """
    视频视图集
    """
    queryset = Video.objects.filter(status='published')
    serializer_class = VideoSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = VideoFilter
    search_fields = ['title', 'description', 'bv_number']
    ordering_fields = ['created_at', 'view_count', 'like_count', 'performance_date']
    ordering = ['-created_at']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return VideoListSerializer
        return VideoSerializer
    
    def get_permissions(self):
        """
        根据动作获取权限
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def toggle_favorite(self, request, pk=None):
        """
        切换收藏状态
        """
        video = self.get_object()
        favorite, created = VideoFavorite.objects.get_or_create(
            user=request.user,
            video=video
        )
        
        if created:
            message = '收藏成功'
        else:
            favorite.delete()
            message = '取消收藏'
        
        return Response({'message': message, 'favorited': created})
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def rate(self, request, pk=None):
        """
        评分视频
        """
        video = self.get_object()
        rating = request.data.get('rating')
        comment = request.data.get('comment', '')
        
        if not rating or not (1 <= int(rating) <= 5):
            return Response({'error': '评分必须在1-5之间'}, status=status.HTTP_400_BAD_REQUEST)
        
        rating_obj, created = VideoRating.objects.update_or_create(
            user=request.user,
            video=video,
            defaults={'rating': rating, 'comment': comment}
        )
        
        serializer = VideoRatingSerializer(rating_obj)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def comments(self, request, pk=None):
        """
        获取视频评论
        """
        video = self.get_object()
        comments = VideoComment.objects.filter(video=video, parent=None, is_approved=True)
        serializer = VideoCommentSerializer(comments, many=True)
        return Response(serializer.data)


class VideoFavoriteViewSet(viewsets.ModelViewSet):
    """
    视频收藏视图集
    """
    serializer_class = VideoFavoriteSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return VideoFavorite.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class VideoCommentViewSet(viewsets.ModelViewSet):
    """
    视频评论视图集
    """
    serializer_class = VideoCommentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return VideoComment.objects.filter(is_approved=True)
    
    def perform_create(self, serializer):
        serializer.save(user=self.request.user) 