from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class Competition(models.Model):
    """
    比赛模型
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, verbose_name='比赛名称')
    description = models.TextField(blank=True, verbose_name='比赛描述')
    
    # 基本信息
    year = models.IntegerField(verbose_name='年份')
    location = models.CharField(max_length=100, blank=True, verbose_name='举办地点')
    website = models.URLField(blank=True, verbose_name='官方网站')
    
    # 时间信息
    start_date = models.DateField(blank=True, null=True, verbose_name='开始日期')
    end_date = models.DateField(blank=True, null=True, verbose_name='结束日期')
    
    # 组织者信息
    organizer = models.CharField(max_length=100, blank=True, verbose_name='主办方')
    sponsor = models.CharField(max_length=100, blank=True, verbose_name='赞助商')
    
    # 统计信息
    participant_count = models.IntegerField(default=0, verbose_name='参赛人数')
    award_count = models.IntegerField(default=0, verbose_name='奖项数量')
    
    # 状态
    is_active = models.BooleanField(default=True, verbose_name='是否启用')
    is_featured = models.BooleanField(default=False, verbose_name='是否推荐')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        verbose_name = '比赛'
        verbose_name_plural = '比赛'
        ordering = ['-year', '-start_date']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['year']),
            models.Index(fields=['start_date']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.year})" 