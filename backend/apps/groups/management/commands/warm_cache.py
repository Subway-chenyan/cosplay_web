from django.core.management.base import BaseCommand
from apps.groups.cache_utils import GroupCacheManager


class Command(BaseCommand):
    help = '预热社团相关缓存'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear-first',
            action='store_true',
            help='预热前先清除现有缓存',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('开始预热社团缓存...'))
        
        try:
            if options['clear_first']:
                self.stdout.write('清除现有缓存...')
                GroupCacheManager.clear_all_group_cache()
                self.stdout.write(self.style.SUCCESS('缓存清除完成'))
            
            self.stdout.write('开始预热缓存...')
            success = GroupCacheManager.warm_up_cache()
            
            if success:
                self.stdout.write(self.style.SUCCESS('缓存预热完成！'))
                
                # 显示缓存信息
                cache_info = GroupCacheManager.get_cache_info()
                self.stdout.write('\n缓存信息:')
                for key, value in cache_info.items():
                    self.stdout.write(f'  {key}: {value}')
            else:
                self.stdout.write(self.style.ERROR('缓存预热失败'))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'预热缓存时发生错误: {str(e)}'))