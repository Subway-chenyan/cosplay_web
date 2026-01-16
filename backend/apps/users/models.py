from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """
    自定义用户模型
    支持管理员、编辑者、浏览用户和贡献者四种角色
    """
    ROLE_CHOICES = [
        ('admin', '管理员'),
        ('editor', '编辑'),
        ('viewer', '浏览用户'),
        ('contributor', '贡献者'),
    ]

    email = models.EmailField(unique=True, verbose_name='邮箱')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='viewer', verbose_name='角色')

    # 个人资料字段
    nickname = models.CharField(max_length=50, blank=True, verbose_name='昵称')
    bio = models.TextField(blank=True, verbose_name='个人简介')
    avatar = models.ImageField(
        upload_to='user_avatars/',
        blank=True,
        null=True,
        verbose_name='头像'
    )

    # 关联字段（多对多）
    groups = models.ManyToManyField(
        'groups.Group',
        blank=True,
        related_name='members',
        verbose_name='所属社团'
    )
    performed_videos = models.ManyToManyField(
        'videos.Video',
        blank=True,
        related_name='performers',
        verbose_name='参演视频'
    )

    # 权限申请相关字段
    role_application_pending = models.BooleanField(
        default=False,
        verbose_name='是否有待审核的权限申请'
    )
    role_application_reason = models.TextField(
        blank=True,
        verbose_name='申请理由'
    )
    role_application_date = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='申请时间'
    )

    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '用户'
        verbose_name_plural = '用户'
        ordering = ['-created_at']

    def __str__(self):
        return self.nickname or self.username

    def is_admin(self):
        return self.role == 'admin'

    def is_editor(self):
        return self.role in ['admin', 'editor']

    def is_contributor(self):
        return self.role in ['admin', 'editor', 'contributor']

    def can_edit(self):
        return self.is_editor()

    def can_contribute(self):
        return self.is_contributor()

    def can_import_data(self):
        """检查是否可以导入数据（贡献者及以上）"""
        return self.role in ['contributor', 'editor', 'admin']

    def can_manage_data(self):
        """检查是否可以管理数据（编辑及以上）"""
        return self.role in ['editor', 'admin']

    def can_approve_roles(self):
        """检查是否可以审批角色申请（仅管理员）"""
        return self.role == 'admin'


class Feedback(models.Model):
    """
    用户反馈模型
    用于收集站点建议、社团或奖项信息问题反馈
    """
    FEEDBACK_TYPE_CHOICES = [
        ('suggestion', '站点建议'),
        ('group_info', '社团信息问题'),
        ('award_info', '奖项信息问题'),
        ('other', '其他'),
    ]

    STATUS_CHOICES = [
        ('pending', '待处理'),
        ('processing', '处理中'),
        ('resolved', '已解决'),
        ('rejected', '已拒绝'),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='feedbacks',
        verbose_name='提交用户'
    )
    feedback_type = models.CharField(
        max_length=20,
        choices=FEEDBACK_TYPE_CHOICES,
        default='suggestion',
        verbose_name='反馈类型'
    )
    content = models.TextField(verbose_name='反馈内容')
    contact_info = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='联系方式'
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='处理状态'
    )
    admin_reply = models.TextField(
        blank=True,
        verbose_name='管理员回复'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='提交时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '用户反馈'
        verbose_name_plural = '用户反馈'
        ordering = ['-created_at']

    def __str__(self):
        user_display = self.user.nickname or self.user.username if self.user else '匿名用户'
        return f"{user_display} - {self.get_feedback_type_display()} - {self.created_at.strftime('%Y-%m-%d')}"