from django.core.management.base import BaseCommand
from apps.groups.cache_utils import GroupCacheManager


class Command(BaseCommand):
    help = '清除社团相关缓存'

    def add_arguments(self, parser):
        parser.add_argument(
            '--type',
            type=str,
            default='all',
            choices=['all', 'province', 'city', 'list'],
            help='指定要清除的缓存类型 (默认: all)',
        )
        parser.add_argument(
            '--province',
            type=str,
            help='清除指定省份的城市统计缓存',
        )

    def handle(self, *args, **options):
        cache_type = options['type']
        province = options.get('province')
        
        self.stdout.write(f'开始清除缓存 (类型: {cache_type})...')
        
        try:
            if cache_type == 'all':
                success = GroupCacheManager.clear_all_group_cache()
                message = '已清除所有社团相关缓存'
            elif cache_type == 'province':
                success = GroupCacheManager.clear_province_cache()
                message = '已清除省份统计缓存'
            elif cache_type == 'city':
                success = GroupCacheManager.clear_city_cache(province)
                message = f'已清除城市统计缓存 (省份: {province or "全部"})'
            elif cache_type == 'list':
                success = GroupCacheManager.clear_group_list_cache()
                message = '已清除社团列表缓存'
            
            if success:
                self.stdout.write(self.style.SUCCESS(message))
                
                # 显示剩余缓存信息
                cache_info = GroupCacheManager.get_cache_info()
                self.stdout.write('\n当前缓存信息:')
                for key, value in cache_info.items():
                    self.stdout.write(f'  {key}: {value}')
            else:
                self.stdout.write(self.style.ERROR('清除缓存失败'))
                
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'清除缓存时发生错误: {str(e)}'))