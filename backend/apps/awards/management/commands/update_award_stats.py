from django.core.management.base import BaseCommand
from django.db import transaction
from apps.groups.models import Group
from apps.awards.models import AwardRecord


class Command(BaseCommand):
    help = '更新所有社团的获奖数量统计'

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

    def handle(self, *args, **options):
        group_id = options.get('group_id')
        dry_run = options.get('dry_run')

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
            self.stdout.write(f'将更新 {groups.count()} 个社团的获奖数量统计')

        updated_count = 0
        
        with transaction.atomic():
            for group in groups:
                # 计算获奖数量
                award_count = AwardRecord.objects.filter(group=group).count()
                
                if dry_run:
                    self.stdout.write(
                        f'社团: {group.name} - 获奖数: {award_count} (当前: {group.award_count})'
                    )
                else:
                    # 更新获奖数量统计
                    group.award_count = award_count
                    group.save(update_fields=['award_count'])
                    
                    self.stdout.write(
                        f'已更新社团: {group.name} - 获奖数: {award_count}'
                    )
                
                updated_count += 1

        if dry_run:
            self.stdout.write(self.style.SUCCESS(f'DRY RUN 完成，将更新 {updated_count} 个社团的获奖数量'))
        else:
            self.stdout.write(self.style.SUCCESS(f'成功更新 {updated_count} 个社团的获奖数量统计')) 