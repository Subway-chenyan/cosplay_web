import requests
import logging
from django.http import JsonResponse
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([AllowAny])
@cache_page(60 * 60 * 24)  # 缓存24小时
def china_geojson(request):
    """
    获取中国地图GeoJSON数据的代理API
    避免前端跨域问题
    """
    try:
        # 请求阿里云DataV的中国地图数据
        response = requests.get(
            'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json',
            timeout=10
        )
        
        if response.status_code == 200:
            logger.info('成功获取中国地图数据')
            return JsonResponse(response.json(), safe=False)
        else:
            logger.error(f'获取地图数据失败，状态码: {response.status_code}')
            return Response(
                {'error': '获取地图数据失败'}, 
                status=status.HTTP_502_BAD_GATEWAY
            )
            
    except requests.exceptions.Timeout:
        logger.error('请求地图数据超时')
        return Response(
            {'error': '请求超时'}, 
            status=status.HTTP_408_REQUEST_TIMEOUT
        )
    except requests.exceptions.RequestException as e:
        logger.error(f'请求地图数据异常: {str(e)}')
        return Response(
            {'error': '网络请求失败'}, 
            status=status.HTTP_502_BAD_GATEWAY
        )
    except Exception as e:
        logger.error(f'获取地图数据时发生未知错误: {str(e)}')
        return Response(
            {'error': '服务器内部错误'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
