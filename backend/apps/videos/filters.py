import django_filters
from django.db import models
from .models import Video


class VideoFilter(django_filters.FilterSet):
    """
    视频过滤器
    """
    # 关键词搜索
    title_contains = django_filters.CharFilter(field_name='title', lookup_expr='icontains')
    description_contains = django_filters.CharFilter(field_name='description', lookup_expr='icontains')
    
    # 关联筛选
    groups = django_filters.CharFilter(field_name='group__id', method='filter_by_groups')
    competitions = django_filters.CharFilter(field_name='competition__id', method='filter_by_competitions')

    tags = django_filters.CharFilter(field_name='tags__id', method='filter_by_tags')
    styleTag = django_filters.CharFilter(method='filter_by_style_tag')
    ipTag = django_filters.CharFilter(method='filter_by_ip_tag')

    def filter_by_groups(self, queryset, name, value):
        """按社团ID筛选"""
        if value:
            group_ids = value.split(',')
            return queryset.filter(group__id__in=group_ids).distinct()
        return queryset
    
    def filter_by_competitions(self, queryset, name, value):
        """按比赛ID筛选"""
        if value:
            competition_ids = value.split(',')
            return queryset.filter(competition__id__in=competition_ids).distinct()
        return queryset
    
    def filter_by_tags(self, queryset, name, value):
        """按标签ID筛选（AND逻辑）"""
        if value:
            tag_ids = value.split(',')
            # 使用AND逻辑：视频必须包含所有指定的标签
            for tag_id in tag_ids:
                queryset = queryset.filter(tags__id=tag_id)
            return queryset.distinct()
        return queryset
    
    def filter_by_style_tag(self, queryset, name, value):
        """按风格标签筛选（单选）"""
        if value:
            return queryset.filter(tags__id=value, tags__category='风格').distinct()
        return queryset
    
    def filter_by_ip_tag(self, queryset, name, value):
        """按IP标签筛选（单选）"""
        if value:
            return queryset.filter(tags__id=value, tags__category='IP').distinct()
        return queryset
    
    class Meta:
        model = Video
        fields = {
            'competition': ['exact'],
            'year': ['exact', 'gte', 'lte'],
        }