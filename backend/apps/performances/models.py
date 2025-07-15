from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class Performance(models.Model):
    """
    演出模型
    """
    TYPE_CHOICES = [
        ('solo', '个人表演'),
        ('group', '团体表演'),
        ('stage_play', '舞台剧'),
        ('dance', '舞蹈'),
        ('music', '音乐'),
        ('other', '其他'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=255, verbose_name='演出名称')
    description = models.TextField(blank=True, verbose_name='描述')
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, verbose_name='类型')
    
    # 作品信息
    original_work = models.CharField(max_length=255, blank=True, verbose_name='原作品')
    character_names = models.TextField(blank=True, verbose_name='角色名称')
    
    # 关联信息
    group = models.ForeignKey('groups.Group', on_delete=models.SET_NULL, null=True, blank=True,
                             related_name='performances', verbose_name='所属社团')
    
    # 时间信息
    debut_date = models.DateField(blank=True, null=True, verbose_name='首演时间')
    
    # 统计信息
    view_count = models.IntegerField(default=0, verbose_name='观看次数')
    like_count = models.IntegerField(default=0, verbose_name='点赞数')
    
    # 状态
    is_active = models.BooleanField(default=True, verbose_name='是否启用')
    is_featured = models.BooleanField(default=False, verbose_name='是否推荐')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        verbose_name = '演出'
        verbose_name_plural = '演出'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['title']),
            models.Index(fields=['type']),
            models.Index(fields=['debut_date']),
        ]
    
    def __str__(self):
        return self.title


class PerformanceVideo(models.Model):
    """
    演出视频关联模型
    """
    performance = models.ForeignKey(Performance, on_delete=models.CASCADE, 
                                   related_name='performance_videos', verbose_name='演出')
    video = models.ForeignKey('videos.Video', on_delete=models.CASCADE, 
                             related_name='performance_videos', verbose_name='视频')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    
    class Meta:
        verbose_name = '演出视频'
        verbose_name_plural = '演出视频'
        unique_together = ['performance', 'video']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.performance.title} - {self.video.title}" 