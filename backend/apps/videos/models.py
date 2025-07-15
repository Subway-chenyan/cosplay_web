from django.db import models
from django.contrib.auth import get_user_model
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
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
    comment_count = models.IntegerField(default=0, verbose_name='评论数')
    favorite_count = models.IntegerField(default=0, verbose_name='收藏数')
    share_count = models.IntegerField(default=0, verbose_name='分享数')
    
    # 日期信息
    upload_date = models.DateTimeField(blank=True, null=True, verbose_name='上传时间')
    performance_date = models.DateField(blank=True, null=True, verbose_name='表演时间')
    
    # 状态和权限
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='published', verbose_name='状态')
    is_featured = models.BooleanField(default=False, verbose_name='是否推荐')
    is_original = models.BooleanField(default=True, verbose_name='是否原创')
    
    # 上传者信息
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                                   related_name='uploaded_videos', verbose_name='上传者')
    
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


class VideoFavorite(models.Model):
    """
    视频收藏
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='favorites', verbose_name='用户')
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name='favorites', verbose_name='视频')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='收藏时间')
    
    class Meta:
        verbose_name = '视频收藏'
        verbose_name_plural = '视频收藏'
        unique_together = ['user', 'video']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} 收藏了 {self.video.title}"


class VideoRating(models.Model):
    """
    视频评分
    """
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='ratings', verbose_name='用户')
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name='ratings', verbose_name='视频')
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name='评分'
    )
    comment = models.TextField(blank=True, verbose_name='评价')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='评分时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        verbose_name = '视频评分'
        verbose_name_plural = '视频评分'
        unique_together = ['user', 'video']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} 给 {self.video.title} 评分 {self.rating}"


class VideoComment(models.Model):
    """
    视频评论
    """
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name='comments', verbose_name='视频')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='comments', verbose_name='用户')
    content = models.TextField(verbose_name='评论内容')
    parent = models.ForeignKey('self', on_delete=models.CASCADE, blank=True, null=True, 
                              related_name='replies', verbose_name='父评论')
    
    # 状态
    is_approved = models.BooleanField(default=True, verbose_name='是否审核通过')
    is_pinned = models.BooleanField(default=False, verbose_name='是否置顶')
    
    # 统计
    like_count = models.IntegerField(default=0, verbose_name='点赞数')
    reply_count = models.IntegerField(default=0, verbose_name='回复数')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='评论时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        verbose_name = '视频评论'
        verbose_name_plural = '视频评论'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} 评论了 {self.video.title}"
    
    def is_reply(self):
        return self.parent is not None


class VideoView(models.Model):
    """
    视频观看记录
    """
    video = models.ForeignKey(Video, on_delete=models.CASCADE, related_name='views', verbose_name='视频')
    user = models.ForeignKey(User, on_delete=models.CASCADE, blank=True, null=True, 
                            related_name='video_views', verbose_name='用户')
    ip_address = models.GenericIPAddressField(verbose_name='IP地址')
    user_agent = models.TextField(blank=True, verbose_name='用户代理')
    
    # 观看信息
    watch_duration = models.DurationField(blank=True, null=True, verbose_name='观看时长')
    completion_rate = models.FloatField(default=0, validators=[MinValueValidator(0), MaxValueValidator(1)], 
                                       verbose_name='完成率')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='观看时间')
    
    class Meta:
        verbose_name = '视频观看记录'
        verbose_name_plural = '视频观看记录'
        ordering = ['-created_at']
    
    def __str__(self):
        user_display = self.user.username if self.user else '匿名用户'
        return f"{user_display} 观看了 {self.video.title}" 