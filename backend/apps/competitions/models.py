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
    
    # 配置字段
    banner_image = models.URLField(blank=True, verbose_name='Banner背景图片')
    banner_gradient = models.JSONField(blank=True, default=list, verbose_name='Banner渐变色')
    award_display_order = models.JSONField(blank=True, default=list, verbose_name='奖项显示顺序')
    
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


class Event(models.Model):
    """
    赛事信息模型
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    date = models.DateField(verbose_name='赛事日期')
    competition = models.ForeignKey(Competition, on_delete=models.CASCADE, 
                                   related_name='events', verbose_name='关联比赛')
    title = models.CharField(max_length=200, verbose_name='赛事标题')
    description = models.TextField(blank=True, verbose_name='赛事描述')
    contact = models.CharField(max_length=200, blank=True, verbose_name='联系方式')
    website = models.URLField(blank=True, verbose_name='官网链接')
    promotional_image = models.URLField(blank=True, verbose_name='宣传图链接')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        verbose_name = '赛事信息'
        verbose_name_plural = '赛事信息'
        ordering = ['-date']
        indexes = [
            models.Index(fields=['date']),
            models.Index(fields=['competition', 'date']),
        ]
    
    def __str__(self):
        return f"{self.title} - {self.date}"