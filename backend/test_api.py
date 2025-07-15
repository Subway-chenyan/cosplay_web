#!/usr/bin/env python
"""
API连通性测试脚本
用于测试cosplay数据库后端API的各个端点
"""

import requests
import json
import sys
from typing import Dict, Any


class APITester:
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.access_token = None
        
    def print_result(self, endpoint: str, response: requests.Response, expected_status: int = 200):
        """打印测试结果"""
        status = "✅" if response.status_code == expected_status else "❌"
        print(f"{status} {endpoint} - Status: {response.status_code}")
        
        if response.status_code != expected_status:
            print(f"   Expected: {expected_status}, Got: {response.status_code}")
            print(f"   Response: {response.text}")
        else:
            try:
                data = response.json()
                if isinstance(data, list):
                    print(f"   返回列表，共 {len(data)} 项")
                elif isinstance(data, dict):
                    if 'results' in data:
                        print(f"   分页结果，共 {data.get('count', 0)} 项")
                    else:
                        print(f"   返回对象: {list(data.keys())[:5]}")
            except:
                print(f"   Response length: {len(response.text)}")
    
    def test_health_check(self):
        """测试健康检查"""
        print("\n🔍 测试健康检查")
        response = self.session.get(f"{self.base_url}/api/health/")
        self.print_result("GET /api/health/", response)
        return response.status_code == 200
    
    def test_login(self, username: str = "cosplay_fan_1", password: str = "testpass123"):
        """测试登录"""
        print(f"\n🔐 测试用户登录 ({username})")
        login_data = {
            "username": username,
            "password": password
        }
        response = self.session.post(f"{self.base_url}/api/auth/login/", json=login_data)
        self.print_result("POST /api/auth/login/", response)
        
        if response.status_code == 200:
            data = response.json()
            self.access_token = data.get('access')
            self.session.headers.update({
                'Authorization': f'Bearer {self.access_token}'
            })
            print(f"   登录成功，用户: {data.get('user', {}).get('username')}")
            return True
        return False
    
    def test_videos_api(self):
        """测试视频API"""
        print("\n🎬 测试视频API")
        
        # 获取视频列表
        response = self.session.get(f"{self.base_url}/api/videos/")
        self.print_result("GET /api/videos/", response)
        
        if response.status_code == 200:
            videos = response.json()
            if videos.get('results'):
                # 获取第一个视频的详情
                first_video_id = videos['results'][0]['id']
                response = self.session.get(f"{self.base_url}/api/videos/{first_video_id}/")
                self.print_result(f"GET /api/videos/{first_video_id}/", response)
                
                # 测试视频评论
                response = self.session.get(f"{self.base_url}/api/videos/{first_video_id}/comments/")
                self.print_result(f"GET /api/videos/{first_video_id}/comments/", response)
    
    def test_groups_api(self):
        """测试社团API"""
        print("\n👥 测试社团API")
        
        # 获取社团列表
        response = self.session.get(f"{self.base_url}/api/groups/")
        self.print_result("GET /api/groups/", response)
        
        if response.status_code == 200:
            groups = response.json()
            if groups.get('results'):
                # 获取第一个社团的详情
                first_group_id = groups['results'][0]['id']
                response = self.session.get(f"{self.base_url}/api/groups/{first_group_id}/")
                self.print_result(f"GET /api/groups/{first_group_id}/", response)
    
    def test_tags_api(self):
        """测试标签API"""
        print("\n🏷️ 测试标签API")
        
        # 获取标签列表
        response = self.session.get(f"{self.base_url}/api/tags/")
        self.print_result("GET /api/tags/", response)
    
    def test_performances_api(self):
        """测试演出API"""
        print("\n🎭 测试演出API")
        
        # 获取演出列表
        response = self.session.get(f"{self.base_url}/api/performances/")
        self.print_result("GET /api/performances/", response)
    
    def test_competitions_api(self):
        """测试比赛API"""
        print("\n🏆 测试比赛API")
        
        # 获取比赛列表
        response = self.session.get(f"{self.base_url}/api/competitions/")
        self.print_result("GET /api/competitions/", response)
    
    def test_awards_api(self):
        """测试奖项API"""
        print("\n🥇 测试奖项API")
        
        # 获取奖项列表
        response = self.session.get(f"{self.base_url}/api/awards/")
        self.print_result("GET /api/awards/", response)
    
    def test_users_api(self):
        """测试用户API"""
        print("\n👤 测试用户API")
        
        # 获取当前用户信息
        response = self.session.get(f"{self.base_url}/api/auth/me/")
        self.print_result("GET /api/auth/me/", response)
        
        # 获取用户资料
        response = self.session.get(f"{self.base_url}/api/users/profile/")
        self.print_result("GET /api/users/profile/", response)
    
    def test_search_and_filter(self):
        """测试搜索和过滤功能"""
        print("\n🔍 测试搜索和过滤")
        
        # 搜索视频
        response = self.session.get(f"{self.base_url}/api/videos/?search=原神")
        self.print_result("GET /api/videos/?search=原神", response)
        
        # 按状态过滤
        response = self.session.get(f"{self.base_url}/api/videos/?status=published")
        self.print_result("GET /api/videos/?status=published", response)
        
        # 按标签分类过滤
        response = self.session.get(f"{self.base_url}/api/tags/?category=游戏IP")
        self.print_result("GET /api/tags/?category=游戏IP", response)
    
    def test_api_docs(self):
        """测试API文档"""
        print("\n📚 测试API文档")
        
        # 测试Swagger文档
        response = self.session.get(f"{self.base_url}/api/docs/")
        self.print_result("GET /api/docs/", response)
        
        # 测试Schema
        response = self.session.get(f"{self.base_url}/api/schema/")
        self.print_result("GET /api/schema/", response)
    
    def run_all_tests(self):
        """运行所有测试"""
        print("🚀 开始API连通性测试")
        print(f"📡 测试服务器: {self.base_url}")
        
        # 基础连通性测试
        if not self.test_health_check():
            print("❌ 健康检查失败，请检查服务器是否正在运行")
            return False
        
        # 认证测试
        if not self.test_login():
            print("❌ 登录失败，将进行匿名测试")
        
        # API端点测试
        self.test_videos_api()
        self.test_groups_api()
        self.test_tags_api()
        self.test_performances_api()
        self.test_competitions_api()
        self.test_awards_api()
        self.test_users_api()
        
        # 高级功能测试
        self.test_search_and_filter()
        self.test_api_docs()
        
        print("\n✅ API测试完成！")
        print(f"🌐 访问Swagger文档: {self.base_url}/api/docs/")
        print(f"🔗 访问管理后台: {self.base_url}/admin/")
        
        return True


def main():
    """主函数"""
    base_url = "http://localhost:8000"
    
    if len(sys.argv) > 1:
        base_url = sys.argv[1]
    
    tester = APITester(base_url)
    tester.run_all_tests()


if __name__ == "__main__":
    main() 