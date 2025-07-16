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

from .models import Video
from .serializers import (
    VideoSerializer, VideoListSerializer,  BulkImportSerializer,
    ImportResultSerializer
)
from .filters import VideoFilter
from .bulk_import import process_bulk_import, get_import_template


class VideoViewSet(viewsets.ModelViewSet):
    """
    视频视图集
    """
    queryset = Video.objects.filter(status='published')
    serializer_class = VideoSerializer
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_class = VideoFilter
    search_fields = ['title', 'description', 'bv_number']
    ordering_fields = ['created_at', 'view_count', 'like_count', 'performance_date']
    ordering = ['-created_at']
    
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
                ['view_count', '播放量', '否', '1000'],
                ['like_count', '点赞数', '否', '100'],
                ['performance_date', '表演日期', '否', '2024-01-01']
            ])
            instructions_df.to_excel(writer, index=False, sheet_name='字段说明', header=False)
        
        return response
    