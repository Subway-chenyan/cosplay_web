#!/usr/bin/env python
"""
清理标签数据脚本
删除年份和地区分类的标签，因为这些现在是视频的基础属性
"""

import os
import sys
import django

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cosplay_backend.settings')
django.setup()

from apps.tags.models import Tag, VideoTag
from apps.videos.models import Video

def cleanup_tags():
    """清理年份和地区标签"""
    print("开始清理标签数据...")
    
    # 删除年份标签
    year_tags = Tag.objects.filter(category='年份')
    year_count = year_tags.count()
    if year_count > 0:
        print(f"删除 {year_count} 个年份标签...")
        year_tags.delete()
    
    # 删除地区标签
    region_tags = Tag.objects.filter(category='地区')
    region_count = region_tags.count()
    if region_count > 0:
        print(f"删除 {region_count} 个地区标签...")
        region_tags.delete()
    
    print("标签清理完成！")
    
    # 显示剩余标签统计
    remaining_tags = Tag.objects.all()
    print(f"\n剩余标签统计:")
    for category in ['IP', '风格', '其他']:
        count = remaining_tags.filter(category=category).count()
        print(f"  {category}: {count} 个")
    
    print(f"\n总计剩余标签: {remaining_tags.count()} 个")

if __name__ == '__main__':
    cleanup_tags()