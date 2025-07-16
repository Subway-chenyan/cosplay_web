from django.contrib import admin
from django.utils.html import format_html
from django import forms
from .models import Video
from apps.tags.models import VideoTag
from apps.awards.models import AwardRecord

class VideoTagInline(admin.TabularInline):
    model = VideoTag
    extra = 1

class AwardRecordInlineFormSet(forms.models.BaseInlineFormSet):
    def save_new(self, form, commit=True):
        """保存新的获奖记录时自动填充社团和年份"""
        instance = super().save_new(form, commit=False)
        if hasattr(self, 'video_instance') and self.video_instance:
            instance.group = self.video_instance.group
            instance.year = self.video_instance.competition_year or 2024  # 提供默认值
        else:
            # 如果视频对象不存在，设置默认值
            instance.year = 2024
        if commit:
            instance.save()
        return instance

class AwardRecordInline(admin.TabularInline):
    model = AwardRecord
    extra = 0
    fields = ('award', 'description')  # 只显示奖项和描述
    autocomplete_fields = ['award']
    formset = AwardRecordInlineFormSet

    def get_formset(self, request, obj=None, **kwargs):
        formset = super().get_formset(request, obj, **kwargs)
        original_formset = formset
        
        class CustomFormSet(original_formset):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)
                self.video_instance = obj
        
        return CustomFormSet

@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    """
    视频管理后台
    """
    list_display = ['title', 'bv_number', 'group', 'get_tags', 'competition', 'competition_year', 'get_awards', 'created_at']
    list_filter = ['group', 'tags', 'competition', 'competition_year', 'created_at']
    search_fields = ['title', 'description', 'bv_number', 'group__name', 'tags__name', 'competition__name']
    ordering = ['-created_at']
    filter_horizontal = ['tags']
    inlines = [VideoTagInline, AwardRecordInline]
    
    fieldsets = (
        ('基本信息', {
            'fields': ('bv_number', 'title', 'description', 'url', 'thumbnail')
        }),
        ('关联信息', {
            'fields': ('uploaded_by', 'group', 'competition', 'competition_year')
        }),
    )
    
    def get_tags(self, obj):
        """获取标签显示"""
        return ", ".join([tag.name for tag in obj.tags.all()[:3]])
    get_tags.short_description = '标签'
    
    def get_awards(self, obj):
        """获取获奖记录显示"""
        awards = obj.award_records.all()
        if awards:
            award_list = [f"{award.award.name}({award.year})" for award in awards[:2]]
            return ", ".join(award_list)
        return "无"
    get_awards.short_description = '获奖记录'
    
    def save_model(self, request, obj, form, change):
        """保存模型时的额外处理"""
        if not change and not obj.uploaded_by:
            obj.uploaded_by = request.user
        super().save_model(request, obj, form, change) 