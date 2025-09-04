import django_filters
from .models import AwardRecord


class AwardRecordFilter(django_filters.FilterSet):
    """
    获奖记录过滤器
    """
    group = django_filters.CharFilter(field_name='group__id', lookup_expr='exact')
    video = django_filters.CharFilter(field_name='video__id', lookup_expr='exact')
    award = django_filters.CharFilter(field_name='award__id', lookup_expr='exact')
    year = django_filters.NumberFilter(field_name='competition_year__year', lookup_expr='exact')
    competition = django_filters.CharFilter(field_name='award__competition__id', lookup_expr='exact')
    
    class Meta:
        model = AwardRecord
        fields = ['group', 'video', 'award', 'year', 'competition']