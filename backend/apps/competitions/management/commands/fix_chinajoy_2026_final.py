from django.core.management.base import BaseCommand
from django.db.models import Q
from django.db import transaction

from apps.competitions.models import Event


class Command(BaseCommand):
    help = 'Remove non-2026 videos mistakenly linked to 2026 ChinaJoy/CJ final events.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Only print mismatched links without changing data.',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        final_keyword = Q(title__iregex=r'(ChinaJoy|CJ|总决赛|總決賽)') | Q(region__iregex=r'(ChinaJoy|CJ|总决赛|總決賽)') | Q(competition__name__iregex=r'(ChinaJoy|CJ|超级联赛)')
        events = (
            Event.objects.filter(start_date__year=2026, stage='final')
            .filter(final_keyword)
            .select_related('competition')
            .prefetch_related('videos')
        )

        removed = 0
        inspected = 0

        with transaction.atomic():
            for event in events:
                inspected += 1
                for video in event.videos.all():
                    if video.year != 2026:
                        self.stdout.write(
                            f'{event.title} ({event.start_date}) <- {video.year} {video.bv_number} {video.title}'
                        )
                        if not dry_run:
                            event.videos.remove(video)
                        removed += 1

            if dry_run:
                transaction.set_rollback(True)

        action = 'would remove' if dry_run else 'removed'
        self.stdout.write(self.style.SUCCESS(f'Inspected {inspected} final event(s), {action} {removed} mismatched link(s).'))
