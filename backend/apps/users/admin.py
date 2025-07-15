from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, UserProfile, UserSetting


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    用户管理后台
    """
    list_display = ['username', 'email', 'role', 'is_active', 'created_at']
    list_filter = ['role', 'is_active', 'created_at']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['-created_at']
    
    fieldsets = BaseUserAdmin.fieldsets + (
        ('额外信息', {'fields': ('role', 'avatar', 'bio', 'website', 'location')}),
        ('偏好设置', {'fields': ('theme', 'language', 'timezone')}),
        ('统计信息', {'fields': ('video_count', 'favorite_count')}),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    """
    用户资料管理后台
    """
    list_display = ['user', 'gender', 'phone', 'cosplay_experience', 'created_at']
    list_filter = ['gender', 'cosplay_experience', 'created_at']
    search_fields = ['user__username', 'phone', 'wechat', 'qq']
    ordering = ['-created_at']


@admin.register(UserSetting)
class UserSettingAdmin(admin.ModelAdmin):
    """
    用户设置管理后台
    """
    list_display = ['user', 'email_notifications', 'profile_public', 'created_at']
    list_filter = ['email_notifications', 'profile_public', 'created_at']
    search_fields = ['user__username']
    ordering = ['-created_at'] 