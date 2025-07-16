from django.contrib import admin
from .models import Competition


@admin.register(Competition)
class CompetitionAdmin(admin.ModelAdmin):
    """
    比赛管理后台
    """
    list_display = ['name', 'description', 'website', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'description']
    ordering = ['-created_at'] 