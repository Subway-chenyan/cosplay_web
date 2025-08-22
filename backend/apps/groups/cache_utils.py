from django.core.cache import cache
from django.core.cache.utils import make_template_fragment_key
import logging

logger = logging.getLogger(__name__)

class GroupCacheManager:
    """
    社团相关缓存管理器
    """
    
    # 缓存键前缀
    PROVINCE_STATS_KEY = 'groups:province_stats'
    CITY_STATS_KEY = 'groups:city_stats'
    GROUP_LIST_KEY = 'groups:list'
    MAP_GEOJSON_KEY = 'map:china_geojson'
    
    @classmethod
    def clear_all_group_cache(cls):
        """
        清除所有社团相关缓存
        """
        try:
            # 清除省份统计缓存
            cache.delete_many([
                cls.PROVINCE_STATS_KEY,
                cls.CITY_STATS_KEY,
                cls.GROUP_LIST_KEY,
            ])
            
            # 清除所有以groups开头的缓存键
            cache_keys = cache.keys('*groups*')
            if cache_keys:
                cache.delete_many(cache_keys)
            
            logger.info('已清除所有社团相关缓存')
            return True
        except Exception as e:
            logger.error(f'清除缓存失败: {str(e)}')
            return False
    
    @classmethod
    def clear_province_cache(cls):
        """
        清除省份统计缓存
        """
        try:
            cache.delete(cls.PROVINCE_STATS_KEY)
            # 清除所有省份相关的缓存
            cache_keys = cache.keys('*by_province*')
            if cache_keys:
                cache.delete_many(cache_keys)
            logger.info('已清除省份统计缓存')
            return True
        except Exception as e:
            logger.error(f'清除省份缓存失败: {str(e)}')
            return False
    
    @classmethod
    def clear_city_cache(cls, province=None):
        """
        清除城市统计缓存
        """
        try:
            if province:
                # 清除特定省份的城市缓存
                cache_key = f'{cls.CITY_STATS_KEY}:{province}'
                cache.delete(cache_key)
            else:
                # 清除所有城市缓存
                cache.delete(cls.CITY_STATS_KEY)
                cache_keys = cache.keys('*by_city*')
                if cache_keys:
                    cache.delete_many(cache_keys)
            logger.info(f'已清除城市统计缓存 (省份: {province or "全部"})')
            return True
        except Exception as e:
            logger.error(f'清除城市缓存失败: {str(e)}')
            return False
    
    @classmethod
    def clear_group_list_cache(cls):
        """
        清除社团列表缓存
        """
        try:
            # 清除所有社团列表相关的缓存
            cache_keys = cache.keys('*groups*list*')
            if cache_keys:
                cache.delete_many(cache_keys)
            logger.info('已清除社团列表缓存')
            return True
        except Exception as e:
            logger.error(f'清除社团列表缓存失败: {str(e)}')
            return False
    
    @classmethod
    def warm_up_cache(cls):
        """
        预热缓存 - 预先加载常用数据
        """
        try:
            from django.db.models import Count
            from apps.groups.models import Group
            from django.core.cache import cache
            
            # 直接计算并缓存省份统计数据
            province_stats = Group.objects.filter(is_active=True).values('province').annotate(
                count=Count('id')
            ).order_by('-count')
            
            province_data = [{
                'province': item['province'],
                'count': item['count']
            } for item in province_stats]
            
            cache.set('groups_by_province', province_data, 60 * 15)  # 15分钟
            
            # 预热主要省份的城市统计缓存
            major_provinces = ['北京市', '上海市', '广东省', '浙江省', '江苏省', '山东省']
            for province in major_provinces:
                city_stats = Group.objects.filter(
                    is_active=True, 
                    province=province
                ).values('city').annotate(
                    count=Count('id')
                ).order_by('-count')
                
                city_data = [{
                    'city': item['city'],
                    'count': item['count']
                } for item in city_stats]
                
                cache_key = f'groups_by_city_{province}'
                cache.set(cache_key, city_data, 60 * 15)  # 15分钟
            
            # 预热社团列表缓存（前几页的数据）
            from django.core.paginator import Paginator
            from apps.groups.serializers import GroupSerializer
            
            groups = Group.objects.filter(is_active=True).order_by('-created_at')
            paginator = Paginator(groups, 100)  # 使用LargeResultsSetPagination的page_size
            
            for page_num in range(1, min(4, paginator.num_pages + 1)):
                page = paginator.page(page_num)
                serializer = GroupSerializer(page.object_list, many=True)
                
                cache_key = f'groups_list_page_{page_num}'
                cache_data = {
                    'results': serializer.data,
                    'count': paginator.count,
                    'next': page.has_next(),
                    'previous': page.has_previous()
                }
                cache.set(cache_key, cache_data, 60 * 10)  # 10分钟
            
            logger.info('缓存预热完成')
            return True
        except Exception as e:
            logger.error(f'缓存预热失败: {str(e)}')
            return False
    
    @classmethod
    def get_cache_info(cls):
        """
        获取缓存信息
        """
        try:
            info = {
                'cache_backend': cache.__class__.__name__,
                'cache_location': getattr(cache, '_cache', {}).get('_server', 'Unknown'),
                'cached_keys': []
            }
            
            # 尝试获取所有相关的缓存键
            try:
                group_keys = cache.keys('*groups*')
                map_keys = cache.keys('*map*')
                info['cached_keys'] = list(group_keys) + list(map_keys)
            except:
                info['cached_keys'] = ['无法获取缓存键列表']
            
            return info
        except Exception as e:
            logger.error(f'获取缓存信息失败: {str(e)}')
            return {'error': str(e)}