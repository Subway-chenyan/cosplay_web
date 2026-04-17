from django.contrib import admin

from .models import SocialAccountLink


@admin.register(SocialAccountLink)
class SocialAccountLinkAdmin(admin.ModelAdmin):
    list_display = ('provider', 'openid', 'user', 'nickname', 'created_at')
    list_filter = ('provider', 'created_at')
    search_fields = ('openid', 'nickname', 'user__username', 'user__email')
