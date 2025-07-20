#!/usr/bin/env python3
"""
测试标签分类更新
"""
import requests
import json

def test_tag_categories():
    """测试标签分类更新"""
    base_url = "http://localhost:8000/api"
    
    print("🔍 测试标签分类更新")
    print("=" * 50)
    
    # 获取所有标签
    response = requests.get(f"{base_url}/tags/")
    if response.status_code == 200:
        tags = response.json()['results']
        print(f"✅ 获取到 {len(tags)} 个标签")
        
        # 按分类统计
        categories = {}
        for tag in tags:
            category = tag['category']
            if category not in categories:
                categories[category] = []
            categories[category].append(tag['name'])
        
        print("\n📊 标签分类统计:")
        for category, tag_names in categories.items():
            print(f"  {category}: {len(tag_names)} 个标签")
            print(f"    {', '.join(tag_names[:5])}{'...' if len(tag_names) > 5 else ''}")
        
        # 验证IP分类
        ip_tags = categories.get('IP', [])
        print(f"\n🎮 IP分类标签 ({len(ip_tags)} 个):")
        for tag_name in ip_tags:
            print(f"  - {tag_name}")
        
        # 验证没有旧分类
        old_categories = ['游戏IP', '动漫IP', '类型']
        for old_cat in old_categories:
            if old_cat in categories:
                print(f"❌ 发现旧分类: {old_cat}")
            else:
                print(f"✅ 旧分类已删除: {old_cat}")
        
        # 测试按IP分类过滤
        response = requests.get(f"{base_url}/tags/?category=IP")
        if response.status_code == 200:
            ip_filtered_tags = response.json()['results']
            print(f"\n✅ IP分类过滤测试成功，返回 {len(ip_filtered_tags)} 个标签")
        else:
            print(f"❌ IP分类过滤测试失败: {response.status_code}")
    
    else:
        print(f"❌ 获取标签失败: {response.status_code}")

if __name__ == "__main__":
    test_tag_categories() 