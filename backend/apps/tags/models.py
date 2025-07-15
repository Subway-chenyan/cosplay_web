from django.db import models
import uuid


class Tag(models.Model):
    """
    标签模型
    """
    CATEGORY_CHOICES = [
        ('游戏IP', '游戏IP'),
        ('动漫IP', '动漫IP'),
        ('年份', '年份'),
        ('类型', '类型'),
        ('风格', '风格'),
        ('地区', '地区'),
        ('其他', '其他'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50, verbose_name='标签名称')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, verbose_name='分类')
    description = models.TextField(blank=True, verbose_name='描述')
    color = models.CharField(max_length=7, default='#007bff', verbose_name='颜色')
    
    # 统计信息
    usage_count = models.IntegerField(default=0, verbose_name='使用次数')
    
    # 状态
    is_active = models.BooleanField(default=True, verbose_name='是否启用')
    is_featured = models.BooleanField(default=False, verbose_name='是否推荐')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        verbose_name = '标签'
        verbose_name_plural = '标签'
        unique_together = ['name', 'category']
        ordering = ['-usage_count', 'name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['category']),
            models.Index(fields=['is_active']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_category_display()})"


class VideoTag(models.Model):
    """
    视频标签关联模型
    """
    video = models.ForeignKey('videos.Video', on_delete=models.CASCADE, 
                             related_name='video_tags', verbose_name='视频')
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE, 
                           related_name='video_tags', verbose_name='标签')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    
    class Meta:
        verbose_name = '视频标签'
        verbose_name_plural = '视频标签'
        unique_together = ['video', 'tag']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.video.title} - {self.tag.name}" 