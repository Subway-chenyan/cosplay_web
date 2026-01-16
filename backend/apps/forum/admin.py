from django.contrib import admin
from .models import ForumCategory, Post, Comment, ForumAttachment

@admin.register(ForumCategory)
class ForumCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'order')
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'category', 'view_count', 'created_at', 'is_active')
    list_filter = ('category', 'is_active', 'created_at')
    search_fields = ('title', 'content', 'author__username')
    raw_id_fields = ('author',)
    date_hierarchy = 'created_at'

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('author', 'post', 'parent', 'created_at', 'is_active')
    list_filter = ('is_active', 'created_at')
    search_fields = ('content', 'author__username', 'post__title')
    raw_id_fields = ('author', 'post', 'parent')

@admin.register(ForumAttachment)
class ForumAttachmentAdmin(admin.ModelAdmin):
    list_display = ('author', 'file', 'created_at')
    list_filter = ('created_at',)
    raw_id_fields = ('author',)
