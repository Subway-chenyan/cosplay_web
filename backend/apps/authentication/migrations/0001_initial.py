from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='SocialAccountLink',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('provider', models.CharField(choices=[('qq', 'QQ互联')], max_length=20, verbose_name='提供方')),
                ('openid', models.CharField(max_length=128, verbose_name='第三方OpenID')),
                ('nickname', models.CharField(blank=True, max_length=100, verbose_name='第三方昵称')),
                ('avatar_url', models.URLField(blank=True, verbose_name='第三方头像')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='创建时间')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='更新时间')),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='social_account_links', to=settings.AUTH_USER_MODEL, verbose_name='用户')),
            ],
            options={
                'verbose_name': '第三方账号绑定',
                'verbose_name_plural': '第三方账号绑定',
                'unique_together': {('provider', 'openid')},
            },
        ),
        migrations.AddIndex(
            model_name='socialaccountlink',
            index=models.Index(fields=['provider', 'openid'], name='authenticat_provide_3936f1_idx'),
        ),
        migrations.AddIndex(
            model_name='socialaccountlink',
            index=models.Index(fields=['user', 'provider'], name='authenticat_user_id_a80627_idx'),
        ),
    ]
