import requests
import json

# 测试API端点
base_url = "http://localhost:8000/api"

def test_api():
    print("测试API端点...")
    
    # 测试社团列表
    print("\n1. 测试社团列表:")
    try:
        response = requests.get(f"{base_url}/groups/")
        if response.status_code == 200:
            data = response.json()
            print(f"社团数量: {data['count']}")
            for group in data['results'][:3]:  # 只显示前3个
                print(f"  - {group['name']} (ID: {group['id']})")
        else:
            print(f"错误: {response.status_code}")
    except Exception as e:
        print(f"请求失败: {e}")
    
    # 测试视频列表
    print("\n2. 测试视频列表:")
    try:
        response = requests.get(f"{base_url}/videos/")
        if response.status_code == 200:
            data = response.json()
            print(f"视频数量: {data['count']}")
            for video in data['results'][:3]:  # 只显示前3个
                print(f"  - {video['title']} (社团: {video.get('group_name', '无')})")
        else:
            print(f"错误: {response.status_code}")
    except Exception as e:
        print(f"请求失败: {e}")
    
    # 测试特定社团的视频
    print("\n3. 测试社团视频过滤:")
    try:
        # 先获取第一个社团的ID
        groups_response = requests.get(f"{base_url}/groups/")
        if groups_response.status_code == 200:
            groups_data = groups_response.json()
            if groups_data['results']:
                first_group_id = groups_data['results'][0]['id']
                print(f"测试社团: {groups_data['results'][0]['name']} (ID: {first_group_id})")
                
                # 获取该社团的视频
                videos_response = requests.get(f"{base_url}/videos/?groups={first_group_id}")
                if videos_response.status_code == 200:
                    videos_data = videos_response.json()
                    print(f"该社团的视频数量: {videos_data['count']}")
                    for video in videos_data['results']:
                        print(f"  - {video['title']}")
                else:
                    print(f"获取社团视频失败: {videos_response.status_code}")
        else:
            print("获取社团列表失败")
    except Exception as e:
        print(f"请求失败: {e}")

if __name__ == "__main__":
    test_api() 