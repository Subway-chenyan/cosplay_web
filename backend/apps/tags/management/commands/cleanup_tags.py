from django.core.management.base import BaseCommand
from apps.tags.models import Tag

class Command(BaseCommand):
    help = '清理年份和地区标签，因为这些现在是视频的基础属性'

    def handle(self, *args, **options):
        self.stdout.write("开始清理标签数据...")
        
        # 删除年份标签
        year_tags = Tag.objects.filter(category='年份')
        year_count = year_tags.count()
        if year_count > 0:
            self.stdout.write(f"删除 {year_count} 个年份标签...")
            year_tags.delete()
        
        # 删除地区标签
        region_tags = Tag.objects.filter(category='地区')
        region_count = region_tags.count()
        if region_count > 0:
            self.stdout.write(f"删除 {region_count} 个地区标签...")
            region_tags.delete()
        
        self.stdout.write(self.style.SUCCESS("标签清理完成！"))
        
        # 显示剩余标签统计
        remaining_tags = Tag.objects.all()
        self.stdout.write("\n剩余标签统计:")
        for category in ['IP', '风格', '其他']:
            count = remaining_tags.filter(category=category).count()
            self.stdout.write(f"  {category}: {count} 个")
        
        self.stdout.write(f"\n总计剩余标签: {remaining_tags.count()} 个")