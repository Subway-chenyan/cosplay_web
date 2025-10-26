from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.core.cache import cache
from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from django.db.models import Q
import pandas as pd
import io

import json
import os
import tempfile
import uuid
from datetime import datetime, timedelta
from django.utils import timezone
from django.conf import settings
from django.http import JsonResponse, HttpResponse, FileResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.core.files.storage import default_storage
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
import threading
import pandas as pd

# 导入upload_data模块
import sys
sys.path.append(os.path.join(settings.BASE_DIR, 'upload_data'))
from import_data import DataImporter
from generate_template import generate_template

# 全局任务状态存储
IMPORT_TASKS = {}

class ImportTaskStatus:
    def __init__(self, task_id, import_type):
        self.task_id = task_id
        self.import_type = import_type
        self.status = 'pending'  # pending, processing, success, failed
        self.total_records = 0
        self.success_count = 0
        self.error_count = 0
        self.errors = []
        self.warnings = []
        self.created_at = datetime.now()
        self.updated_at = datetime.now()

def load_upload_config():
    """加载上传配置"""
    config_path = os.path.join(settings.BASE_DIR, 'upload_data', 'config.json')
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except:
        return {
            "upload_key": "cosplay_upload_key_2024",
            "max_file_size": 52428800,
            "allowed_extensions": [".xlsx", ".xls", ".csv"]
        }

def verify_upload_key(request):
    """验证上传密钥"""
    config = load_upload_config()
    upload_key = request.headers.get('X-Upload-Key') or request.POST.get('upload_key')
    return upload_key == config.get('upload_key')

