#!/usr/bin/env python
"""
删除后端数据库中所有数据的脚本
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


def confirm_deletion():
    """
    确认删除操作
    """
    print("⚠️  警告：此操作将删除数据库中的所有数据！")
    print("📊 将要删除的数据包括：")
    print("   - 所有视频记录")
    print("   - 所有社团信息")
    print("   - 所有比赛信息")
    print("   - 所有奖项和获奖记录")
    print("   - 所有标签和标签关联")
    print("   - 所有用户账户（除超级用户外）")
    print("")
    
    # 显示当前数据统计
    try:
        video_count = Video.objects.count()
        group_count = Group.objects.count()
        competition_count = Competition.objects.count()
        award_count = Award.objects.count()
        award_record_count = AwardRecord.objects.count()
        tag_count = Tag.objects.count()
        video_tag_count = VideoTag.objects.count()
        user_count = User.objects.count()
        superuser_count = User.objects.filter(is_superuser=True).count()
        
        print("📈 当前数据统计：")
        print(f"   - 视频: {video_count} 条")
        print(f"   - 社团: {group_count} 个")
        print(f"   - 比赛: {competition_count} 个")
        print(f"   - 奖项: {award_count} 个")
        print(f"   - 获奖记录: {award_record_count} 条")
        print(f"   - 标签: {tag_count} 个")
        print(f"   - 视频标签关联: {video_tag_count} 条")
        print(f"   - 用户: {user_count} 个 (其中超级用户: {superuser_count} 个)")
        print("")
        
    except Exception as e:
        print(f"⚠️  无法获取数据统计: {e}")
        print("")
    
    print("🔒 注意：超级用户账户将被保留")
    print("")
    
    while True:
        confirm = input("确认删除所有数据吗？请输入 'DELETE' 来确认，或输入 'n' 取消: ").strip()
        if confirm == 'DELETE':
            return True
        elif confirm.lower() in ['n', 'no', '取消']:
            return False
        else:
            print("请输入 'DELETE' 确认删除，或输入 'n' 取消操作")


def delete_all_data():
    """
    删除所有数据
    """
    print("🗑️  开始删除数据...")
    print("")
    
    try:
        with transaction.atomic():
            # 1. 删除获奖记录（依赖奖项和视频/社团）
            print("🔄 删除获奖记录...")
            award_record_count = AwardRecord.objects.count()
            AwardRecord.objects.all().delete()
            print(f"✅ 已删除 {award_record_count} 条获奖记录")
            
            # 2. 删除奖项（依赖比赛）
            print("🔄 删除奖项...")
            award_count = Award.objects.count()
            Award.objects.all().delete()
            print(f"✅ 已删除 {award_count} 个奖项")
            
            # 3. 删除视频标签关联（依赖视频和标签）
            print("🔄 删除视频标签关联...")
            video_tag_count = VideoTag.objects.count()
            VideoTag.objects.all().delete()
            print(f"✅ 已删除 {video_tag_count} 条视频标签关联")
            
            # 4. 删除视频（依赖社团、比赛、用户）
            print("🔄 删除视频...")
            video_count = Video.objects.count()
            Video.objects.all().delete()
            print(f"✅ 已删除 {video_count} 个视频")
            
            # 5. 删除标签
            print("🔄 删除标签...")
            tag_count = Tag.objects.count()
            Tag.objects.all().delete()
            print(f"✅ 已删除 {tag_count} 个标签")
            
            # 6. 删除社团
            print("🔄 删除社团...")
            group_count = Group.objects.count()
            Group.objects.all().delete()
            print(f"✅ 已删除 {group_count} 个社团")
            
            # 7. 删除比赛
            print("🔄 删除比赛...")
            competition_count = Competition.objects.count()
            Competition.objects.all().delete()
            print(f"✅ 已删除 {competition_count} 个比赛")
            
            # 8. 删除普通用户（保留超级用户）
            print("🔄 删除普通用户（保留超级用户）...")
            normal_users = User.objects.filter(is_superuser=False)
            normal_user_count = normal_users.count()
            normal_users.delete()
            print(f"✅ 已删除 {normal_user_count} 个普通用户")
            
            remaining_users = User.objects.count()
            print(f"🔒 保留了 {remaining_users} 个超级用户")
            
        print("")
        print("🎉 所有数据删除完成！")
        print(f"⏰ 删除时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        
    except Exception as e:
        print(f"❌ 删除过程中发生错误: {e}")
        print("🔄 事务已回滚，数据未被删除")
        return False
    
    return True


def main():
    """
    主函数
    """
    print("🗑️  Cosplay数据库清理工具")
    print("=" * 50)
    print("")
    
    # 确认删除
    if not confirm_deletion():
        print("❌ 操作已取消")
        return
    
    print("")
    print("=" * 50)
    
    # 执行删除
    success = delete_all_data()
    
    if success:
        print("")
        print("=" * 50)
        print("✅ 数据库清理完成！")
        print("💡 提示：您可以重新运行数据导入脚本来添加新数据")
    else:
        print("")
        print("=" * 50)
        print("❌ 数据库清理失败！")
        print("💡 请检查错误信息并重试")


if __name__ == '__main__':
    main()