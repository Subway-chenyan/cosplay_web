from django.db import models
from django.contrib.auth import get_user_model
import uuid

User = get_user_model()


class Group(models.Model):
    """
    社团模型
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True, verbose_name='社团名称')
    description = models.TextField(blank=True, verbose_name='社团描述')
    logo = models.ImageField(upload_to='group_logos/', max_length=500, blank=True, null=True, verbose_name='社团logo')

    # 基本信息
    founded_date = models.DateField(blank=True, null=True, verbose_name='成立时间')
    province = models.CharField(max_length=50, blank=True, verbose_name='所在省份')
    city = models.CharField(max_length=50, blank=True, verbose_name='所在城市')
    location = models.CharField(max_length=100, blank=True, verbose_name='详细地址')
    website = models.URLField(blank=True, verbose_name='官方网站')
    email = models.EmailField(blank=True, verbose_name='联系邮箱')
    phone = models.CharField(max_length=20, blank=True, verbose_name='联系电话')
    
    # 社交媒体
    weibo = models.URLField(blank=True, verbose_name='微博链接')
    wechat = models.CharField(max_length=50, blank=True, verbose_name='微信号')
    qq_group = models.CharField(max_length=20, blank=True, verbose_name='QQ群')
    bilibili = models.URLField(blank=True, verbose_name='B站链接')
    
    # 状态和设置
    is_active = models.BooleanField(default=True, verbose_name='是否活跃')
    
    # 统计信息
    video_count = models.IntegerField(default=0, verbose_name='视频数量')
    award_count = models.IntegerField(default=0, verbose_name='获奖数量')
    
    # 创建者
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                                  related_name='created_groups', verbose_name='创建者')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        verbose_name = '社团'
        verbose_name_plural = '社团'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['is_active']),
            models.Index(fields=['province']),
            models.Index(fields=['city']),
        ]
    
    def __str__(self):
        return self.name
    
    def get_absolute_url(self):
        return f'/groups/{self.id}/'