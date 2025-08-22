from django.core.management.base import BaseCommand
from django.core.cache import cache
from apps.groups.cache_utils import GroupCacheManager
import time
import json


class Command(BaseCommand):
    help = '监控社团缓存使用情况'

    def add_arguments(self, parser):
        parser.add_argument(
            '--interval',
            type=int,
            default=30,
            help='监控间隔时间（秒），默认30秒',
        )
        parser.add_argument(
            '--count',
            type=int,
            default=10,
            help='监控次数，默认10次',
        )
        parser.add_argument(
            '--json',
            action='store_true',
            help='以JSON格式输出',
        )

    def handle(self, *args, **options):
        interval = options['interval']
        count = options['count']
        json_output = options['json']
        
        if not json_output:
            self.stdout.write(self.style.SUCCESS(f'开始监控缓存，间隔{interval}秒，共{count}次'))
            self.stdout.write('=' * 60)
        
        for i in range(count):
            try:
                cache_info = GroupCacheManager.get_cache_info()
                timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
                
                if json_output:
                    output_data = {
                        'timestamp': timestamp,
                        'iteration': i + 1,
                        'cache_info': cache_info
                    }
                    self.stdout.write(json.dumps(output_data, ensure_ascii=False, indent=2))
                else:
                    self.stdout.write(f'\n[{timestamp}] 第 {i+1}/{count} 次监控:')
                    self.stdout.write(f'  缓存后端: {cache_info.get("cache_backend", "Unknown")}')
                    self.stdout.write(f'  缓存位置: {cache_info.get("cache_location", "Unknown")}')
                    
                    cached_keys = cache_info.get('cached_keys', [])
                    self.stdout.write(f'  缓存键数量: {len(cached_keys)}')
                    
                    if cached_keys:
                        self.stdout.write('  缓存键列表:')
                        for key in cached_keys:
                            # 尝试获取缓存值的大小信息
                            try:
                                value = cache.get(key)
                                if value:
                                    if isinstance(value, (list, dict)):
                                        size_info = f'({len(value)} items)'
                                    else:
                                        size_info = f'({type(value).__name__})'
                                else:
                                    size_info = '(empty)'
                            except:
                                size_info = '(error)'
                            
                            self.stdout.write(f'    - {key} {size_info}')
                    else:
                        self.stdout.write('  无缓存数据')
                
                if i < count - 1:  # 不是最后一次
                    if not json_output:
                        self.stdout.write(f'\n等待 {interval} 秒...')
                    time.sleep(interval)
                    
            except Exception as e:
                error_msg = f'监控过程中发生错误: {str(e)}'
                if json_output:
                    error_data = {
                        'timestamp': time.strftime('%Y-%m-%d %H:%M:%S'),
                        'iteration': i + 1,
                        'error': error_msg
                    }
                    self.stdout.write(json.dumps(error_data, ensure_ascii=False, indent=2))
                else:
                    self.stdout.write(self.style.ERROR(error_msg))
        
        if not json_output:
            self.stdout.write('\n' + '=' * 60)
            self.stdout.write(self.style.SUCCESS('缓存监控完成'))