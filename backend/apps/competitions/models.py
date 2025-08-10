from django.db import models
import uuid


class Competition(models.Model):
    """
    比赛模型
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, verbose_name='比赛名称')
    description = models.TextField(blank=True, verbose_name='比赛描述')
    website = models.URLField(blank=True, verbose_name='官网链接')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        verbose_name = '比赛'
        verbose_name_plural = '比赛'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['name']),
        ]
    
    def __str__(self):
        return self.name


class CompetitionYear(models.Model):
    """
    比赛年份模型
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    competition = models.ForeignKey(Competition, on_delete=models.CASCADE, 
                                   related_name='years', verbose_name='所属比赛')
    year = models.IntegerField(verbose_name='年份')
    description = models.TextField(blank=True, verbose_name='年份描述')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        verbose_name = '比赛年份'
        verbose_name_plural = '比赛年份'
        ordering = ['-year']
        unique_together = ['competition', 'year']
        indexes = [
            models.Index(fields=['competition', 'year']),
            models.Index(fields=['year']),
        ]
    
    def __str__(self):
        return f"{self.competition.name} - {self.year}年"