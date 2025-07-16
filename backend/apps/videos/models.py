from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class Video(models.Model):
    """
    视频模型
    """
    STATUS_CHOICES = [
        ('draft', '草稿'),
        ('published', '已发布'),
        ('private', '私有'),
        ('deleted', '已删除'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bv_number = models.CharField(max_length=20, unique=True, verbose_name='BV号')
    title = models.CharField(max_length=255, verbose_name='标题')
    description = models.TextField(blank=True, verbose_name='描述')
    url = models.URLField(verbose_name='视频链接')
    thumbnail = models.URLField(blank=True, verbose_name='缩略图')
    
    # 视频信息
    duration = models.DurationField(blank=True, null=True, verbose_name='时长')
    resolution = models.CharField(max_length=20, blank=True, verbose_name='分辨率')
    file_size = models.BigIntegerField(blank=True, null=True, verbose_name='文件大小（字节）')
    
    # 统计信息
    view_count = models.IntegerField(default=0, verbose_name='播放量')
    like_count = models.IntegerField(default=0, verbose_name='点赞数')
    share_count = models.IntegerField(default=0, verbose_name='分享数')
    
    # 日期信息
    upload_date = models.DateTimeField(blank=True, null=True, verbose_name='上传时间')
    performance_date = models.DateField(blank=True, null=True, verbose_name='表演时间')
    
    # 状态和权限
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='published', verbose_name='状态')
    is_featured = models.BooleanField(default=False, verbose_name='是否推荐')
    is_original = models.BooleanField(default=True, verbose_name='是否原创')
    
    # 关联信息
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                                   related_name='uploaded_videos', verbose_name='上传者')
    group = models.ForeignKey('groups.Group', on_delete=models.SET_NULL, null=True, blank=True,
                             related_name='videos', verbose_name='所属社团')
    tags = models.ManyToManyField('tags.Tag', through='tags.VideoTag', 
                                 related_name='videos', verbose_name='标签')
    competition = models.ForeignKey('competitions.Competition', on_delete=models.SET_NULL, 
                                   null=True, blank=True, related_name='videos', verbose_name='所属比赛')
    competition_year = models.IntegerField(blank=True, null=True, verbose_name='比赛年份')
    
    # 时间戳
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        verbose_name = '视频'
        verbose_name_plural = '视频'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['bv_number']),
            models.Index(fields=['status']),
            models.Index(fields=['is_featured']),
            models.Index(fields=['performance_date']),
            models.Index(fields=['upload_date']),
            models.Index(fields=['group']),
            models.Index(fields=['competition']),
            models.Index(fields=['competition_year']),
        ]
    
    def __str__(self):
        return self.title
    
    def get_absolute_url(self):
        return self.url
    
    def is_published(self):
        return self.status == 'published'
    
    def get_duration_display(self):
        if self.duration:
            seconds = int(self.duration.total_seconds())
            hours = seconds // 3600
            minutes = (seconds % 3600) // 60
            seconds = seconds % 60
            if hours:
                return f"{hours}:{minutes:02d}:{seconds:02d}"
            return f"{minutes}:{seconds:02d}"
        return "未知" 