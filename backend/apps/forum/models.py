from django.contrib.auth import get_user_model
from django.db import models
from django.utils import timezone

User = get_user_model()

class ForumCategory(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=50, blank=True, help_text="CSS class or icon name")
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    post_count = models.PositiveIntegerField(default=0)
    comment_count = models.PositiveIntegerField(default=0)
    allowed_roles = models.JSONField(default=list, blank=True, help_text="Empty means any authenticated user can post")

    class Meta:
        ordering = ['order']

    def __str__(self):
        return self.name

class ForumTag(models.Model):
    name = models.CharField(max_length=50, unique=True)
    slug = models.SlugField(unique=True)
    color = models.CharField(max_length=20, default="#d90614")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name

class Post(models.Model):
    STATUS_DRAFT = 'draft'
    STATUS_PUBLISHED = 'published'
    STATUS_PENDING = 'pending'
    STATUS_HIDDEN = 'hidden'
    STATUS_DELETED = 'deleted'
    STATUS_CHOICES = [
        (STATUS_DRAFT, '草稿'),
        (STATUS_PUBLISHED, '已发布'),
        (STATUS_PENDING, '待审核'),
        (STATUS_HIDDEN, '已隐藏'),
        (STATUS_DELETED, '已删除'),
    ]

    title = models.CharField(max_length=200)
    content = models.TextField()  # Stores sanitized HTML rendered from TipTap
    content_json = models.JSONField(null=True, blank=True)
    excerpt = models.CharField(max_length=300, blank=True)
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='forum_posts')
    category = models.ForeignKey(ForumCategory, on_delete=models.CASCADE, related_name='posts')
    tags = models.ManyToManyField(ForumTag, blank=True, related_name='posts')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PUBLISHED)
    view_count = models.PositiveIntegerField(default=0)
    reply_count = models.PositiveIntegerField(default=0)
    like_count = models.PositiveIntegerField(default=0)
    report_count = models.PositiveIntegerField(default=0)
    is_pinned = models.BooleanField(default=False)
    is_featured = models.BooleanField(default=False)
    is_locked = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(default=timezone.now)
    last_commented_at = models.DateTimeField(null=True, blank=True)
    last_commented_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='last_commented_posts')
    edited_at = models.DateTimeField(null=True, blank=True)
    edited_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='edited_forum_posts')
    hidden_at = models.DateTimeField(null=True, blank=True)
    hidden_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='hidden_forum_posts')
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='deleted_forum_posts')
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-is_pinned', '-last_commented_at', '-created_at']
        indexes = [
            models.Index(fields=['status', 'is_active']),
            models.Index(fields=['category', 'status']),
            models.Index(fields=['-is_pinned', '-last_commented_at']),
        ]

    def __str__(self):
        return self.title

    @property
    def is_visible(self):
        return self.is_active and self.status == self.STATUS_PUBLISHED

class Comment(models.Model):
    STATUS_PUBLISHED = 'published'
    STATUS_HIDDEN = 'hidden'
    STATUS_DELETED = 'deleted'
    STATUS_CHOICES = [
        (STATUS_PUBLISHED, '已发布'),
        (STATUS_HIDDEN, '已隐藏'),
        (STATUS_DELETED, '已删除'),
    ]

    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='forum_comments')
    content = models.TextField()
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.CASCADE, related_name='replies')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PUBLISHED)
    like_count = models.PositiveIntegerField(default=0)
    report_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    edited_at = models.DateTimeField(null=True, blank=True)
    edited_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='edited_forum_comments')
    hidden_at = models.DateTimeField(null=True, blank=True)
    hidden_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='hidden_forum_comments')
    deleted_at = models.DateTimeField(null=True, blank=True)
    deleted_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='deleted_forum_comments')
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['post', 'parent', 'status']),
            models.Index(fields=['author', 'created_at']),
        ]

    def __str__(self):
        return f'Comment by {self.author} on {self.post}'

