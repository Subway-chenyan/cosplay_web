from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Feedback


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
        ('角色权限', {'fields': ('role',)}),
    )


@admin.register(Feedback)
class FeedbackAdmin(admin.ModelAdmin):
    """
    用户反馈管理后台
    """
    list_display = ['id', 'user_display', 'feedback_type', 'status', 'created_at']
    list_filter = ['feedback_type', 'status', 'created_at']
    search_fields = ['content', 'contact_info', 'user__username', 'user__nickname']
    ordering = ['-created_at']
    readonly_fields = ['user', 'feedback_type', 'content', 'contact_info', 'created_at', 'updated_at']

    fieldsets = (
        ('反馈信息', {
            'fields': ('user', 'feedback_type', 'content', 'contact_info')
        }),
        ('处理状态', {
            'fields': ('status', 'admin_reply')
        }),
        ('时间信息', {
            'fields': ('created_at', 'updated_at')
        }),
    )

    def user_display(self, obj):
        if obj.user:
            return obj.user.nickname or obj.user.username
        return '匿名用户'
    user_display.short_description = '提交用户'