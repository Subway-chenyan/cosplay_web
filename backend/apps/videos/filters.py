import django_filters
from django.db import models
from .models import Video


class VideoFilter(django_filters.FilterSet):
    """
    视频过滤器
    """
    # 日期范围过滤
    upload_date_from = django_filters.DateFilter(field_name='upload_date', lookup_expr='gte')
    upload_date_to = django_filters.DateFilter(field_name='upload_date', lookup_expr='lte')
    performance_date_from = django_filters.DateFilter(field_name='performance_date', lookup_expr='gte')
    performance_date_to = django_filters.DateFilter(field_name='performance_date', lookup_expr='lte')
    
    # 数值范围过滤
    view_count_min = django_filters.NumberFilter(field_name='view_count', lookup_expr='gte')
    view_count_max = django_filters.NumberFilter(field_name='view_count', lookup_expr='lte')
    duration_min = django_filters.DurationFilter(field_name='duration', lookup_expr='gte')
    duration_max = django_filters.DurationFilter(field_name='duration', lookup_expr='lte')
    
    # 关键词搜索
    title_contains = django_filters.CharFilter(field_name='title', lookup_expr='icontains')
    description_contains = django_filters.CharFilter(field_name='description', lookup_expr='icontains')
    
    class Meta:
        model = Video
        fields = {
            'status': ['exact'],
            'is_featured': ['exact'],
            'is_original': ['exact'],
            'resolution': ['exact', 'icontains'],
            'upload_date': ['exact', 'year', 'month'],
            'performance_date': ['exact', 'year', 'month'],
        } 