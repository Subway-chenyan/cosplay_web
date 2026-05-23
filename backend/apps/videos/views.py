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
import re
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
import requests

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
@permission_classes([permissions.IsAuthenticated])
def download_template(request):
    """下载导入模板"""
    try:
        # 检查用户权限
        if not request.user.can_import_data():
            return Response({
                'error': '权限不足，需要编辑及以上权限'
            }, status=status.HTTP_403_FORBIDDEN)

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
@permission_classes([permissions.IsAuthenticated])
def start_import(request):
    """开始数据导入"""
    try:
        # 检查用户权限
        if not request.user.can_import_data():
            return Response({
                'error': '权限不足，需要编辑及以上权限'
            }, status=status.HTTP_403_FORBIDDEN)
        
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
@permission_classes([permissions.IsAuthenticated])
def get_import_status(request, task_id):
    """获取导入任务状态"""
    try:
        # 检查用户权限
        if not request.user.can_import_data():
            return Response({
                'error': '权限不足，需要编辑及以上权限'
            }, status=status.HTTP_403_FORBIDDEN)
        
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

logger = logging.getLogger(__name__)


def _is_cj_guoman_gold_overlap_query(query):
    normalized = re.sub(r'\s+', '', query).lower()
    has_overlap_intent = any(token in normalized for token in ('\u540c\u65f6', '\u5171\u540c', '\u90fd\u83b7\u5f97', '\u90fd\u62ff\u8fc7'))
    has_cj = 'cj' in normalized or 'chinajoy' in normalized
    has_guoman = '\u56fd\u6f2b' in normalized or '\u4e2d\u56fd\u56fd\u9645\u52a8\u6f2b\u8282' in normalized
    has_gold = '\u91d1\u5956' in normalized
    wants_entities = any(token in normalized for token in ('\u793e\u56e2', '\u56e2\u961f', '\u89c6\u9891', '\u5217\u51fa'))
    return has_overlap_intent and has_cj and has_guoman and has_gold and wants_entities


def _build_cj_guoman_gold_overlap_response():
    from django.db.models import Q
    from apps.awards.models import AwardRecord
    from apps.awards.serializers import AwardRecordSerializer

    cj_name = 'ChinaJoy'
    guoman_name = '\u4e2d\u56fd\u56fd\u9645\u52a8\u6f2b\u8282'
    gold = '\u91d1\u5956'

    cj_group_ids = set(
        AwardRecord.objects.filter(
            award__competition__name__icontains=cj_name,
            award__name__contains=gold,
            group__isnull=False,
        ).values_list('group_id', flat=True)
    )
    guoman_group_ids = set(
        AwardRecord.objects.filter(
            award__competition__name__icontains=guoman_name,
            award__name__contains=gold,
            group__isnull=False,
        ).values_list('group_id', flat=True)
    )
    group_ids = cj_group_ids & guoman_group_ids

    groups = list(Group.objects.filter(id__in=group_ids).order_by('name'))
    records = list(
        AwardRecord.objects.filter(group_id__in=group_ids, award__name__contains=gold)
        .filter(Q(award__competition__name__icontains=cj_name) | Q(award__competition__name__icontains=guoman_name))
        .select_related('award__competition', 'group', 'video', 'competition_year')
        .order_by('group__name', 'award__competition__name', '-competition_year__year', 'award__name')
    )
    videos = list(
        Video.objects.filter(id__in=[record.video_id for record in records if record.video_id])
        .prefetch_related('tags')
        .select_related('group', 'competition')
    )

    groups_by_id = {item['id']: item for item in GroupSerializer(groups, many=True).data}
    videos_by_id = {item['id']: item for item in VideoListSerializer(videos, many=True).data}
    award_records = AwardRecordSerializer(records, many=True).data

    data = []
    for group in groups:
        group_id = str(group.id)
        group_records = [record for record in award_records if str(record.get('group')) == group_id]
        group_videos = []
        seen_video_ids = set()
        for record in group_records:
            video_id = str(record.get('video') or '')
            if video_id and video_id in videos_by_id and video_id not in seen_video_ids:
                seen_video_ids.add(video_id)
                group_videos.append(videos_by_id[video_id])
        data.append({
            'group': groups_by_id[group_id],
            'award_records': group_records,
            'videos': group_videos,
        })

    title = '\u540c\u65f6\u83b7\u5f97 CJ \u548c\u56fd\u6f2b\u91d1\u5956\u7684\u793e\u56e2'
    summary = (
        f'\u627e\u5230 {len(data)} \u4e2a\u540c\u65f6\u83b7\u5f97 ChinaJoy Cosplay\u8d85\u7ea7\u8054\u8d5b'
        f'\uff08CJ\uff09\u91d1\u5956\u548c\u4e2d\u56fd\u56fd\u9645\u52a8\u6f2b\u8282COSPLAY\u8d85\u7ea7\u76db\u5178'
        f'\uff08\u56fd\u6f2b\uff09\u91d1\u5956\u7684\u793e\u56e2\uff0c\u5171 {len(videos_by_id)} '
        f'\u4e2a\u5df2\u7ed1\u5b9a\u89c6\u9891\u3001{len(award_records)} \u6761\u83b7\u5956\u8bb0\u5f55\u3002'
    )
    return {
        'natural_language_overview': summary,
        'ui_type': 'group_detail',
        'title': title,
        'summary': summary,
        'text': summary,
        'video_id_list': list(videos_by_id.keys()),
        'group_id_list': [str(group.id) for group in groups],
        'award_record_id_list': [str(record.id) for record in records],
        'data': data,
        'sections': [],
    }


