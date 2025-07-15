from django.contrib import admin
from .models import Tag, VideoTag


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    """
    标签管理后台
    """
    list_display = ['name', 'category', 'usage_count', 'is_active', 'created_at']
    list_filter = ['category', 'is_active', 'is_featured', 'created_at']
    search_fields = ['name', 'description']
    ordering = ['-usage_count', 'name']
    readonly_fields = ['usage_count']


@admin.register(VideoTag)
class VideoTagAdmin(admin.ModelAdmin):
    """
    视频标签管理后台
    """
    list_display = ['video', 'tag', 'created_at']
    list_filter = ['tag__category', 'created_at']
    search_fields = ['video__title', 'tag__name']
    ordering = ['-created_at'] 