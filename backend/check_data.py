#!/usr/bin/env python
"""
数据库查询脚本 - 验证新增数据是否成功
"""
import os
import sys
import django

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cosplay_api.settings')
django.setup()

from apps.videos.models import Video
from apps.groups.models import Group
from apps.users.models import User
from apps.competitions.models import Competition
from apps.awards.models import Award, AwardRecord
from apps.tags.models import Tag

def check_database_data():
    """检查数据库中的数据"""
    print("=" * 50)
    print("数据库数据查询结果")
    print("=" * 50)
    
    # 1. 检查用户数据
    print("\n1. 用户数据:")
    users = User.objects.all()
    print(f"用户总数: {users.count()}")
    for user in users:
        print(f"  - {user.username} ({user.email}) - 角色: {user.role}")
    
    # 2. 检查社团数据
    print("\n2. 社团数据:")
    groups = Group.objects.all()
    print(f"社团总数: {groups.count()}")
    for group in groups:
        print(f"  - {group.name} ({group.location}) - 视频数: {group.videos.count()}")
    
    # 3. 检查视频数据
    print("\n3. 视频数据:")
    videos = Video.objects.all()
    print(f"视频总数: {videos.count()}")
    for video in videos:
        group_name = video.group.name if video.group else "无社团"
        print(f"  - {video.title}")
        print(f"    BV号: {video.bv_number}")
        print(f"    社团: {group_name}")
        print(f"    播放量: {video.view_count}")
        print(f"    状态: {video.status}")
        print()
    
    # 4. 检查比赛数据
    print("\n4. 比赛数据:")
    competitions = Competition.objects.all()
    print(f"比赛总数: {competitions.count()}")
    for comp in competitions:
        print(f"  - {comp.name} ({comp.year}年)")
    
    # 5. 检查奖项数据
    print("\n5. 奖项数据:")
    awards = Award.objects.all()
    print(f"奖项总数: {awards.count()}")
    for award in awards:
        print(f"  - {award.name} ({award.competition.name})")
    
    # 6. 检查获奖记录
    print("\n6. 获奖记录:")
    records = AwardRecord.objects.all()
    print(f"获奖记录总数: {records.count()}")
    for record in records:
        group_name = record.group.name if record.group else "无社团"
        print(f"  - {record.video.title} 获得 {record.award.name}")
        print(f"    社团: {group_name}")
        print(f"    年份: {record.year}")
        print()
    
    # 7. 检查标签数据
    print("\n7. 标签数据:")
    tags = Tag.objects.all()
    print(f"标签总数: {tags.count()}")
    for tag in tags:
        print(f"  - {tag.name} ({tag.category})")
    
    # 8. 检查视频与社团的关联
    print("\n8. 视频与社团关联检查:")
    videos_with_group = Video.objects.filter(group__isnull=False)
    videos_without_group = Video.objects.filter(group__isnull=True)
    print(f"有社团的视频: {videos_with_group.count()}")
    print(f"无社团的视频: {videos_without_group.count()}")
    
    # 9. 检查社团的视频数量
    print("\n9. 各社团的视频数量:")
    for group in groups:
        video_count = group.videos.count()
        print(f"  - {group.name}: {video_count} 个视频")
    
    print("\n" + "=" * 50)
    print("数据查询完成！")
    print("=" * 50)

if __name__ == "__main__":
    check_database_data() 