from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    自定义用户模型
    """
    ROLE_CHOICES = [
        ('admin', '管理员'),
        ('editor', '编辑'),
        ('viewer', '查看者'),
    ]
    
    email = models.EmailField(unique=True, verbose_name='邮箱')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='viewer', verbose_name='角色')
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True, verbose_name='头像')
    bio = models.TextField(blank=True, verbose_name='个人简介')
    website = models.URLField(blank=True, verbose_name='个人网站')
    location = models.CharField(max_length=100, blank=True, verbose_name='所在地')
    
    # 偏好设置
    theme = models.CharField(max_length=20, default='light', verbose_name='主题')
    language = models.CharField(max_length=10, default='zh-hans', verbose_name='语言')
    timezone = models.CharField(max_length=50, default='Asia/Shanghai', verbose_name='时区')
    
    # 统计信息
    video_count = models.IntegerField(default=0, verbose_name='上传视频数')
    favorite_count = models.IntegerField(default=0, verbose_name='收藏数')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        verbose_name = '用户'
        verbose_name_plural = '用户'
        ordering = ['-created_at']
    
    def __str__(self):
        return self.username
    
    def is_admin(self):
        return self.role == 'admin'
    
    def is_editor(self):
        return self.role in ['admin', 'editor']
    
    def can_edit(self):
        return self.is_editor()


class UserProfile(models.Model):
    """
    用户详细信息
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile', verbose_name='用户')
    birth_date = models.DateField(blank=True, null=True, verbose_name='出生日期')
    gender = models.CharField(max_length=10, choices=[('male', '男'), ('female', '女'), ('other', '其他')], 
                             blank=True, verbose_name='性别')
    phone = models.CharField(max_length=20, blank=True, verbose_name='手机号')
    wechat = models.CharField(max_length=50, blank=True, verbose_name='微信号')
    qq = models.CharField(max_length=20, blank=True, verbose_name='QQ号')
    
    # 兴趣爱好
    interests = models.TextField(blank=True, verbose_name='兴趣爱好')
    favorite_games = models.TextField(blank=True, verbose_name='喜爱游戏')
    favorite_characters = models.TextField(blank=True, verbose_name='喜爱角色')
    
    # 经验相关
    cosplay_experience = models.IntegerField(default=0, verbose_name='cosplay经验年数')
    skills = models.TextField(blank=True, verbose_name='技能')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        verbose_name = '用户资料'
        verbose_name_plural = '用户资料'
    
    def __str__(self):
        return f"{self.user.username}的资料"


class UserSetting(models.Model):
    """
    用户设置
    """
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='settings', verbose_name='用户')
    
    # 通知设置
    email_notifications = models.BooleanField(default=True, verbose_name='邮件通知')
    new_video_notifications = models.BooleanField(default=True, verbose_name='新视频通知')
    comment_notifications = models.BooleanField(default=True, verbose_name='评论通知')
    
    # 隐私设置
    profile_public = models.BooleanField(default=True, verbose_name='公开资料')
    show_email = models.BooleanField(default=False, verbose_name='显示邮箱')
    show_real_name = models.BooleanField(default=False, verbose_name='显示真实姓名')
    
    # 其他设置
    auto_play_videos = models.BooleanField(default=True, verbose_name='自动播放视频')
    default_video_quality = models.CharField(max_length=10, default='720p', verbose_name='默认视频质量')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        verbose_name = '用户设置'
        verbose_name_plural = '用户设置'
    
    def __str__(self):
        return f"{self.user.username}的设置" 