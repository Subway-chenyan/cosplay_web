from django.contrib import admin
from django.utils.html import format_html
from django import forms
from .models import Video
from apps.tags.models import VideoTag
from apps.awards.models import AwardRecord
from apps.competitions.models import CompetitionYear

class VideoTagInline(admin.TabularInline):
    model = VideoTag
    extra = 1

class AwardRecordInlineFormSet(forms.models.BaseInlineFormSet):
    def save_new(self, form, commit=True):
        """保存新的获奖记录时自动填充社团和比赛年份"""
        instance = super().save_new(form, commit=False)
        if hasattr(self, 'video_instance') and self.video_instance:
            instance.group = self.video_instance.group
            # 自动设置比赛年份
            from apps.competitions.models import CompetitionYear
            try:
                competition_year = CompetitionYear.objects.get(
                    competition=self.video_instance.competition,
                    year=self.video_instance.year
                )
                instance.competition_year = competition_year
            except CompetitionYear.DoesNotExist:
                # 如果找不到对应的CompetitionYear，创建一个新的
                competition_year = CompetitionYear.objects.create(
                    competition=self.video_instance.competition,
                    year=self.video_instance.year
                )
                instance.competition_year = competition_year
        if commit:
            instance.save()
        return instance

class AwardRecordInlineForm(forms.ModelForm):
    """
    内联获奖记录表单，允许直接输入年份数字
    """
    year_input = forms.IntegerField(
        label='年份',
        help_text='输入年份数字',
        min_value=2000,
        max_value=2030,
        required=True
    )
    
    class Meta:
        model = AwardRecord
        fields = ['award', 'year_input', 'description']
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk and hasattr(self.instance, 'competition_year') and self.instance.competition_year:
            self.fields['year_input'].initial = self.instance.competition_year.year
    
    def save(self, commit=True):
        instance = super().save(commit=False)
        year = self.cleaned_data.get('year_input')
        
        if year and hasattr(self, 'video_instance') and self.video_instance:
            # 根据视频的比赛和输入的年份查找或创建CompetitionYear
            competition = self.video_instance.competition
            try:
                competition_year = CompetitionYear.objects.get(
                    competition=competition,
                    year=year
                )
            except CompetitionYear.DoesNotExist:
                competition_year = CompetitionYear.objects.create(
                    competition=competition,
                    year=year
                )
            instance.competition_year = competition_year
            instance.group = self.video_instance.group
        
        if commit:
            instance.save()
        return instance

class AwardRecordInline(admin.TabularInline):
    model = AwardRecord
    extra = 0
    fields = ('award', 'year_input', 'description')  # 显示奖项、年份输入框和描述
    readonly_fields = ()
    autocomplete_fields = ['award']
    form = AwardRecordInlineForm
    ordering = ['-created_at']

    def get_formset(self, request, obj=None, **kwargs):
        formset = super().get_formset(request, obj, **kwargs)
        original_form = self.form
        
        class CustomForm(original_form):
            def __init__(self, *args, **kwargs):
                super().__init__(*args, **kwargs)
                self.video_instance = obj
        
        formset.form = CustomForm
        return formset

@admin.register(Video)
class VideoAdmin(admin.ModelAdmin):
    """
    视频管理后台
    """
    list_display = ['bv_number', 'title', 'group', 'competition', 'year', 'uploaded_by', 'created_at']
    list_filter = ['group', 'competition', 'year', 'uploaded_by', 'created_at']
    search_fields = ['title', 'description', 'bv_number', 'group__name', 'tags__name', 'competition__name']
    ordering = ['-created_at']
    filter_horizontal = ['tags']
    inlines = [VideoTagInline, AwardRecordInline]
    
    fieldsets = (
        ('基本信息', {
            'fields': ('bv_number', 'title', 'description', 'url', 'thumbnail')
        }),
        ('社团信息', {
            'fields': ('group',)
        }),
        ('Competition Info', {
            'fields': ('competition', 'year')
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