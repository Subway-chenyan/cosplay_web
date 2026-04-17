from django.conf import settings
from django.db import models


class SocialAccountLink(models.Model):
    """
    第三方账号绑定关系。
    目前用于保存 QQ 互联返回的 openid 与本站用户的稳定映射。
    """

    PROVIDER_QQ = 'qq'

    PROVIDER_CHOICES = [
        (PROVIDER_QQ, 'QQ互联'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='social_account_links',
        verbose_name='用户',
    )
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES, verbose_name='提供方')
    openid = models.CharField(max_length=128, verbose_name='第三方OpenID')
    nickname = models.CharField(max_length=100, blank=True, verbose_name='第三方昵称')
    avatar_url = models.URLField(blank=True, verbose_name='第三方头像')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '第三方账号绑定'
        verbose_name_plural = '第三方账号绑定'
        unique_together = ('provider', 'openid')
        indexes = [
            models.Index(fields=['provider', 'openid']),
            models.Index(fields=['user', 'provider']),
        ]

    def __str__(self):
        return f'{self.get_provider_display()} - {self.user} - {self.openid}'
