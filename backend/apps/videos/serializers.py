from rest_framework import serializers
from .models import Video, VideoFavorite, VideoRating, VideoComment, VideoView


class VideoSerializer(serializers.ModelSerializer):
    """
    视频序列化器
    """
    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True)
    duration_display = serializers.CharField(source='get_duration_display', read_only=True)
    
    class Meta:
        model = Video
        fields = [
            'id', 'bv_number', 'title', 'description', 'url', 'thumbnail',
            'duration', 'duration_display', 'resolution', 'file_size',
            'view_count', 'like_count', 'comment_count', 'favorite_count', 'share_count',
            'upload_date', 'performance_date', 'status', 'is_featured', 'is_original',
            'uploaded_by', 'uploaded_by_username', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'view_count', 'like_count', 'comment_count', 'favorite_count', 'share_count']


class VideoListSerializer(serializers.ModelSerializer):
    """
    视频列表序列化器
    """
    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True)
    
    class Meta:
        model = Video
        fields = [
            'id', 'bv_number', 'title', 'thumbnail', 'duration', 'view_count',
            'like_count', 'performance_date', 'uploaded_by_username', 'created_at'
        ]


class VideoFavoriteSerializer(serializers.ModelSerializer):
    """
    视频收藏序列化器
    """
    video_title = serializers.CharField(source='video.title', read_only=True)
    
    class Meta:
        model = VideoFavorite
        fields = ['id', 'user', 'video', 'video_title', 'created_at']
        read_only_fields = ['id', 'user']


class VideoRatingSerializer(serializers.ModelSerializer):
    """
    视频评分序列化器
    """
    user_username = serializers.CharField(source='user.username', read_only=True)
    video_title = serializers.CharField(source='video.title', read_only=True)
    
    class Meta:
        model = VideoRating
        fields = ['id', 'user', 'user_username', 'video', 'video_title', 'rating', 'comment', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user']


class VideoCommentSerializer(serializers.ModelSerializer):
    """
    视频评论序列化器
    """
    user_username = serializers.CharField(source='user.username', read_only=True)
    user_avatar = serializers.CharField(source='user.avatar.url', read_only=True)
    replies = serializers.SerializerMethodField()
    
    class Meta:
        model = VideoComment
        fields = [
            'id', 'video', 'user', 'user_username', 'user_avatar', 'content',
            'parent', 'is_approved', 'is_pinned', 'like_count', 'reply_count',
            'replies', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'like_count', 'reply_count']
    
    def get_replies(self, obj):
        if obj.replies.exists():
            return VideoCommentSerializer(obj.replies.all(), many=True).data
        return [] 