from django.core.management.base import BaseCommand
from apps.tags.models import Tag

class Command(BaseCommand):
    help = '创建风格标签测试数据'

    def handle(self, *args, **options):
        self.stdout.write("开始创建风格标签...")
        
        # 风格标签数据
        style_tags = [
            {'name': '古风', 'color': '#8B4513', 'description': '古典风格cosplay'},
            {'name': '现代', 'color': '#4169E1', 'description': '现代风格cosplay'},
            {'name': '甜美', 'color': '#FF69B4', 'description': '甜美可爱风格'},
            {'name': '帅气', 'color': '#2F4F4F', 'description': '帅气酷炫风格'},
            {'name': '华丽', 'color': '#FFD700', 'description': '华丽精致风格'},
            {'name': '简约', 'color': '#708090', 'description': '简约清新风格'},
            {'name': '暗黑', 'color': '#000000', 'description': '暗黑哥特风格'},
            {'name': '梦幻', 'color': '#DA70D6', 'description': '梦幻仙气风格'},
        ]
        
        created_count = 0
        for tag_data in style_tags:
            tag, created = Tag.objects.get_or_create(
                name=tag_data['name'],
                category='风格',
                defaults={
                    'color': tag_data['color'],
                    'description': tag_data['description'],
                    'is_active': True,
                    'is_featured': True,
                }
            )
            if created:
                created_count += 1
                self.stdout.write(f"创建风格标签: {tag.name}")
            else:
                self.stdout.write(f"风格标签已存在: {tag.name}")
        
        self.stdout.write(self.style.SUCCESS(f"风格标签创建完成！新创建 {created_count} 个标签"))
        
        # 显示所有标签统计
        all_tags = Tag.objects.all()
        self.stdout.write("\n当前标签统计:")
        for category in ['IP', '风格', '其他']:
            count = all_tags.filter(category=category).count()
            self.stdout.write(f"  {category}: {count} 个")
        
        self.stdout.write(f"\n总计标签: {all_tags.count()} 个")