class ForumAttachment(models.Model):
    STATUS_UPLOADED = 'uploaded'
    STATUS_ATTACHED = 'attached'
    STATUS_ORPHANED = 'orphaned'
    STATUS_BLOCKED = 'blocked'
    STATUS_CHOICES = [
        (STATUS_UPLOADED, '已上传'),
        (STATUS_ATTACHED, '已关联'),
        (STATUS_ORPHANED, '孤儿文件'),
        (STATUS_BLOCKED, '已屏蔽'),
    ]

    file = models.ImageField(upload_to='forum/attachments/%Y/%m/%d/')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='forum_attachments')
    post = models.ForeignKey(Post, null=True, blank=True, on_delete=models.SET_NULL, related_name='attachments')
    comment = models.ForeignKey(Comment, null=True, blank=True, on_delete=models.SET_NULL, related_name='attachments')
    original_name = models.CharField(max_length=255, blank=True)
    content_type = models.CharField(max_length=100, blank=True)
    size = models.PositiveIntegerField(default=0)
    width = models.PositiveIntegerField(null=True, blank=True)
    height = models.PositiveIntegerField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_UPLOADED)
    created_at = models.DateTimeField(auto_now_add=True)
    attached_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Attachment by {self.author} at {self.created_at}"

class PostRevision(models.Model):
    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name='revisions')
    editor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='forum_post_revisions')
    title = models.CharField(max_length=200)
    content = models.TextField()
    content_json = models.JSONField(null=True, blank=True)
    reason = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

class ForumReaction(models.Model):
    TARGET_POST = 'post'
    TARGET_COMMENT = 'comment'
    TARGET_CHOICES = [
        (TARGET_POST, '帖子'),
        (TARGET_COMMENT, '评论'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='forum_reactions')
    target_type = models.CharField(max_length=20, choices=TARGET_CHOICES)
    post = models.ForeignKey(Post, null=True, blank=True, on_delete=models.CASCADE, related_name='reactions')
    comment = models.ForeignKey(Comment, null=True, blank=True, on_delete=models.CASCADE, related_name='reactions')
    reaction = models.CharField(max_length=20, default='like')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'post', 'reaction'],
                condition=models.Q(post__isnull=False),
                name='unique_forum_post_reaction',
            ),
            models.UniqueConstraint(
                fields=['user', 'comment', 'reaction'],
                condition=models.Q(comment__isnull=False),
                name='unique_forum_comment_reaction',
            ),
        ]

class ForumReport(models.Model):
    REASON_SPAM = 'spam'
    REASON_ABUSE = 'abuse'
    REASON_COPYRIGHT = 'copyright'
    REASON_OTHER = 'other'
    REASON_CHOICES = [
        (REASON_SPAM, '垃圾内容'),
        (REASON_ABUSE, '攻击或骚扰'),
        (REASON_COPYRIGHT, '版权问题'),
        (REASON_OTHER, '其他'),
    ]
    STATUS_PENDING = 'pending'
    STATUS_RESOLVED = 'resolved'
    STATUS_REJECTED = 'rejected'
    STATUS_CHOICES = [
        (STATUS_PENDING, '待处理'),
        (STATUS_RESOLVED, '已处理'),
        (STATUS_REJECTED, '已拒绝'),
    ]

    reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='forum_reports')
    post = models.ForeignKey(Post, null=True, blank=True, on_delete=models.CASCADE, related_name='reports')
    comment = models.ForeignKey(Comment, null=True, blank=True, on_delete=models.CASCADE, related_name='reports')
    reason = models.CharField(max_length=20, choices=REASON_CHOICES)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    handled_by = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL, related_name='handled_forum_reports')
    handled_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

class ModerationLog(models.Model):
    ACTION_PIN = 'pin'
    ACTION_UNPIN = 'unpin'
    ACTION_LOCK = 'lock'
    ACTION_UNLOCK = 'unlock'
    ACTION_FEATURE = 'feature'
    ACTION_UNFEATURE = 'unfeature'
    ACTION_HIDE = 'hide'
    ACTION_RESTORE = 'restore'
    ACTION_DELETE = 'delete'
    ACTION_CHOICES = [
        (ACTION_PIN, '置顶'),
        (ACTION_UNPIN, '取消置顶'),
        (ACTION_LOCK, '锁定'),
        (ACTION_UNLOCK, '解锁'),
        (ACTION_FEATURE, '设为精华'),
        (ACTION_UNFEATURE, '取消精华'),
        (ACTION_HIDE, '隐藏'),
        (ACTION_RESTORE, '恢复'),
        (ACTION_DELETE, '删除'),
    ]

    actor = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='forum_moderation_logs')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    post = models.ForeignKey(Post, null=True, blank=True, on_delete=models.CASCADE, related_name='moderation_logs')
    comment = models.ForeignKey(Comment, null=True, blank=True, on_delete=models.CASCADE, related_name='moderation_logs')
    reason = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
