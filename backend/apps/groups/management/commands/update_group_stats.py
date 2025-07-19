from django.core.management.base import BaseCommand
from django.db import transaction
from apps.groups.models import Group
from apps.videos.models import Video
from apps.awards.models import AwardRecord


class Command(BaseCommand):
    help = '更新所有社团的视频数量和获奖数量统计'

    def add_arguments(self, parser):
        parser.add_argument(
            '--group-id',
            type=str,
            help='指定要更新的社团ID（可选）',
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='仅显示将要更新的数据，不实际执行更新',
        )
        parser.add_argument(
            '--video-only',
            action='store_true',
            help='仅更新视频数量统计',
        )
        parser.add_argument(
            '--award-only',
            action='store_true',
            help='仅更新获奖数量统计',
        )

    def handle(self, *args, **options):
        group_id = options.get('group_id')
        dry_run = options.get('dry_run')
        video_only = options.get('video_only')
        award_only = options.get('award_only')

        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN 模式 - 不会实际更新数据'))

        # 获取要更新的社团
        if group_id:
            try:
                groups = [Group.objects.get(id=group_id)]
                self.stdout.write(f'将更新社团: {groups[0].name}')
            except Group.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'社团ID {group_id} 不存在'))
                return
        else:
            groups = Group.objects.all()
            self.stdout.write(f'将更新 {groups.count()} 个社团的统计信息')

        updated_count = 0
        
        with transaction.atomic():
            for group in groups:
                # 计算视频数量
                video_count = Video.objects.filter(group=group).count()
                
                # 计算获奖数量
                award_count = AwardRecord.objects.filter(group=group).count()
                
                if dry_run:
                    self.stdout.write(
                        f'社团: {group.name} - 视频数: {video_count} (当前: {group.video_count}), '
                        f'获奖数: {award_count} (当前: {group.award_count})'
                    )
                else:
                    # 根据参数决定更新哪些字段
                    update_fields = []
                    
                    if not award_only:
                        group.video_count = video_count
                        update_fields.append('video_count')
                    
                    if not video_only:
                        group.award_count = award_count
                        update_fields.append('award_count')
                    
                    if update_fields:
                        group.save(update_fields=update_fields)
                        
                        update_info = []
                        if 'video_count' in update_fields:
                            update_info.append(f'视频数: {video_count}')
                        if 'award_count' in update_fields:
                            update_info.append(f'获奖数: {award_count}')
                        
                        self.stdout.write(
                            f'已更新社团: {group.name} - {", ".join(update_info)}'
                        )
                
                updated_count += 1

        if dry_run:
            self.stdout.write(self.style.SUCCESS(f'DRY RUN 完成，将更新 {updated_count} 个社团'))
        else:
            update_type = []
            if not award_only:
                update_type.append('视频数量')
            if not video_only:
                update_type.append('获奖数量')
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'成功更新 {updated_count} 个社团的{", ".join(update_type)}统计信息'
                )
            ) 