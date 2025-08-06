#!/usr/bin/env python
"""
强制删除后端数据库中所有数据的脚本（无需确认）
注意：此操作不可逆，请谨慎使用！
"""
import os
import sys
from datetime import datetime

# 添加Django项目路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# 配置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cosplay_api.settings')

try:
    import django
    from django.db import transaction
    from django.contrib.auth import get_user_model
    django.setup()
    
    # 导入所有模型
    from apps.videos.models import Video
    from apps.groups.models import Group
    from apps.competitions.models import Competition
    from apps.awards.models import Award, AwardRecord
    from apps.tags.models import Tag, VideoTag
    
    User = get_user_model()
    
except ImportError as e:
    print(f"❌ 导入错误: {e}")
    print("请确保在Django项目根目录下运行此脚本")
    sys.exit(1)


def delete_all_data_force():
    """
    强制删除所有数据（无需确认）
    """
    print("🗑️  开始强制删除所有数据...")
    print(f"⏰ 开始时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("")
    
    try:
        with transaction.atomic():
            # 获取删除前的统计
            stats_before = {
                'award_records': AwardRecord.objects.count(),
                'awards': Award.objects.count(),
                'video_tags': VideoTag.objects.count(),
                'videos': Video.objects.count(),
                'tags': Tag.objects.count(),
                'groups': Group.objects.count(),
                'competitions': Competition.objects.count(),
                'normal_users': User.objects.filter(is_superuser=False).count(),
                'super_users': User.objects.filter(is_superuser=True).count(),
            }
            
            print("📊 删除前统计:")
            for key, count in stats_before.items():
                print(f"   - {key}: {count}")
            print("")
            
            # 按依赖关系顺序删除
            print("🔄 删除获奖记录...")
            AwardRecord.objects.all().delete()
            
            print("🔄 删除奖项...")
            Award.objects.all().delete()
            
            print("🔄 删除视频标签关联...")
            VideoTag.objects.all().delete()
            
            print("🔄 删除视频...")
            Video.objects.all().delete()
            
            print("🔄 删除标签...")
            Tag.objects.all().delete()
            
            print("🔄 删除社团...")
            Group.objects.all().delete()
            
            print("🔄 删除比赛...")
            Competition.objects.all().delete()
            
            print("🔄 删除普通用户（保留超级用户）...")
            User.objects.filter(is_superuser=False).delete()
            
            # 获取删除后的统计
            remaining_users = User.objects.count()
            
            print("")
            print("✅ 删除完成统计:")
            print(f"   - 删除获奖记录: {stats_before['award_records']} 条")
            print(f"   - 删除奖项: {stats_before['awards']} 个")
            print(f"   - 删除视频标签关联: {stats_before['video_tags']} 条")
            print(f"   - 删除视频: {stats_before['videos']} 个")
            print(f"   - 删除标签: {stats_before['tags']} 个")
            print(f"   - 删除社团: {stats_before['groups']} 个")
            print(f"   - 删除比赛: {stats_before['competitions']} 个")
            print(f"   - 删除普通用户: {stats_before['normal_users']} 个")
            print(f"   - 保留超级用户: {remaining_users} 个")
            
        print("")
        print("🎉 所有数据删除完成！")
        print(f"⏰ 完成时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
        return True
        
    except Exception as e:
        print(f"❌ 删除过程中发生错误: {e}")
        print("🔄 事务已回滚，数据未被删除")
        return False


def main():
    """
    主函数
    """
    print("🗑️  Cosplay数据库强制清理工具")
    print("=" * 50)
    print("⚠️  警告：此脚本将立即删除所有数据，无需确认！")
    print("=" * 50)
    print("")
    
    # 执行删除
    success = delete_all_data_force()
    
    if success:
        print("")
        print("=" * 50)
        print("✅ 数据库强制清理完成！")
        print("💡 提示：您可以重新运行数据导入脚本来添加新数据")
    else:
        print("")
        print("=" * 50)
        print("❌ 数据库强制清理失败！")
        print("💡 请检查错误信息并重试")


if __name__ == '__main__':
    main()