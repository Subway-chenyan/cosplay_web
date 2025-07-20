from django.db import migrations

def update_tag_categories(apps, schema_editor):
    """
    将游戏IP和动漫IP标签更新为IP分类，删除类型分类的标签
    """
    Tag = apps.get_model('tags', 'Tag')
    
    # 更新游戏IP和动漫IP标签为IP分类
    Tag.objects.filter(category__in=['游戏IP', '动漫IP']).update(category='IP')
    
    # 删除类型分类的标签
    Tag.objects.filter(category='类型').delete()

def reverse_update_tag_categories(apps, schema_editor):
    """
    反向操作：将IP标签恢复为原来的分类（这里简化为游戏IP）
    """
    Tag = apps.get_model('tags', 'Tag')
    
    # 将IP标签恢复为游戏IP（简化处理）
    Tag.objects.filter(category='IP').update(category='游戏IP')

class Migration(migrations.Migration):

    dependencies = [
        ('tags', '0003_alter_tag_category'),
    ]

    operations = [
        migrations.RunPython(update_tag_categories, reverse_update_tag_categories),
    ] 