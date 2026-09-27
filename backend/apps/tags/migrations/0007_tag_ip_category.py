from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('tags', '0006_alter_tag_category')]
    operations = [
        migrations.AddField(
            model_name='tag',
            name='ip_category',
            field=models.CharField(
                blank=True,
                choices=[('国漫', '国漫'), ('日漫', '日漫'), ('游戏', '游戏'), ('影视', '影视'), ('其他', '其他')],
                default='',
                max_length=10,
                verbose_name='IP 分类',
            ),
        ),
    ]
