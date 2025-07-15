from django.db import models
import uuid


class Competition(models.Model):
    """
    比赛模型
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, verbose_name='比赛名称')
    year = models.IntegerField(verbose_name='年份')
    description = models.TextField(blank=True, verbose_name='比赛描述')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        verbose_name = '比赛'
        verbose_name_plural = '比赛'
        ordering = ['-year']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['year']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.year})" 