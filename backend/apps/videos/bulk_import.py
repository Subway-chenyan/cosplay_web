import pandas as pd
import uuid
import logging
from datetime import datetime
from django.core.cache import cache
from django.contrib.auth import get_user_model
from django.utils import timezone
from celery import shared_task
import chardet
import io

from .models import Video
from apps.groups.models import Group
from apps.tags.models import Tag
from apps.competitions.models import Competition

User = get_user_model()
logger = logging.getLogger(__name__)


class DataImportProcessor:
    """
    数据导入处理器
    """
    
    def __init__(self, task_id=None):
        self.task_id = task_id or str(uuid.uuid4())
        self.errors = []
        self.warnings = []
        self.success_count = 0
        self.error_count = 0
        
    def update_progress(self, status, **kwargs):
        """更新任务进度"""
        cache_key = f"import_task_{self.task_id}"
        progress_data = {
            'task_id': self.task_id,
            'status': status,
            'success_count': self.success_count,
            'error_count': self.error_count,
            'errors': self.errors,
            'warnings': self.warnings,
            'updated_at': timezone.now().isoformat(),
            **kwargs
        }
        cache.set(cache_key, progress_data, timeout=3600)  # 1小时过期
        return progress_data
    
    def read_file(self, file_content, filename):
        """读取文件内容"""
        try:
            # 检测文件编码
            encoding_result = chardet.detect(file_content)
            encoding = encoding_result.get('encoding', 'utf-8')
            
            if filename.lower().endswith('.csv'):
                # 处理CSV文件
                df = pd.read_csv(
                    io.BytesIO(file_content),
                    encoding=encoding,
                    keep_default_na=False
                )
            elif filename.lower().endswith(('.xlsx', '.xls')):
                # 处理Excel文件
                df = pd.read_excel(
                    io.BytesIO(file_content),
                    keep_default_na=False
                )
            else:
                raise ValueError(f"不支持的文件格式: {filename}")
            
            return df
        except Exception as e:
            logger.error(f"读取文件失败: {str(e)}")
            raise ValueError(f"文件读取失败: {str(e)}")
    
    def validate_video_data(self, df):
        """验证视频数据"""
        required_columns = ['bv_number', 'title', 'url']
        missing_columns = [col for col in required_columns if col not in df.columns]
        
        if missing_columns:
            raise ValueError(f"缺少必需的列: {', '.join(missing_columns)}")
        
        # 检查数据格式
        for index, row in df.iterrows():
            row_num = index + 2  # Excel行号从2开始
            
            # BV号验证
            if not row['bv_number'] or len(str(row['bv_number']).strip()) == 0:
                self.errors.append({
                    'row': row_num,
                    'field': 'bv_number',
                    'message': 'BV号不能为空'
                })
            
            # 标题验证
            if not row['title'] or len(str(row['title']).strip()) == 0:
                self.errors.append({
                    'row': row_num,
                    'field': 'title',
                    'message': '标题不能为空'
                })
            
            # URL验证
            if not row['url'] or not str(row['url']).strip().startswith(('http://', 'https://')):
                self.errors.append({
                    'row': row_num,
                    'field': 'url',
                    'message': 'URL格式不正确'
                })
    
    def process_video_import(self, df, user, validate_only=False):
        """处理视频数据导入"""
        self.validate_video_data(df)
        
        if self.errors:
            return
        
        total_records = len(df)
        
        for index, row in df.iterrows():
            try:
                row_num = index + 2
                
                # 检查重复的BV号
                if Video.objects.filter(bv_number=row['bv_number']).exists():
                    self.warnings.append({
                        'row': row_num,
                        'message': f"BV号 {row['bv_number']} 已存在，跳过"
                    })
                    continue
                
                if not validate_only:
                    # 创建视频记录
                    video_data = {
                        'bv_number': str(row['bv_number']).strip(),
                        'title': str(row['title']).strip(),
                        'url': str(row['url']).strip(),
                        'uploaded_by': user,
                    }
                    
                    # 可选字段
                    if 'description' in row and pd.notna(row['description']):
                        video_data['description'] = str(row['description']).strip()
                    
                    if 'thumbnail' in row and pd.notna(row['thumbnail']):
                        video_data['thumbnail'] = str(row['thumbnail']).strip()
                    
                    if 'view_count' in row and pd.notna(row['view_count']):
                        try:
                            video_data['view_count'] = int(row['view_count'])
                        except (ValueError, TypeError):
                            pass
                    
                    if 'performance_date' in row and pd.notna(row['performance_date']):
                        try:
                            video_data['performance_date'] = pd.to_datetime(row['performance_date']).date()
                        except (ValueError, TypeError):
                            pass
                    
                    Video.objects.create(**video_data)
                
                self.success_count += 1
                
                # 更新进度
                if index % 10 == 0:  # 每10条记录更新一次进度
                    self.update_progress(
                        'processing',
                        total_records=total_records,
                        processed=index + 1
                    )
                    
            except Exception as e:
                self.error_count += 1
                self.errors.append({
                    'row': row_num,
                    'message': f"处理失败: {str(e)}"
                })
                logger.error(f"导入第{row_num}行数据失败: {str(e)}")


@shared_task(bind=True)
def process_bulk_import(self, file_content, filename, import_type, user_id, validate_only=False):
    """
    Celery任务：处理批量导入
    """
    task_id = self.request.id
    processor = DataImportProcessor(task_id)
    
    try:
        # 更新任务状态
        processor.update_progress('processing', total_records=0)
        
        # 获取用户
        user = User.objects.get(id=user_id)
        
        # 读取文件
        df = processor.read_file(file_content, filename)
        total_records = len(df)
        
        # 根据导入类型处理数据
        if import_type == 'video':
            processor.process_video_import(df, user, validate_only)
        else:
            raise ValueError(f"不支持的导入类型: {import_type}")
        
        # 完成处理
        status = 'success' if processor.error_count == 0 else 'failed'
        result = processor.update_progress(
            status,
            total_records=total_records,
            completed_at=timezone.now().isoformat()
        )
        
        logger.info(f"批量导入完成: {task_id}, 成功: {processor.success_count}, 失败: {processor.error_count}")
        return result
        
    except Exception as e:
        logger.error(f"批量导入任务失败: {task_id}, 错误: {str(e)}")
        processor.errors.append({
            'message': f"任务执行失败: {str(e)}"
        })
        result = processor.update_progress(
            'failed',
            completed_at=timezone.now().isoformat()
        )
        return result


def get_import_template(import_type):
    """
    获取导入模板
    """
    templates = {
        'video': {
            'columns': [
                'bv_number', 'title', 'description', 'url', 'thumbnail',
                'view_count', 'like_count', 'performance_date'
            ],
            'sample_data': [{
                'bv_number': 'BV1234567890',
                'title': '示例视频标题',
                'description': '视频描述信息',
                'url': 'https://www.bilibili.com/video/BV1234567890',
                'thumbnail': 'https://example.com/thumbnail.jpg',
                'view_count': 1000,
                'like_count': 100,
                'performance_date': '2024-01-01'
            }]
        },
        'group': {
            'columns': [
                'name', 'description', 'location', 'website',
                'email', 'founded_date'
            ],
            'sample_data': [{
                'name': '示例社团',
                'description': '社团描述',
                'location': '北京',
                'website': 'https://example.com',
                'email': 'contact@example.com',
                'founded_date': '2020-01-01'
            }]
        }
    }
    return templates.get(import_type, {}) 