@api_view(['POST'])
@permission_classes([AllowAny])
def verify_upload_key_api(request):
    """验证上传密钥API"""
    try:
        upload_key = request.data.get('upload_key')
        config = load_upload_config()
        
        if upload_key == config.get('upload_key'):
            return Response({
                'valid': True,
                'message': '密钥验证成功'
            })
        else:
            return Response({
                'valid': False,
                'message': '密钥无效'
            }, status=status.HTTP_401_UNAUTHORIZED)
            
    except Exception as e:
        return Response({
            'valid': False,
            'message': f'验证失败: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def download_template(request):
    """下载导入模板"""
    try:
        # 验证密钥
        if not verify_upload_key(request):
            return Response({
                'error': '无效的上传密钥'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        import_type = request.GET.get('type', 'video')
        
        # 生成模板文件
        upload_data_path = os.path.join(settings.BASE_DIR, 'upload_data')
        original_cwd = os.getcwd()
        
        try:
            os.chdir(upload_data_path)
            template_path = generate_template()
            full_template_path = os.path.join(upload_data_path, template_path)
            
            if os.path.exists(full_template_path):
                response = FileResponse(
                    open(full_template_path, 'rb'),
                    as_attachment=True,
                    filename=f'{import_type}_import_template.xlsx'
                )
                return response
            else:
                return Response({
                    'error': '模板文件生成失败'
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        finally:
            os.chdir(original_cwd)
            
    except Exception as e:
        return Response({
            'error': f'下载模板失败: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def run_import_task(task_id, file_path, import_type, validate_only=False):
    """在后台运行导入任务"""
    task = IMPORT_TASKS[task_id]
    
    try:
        task.status = 'processing'
        task.updated_at = datetime.now()
        
        # 创建数据导入器
        importer = DataImporter()
        
        # 读取文件获取总记录数
        try:
            df = pd.read_excel(file_path)
            task.total_records = len(df)
        except:
            task.total_records = 0
        
        if validate_only:
            # 仅验证模式
            task.status = 'success'
            task.success_count = task.total_records
            task.warnings.append({
                'message': '仅验证模式，未实际导入数据'
            })
        else:
            # 实际导入
            importer.import_from_excel(file_path)
            
            task.success_count = importer.success_count
            task.error_count = importer.error_count
            
            # 格式化错误信息
            for i, error in enumerate(importer.errors):
                parts = error.split(': ', 1)
                if len(parts) == 2:
                    row_part = parts[0]
                    message = parts[1]
                    row_num = row_part.replace('第', '').replace('行', '') if '第' in row_part else None
                    task.errors.append({
                        'row': int(row_num) if row_num and row_num.isdigit() else None,
                        'message': message
                    })
                else:
                    task.errors.append({
                        'message': error
                    })
            
            task.status = 'success' if task.error_count == 0 else 'failed'
        
    except Exception as e:
        task.status = 'failed'
        task.errors.append({
            'message': f'导入过程中发生错误: {str(e)}'
        })
    
    finally:
        task.updated_at = datetime.now()
        # 清理临时文件
        try:
            os.remove(file_path)
        except:
            pass

@api_view(['POST'])
@permission_classes([AllowAny])
def start_import(request):
    """开始数据导入"""
    try:
        # 验证密钥
        if not verify_upload_key(request):
            return Response({
                'error': '无效的上传密钥'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        # 获取参数
        import_type = request.data.get('import_type', 'video')
        validate_only_str = request.data.get('validate_only', 'false')
        # 正确处理字符串到布尔值的转换
        validate_only = validate_only_str in ['true', 'True', '1', True]
        file = request.FILES.get('file')
        
        if not file:
            return Response({
                'error': '请选择要上传的文件'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 验证文件类型
        config = load_upload_config()
        file_ext = os.path.splitext(file.name)[1].lower()
        if file_ext not in config.get('allowed_extensions', ['.xlsx', '.xls', '.csv']):
            return Response({
                'error': f'不支持的文件格式: {file_ext}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 验证文件大小
        if file.size > config.get('max_file_size', 52428800):
            return Response({
                'error': '文件大小超过限制'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 创建任务
        task_id = str(uuid.uuid4())
        task = ImportTaskStatus(task_id, import_type)
        IMPORT_TASKS[task_id] = task
        
        # 保存临时文件
        temp_dir = tempfile.gettempdir()
        temp_filename = f"{task_id}_{file.name}"
        temp_path = os.path.join(temp_dir, temp_filename)
        
        with open(temp_path, 'wb') as temp_file:
            for chunk in file.chunks():
                temp_file.write(chunk)
        
        # 启动后台任务
        thread = threading.Thread(
            target=run_import_task,
            args=(task_id, temp_path, import_type, validate_only)
        )
        thread.daemon = True
        thread.start()
        
        return Response({
            'task_id': task_id,
            'message': '导入任务已启动'
        })
        
    except Exception as e:
        return Response({
            'error': f'启动导入失败: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_import_status(request, task_id):
    """获取导入任务状态"""
    try:
        # 验证密钥
        if not verify_upload_key(request):
            return Response({
                'error': '无效的上传密钥'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        task = IMPORT_TASKS.get(task_id)
        if not task:
            return Response({
                'error': '任务不存在'
            }, status=status.HTTP_404_NOT_FOUND)
        
        return Response({
            'task_id': task.task_id,
            'import_type': task.import_type,
            'status': task.status,
            'total_records': task.total_records,
            'success_count': task.success_count,
            'error_count': task.error_count,
            'errors': task.errors,
            'warnings': task.warnings,
            'created_at': task.created_at.isoformat(),
            'updated_at': task.updated_at.isoformat()
        })
        
    except Exception as e:
        return Response({
            'error': f'获取状态失败: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

from .models import Video
from .serializers import (
    VideoSerializer, VideoListSerializer,  BulkImportSerializer,
    ImportResultSerializer
)
from .filters import VideoFilter
from .bulk_import import process_bulk_import, get_import_template
from .pagination import OptimizedVideoPagination, LargeResultsSetPagination
from apps.groups.models import Group
from apps.groups.serializers import GroupSerializer
import logging

# 导入SQL Agent相关模块
import sys
import os
sys.path.append(os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'apps', 'text2sql'))
try:
    from sql_agent_cached import SQLAgent
except ImportError:
    SQLAgent = None
logger = logging.getLogger(__name__)


class VideoViewSet(viewsets.ModelViewSet):
    """
    视频视图集
    """
    queryset = Video.objects.all()
    serializer_class = VideoSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = VideoFilter
    search_fields = ['title', 'description', 'bv_number']
    ordering_fields = ['created_at', 'year', 'play_count', 'like_count']
    ordering = ['-created_at']
    pagination_class = OptimizedVideoPagination
    
    def get_serializer_class(self):
        if self.action == 'list':
            return VideoListSerializer
        return VideoSerializer
    
    def get_permissions(self):
        """
        根据动作获取权限
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)
    
    @action(
        detail=False,
        methods=['post'],
        parser_classes=[MultiPartParser, FormParser],
        permission_classes=[permissions.IsAuthenticated],
        url_path='bulk-import'
    )
    def bulk_import(self, request):
        """
        批量导入数据
        """
        serializer = BulkImportSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        file = serializer.validated_data['file']
        import_type = serializer.validated_data['import_type']
        validate_only = serializer.validated_data['validate_only']
        
        try:
            # 读取文件内容
            file_content = file.read()
            
            # 启动异步任务
            task = process_bulk_import.delay(
                file_content=file_content,
                filename=file.name,
                import_type=import_type,
                user_id=request.user.id,
                validate_only=validate_only
            )
            
            return Response({
                'task_id': task.id,
                'message': '导入任务已启动，请稍后查看结果',
                'status': 'pending'
            }, status=status.HTTP_202_ACCEPTED)
            
        except Exception as e:
            return Response({
                'error': f'文件处理失败: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(
        detail=False,
        methods=['get'],
        permission_classes=[permissions.IsAuthenticated],
        url_path='import-status/(?P<task_id>[^/.]+)'
    )
    def import_status(self, request, task_id=None):
        """
        查询导入任务状态
        """

    @action(
        detail=False,
        methods=['get'],
        permission_classes=[permissions.AllowAny],
        url_path='stats'
    )
    def stats(self, request):
        now = timezone.now()
        week_ago = now - timedelta(days=7)
        weekly_new = self.queryset.filter(created_at__gte=week_ago).count()
        total_count = self.queryset.count()
        return Response({
            'total_videos': total_count,
            'weekly_new_videos': weekly_new
        })
    @action(
        detail=False,
        methods=['get'],
        permission_classes=[permissions.AllowAny],
        url_path='competition/(?P<competition_id>[^/.]+)/stats'
    )
    def competition_stats(self, request, competition_id=None):
        """
        获取比赛视频的统计信息，包括年份分布和总数
        """
        try:
            videos = self.queryset.filter(competition_id=competition_id)
            
            # 年份统计
            year_stats = videos.values('year').annotate(
                count=models.Count('id')
            ).order_by('year')
            
            # 总视频数
            total_count = videos.count()
            
            # 奖项统计
            award_stats = videos.values('award__name').annotate(
                count=models.Count('id')
            ).order_by('-count')
            
            return Response({
                'total_videos': total_count,
                'year_distribution': list(year_stats),
                'award_distribution': list(award_stats),
                'competition_id': competition_id
            })
            
        except Exception as e:
            return Response({
                'error': f'获取统计信息失败: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)

    @action(
        detail=False,
        methods=['get'],
        permission_classes=[permissions.AllowAny],
        url_path='competition/(?P<competition_id>[^/.]+)/optimized'
    )
    def competition_optimized(self, request, competition_id=None):
        """
        优化的比赛视频列表API，支持高效筛选和分页
        """
        try:
            # 使用LargeResultsSetPagination处理大量数据
            self.pagination_class = LargeResultsSetPagination
            
            # 获取基础查询集
            queryset = self.queryset.filter(competition_id=competition_id)
            
            # 应用筛选
            year = request.query_params.get('year')
            if year:
                queryset = queryset.filter(year=year)
                
            award = request.query_params.get('award')
            if award:
                queryset = queryset.filter(award__name=award)
            
            # 应用排序
            ordering = request.query_params.get('ordering', '-created_at')
            if ordering in ['year', '-year', 'play_count', '-play_count', 'like_count', '-like_count']:
                queryset = queryset.order_by(ordering)
            
            # 分页和序列化
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                return self.get_paginated_response(serializer.data)
            
            serializer = self.get_serializer(queryset, many=True)
            return Response(serializer.data)
            
        except Exception as e:
            return Response({
                'error': f'获取视频列表失败: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        cache_key = f"import_task_{task_id}"
        task_data = cache.get(cache_key)
        
        if not task_data:
            return Response({
                'error': '任务不存在或已过期'
            }, status=status.HTTP_404_NOT_FOUND)
        
        return Response(task_data)
    
    @action(
        detail=False,
        methods=['get'],
        permission_classes=[permissions.IsAuthenticated],
        url_path='import-template'
    )
    def import_template(self, request):
        """
        下载导入模板
        """
        import_type = request.query_params.get('type', 'video')
        template_info = get_import_template(import_type)
        
        if not template_info:
            return Response({
                'error': '不支持的模板类型'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 创建Excel模板
        df = pd.DataFrame(template_info['sample_data'])
        
        # 设置响应
        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        response['Content-Disposition'] = f'attachment; filename="{import_type}_import_template.xlsx"'
        
        # 写入Excel数据
        with pd.ExcelWriter(response, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='数据')
            
            # 添加说明sheet
            instructions_df = pd.DataFrame([
                ['字段名', '说明', '是否必填', '示例'],
                ['bv_number', 'B站视频BV号', '是', 'BV1234567890'],
                ['title', '视频标题', '是', '精彩的cosplay表演'],
                ['description', '视频描述', '否', '详细的视频描述信息'],
                ['url', '视频链接', '是', 'https://www.bilibili.com/video/BV1234567890'],
                ['thumbnail', '缩略图链接', '否', 'https://example.com/thumb.jpg'],
            ])
            instructions_df.to_excel(writer, index=False, sheet_name='字段说明', header=False)
        
        return response
    
    @action(
        detail=False,
        methods=['get'],
        permission_classes=[permissions.AllowAny],
        url_path='search-groups'
    )
    def search_groups(self, request):
        """
        搜索社团（用于视频创建时选择社团）
        """
        search_query = request.query_params.get('search', '').strip()
        page_size = min(int(request.query_params.get('page_size', 20)), 50)  # 限制最大返回数量
        
        # 构建查询条件
        queryset = Group.objects.filter(is_active=True)
        
        if search_query:
            # 支持按社团名称、省份、城市、地区搜索
            queryset = queryset.filter(
                Q(name__icontains=search_query) |
                Q(province__icontains=search_query) |
                Q(city__icontains=search_query) |
                Q(location__icontains=search_query)
            )
        
        # 按名称排序，限制返回数量
        groups = queryset.order_by('name')[:page_size]
        
        # 序列化数据，只返回必要字段
        groups_data = []
        for group in groups:
            groups_data.append({
                'id': group.id,
                'name': group.name,
                'location': group.location or f"{group.province or ''}{group.city or ''}".strip(),
                'province': group.province,
                'city': group.city,
                'video_count': group.video_count,
                'is_active': group.is_active
            })
        
        return Response({
            'results': groups_data,
            'count': len(groups_data),
            'search_query': search_query
        })

    @action(
        detail=False,
        methods=['post'],
        permission_classes=[permissions.AllowAny],
        url_path='agent-search'
    )
    def agent_search(self, request):
        """
        Agent智能搜索 - 使用SQL Agent进行智能查询，返回结构化结果
        """
        search_query = request.data.get('query', '').strip()
        if not search_query:
            return Response({'error': '搜索查询不能为空'}, status=status.HTTP_400_BAD_REQUEST)

        # 检查SQL Agent是否可用
        if SQLAgent is None:
            return Response({'error': 'SQL Agent服务暂不可用'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        logger.info("agent_search query=%s", search_query)
        try:
            # 初始化并调用SQL Agent，确保返回结构与AgentOutput一致
            agent = SQLAgent()
            structured = agent.invoke(search_query)

            # 兼容BaseModel或dict两种返回形态
            payload = structured.dict() if hasattr(structured, 'dict') else dict(structured)

            # 只返回与AgentOutput一致的字段
            return Response({
                'natural_language_overview': payload.get('natural_language_overview', ''),
                'video_id_list': payload.get('video_id_list', []),
                'group_id_list': payload.get('group_id_list', []),
            })
        except Exception as e:
            logger.exception("agent_search failed: %s", e)
            error_msg = f"Agent搜索失败: {str(e)}"
            return Response({'error': error_msg}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    