from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class Video(models.Model):
    """
    视频模型
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bv_number = models.CharField(max_length=20, unique=True, verbose_name='BV号')
    title = models.CharField(max_length=255, verbose_name='标题')
    description = models.TextField(blank=True, verbose_name='描述')
    url = models.URLField(verbose_name='视频链接')
    thumbnail = models.URLField(blank=True, verbose_name='缩略图')

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
            models.Index(fields=['group']),
            models.Index(fields=['competition']),
            models.Index(fields=['competition_year']),
        ]

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        return self.url 