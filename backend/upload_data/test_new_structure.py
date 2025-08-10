#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
测试新数据结构的导入逻辑

这个脚本用于验证更新后的上传逻辑是否正确适应新的数据结构变化：
1. UUID作为主键
2. CompetitionYear模型的引入
3. AwardRecord与CompetitionYear的关联
"""

import os
import sys
import django

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
django.setup()

from apps.groups.models import Group
from apps.videos.models import Video
from apps.competitions.models import Competition, CompetitionYear
from apps.awards.models import Award, AwardRecord
from apps.tags.models import Tag


def test_data_structure():
    """测试数据结构"""
    print("=== 测试新数据结构 ===")
    
    # 测试UUID字段
    print("1. 测试UUID字段:")
    
    # 创建测试数据
    group = Group.objects.create(
        name="测试社团",
        description="测试描述",
        province="上海市",
        city="上海市"
    )
    print(f"   社团ID: {group.id} (类型: {type(group.id)})")
    
    competition = Competition.objects.create(
        name="测试比赛",
        description="测试比赛描述"
    )
    print(f"   比赛ID: {competition.id} (类型: {type(competition.id)})")
    
    competition_year = CompetitionYear.objects.create(
        competition=competition,
        year=2024,
        description="2024年测试比赛"
    )
    print(f"   比赛年份ID: {competition_year.id} (类型: {type(competition_year.id)})")
    
    video = Video.objects.create(
        bv_number="test123",
        title="测试视频",
        group=group,
        competition=competition,
        year=2024
    )
    print(f"   视频ID: {video.id} (类型: {type(video.id)})")
    
    award = Award.objects.create(
        name="测试奖项",
        competition=competition
    )
    print(f"   奖项ID: {award.id} (类型: {type(award.id)})")
    
    award_record = AwardRecord.objects.create(
        award=award,
        video=video,
        competition_year=competition_year,
        group=group
    )
    print(f"   获奖记录ID: {award_record.id} (类型: {type(award_record.id)})")
    
    # 测试关联关系
    print("\n2. 测试关联关系:")
    print(f"   比赛年份: {competition_year.competition.name} - {competition_year.year}")
    print(f"   获奖记录关联的比赛年份: {award_record.competition_year.competition.name} - {award_record.competition_year.year}")
    
    # 测试信号处理器
    print("\n3. 测试信号处理器:")
    print(f"   社团视频数量: {group.video_count}")
    print(f"   社团获奖数量: {group.award_count}")
    
    # 清理测试数据
    award_record.delete()
    award.delete()
    video.delete()
    competition_year.delete()
    competition.delete()
    group.delete()
    
    print("\n✅ 测试完成，数据已清理")


def test_import_logic():
    """测试导入逻辑"""
    print("\n=== 测试导入逻辑 ===")
    
    try:
        from import_data import DataImporter
        
        # 创建导入器实例
        importer = DataImporter()
        
        # 测试比赛年份创建
        test_competition = Competition.objects.create(
            name="测试导入比赛",
            description="测试描述"
        )
        
        competition_year = importer.get_or_create_competition_year(test_competition, "2024")
        
        if competition_year:
            print(f"✅ 成功创建比赛年份: {competition_year}")
        else:
            print("❌ 创建比赛年份失败")
        
        # 清理
        if competition_year:
            competition_year.delete()
        test_competition.delete()
        
    except Exception as e:
        print(f"❌ 导入逻辑测试失败: {e}")


if __name__ == "__main__":
    test_data_structure()
    test_import_logic()