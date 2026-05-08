from django.contrib import admin

from .models import (
    Comment,
    ForumAttachment,
    ForumCategory,
    ForumReaction,
    ForumReport,
    ForumTag,
    ModerationLog,
    Post,
    PostRevision,
)


@admin.register(ForumCategory)
class ForumCategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'order', 'is_active', 'post_count', 'comment_count')
    list_filter = ('is_active',)
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(ForumTag)
class ForumTagAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'color', 'created_at')
    search_fields = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = (
        'title', 'author', 'category', 'status', 'is_pinned',
        'is_featured', 'is_locked', 'reply_count', 'view_count', 'created_at'
    )
    list_filter = ('category', 'status', 'is_pinned', 'is_featured', 'is_locked', 'created_at')
    search_fields = ('title', 'content', 'excerpt', 'author__username', 'author__nickname')
    raw_id_fields = ('author', 'last_commented_by', 'edited_by', 'hidden_by', 'deleted_by')
    filter_horizontal = ('tags',)
    date_hierarchy = 'created_at'


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ('author', 'post', 'parent', 'status', 'like_count', 'report_count', 'created_at')
    list_filter = ('status', 'is_active', 'created_at')
    search_fields = ('content', 'author__username', 'author__nickname', 'post__title')
    raw_id_fields = ('author', 'post', 'parent', 'edited_by', 'hidden_by', 'deleted_by')


@admin.register(ForumAttachment)
class ForumAttachmentAdmin(admin.ModelAdmin):
    list_display = ('author', 'file', 'post', 'comment', 'status', 'content_type', 'size', 'created_at')
    list_filter = ('status', 'content_type', 'created_at')
    raw_id_fields = ('author', 'post', 'comment')


@admin.register(PostRevision)
class PostRevisionAdmin(admin.ModelAdmin):
    list_display = ('post', 'editor', 'created_at', 'reason')
    search_fields = ('post__title', 'content', 'editor__username')
    raw_id_fields = ('post', 'editor')


@admin.register(ForumReaction)
class ForumReactionAdmin(admin.ModelAdmin):
    list_display = ('user', 'target_type', 'post', 'comment', 'reaction', 'created_at')
    list_filter = ('target_type', 'reaction', 'created_at')
    raw_id_fields = ('user', 'post', 'comment')


@admin.register(ForumReport)
class ForumReportAdmin(admin.ModelAdmin):
    list_display = ('reporter', 'reason', 'status', 'post', 'comment', 'created_at', 'handled_by')
    list_filter = ('reason', 'status', 'created_at')
    search_fields = ('description', 'reporter__username', 'post__title', 'comment__content')
    raw_id_fields = ('reporter', 'post', 'comment', 'handled_by')


@admin.register(ModerationLog)
class ModerationLogAdmin(admin.ModelAdmin):
    list_display = ('actor', 'action', 'post', 'comment', 'created_at')
    list_filter = ('action', 'created_at')
    search_fields = ('reason', 'actor__username', 'post__title', 'comment__content')
    raw_id_fields = ('actor', 'post', 'comment')
