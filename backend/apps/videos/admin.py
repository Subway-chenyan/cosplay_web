from django.contrib import admin
from .models import Video, VideoFavorite, VideoRating, VideoComment, VideoView


@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    """
    视频管理后台
    """
    list_display = ['title', 'bv_number', 'status', 'view_count', 'like_count', 'upload_date', 'created_at']
    list_filter = ['status', 'is_featured', 'is_original', 'upload_date', 'created_at']
    search_fields = ['title', 'description', 'bv_number']
    ordering = ['-created_at']
    readonly_fields = ['view_count', 'like_count', 'comment_count', 'favorite_count', 'share_count']


@admin.register(VideoFavorite)
class VideoFavoriteAdmin(admin.ModelAdmin):
    """
    视频收藏管理后台
    """
    list_display = ['user', 'video', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'video__title']
    ordering = ['-created_at']


@admin.register(VideoRating)
class VideoRatingAdmin(admin.ModelAdmin):
    """
    视频评分管理后台
    """
    list_display = ['user', 'video', 'rating', 'created_at']
    list_filter = ['rating', 'created_at']
    search_fields = ['user__username', 'video__title']
    ordering = ['-created_at']


@admin.register(VideoComment)
class VideoCommentAdmin(admin.ModelAdmin):
    """
    视频评论管理后台
    """
    list_display = ['user', 'video', 'content', 'is_approved', 'created_at']
    list_filter = ['is_approved', 'is_pinned', 'created_at']
    search_fields = ['user__username', 'video__title', 'content']
    ordering = ['-created_at']
    actions = ['approve_comments', 'disapprove_comments']
    
    def approve_comments(self, request, queryset):
        queryset.update(is_approved=True)
    approve_comments.short_description = "批准选中的评论"
    
    def disapprove_comments(self, request, queryset):
        queryset.update(is_approved=False)
    disapprove_comments.short_description = "拒绝选中的评论" 