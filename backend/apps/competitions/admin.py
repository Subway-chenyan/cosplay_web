from django.contrib import admin
from .models import Competition, Event


@admin.register(Competition)
class CompetitionAdmin(admin.ModelAdmin):
    """
    比赛管理后台
    """
    list_display = ['name', 'description', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'description']
    ordering = ['-created_at'] 


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    """
    赛事信息管理后台
    """
    list_display = ['title', 'competition', 'region', 'stage', 'start_date', 'end_date', 'contact', 'created_at']
    list_filter = ['start_date', 'end_date', 'competition', 'region', 'stage', 'created_at']
    search_fields = ['title', 'description', 'contact', 'region']
    ordering = ['-start_date']
    date_hierarchy = 'start_date'
    filter_horizontal = ['videos']