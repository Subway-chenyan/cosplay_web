"""Preview/apply resumable IP labels; only adds links, never replaces manual tags."""
import hashlib
import json
import os
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from apps.tags.ip_classifier import classify, normalize_ips
from apps.tags.models import Tag, VideoTag
from apps.videos.models import Video


class Command(BaseCommand):
    help = '通过 LLM 识别视频 IP；默认预览，--apply 写入，JSONL 报告支持断点续跑'

    def add_arguments(self, parser):
        parser.add_argument('--endpoint', default='http://127.0.0.1:15721/v1/messages')
        parser.add_argument('--model', default='glm-5.3-flash')
        parser.add_argument('--report', required=True)
        parser.add_argument('--apply', action='store_true')
        parser.add_argument('--limit', type=int, default=0)
        parser.add_argument('--bv', action='append')
        parser.add_argument('--workers', type=int, default=4)

    def handle(self, *args, **options):
        if options['limit'] < 0:
            raise CommandError('--limit must be nonnegative')
        if not 1 <= options['workers'] <= 16:
            raise CommandError('--workers must be between 1 and 16')
        path = Path(options['report'])
        path.parent.mkdir(parents=True, exist_ok=True)
        previous = {}
        if path.exists():
            for line in path.read_text(encoding='utf-8').splitlines():
                try:
                    row = json.loads(line)
                    if row.get('status') != 'error':
                        previous[(row['id'], row['fingerprint'])] = row
                except (ValueError, KeyError):
                    continue
        videos = Video.objects.exclude(tags__category='IP').order_by('id')
        if options['bv']:
            videos = videos.filter(bv_number__in=options['bv'])
        if options['limit']:
            videos = videos[:options['limit']]
        known = list(Tag.objects.filter(category='IP').values_list('name', flat=True))
        counts = {'tagged': 0, 'skipped': 0, 'error': 0, 'preview': 0}
        videos = list(videos)
        def predict(video):
            fingerprint = hashlib.sha256((video.title + '\n' + video.description).encode()).hexdigest()
            cached = previous.get((str(video.id), fingerprint))
            try:
                return cached['ips'] if cached else classify(video.title, video.description, known, options['endpoint'], options['model'], os.environ.get('IP_LLM_API_KEY', ''))
            except Exception as exc:
                return exc

        with path.open('a', encoding='utf-8') as report, ThreadPoolExecutor(max_workers=options['workers']) as pool:
            for video, prediction in zip(videos, pool.map(predict, videos)):
                fingerprint = hashlib.sha256((video.title + '\n' + video.description).encode()).hexdigest()
                row = {'id': str(video.id), 'bv': video.bv_number, 'title': video.title, 'fingerprint': fingerprint, 'model': options['model']}
                try:
                    if isinstance(prediction, Exception):
                        raise prediction
                    ips = normalize_ips(prediction)
                    if len(ips) > 1 and not all(ip['evidence'] in video.title for ip in ips):
                        ips = []
                    row['ips'] = ips
                    row['status'] = 'preview' if ips else 'skipped'
                    row['created_links'] = []
                    if ips and options['apply']:
                        with transaction.atomic():
                            current = Video.objects.select_for_update().get(pk=video.pk)
                            if current.title != video.title or current.description != video.description or current.tags.filter(category='IP').exists():
                                row['status'] = 'skipped'
                            else:
                                for ip in ips:
                                    tag, _ = Tag.objects.get_or_create(name=ip['name'], category='IP')
                                    tag = Tag.objects.select_for_update().get(pk=tag.pk)
                                    if not tag.is_active:
                                        continue
                                    link, created = VideoTag.objects.get_or_create(video=current, tag=tag)
                                    if created:
                                        row['created_links'].append(link.pk)
                                    tag.usage_count = tag.video_tags.count()
                                    tag.save(update_fields=['usage_count'])
                                row['status'] = 'tagged' if row['created_links'] else 'skipped'
                except Exception as exc:
                    row.update(status='error', error=str(exc))
                counts[row['status']] += 1
                report.write(json.dumps(row, ensure_ascii=False) + '\n')
                report.flush()
                self.stdout.write(json.dumps(row, ensure_ascii=False))
        self.stdout.write(json.dumps(counts))
        if counts['error']:
            raise CommandError(f"{counts['error']} videos failed; rerun with the same report to retry")
