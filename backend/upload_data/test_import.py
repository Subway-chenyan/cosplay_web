#!/usr/bin/env python
"""
测试数据导入功能
"""
import os
import sys
import pandas as pd
from datetime import datetime

# 添加Django项目路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 配置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cosplay_api.settings')

try:
    import django
    django.setup()
    
    from apps.videos.models import Video
    from apps.tags.models import Tag
    from import_data import DataImporter
except ImportError as e:
    print(f"导入错误: {e}")
    sys.exit(1)

def create_test_data():
    """创建测试数据"""
    test_data = {
        'bv_number': ['BV_TEST_001', 'BV_TEST_002'],
        'title': ['测试视频1 - 新数据结构', '测试视频2 - 风格标签'],
        'url': ['https://www.bilibili.com/video/BV_TEST_001', 'https://www.bilibili.com/video/BV_TEST_002'],
        'description': ['测试新的年份和地区字段', '测试风格标签功能'],
        'thumbnail': ['', ''],
        'year': [2024, 2023],
        'group_name': ['测试社团A', '测试社团B'],
        'competition_name': ['测试比赛', ''],
        'tags': ['初音未来:IP,甜美:风格', '东方Project:IP,古风:风格,测试:其他'],
        'group_description': ['专业cosplay社团', '学生cosplay社团'],
        'group_founded_date': ['2020-01-01', '2021-06-15'],
        'group_province': ['北京市', '上海市'],
        'group_city': ['北京市', '上海市'],
        'group_location': ['朝阳区CBD商务区', '浦东新区陆家嘴'],
        'group_website': ['', ''],
        'group_email': ['', ''],
        'group_phone': ['', ''],
        'group_weibo': ['', ''],
        'group_wechat': ['', ''],
        'group_qq_group': ['', ''],
        'group_bilibili': ['', ''],
        'competition_description': ['', ''],
        'competition_website': ['', ''],
        'award_names': ['最佳创意奖', ''],
        'award_years': ['2024', ''],
        'award_descriptions': ['创意设计优秀', ''],
    }
    
    # 创建DataFrame并保存为Excel
    df = pd.DataFrame(test_data)
    test_file = 'test_data.xlsx'
    df.to_excel(test_file, index=False)
    
    return test_file

def test_import():
    """测试导入功能"""
    print("🧪 开始测试数据导入功能...")
    
    # 清理可能存在的测试数据
    Video.objects.filter(bv_number__startswith='BV_TEST_').delete()
    
    # 创建测试数据文件
    test_file = create_test_data()
    print(f"✅ 创建测试数据文件: {test_file}")
    
    try:
        # 执行导入
        importer = DataImporter()
        importer.import_from_excel(test_file)
        
        print(f"\n📊 导入结果:")
        print(f"  成功: {importer.success_count} 条")
        print(f"  失败: {importer.error_count} 条")
        
        if importer.errors:
            print("\n❌ 错误详情:")
            for error in importer.errors:
                print(f"  {error}")
        
        # 验证导入结果
        test_videos = Video.objects.filter(bv_number__startswith='BV_TEST_')
        print(f"\n🔍 验证结果:")
        print(f"  导入的视频数量: {test_videos.count()}")
        
        for video in test_videos:
            print(f"\n  视频: {video.title}")
            print(f"    BV号: {video.bv_number}")
            print(f"    年份: {video.year}")
            if video.group:
                print(f"    社团省份: {video.group.province}")
                print(f"    社团城市: {video.group.city}")
                print(f"    社团详细地址: {video.group.location}")
            print(f"    标签: {[f'{tag.name}({tag.category})' for tag in video.tags.all()]}")
        
        # 验证标签分类
        test_tags = Tag.objects.filter(videos__in=test_videos).distinct()
        print(f"\n🏷️ 标签验证:")
        for category in ['IP', '风格', '其他']:
            category_tags = test_tags.filter(category=category)
            print(f"  {category}: {[tag.name for tag in category_tags]}")
        
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        # 清理测试文件
        if os.path.exists(test_file):
            os.remove(test_file)
            print(f"\n🧹 清理测试文件: {test_file}")

if __name__ == '__main__':
    test_import()