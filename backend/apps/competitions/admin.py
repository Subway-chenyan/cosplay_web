from django.contrib import admin
from .models import Competition


@admin.register(Competition)
class CompetitionAdmin(admin.ModelAdmin):
    """
    比赛管理后台
    """
    list_display = ['name', 'year', 'location', 'start_date', 'participant_count', 'award_count', 'created_at']
    list_filter = ['year', 'is_active', 'is_featured', 'start_date', 'created_at']
    search_fields = ['name', 'description', 'location', 'organizer']
    ordering = ['-year', '-start_date']
    readonly_fields = ['participant_count', 'award_count'] 