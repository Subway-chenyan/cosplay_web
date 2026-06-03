#!/usr/bin/env python3
"""
测试智能搜索API端点 - 特殊查询
"""

import requests
import json

def test_agent_search():
    """测试智能搜索API"""

    url = "http://localhost:8000/api/videos/agent-search/"

    test_queries = [
        "同时获得金龙金奖和CJ金奖的团队有哪些",
        "动作设计奖项有哪些视频",
        "GDC有哪些视频",
        "GDCoser有哪些视频",
        "金龙金奖和CJ金奖都获得的团队",
    ]

    print("=" * 60)
    print("测试特殊查询API端点")
    print("=" * 60)

    for query in test_queries:
        print(f"\n【查询】{query}")
        print("-" * 40)

        try:
            response = requests.post(
                url,
                json={"query": query},
                timeout=10
            )

            print(f"📊 响应状态码: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                print("✅ API调用成功")

                if "natural_language_overview" in data:
                    print(f"💬 概述: {data['natural_language_overview'][:100]}...")
                else:
                    print("❌ 缺少 natural_language_overview 字段")

                if "video_id_list" in data:
                    print(f"🎥 视频ID数量: {len(data['video_id_list'])}")
                else:
                    print("❌ 缺少 video_id_list 字段")

                if "group_id_list" in data:
                    print(f"👥 社团ID数量: {len(data['group_id_list'])}")
                else:
                    print("❌ 缺少 group_id_list 字段")

            else:
                print(f"❌ API调用失败: {response.status_code}")
                print(f"错误内容: {response.text}")

        except requests.exceptions.ConnectionError:
            print("❌ 无法连接到API服务器，请确保后端服务正在运行")
            print("运行命令: cd backend && python manage.py runserver")
        except Exception as e:
            print(f"❌ 异常: {str(e)}")

        print("\n" + "=" * 60)

if __name__ == "__main__":
    test_agent_search()