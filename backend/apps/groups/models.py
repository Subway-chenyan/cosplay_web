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
    logo = models.ImageField(upload_to='group_logos/', blank=True, null=True, verbose_name='社团logo')
    
    # 基本信息
    founded_date = models.DateField(blank=True, null=True, verbose_name='成立时间')
    location = models.CharField(max_length=100, blank=True, verbose_name='所在地')
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
    is_verified = models.BooleanField(default=False, verbose_name='是否认证')
    is_featured = models.BooleanField(default=False, verbose_name='是否推荐')
    
    # 统计信息
    member_count = models.IntegerField(default=0, verbose_name='成员数量')
    video_count = models.IntegerField(default=0, verbose_name='视频数量')
    performance_count = models.IntegerField(default=0, verbose_name='演出数量')
    award_count = models.IntegerField(default=0, verbose_name='获奖数量')
    
    # 创建者和管理员
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
            models.Index(fields=['is_verified']),
            models.Index(fields=['is_featured']),
        ]
    
    def __str__(self):
        return self.name
    
    def get_absolute_url(self):
        return f'/groups/{self.id}/'


class GroupMember(models.Model):
    """
    社团成员模型
    """
    ROLE_CHOICES = [
        ('leader', '社长'),
        ('vice_leader', '副社长'),
        ('manager', '管理员'),
        ('member', '成员'),
        ('guest', '嘉宾'),
    ]
    
    STATUS_CHOICES = [
        ('active', '活跃'),
        ('inactive', '不活跃'),
        ('pending', '待审核'),
        ('rejected', '已拒绝'),
        ('left', '已退出'),
    ]
    
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='members', verbose_name='社团')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='group_memberships', verbose_name='用户')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member', verbose_name='角色')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='状态')
    
    # 成员信息
    nickname = models.CharField(max_length=50, blank=True, verbose_name='在社团中的昵称')
    bio = models.TextField(blank=True, verbose_name='个人介绍')
    position = models.CharField(max_length=100, blank=True, verbose_name='职位')
    
    # 时间信息
    joined_at = models.DateTimeField(auto_now_add=True, verbose_name='加入时间')
    left_at = models.DateTimeField(blank=True, null=True, verbose_name='离开时间')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        verbose_name = '社团成员'
        verbose_name_plural = '社团成员'
        unique_together = ['group', 'user']
        ordering = ['-joined_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.group.name} ({self.get_role_display()})"
    
    def is_leader(self):
        return self.role in ['leader', 'vice_leader']
    
    def is_active(self):
        return self.status == 'active'


class GroupFollower(models.Model):
    """
    社团关注者模型
    """
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='followers', verbose_name='社团')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='followed_groups', verbose_name='用户')
    
    # 通知设置
    notify_new_videos = models.BooleanField(default=True, verbose_name='新视频通知')
    notify_new_performances = models.BooleanField(default=True, verbose_name='新演出通知')
    notify_awards = models.BooleanField(default=True, verbose_name='获奖通知')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='关注时间')
    
    class Meta:
        verbose_name = '社团关注'
        verbose_name_plural = '社团关注'
        unique_together = ['group', 'user']
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.user.username} 关注了 {self.group.name}" 