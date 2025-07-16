from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class Award(models.Model):
    """
    奖项模型
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, verbose_name='奖项名称')
    description = models.TextField(blank=True, verbose_name='奖项描述')
    
    # 关联比赛
    competition = models.ForeignKey('competitions.Competition', on_delete=models.CASCADE,
                                   related_name='awards', verbose_name='所属比赛')
    
    # 奖品信息
    prize_money = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, 
                                     verbose_name='奖金')
    prize_description = models.TextField(blank=True, verbose_name='奖品描述')
    
    # 统计信息
    winner_count = models.IntegerField(default=0, verbose_name='获奖者数量')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        verbose_name = '奖项'
        verbose_name_plural = '奖项'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.competition.name} - {self.name}"


class AwardRecord(models.Model):
    """
    获奖记录模型
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    award = models.ForeignKey(Award, on_delete=models.CASCADE, 
                             related_name='records', verbose_name='奖项')
    
    # 获奖者信息 (可能是视频、社团中的任意一个或多个)
    video = models.ForeignKey('videos.Video', on_delete=models.SET_NULL, null=True, blank=True,
                             related_name='award_records', verbose_name='获奖视频')
    group = models.ForeignKey('groups.Group', on_delete=models.SET_NULL, null=True, blank=True,
                             related_name='award_records', verbose_name='获奖社团')
    
    # 详细信息
    year = models.IntegerField(verbose_name='获奖年份')
    description = models.TextField(blank=True, verbose_name='获奖描述')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        verbose_name = '获奖记录'
        verbose_name_plural = '获奖记录'
        ordering = ['-year', '-created_at']
    
    def __str__(self):
        return f"{self.award.name} ({self.year})" 