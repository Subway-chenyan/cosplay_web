from django.contrib import admin
from .models import Video


@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    """
    视频管理后台
    """
    list_display = ['title', 'bv_number', 'status', 'view_count', 'like_count', 'upload_date', 'created_at']
    list_filter = ['status', 'is_featured', 'is_original', 'upload_date', 'created_at']
    search_fields = ['title', 'description', 'bv_number']
    ordering = ['-created_at']
    readonly_fields = ['view_count', 'like_count', 'share_count'] 