def _merge_output_ids(llm_output, video_ids=None, group_ids=None, award_record_ids=None):
    output = dict(llm_output or {})
    for key, values in (
        ('video_id_list', video_ids or []),
        ('group_id_list', group_ids or []),
        ('award_record_id_list', award_record_ids or []),
    ):
        merged = []
        seen = set()
        for value in list(output.get(key) or []) + list(values or []):
            string_value = str(value)
            if string_value and string_value not in seen:
                seen.add(string_value)
                merged.append(string_value)
        output[key] = merged
    return output


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
        if self.action in ['create', 'update', 'partial_update', 'destroy', 'link_event', 'unlink_event']:
            permission_classes = [permissions.IsAuthenticated]
        else:
            permission_classes = [permissions.AllowAny]
        return [permission() for permission in permission_classes]

    def ensure_can_manage_video(self, video):
        """确认当前用户可以管理该视频。"""
        if self.request.user.can_manage_data():
            return
        if not video.group or not self.request.user.can_manage_group(video.group):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('只能管理自己管理社团的视频')
    
    def perform_create(self, serializer):
        group = serializer.validated_data.get('group')
        if not self.request.user.can_manage_data():
            if not group or not self.request.user.can_manage_group(group):
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied('只能为自己管理的社团上传视频')
        serializer.save(uploaded_by=self.request.user)

    def perform_update(self, serializer):
        instance = self.get_object()
        target_group = serializer.validated_data.get('group', instance.group)
        if not self.request.user.can_manage_data():
            if not instance.group or not self.request.user.can_manage_group(instance.group):
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied('只能编辑自己管理社团的视频')
            if target_group and not self.request.user.can_manage_group(target_group):
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied('不能把视频转移到未管理的社团')
        serializer.save()

    def perform_destroy(self, instance):
        if not self.request.user.can_manage_data():
            if not instance.group or not self.request.user.can_manage_group(instance.group):
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied('只能删除自己管理社团的视频')
        instance.delete()

    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated], url_path='bilibili-metadata')
    def bilibili_metadata(self, request):
        """根据 B 站链接获取视频基础信息。"""
        url = (request.data.get('url') or '').strip()
        bv_match = re.search(r'(BV[0-9A-Za-z]+)', url)
        if not bv_match:
            return Response({'error': '请提供有效的 B 站视频链接'}, status=status.HTTP_400_BAD_REQUEST)

        bvid = bv_match.group(1)
        api_url = 'https://api.bilibili.com/x/web-interface/view'
        try:
            resp = requests.get(
                api_url,
                params={'bvid': bvid},
                headers={
                    'User-Agent': 'Mozilla/5.0',
                    'Referer': f'https://www.bilibili.com/video/{bvid}/',
                },
                timeout=10,
            )
            resp.raise_for_status()
            payload = resp.json()
        except Exception as exc:
            return Response({'error': f'获取 B 站视频信息失败: {exc}'}, status=status.HTTP_502_BAD_GATEWAY)

        if payload.get('code') != 0 or not payload.get('data'):
            return Response({'error': payload.get('message') or '未找到该 B 站视频'}, status=status.HTTP_400_BAD_REQUEST)

        data = payload['data']
        pubdate = data.get('pubdate')
        year = None
        if pubdate:
            year = datetime.fromtimestamp(pubdate).year

        return Response({
            'bv_number': bvid,
            'title': data.get('title') or '',
            'description': data.get('desc') or '',
            'thumbnail': data.get('pic') or '',
            'url': f'https://www.bilibili.com/video/{bvid}/',
            'year': year,
        })

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def link_event(self, request, pk=None):
        """关联赛事到视频"""
        video = self.get_object()
        self.ensure_can_manage_video(video)
        event_id = request.data.get('event_id')

        if not event_id:
            return Response({'error': '需要提供event_id'}, status=status.HTTP_400_BAD_REQUEST)

        from apps.competitions.models import Event
        try:
            event = Event.objects.get(pk=event_id)
        except Event.DoesNotExist:
            return Response({'error': '赛事不存在'}, status=status.HTTP_404_NOT_FOUND)

        event.videos.add(video)
        video.refresh_from_db()
        serializer = self.get_serializer(video)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def unlink_event(self, request, pk=None):
        """取消关联赛事"""
        video = self.get_object()
        self.ensure_can_manage_video(video)
        event_id = request.data.get('event_id')

        if not event_id:
            return Response({'error': '需要提供event_id'}, status=status.HTTP_400_BAD_REQUEST)

        from apps.competitions.models import Event
        try:
            event = Event.objects.get(pk=event_id)
        except Event.DoesNotExist:
            return Response({'error': '赛事不存在'}, status=status.HTTP_404_NOT_FOUND)

        event.videos.remove(video)
        video.refresh_from_db()
        serializer = self.get_serializer(video)
        return Response(serializer.data)
    
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
        if not request.user.can_import_data():
            return Response({
                'error': '权限不足，需要编辑及以上权限'
            }, status=status.HTTP_403_FORBIDDEN)

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
        if not request.user.can_import_data():
            return Response({
                'error': '权限不足，需要编辑及以上权限'
            }, status=status.HTTP_403_FORBIDDEN)

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
        """Agent智能搜索 — 使用 text2sql agent 查询，返回结构化结果。"""
        search_query = request.data.get('query', '').strip()
        if not search_query:
            return Response({'error': '搜索查询不能为空'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            from apps.text2sql.agent import invoke_agent
            from apps.text2sql.prompts import SYSTEM_PROMPT
            from apps.text2sql.hydration import build_data_array
        except ImportError as e:
            logger.error("text2sql module not available: %s", e)
            return Response({'error': 'SQL Agent服务暂不可用'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        logger.info("agent_search start query_len=%d query=%r", len(search_query), search_query[:200])
        try:
            agent_text, sql_result, llm_output = invoke_agent(search_query)

            if not agent_text:
                return Response({'error': 'AI 未返回有效回答'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

            ui_type = llm_output.get('ui_type') or 'mixed_text'
            answer = llm_output.get('natural_language_overview') or agent_text.strip()
            title = llm_output.get('title') or answer[:50].replace('\n', ' ')

            # Backwards-compatible response format
            sql_rows = sql_result.rows
            video_ids = []
            group_ids = []
            award_record_ids = llm_output.get('award_record_id_list', [])
            data = []

            if sql_rows:
                hydrated = build_data_array(sql_rows, ui_type, answer, explicit_ids=llm_output)
                video_ids = hydrated['video_id_list']
                group_ids = hydrated['group_id_list']
                data = hydrated['data']
            else:
                video_ids = llm_output.get('video_id_list', [])
                group_ids = llm_output.get('group_id_list', [])

            if _is_cj_guoman_gold_overlap_query(search_query):
                fallback = _build_cj_guoman_gold_overlap_response()
                fallback_output = dict(llm_output)
                fallback_output['ui_type'] = fallback['ui_type']
                fallback_output['title'] = fallback['title']
                fallback_output['natural_language_overview'] = fallback['natural_language_overview']
                fallback_output['video_id_list'] = fallback.get('video_id_list', [])
                fallback_output['group_id_list'] = fallback.get('group_id_list', [])
                fallback_output['award_record_id_list'] = fallback.get('award_record_id_list', [])
                fallback['llm_output'] = fallback_output
                fallback['generated_sql'] = sql_result.sql
                logger.info(
                    "agent_search fallback=cj_guoman_gold_overlap videos=%d groups=%d",
                    len(fallback['video_id_list']),
                    len(fallback['group_id_list']),
                )
                return Response(fallback)

            llm_output = _merge_output_ids(llm_output, video_ids, group_ids, award_record_ids)
            logger.info("agent_search ok ui_type=%s videos=%d groups=%d", ui_type, len(video_ids), len(group_ids))

            return Response({
                'natural_language_overview': answer,
                'ui_type': ui_type,
                'title': title,
                'summary': answer,
                'text': answer,
                'video_id_list': video_ids,
                'group_id_list': group_ids,
                'award_record_id_list': award_record_ids,
                'data': data,
                'sections': [],
                'llm_output': llm_output,
                'generated_sql': sql_result.sql,
            })
        except Exception as e:
            logger.exception("agent_search failed: %s", e)
            return Response({'error': f'Agent搜索失败: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
