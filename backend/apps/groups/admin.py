from django.contrib import admin
from .models import Group, GroupMember, GroupFollower


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    """
    社团管理后台
    """
    list_display = ['name', 'is_active', 'is_verified', 'member_count', 'video_count', 'created_at']
    list_filter = ['is_active', 'is_verified', 'is_featured', 'created_at']
    search_fields = ['name', 'description', 'location']
    ordering = ['-created_at']
    readonly_fields = ['member_count', 'video_count', 'performance_count', 'award_count']


@admin.register(GroupMember)
class GroupMemberAdmin(admin.ModelAdmin):
    """
    社团成员管理后台
    """
    list_display = ['user', 'group', 'role', 'status', 'joined_at']
    list_filter = ['role', 'status', 'joined_at']
    search_fields = ['user__username', 'group__name']
    ordering = ['-joined_at']


@admin.register(GroupFollower)
class GroupFollowerAdmin(admin.ModelAdmin):
    """
    社团关注管理后台
    """
    list_display = ['user', 'group', 'notify_new_videos', 'created_at']
    list_filter = ['notify_new_videos', 'created_at']
    search_fields = ['user__username', 'group__name']
    ordering = ['-created_at'] 