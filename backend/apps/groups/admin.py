from django.contrib import admin
from .models import Group


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    """
    社团管理后台
    """
    list_display = ['name', 'is_active', 'is_verified', 'video_count', 'created_at']
    list_filter = ['is_active', 'is_verified', 'is_featured', 'created_at']
    search_fields = ['name', 'description', 'location']
    ordering = ['-created_at']
    readonly_fields = ['video_count', 'award_count'] 