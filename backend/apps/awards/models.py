from django.db import models
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
import uuid

User = get_user_model()


class Award(models.Model):
    """
    奖项模型
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, verbose_name='奖项名称')
    
    # 关联比赛
    competition = models.ForeignKey('competitions.Competition', on_delete=models.CASCADE,
                                   related_name='awards', verbose_name='所属比赛')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        verbose_name = '奖项'
        verbose_name_plural = '奖项'
        ordering = ['name']
    
    def __str__(self):
        return f"{self.competition.name} - {self.name}"


class AwardRecord(models.Model):
    """
    获奖记录模型
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    award = models.ForeignKey(Award, on_delete=models.CASCADE, 
                             related_name='records', verbose_name='奖项')
    
    # 获奖者信息 (可能是视频、社团中的任意一个或多个)
    video = models.ForeignKey('videos.Video', on_delete=models.SET_NULL, null=True, blank=True,
                             related_name='award_records', verbose_name='获奖视频')
    group = models.ForeignKey('groups.Group', on_delete=models.SET_NULL, null=True, blank=True,
                             related_name='award_records', verbose_name='获奖社团')
    
    # 详细信息
    competition_year = models.ForeignKey('competitions.CompetitionYear', on_delete=models.CASCADE, 
                                       related_name='award_records', verbose_name='比赛年份')
    drama_name = models.CharField(max_length=200, blank=True, verbose_name='剧名')
    description = models.TextField(blank=True, verbose_name='获奖描述')
    
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    
    class Meta:
        verbose_name = '获奖记录'
        verbose_name_plural = '获奖记录'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['competition_year', 'award']),
            models.Index(fields=['video', 'competition_year']),
            models.Index(fields=['group', 'competition_year']),
        ]
    
    def __str__(self):
        return f"{self.award.name} ({self.competition_year.year})"


def update_group_award_count(group):
    """更新社团的获奖数量"""
    if group:
        from apps.groups.models import Group
        try:
            group_obj = Group.objects.get(id=group.id)
            group_obj.award_count = group_obj.award_records.count()
            group_obj.save(update_fields=['award_count'])
        except Group.DoesNotExist:
            pass


@receiver(post_save, sender=AwardRecord)
def award_record_saved(sender, instance, created, **kwargs):
    """获奖记录保存时的信号处理"""
    # 如果是新创建的获奖记录
    if created:
        # 更新社团的获奖数量
        if instance.group:
            update_group_award_count(instance.group)
    else:
        # 如果是更新获奖记录，需要检查社团是否发生变化
        if instance.pk:
            try:
                old_instance = AwardRecord.objects.get(pk=instance.pk)
                old_group = old_instance.group
                new_group = instance.group
                
                # 如果社团发生了变化
                if old_group != new_group:
                    # 更新旧社团的获奖数量
                    if old_group:
                        update_group_award_count(old_group)
                    # 更新新社团的获奖数量
                    if new_group:
                        update_group_award_count(new_group)
                # 如果社团没有变化，但获奖记录确实属于某个社团
                elif new_group:
                    update_group_award_count(new_group)
            except AwardRecord.DoesNotExist:
                # 如果找不到旧实例，直接更新新社团
                if instance.group:
                    update_group_award_count(instance.group)


@receiver(post_delete, sender=AwardRecord)
def award_record_deleted(sender, instance, **kwargs):
    """获奖记录删除时的信号处理"""
    # 更新社团的获奖数量
    if instance.group:
        update_group_award_count(instance.group)