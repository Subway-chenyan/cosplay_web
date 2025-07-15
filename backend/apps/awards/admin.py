from django.contrib import admin
from .models import Award, AwardRecord


@admin.register(Award)
class AwardAdmin(admin.ModelAdmin):
    """
    奖项管理后台
    """
    list_display = ['name', 'competition', 'rank', 'level', 'prize_money', 'winner_count', 'created_at']
    list_filter = ['rank', 'level', 'competition', 'created_at']
    search_fields = ['name', 'description', 'competition__name']
    ordering = ['competition', 'rank', 'name']
    readonly_fields = ['winner_count']


@admin.register(AwardRecord)
class AwardRecordAdmin(admin.ModelAdmin):
    """
    获奖记录管理后台
    """
    list_display = ['award', 'video', 'performance', 'group', 'year', 'created_at']
    list_filter = ['year', 'award__competition', 'created_at']
    search_fields = ['award__name', 'video__title', 'performance__title', 'group__name']
    ordering = ['-year', '-created_at'] 