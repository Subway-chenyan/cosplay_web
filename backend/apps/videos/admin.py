from django.contrib import admin
from .models import Video
from apps.tags.models import VideoTag

class VideoTagInline(admin.TabularInline):
    model = VideoTag
    extra = 1

@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    """
    视频管理后台
    """
    list_display = ['title', 'bv_number', 'status', 'group', 'get_tags', 'view_count', 'like_count', 'upload_date', 'created_at']
    list_filter = ['status', 'is_featured', 'is_original', 'group', 'tags', 'upload_date', 'created_at']
    search_fields = ['title', 'description', 'bv_number', 'group__name', 'tags__name']
    ordering = ['-created_at']
    readonly_fields = ['view_count', 'like_count', 'share_count']
    filter_horizontal = ['tags']
    inlines = [VideoTagInline]
    
    fieldsets = (
        ('基本信息', {
            'fields': ('bv_number', 'title', 'description', 'url', 'thumbnail')
        }),
        ('视频信息', {
            'fields': ('duration', 'resolution', 'file_size', 'performance_date')
        }),
        ('统计信息', {
            'fields': ('view_count', 'like_count', 'share_count'),
            'classes': ('collapse',)
        }),
        ('关联信息', {
            'fields': ('uploaded_by', 'group')
        }),
        ('状态设置', {
            'fields': ('status', 'is_featured', 'is_original', 'upload_date')
        }),
    )
    
    def get_tags(self, obj):
        """获取标签显示"""
        return ", ".join([tag.name for tag in obj.tags.all()[:3]])
    get_tags.short_description = '标签'
    
    def save_model(self, request, obj, form, change):
        """保存模型时的额外处理"""
        if not change:  # 新建时
            obj.uploaded_by = request.user
        super().save_model(request, obj, form, change) 