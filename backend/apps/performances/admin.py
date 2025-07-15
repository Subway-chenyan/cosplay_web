from django.contrib import admin
from .models import Performance, PerformanceVideo


@admin.register(Performance)
class PerformanceAdmin(admin.ModelAdmin):
    """
    演出管理后台
    """
    list_display = ['title', 'type', 'group', 'debut_date', 'view_count', 'created_at']
    list_filter = ['type', 'is_active', 'is_featured', 'debut_date', 'created_at']
    search_fields = ['title', 'description', 'original_work', 'character_names']
    ordering = ['-created_at']
    readonly_fields = ['view_count', 'like_count']


@admin.register(PerformanceVideo)
class PerformanceVideoAdmin(admin.ModelAdmin):
    """
    演出视频管理后台
    """
    list_display = ['performance', 'video', 'created_at']
    list_filter = ['created_at']
    search_fields = ['performance__title', 'video__title']
    ordering = ['-created_at'] 