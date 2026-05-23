"""SQL result → ORM object hydration."""

import logging
from collections import defaultdict

from apps.groups.serializers import GroupSerializer
from apps.groups.models import Group
from apps.videos.serializers import VideoListSerializer
from apps.videos.models import Video
from apps.awards.serializers import AwardRecordSerializer
from apps.awards.models import AwardRecord

logger = logging.getLogger(__name__)


class HydrationError(Exception):
    pass


def extract_ids_from_rows(rows, field_types=None):
    """Extract unique non-null values from rows by column name.

    Args:
        rows: List of dicts from SQL query results.
        field_types: Optional mapping of column_name → type hint (unused for now).

    Returns:
        Dict mapping column_name → list of unique string values.
    """
    result = defaultdict(list)
    seen = defaultdict(set)
    for row in rows:
        for key, value in row.items():
            if value is None:
                continue
            str_val = str(value).strip()
            if not str_val:
                continue
            if str_val not in seen[key]:
                seen[key].add(str_val)
                result[key].append(str_val)
    return dict(result)


def hydrate_groups(group_ids):
    if not group_ids:
        return []
    groups = Group.objects.filter(id__in=group_ids)
    return GroupSerializer(groups, many=True).data


def hydrate_videos(video_ids):
    if not video_ids:
        return []
    videos = Video.objects.filter(id__in=video_ids).prefetch_related('tags').select_related('group', 'competition')
    return VideoListSerializer(videos, many=True).data


def hydrate_award_records(award_record_ids):
    if not award_record_ids:
        return []
    records = (
        AwardRecord.objects.filter(id__in=award_record_ids)
        .select_related('award__competition', 'group', 'video', 'competition_year')
    )
    return AwardRecordSerializer(records, many=True).data


def _merge_unique(*lists):
    merged = []
    seen = set()
    for values in lists:
        for value in values or []:
            string_value = str(value)
            if string_value and string_value not in seen:
                seen.add(string_value)
                merged.append(string_value)
    return merged


def build_data_array(rows, ui_type, answer_text, explicit_ids=None):
    """Build the data/response structure for the frontend.

    Returns dict with: video_id_list, group_id_list, data (hydrated objects).
    """
    ids_map = extract_ids_from_rows(rows)

    # Identify entity IDs from various possible column names
    explicit_ids = explicit_ids or {}
    group_ids = _merge_unique(
        ids_map.get('group_id', []),
        ids_map.get('group', []),
        ids_map.get('g_id', []),
        explicit_ids.get('group_id_list', []),
    )
    video_ids = _merge_unique(
        ids_map.get('video_id', []),
        ids_map.get('video', []),
        ids_map.get('v_id', []),
        explicit_ids.get('video_id_list', []),
    )
    ar_ids = _merge_unique(
        ids_map.get('award_record_id', []),
        ids_map.get('award_record', []),
        ids_map.get('ar_id', []),
        ids_map.get('record_id', []),
        explicit_ids.get('award_record_id_list', []),
    )

    # Heuristic for bare 'id' column when only one entity type is involved
    if not group_ids and not video_ids and not ar_ids:
        all_ids = ids_map.get('id', [])
        if all_ids and rows and 'name' in rows[0] and 'bv_number' not in rows[0]:
            group_ids = all_ids
        elif all_ids and rows and 'bv_number' in rows[0]:
            video_ids = all_ids

    # Hydrate
    groups_by_id = {g['id']: g for g in hydrate_groups(group_ids)}
    videos_by_id = {v['id']: v for v in hydrate_videos(video_ids)}
    ars_by_id = {a['id']: a for a in hydrate_award_records(ar_ids)}

    data = []

    if ui_type == 'group_detail':
        grouped = defaultdict(lambda: {'group': None, 'videos': [], 'award_records': []})
        for row in rows:
            gid = str(row.get('group_id', row.get('group', '')))
            if gid and gid in groups_by_id:
                grouped[gid]['group'] = groups_by_id[gid]
            vid = str(row.get('video_id', row.get('video', '')))
            if vid and vid in videos_by_id and videos_by_id[vid] not in grouped[gid]['videos']:
                grouped[gid]['videos'].append(videos_by_id[vid])
            arid = str(row.get('award_record_id', row.get('award_record', '')))
            if arid and arid in ars_by_id and ars_by_id[arid] not in grouped[gid]['award_records']:
                grouped[gid]['award_records'].append(ars_by_id[arid])
        for gid, group in groups_by_id.items():
            grouped[gid]['group'] = group
        for video in videos_by_id.values():
            gid = str(video.get('group') or '')
            if gid in groups_by_id and video not in grouped[gid]['videos']:
                grouped[gid]['videos'].append(video)
        for record in ars_by_id.values():
            gid = str(record.get('group') or '')
            if gid in groups_by_id and record not in grouped[gid]['award_records']:
                grouped[gid]['award_records'].append(record)
        data = [item for item in grouped.values() if item['group']]

    elif ui_type == 'video_grid':
        seen_videos = set()
        for row in rows:
            vid = str(row.get('video_id', row.get('video', row.get('id', ''))))
            if vid and vid in videos_by_id and vid not in seen_videos:
                seen_videos.add(vid)
                gid = str(row.get('group_id', row.get('group', '')))
                arid = str(row.get('award_record_id', row.get('award_record', '')))
                item = {
                    'video': videos_by_id[vid],
                    'group': groups_by_id.get(gid),
                    'award_record': ars_by_id.get(arid),
                }
                data.append(item)
        for vid, video in videos_by_id.items():
            if vid not in seen_videos:
                data.append({
                    'video': video,
                    'group': groups_by_id.get(str(video.get('group') or '')),
                    'award_record': None,
                })

    elif ui_type == 'award_leaderboard':
        grouped = defaultdict(lambda: {'group': None, 'metrics': {'award_count': 0}, 'award_records': [], 'videos': []})
        for row in rows:
            gid = str(row.get('group_id', row.get('group', '')))
            if gid and gid in groups_by_id:
                grouped[gid]['group'] = groups_by_id[gid]
            count = row.get('award_count', row.get('cnt', 1))
            if isinstance(count, (int, float)):
                grouped[gid]['metrics']['award_count'] = int(count)
            arid = str(row.get('award_record_id', row.get('award_record', '')))
            if arid and arid in ars_by_id:
                grouped[gid]['award_records'].append(ars_by_id[arid])
            vid = str(row.get('video_id', row.get('video', '')))
            if vid and vid in videos_by_id:
                grouped[gid]['videos'].append(videos_by_id[vid])
        data = list(grouped.values())

    elif ui_type == 'group_list':
        for gid, group in groups_by_id.items():
            item = {'group': group, 'videos': [], 'award_records': []}
            for video in videos_by_id.values():
                if str(video.get('group') or '') == gid:
                    item['videos'].append(video)
            data.append(item)

    # mixed_text or unknown → empty data
    return {
        'video_id_list': list(videos_by_id.keys()),
        'group_id_list': list(groups_by_id.keys()),
        'data': data,
    }
