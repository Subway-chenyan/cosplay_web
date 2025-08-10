from django.contrib import admin
from django import forms
from .models import Award, AwardRecord
from apps.competitions.models import CompetitionYear


class AwardRecordAdminForm(forms.ModelForm):
    """
    获奖记录管理表单，允许直接输入年份数字
    """
    year_input = forms.IntegerField(
        label='比赛年份',
        help_text='请输入年份数字（如：2024）',
        min_value=2000,
        max_value=2030
    )
    
    class Meta:
        model = AwardRecord
        fields = ['award', 'video', 'group', 'competition_year', 'description']
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk and hasattr(self.instance, 'competition_year') and self.instance.competition_year:
            self.fields['year_input'].initial = self.instance.competition_year.year
    
    def save(self, commit=True):
        instance = super().save(commit=False)
        year = self.cleaned_data.get('year_input')
        
        if year and instance.video:
            # 根据视频的比赛和输入的年份查找或创建CompetitionYear
            competition = instance.video.competition
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
        
        if commit:
            instance.save()
        return instance


@admin.register(Award)
class AwardAdmin(admin.ModelAdmin):
    """
    奖项管理后台
    """
    list_display = ['name', 'competition', 'created_at']
    list_filter = ['competition', 'created_at']
    search_fields = ['name', 'competition__name']
    ordering = ['competition', 'name']


@admin.register(AwardRecord)
class AwardRecordAdmin(admin.ModelAdmin):
    """
    获奖记录管理后台
    """
    form = AwardRecordAdminForm
    list_display = ['award', 'video', 'group', 'get_competition_year', 'created_at']
    list_filter = ['competition_year__year', 'award__competition', 'created_at']
    
    def get_competition_year(self, obj):
        return obj.competition_year.year if obj.competition_year else '-'
    get_competition_year.short_description = '比赛年份'
    search_fields = ['award__name', 'video__title', 'group__name']
    ordering = ['-created_at']
    
    def get_fields(self, request, obj=None):
        fields = super().get_fields(request, obj)
        # 重新排序字段，确保year_input在正确位置
        if 'year_input' not in fields:
            fields = list(fields)
            try:
                year_index = fields.index('competition_year')
                fields[year_index] = 'year_input'  # 替换competition_year为year_input
            except ValueError:
                # 如果找不到competition_year，添加到合适位置
                fields.append('year_input')
        return [f for f in fields if f != 'competition_year']  # 排除competition_year