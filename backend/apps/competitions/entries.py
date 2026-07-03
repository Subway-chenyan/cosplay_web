from collections import defaultdict

from django.db.models import Case, CharField, Count, F, IntegerField, Value, When
from django.db.models.functions import Cast, Coalesce, Concat
from rest_framework.pagination import PageNumberPagination

from apps.awards.models import Award, AwardRecord
from apps.videos.models import Video
from apps.videos.serializers import VideoListSerializer


ENTRY_VALUE_FIELDS = (
    'entry_id',
    'kind',
    'entry_year',
    'sort_year',
    'sort_created',
    'record_key',
    'video_key',
    'award_key',
)


class CompetitionEntriesPagination(PageNumberPagination):
    page_size = 24
    page_size_query_param = 'page_size'
    max_page_size = 100


def build_competition_entries(competition, *, year=None, award=None):
    award_records = AwardRecord.objects.filter(award__competition=competition)
    if year is not None:
        award_records = award_records.filter(competition_year__year=year)
    if award is not None:
        award_records = award_records.filter(award=award)

    award_rows = award_records.annotate(
        entry_id=Concat(
            Value('award-record:'),
            Cast('id', output_field=CharField()),
            output_field=CharField(),
        ),
        kind=Case(
            When(video_id__isnull=True, then=Value('award_without_video')),
            default=Value('awarded_video'),
            output_field=CharField(),
        ),
        entry_year=F('competition_year__year'),
        sort_year=F('competition_year__year'),
        sort_created=F('created_at'),
        record_key=Cast('id', output_field=CharField()),
        video_key=Cast('video_id', output_field=CharField()),
        award_key=Cast('award_id', output_field=CharField()),
    ).values(*ENTRY_VALUE_FIELDS)

    if award is not None:
        return award_rows.order_by('-sort_year', '-sort_created', '-entry_id')

    unawarded_videos = Video.objects.filter(
        competition=competition,
        award_records__isnull=True,
    )
    if year is not None:
        unawarded_videos = unawarded_videos.filter(year=year)

    video_rows = unawarded_videos.annotate(
        entry_id=Concat(
            Value('video:'),
            Cast('id', output_field=CharField()),
            output_field=CharField(),
        ),
        kind=Value('unawarded_video', output_field=CharField()),
        entry_year=F('year'),
        sort_year=Coalesce('year', Value(0), output_field=IntegerField()),
        sort_created=F('created_at'),
        record_key=Value(None, output_field=CharField()),
        video_key=Cast('id', output_field=CharField()),
        award_key=Value(None, output_field=CharField()),
    ).values(*ENTRY_VALUE_FIELDS)

    return award_rows.union(video_rows, all=True).order_by(
        '-sort_year',
        '-sort_created',
        '-entry_id',
    )


def hydrate_competition_entries(rows):
    rows = list(rows)
    record_ids = [row['record_key'] for row in rows if row['record_key']]
    video_ids = [row['video_key'] for row in rows if row['video_key']]

    records = {
        str(record.id): record
        for record in AwardRecord.objects.filter(id__in=record_ids).select_related(
            'award',
            'group',
            'competition_year',
        )
    }
    videos = {
        str(video.id): video
        for video in Video.objects.filter(id__in=video_ids).select_related(
            'group',
            'competition',
            'uploaded_by',
        ).prefetch_related('tags')
    }

    results = []
    for row in rows:
        record = records.get(row['record_key'])
        video = videos.get(row['video_key'])
        award = record.award if record else None
        results.append({
            'entry_id': row['entry_id'],
            'kind': row['kind'],
            'year': row['entry_year'],
            'award': (
                {'id': str(award.id), 'name': award.name}
                if award else None
            ),
            'award_record': (
                {
                    'id': str(record.id),
                    'award': str(record.award_id),
                    'video': str(record.video_id) if record.video_id else None,
                    'group': str(record.group_id) if record.group_id else None,
                    'group_name': record.group.name if record.group else '',
                    'competition_year': str(record.competition_year_id),
                    'competition_year_detail': {
                        'id': str(record.competition_year_id),
                        'competition': str(record.competition_year.competition_id),
                        'year': record.competition_year.year,
                    },
                    'drama_name': record.drama_name,
                    'description': record.description,
                    'created_at': record.created_at,
                    'updated_at': record.updated_at,
                }
                if record else None
            ),
            'video': VideoListSerializer(video).data if video else None,
        })
    return results


def get_competition_filter_options(competition):
    year_counts = defaultdict(int)
    award_records = AwardRecord.objects.filter(award__competition=competition)
    unawarded_videos = Video.objects.filter(
        competition=competition,
        award_records__isnull=True,
    )

    for row in award_records.values('competition_year__year').annotate(count=Count('id')):
        year_counts[row['competition_year__year']] += row['count']
    for row in unawarded_videos.values('year').annotate(count=Count('id')):
        if row['year'] is not None:
            year_counts[row['year']] += row['count']
    for configured_year in competition.years.values_list('year', flat=True):
        year_counts.setdefault(configured_year, 0)

    award_counts = {
        row['award_id']: row['count']
        for row in award_records.values('award_id').annotate(count=Count('id'))
    }
    awards = [
        {
            'id': str(award.id),
            'name': award.name,
            'count': award_counts.get(award.id, 0),
        }
        for award in Award.objects.filter(competition=competition).order_by('name')
    ]

    return {
        'years': [
            {'value': year, 'count': year_counts[year]}
            for year in sorted(year_counts, reverse=True)
        ],
        'awards': awards,
        'total_count': award_records.count() + unawarded_videos.count(),
    }
