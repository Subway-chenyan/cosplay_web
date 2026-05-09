from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('groups', '0005_alter_group_logo'),
        ('users', '0004_feedback'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='managed_groups',
            field=models.ManyToManyField(blank=True, related_name='managers', to='groups.group', verbose_name='管理的社团'),
        ),
        migrations.AddField(
            model_name='user',
            name='role_application_group',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='role_applicants', to='groups.group', verbose_name='申请管理的社团'),
        ),
        migrations.AddField(
            model_name='user',
            name='role_application_group_data',
            field=models.JSONField(blank=True, default=dict, verbose_name='申请创建的社团资料'),
        ),
    ]
