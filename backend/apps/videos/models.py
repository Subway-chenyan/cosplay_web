from django.db import models
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
import uuid

User = get_user_model()


class Video(models.Model):
    """
    视频模型
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    bv_number = models.CharField(max_length=20, unique=True, verbose_name='BV号')
    title = models.CharField(max_length=255, verbose_name='标题')
    description = models.TextField(blank=True, verbose_name='描述')
    url = models.URLField(verbose_name='视频链接')
    thumbnail = models.URLField(blank=True, verbose_name='缩略图')
    
    # 基础属性
    year = models.IntegerField(blank=True, null=True, verbose_name='年份')
    region = models.CharField(max_length=50, blank=True, verbose_name='地区')

    # 关联信息
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, 
                                   related_name='uploaded_videos', verbose_name='上传者')
    group = models.ForeignKey('groups.Group', on_delete=models.SET_NULL, null=True, blank=True,
                             related_name='videos', verbose_name='所属社团')
    tags = models.ManyToManyField('tags.Tag', through='tags.VideoTag', 
                                 related_name='videos', verbose_name='标签')
    competition = models.ForeignKey('competitions.Competition', on_delete=models.SET_NULL, 
                                   null=True, blank=True, related_name='videos', verbose_name='所属比赛')
    competition_year = models.IntegerField(blank=True, null=True, verbose_name='比赛年份')

    # 时间戳
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        verbose_name = '视频'
        verbose_name_plural = '视频'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['bv_number']),
            models.Index(fields=['group']),
            models.Index(fields=['competition']),
            models.Index(fields=['competition_year']),
            models.Index(fields=['year']),
            models.Index(fields=['region']),
        ]

    def __str__(self):
        return self.title

    def get_absolute_url(self):
        return self.url


def update_group_video_count(group):
    """更新社团的视频数量"""
    if group:
        from apps.groups.models import Group
        try:
            group_obj = Group.objects.get(id=group.id)
            group_obj.video_count = group_obj.videos.count()
            group_obj.save(update_fields=['video_count'])
        except Group.DoesNotExist:
            pass


@receiver(post_save, sender=Video)
def video_saved(sender, instance, created, **kwargs):
    """视频保存时的信号处理"""
    
    # 如果是新创建的视频
    if created:
        # 更新当前社团的视频数量
        if instance.group:
            update_group_video_count(instance.group)
    else:
        # 如果是更新视频，需要检查社团是否发生变化
        if instance.pk:
            try:
                old_instance = Video.objects.get(pk=instance.pk)
                old_group = old_instance.group
                new_group = instance.group
                old_competition_year = old_instance.competition_year
                new_competition_year = instance.competition_year
                
                # 如果社团发生了变化
                if old_group != new_group:
                    # 更新旧社团的视频数量
                    if old_group:
                        update_group_video_count(old_group)
                    # 更新新社团的视频数量
                    if new_group:
                        update_group_video_count(new_group)
                # 如果社团没有变化，但视频确实属于某个社团
                elif new_group:
                    update_group_video_count(new_group)
                
                # 如果年份发生变化，需要处理标签关联
                if old_competition_year != new_competition_year:
                    # 移除旧的年份标签关联
                    if old_competition_year:
                        try:
                            old_year_tag = Tag.objects.get(name=str(old_competition_year), category='年份')
                            VideoTag.objects.filter(video=instance, tag=old_year_tag).delete()
                            # 减少旧标签的使用次数
                            old_year_tag.usage_count = max(0, old_year_tag.usage_count - 1)
                            old_year_tag.save(update_fields=['usage_count'])
                        except Tag.DoesNotExist:
                            pass
                    
                    # 添加新的年份标签关联
                    if new_competition_year:
                        year_tag = create_or_get_tag(str(new_competition_year), '年份')
                        VideoTag.objects.get_or_create(video=instance, tag=year_tag)
                
                # 如果社团的location发生变化，需要处理地区标签关联
                if old_group and new_group and old_group.location != new_group.location:
                    # 移除旧的地区标签关联
                    if old_group.location:
                        try:
                            old_location_tag = Tag.objects.get(name=old_group.location, category='地区')
                            VideoTag.objects.filter(video=instance, tag=old_location_tag).delete()
                            # 减少旧标签的使用次数
                            old_location_tag.usage_count = max(0, old_location_tag.usage_count - 1)
                            old_location_tag.save(update_fields=['usage_count'])
                        except Tag.DoesNotExist:
                            pass
                    
                    # 添加新的地区标签关联
                    if new_group.location:
                        location_tag = create_or_get_tag(new_group.location, '地区')
                        VideoTag.objects.get_or_create(video=instance, tag=location_tag)
                        
            except Video.DoesNotExist:
                # 如果找不到旧实例，直接更新新社团
                if instance.group:
                    update_group_video_count(instance.group)


@receiver(post_delete, sender=Video)
def video_deleted(sender, instance, **kwargs):
    """视频删除时的信号处理"""
    from apps.tags.models import Tag
    
    # 减少相关标签的使用次数
    # 处理地区标签
    if instance.group and instance.group.location:
        try:
            location_tag = Tag.objects.get(name=instance.group.location, category='地区')
            location_tag.usage_count = max(0, location_tag.usage_count - 1)
            location_tag.save(update_fields=['usage_count'])
        except Tag.DoesNotExist:
            pass
    
    # 处理年份标签
    if instance.competition_year:
        try:
            year_tag = Tag.objects.get(name=str(instance.competition_year), category='年份')
            year_tag.usage_count = max(0, year_tag.usage_count - 1)
            year_tag.save(update_fields=['usage_count'])
        except Tag.DoesNotExist:
            pass
    
    # 更新社团的视频数量
    if instance.group:
        update_group_video_count(instance.group)