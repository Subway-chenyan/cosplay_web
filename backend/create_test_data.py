#!/usr/bin/env python
import os
import sys
import django

# 添加项目路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cosplay_api.settings')
django.setup()

from apps.groups.models import Group
from django.contrib.auth import get_user_model

User = get_user_model()

def create_test_groups():
    """创建测试社团数据"""
    
    # 创建测试用户
    user, created = User.objects.get_or_create(
        username='testuser',
        defaults={
            'email': 'test@example.com',
            'first_name': 'Test',
            'last_name': 'User'
        }
    )
    
    test_groups = [
        {
            'name': '北京星辰社',
            'description': '专注动漫cosplay的优秀社团，致力于打造高质量的cosplay作品',
            'province': '北京市',
            'city': '北京市',
            'location': '朝阳区CBD商务区',
            'website': 'https://bjxingchen.com',
            'video_count': 15,
            'award_count': 8
        },
        {
            'name': '帝都幻想团',
            'description': '致力于高质量cosplay作品，汇聚了众多优秀的cosplayer',
            'province': '北京市',
            'city': '北京市',
            'location': '海淀区中关村',
            'video_count': 12,
            'award_count': 5
        },
        {
            'name': '魔都cos团',
            'description': '上海地区知名cosplay社团，以创新和精致著称',
            'province': '上海市',
            'city': '上海市',
            'location': '浦东新区陆家嘴',
            'video_count': 18,
            'award_count': 10
        },
        {
            'name': '申城幻梦',
            'description': '追求完美的cosplay艺术，注重细节和表演',
            'province': '上海市',
            'city': '上海市',
            'location': '徐汇区淮海路',
            'video_count': 14,
            'award_count': 7
        },
        {
            'name': '羊城动漫社',
            'description': '广东最大的cosplay社团之一，历史悠久',
            'province': '广东省',
            'city': '广州市',
            'location': '天河区珠江新城',
            'video_count': 22,
            'award_count': 12
        },
        {
            'name': '深圳次元社',
            'description': '年轻活力的cosplay团体，充满创新精神',
            'province': '广东省',
            'city': '深圳市',
            'location': '南山区科技园',
            'video_count': 16,
            'award_count': 9
        },
        {
            'name': '珠海幻想',
            'description': '专业的cosplay制作团队，技术精湛',
            'province': '广东省',
            'city': '珠海市',
            'location': '香洲区拱北',
            'video_count': 11,
            'award_count': 6
        },
        {
            'name': '金陵cos社',
            'description': '历史悠久的cosplay社团，传承与创新并重',
            'province': '江苏省',
            'city': '南京市',
            'location': '鼓楼区新街口',
            'video_count': 13,
            'award_count': 8
        },
        {
            'name': '苏州梦幻',
            'description': '江南风格的cosplay团体，优雅精致',
            'province': '江苏省',
            'city': '苏州市',
            'location': '姑苏区观前街',
            'video_count': 10,
            'award_count': 5
        },
        {
            'name': '杭州天使团',
            'description': '西湖边的cosplay精灵，充满诗意',
            'province': '浙江省',
            'city': '杭州市',
            'location': '西湖区文三路',
            'video_count': 14,
            'award_count': 7
        },
        {
            'name': '宁波海韵社',
            'description': '海港城市的动漫社团，开放包容',
            'province': '浙江省',
            'city': '宁波市',
            'location': '海曙区天一广场',
            'video_count': 9,
            'award_count': 4
        },
        {
            'name': '成都熊猫社',
            'description': '天府之国的cosplay明星，热情洋溢',
            'province': '四川省',
            'city': '成都市',
            'location': '锦江区春熙路',
            'video_count': 17,
            'award_count': 9
        },
        {
            'name': '川渝联盟',
            'description': '西南地区cosplay联盟，团结协作',
            'province': '四川省',
            'city': '成都市',
            'location': '武侯区高新区',
            'video_count': 12,
            'award_count': 6
        },
        {
            'name': '武汉樱花社',
            'description': '江城最美的cosplay团体，如樱花般绚烂',
            'province': '湖北省',
            'city': '武汉市',
            'location': '武昌区中南路',
            'video_count': 15,
            'award_count': 8
        },
        {
            'name': '青岛海风社',
            'description': '海滨城市的cosplay社团，清新自然',
            'province': '山东省',
            'city': '青岛市',
            'location': '市南区五四广场',
            'video_count': 11,
            'award_count': 5
        }
    ]
    
    created_count = 0
    for group_data in test_groups:
        group, created = Group.objects.get_or_create(
            name=group_data['name'],
            defaults={
                **group_data,
                'created_by': user,
                'is_active': True
            }
        )
        if created:
            created_count += 1
            print(f"创建社团: {group.name} - {group.province} {group.city}")
        else:
            print(f"社团已存在: {group.name}")
    
    print(f"\n总共创建了 {created_count} 个新社团")
    print(f"数据库中现有 {Group.objects.count()} 个社团")

if __name__ == '__main__':
    create_test_groups()