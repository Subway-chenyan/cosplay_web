#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
B站用户视频爬虫
根据用户mid获取所有投稿视频信息
支持APP API签名机制
"""

import requests
import json
import time
import csv
import os
import hashlib
import urllib.parse
from typing import List, Dict, Optional


class BilibiliVideoCrawler:
    def __init__(self, appkey: str = None, appsec: str = None):
        self.base_url = "https://api.bilibili.com"
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.bilibili.com/',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-site'
        }
        
        # APP API签名配置
        self.appkey = appkey or "1d8b6e7d45233436"
        self.appsec = appsec or "560c52ccd288fed045859ed18bffd973"
        
        # 支持的appkey列表
        self.supported_appkeys = {
            "1d8b6e7d45233436": "560c52ccd288fed045859ed18bffd973",  # 安卓客户端
            "07da50c9a9bf8f80": "25bdede4e1581d9ce9f5d1b4a0b4b9d8",  # iOS客户端
            "4409e2ce8ffd12b8": "59b43e04ad6965f34319062b478f83dd",  # TV端
            "57263273bc6b67f6": "a0488e488474068d",                    # 概念版
        }
        
    def get_user_videos(self, mid: int, page_size: int = 30, use_app_sign: bool = True) -> List[Dict]:
        """
        获取指定用户的所有投稿视频
        
        Args:
            mid: 用户mid
            page_size: 每页获取的视频数量
            use_app_sign: 是否使用APP API签名（默认启用）
            
        Returns:
            视频信息列表
        """
        videos = []
        page = 1
        max_retries = 30
        retry_delay = 2
        
        while True:
            url = f"{self.base_url}/x/space/arc/search"
            params = {
                'mid': mid,
                'ps': page_size,
                'tid': 0,
                'pn': page,
                'keyword': '',
                'order': 'pubdate',
                'order_avoided': 'true'
            }
            
            # 如果使用APP签名，添加签名参数
            if use_app_sign:
                params = self._generate_app_sign(params)
            
            for attempt in range(max_retries):
                try:
                    response = requests.get(url, headers=self.headers, params=params, timeout=10)
                    response.raise_for_status()
                    data = response.json()
                    
                    if data.get('code') == -352:
                        print(f"API限制，等待{retry_delay}秒后重试...")
                        time.sleep(retry_delay)
                        continue
                    elif data.get('code') != 0:
                        print(f"API返回错误: {data.get('message', '未知错误')}")
                        if use_app_sign:
                            print("尝试不使用APP签名...")
                            return self.get_user_videos(mid, page_size, use_app_sign=False)
                        return videos
                    
                    vlist = data.get('data', {}).get('list', {}).get('vlist', [])
                    if not vlist:
                        print(f"用户 {mid} 的所有视频已获取完成，共{len(videos)}个视频")
                        return videos
                    
                    videos.extend(vlist)
                    print(f"已获取第{page}页，共{len(vlist)}个视频")
                    
                    page += 1
                    time.sleep(2)  # 增加延迟避免限制
                    break
                    
                except requests.RequestException as e:
                    if attempt < max_retries - 1:
                        print(f"请求失败，{retry_delay}秒后重试: {e}")
                        time.sleep(retry_delay)
                    else:
                        print(f"请求失败，已重试{max_retries}次: {e}")
                        return videos
        
        return videos
    
    def _generate_app_sign(self, params: Dict[str, str], timestamp: bool = True, debug: bool = False) -> Dict[str, str]:
        """
        为请求参数生成APP API签名
        
        Args:
            params: 原始请求参数
            timestamp: 是否添加时间戳参数（默认为True）
            debug: 是否输出调试信息
            
        Returns:
            包含签名的参数字典
        """
        # 创建参数的副本以避免修改原始参数
        params_copy = params.copy()
        
        # 添加时间戳（如果需要）
        if timestamp:
            params_copy['ts'] = str(int(time.time()))
        
        # 添加appkey
        params_copy.update({'appkey': self.appkey})
        
        # 按照key排序参数
        sorted_params = dict(sorted(params_copy.items()))
        
        # URL编码参数
        query = urllib.parse.urlencode(sorted_params)
        
        # 计算签名
        sign = hashlib.md5((query + self.appsec).encode()).hexdigest()
        
        # 添加签名到参数
        params_copy.update({'sign': sign})
        
        if debug:
            print(f"[DEBUG] APP签名参数: {sorted_params}")
            print(f"[DEBUG] 签名前字符串: {query + self.appsec}")
            print(f"[DEBUG] 计算签名: {sign}")
            print(f"[DEBUG] 最终参数: {params_copy}")
        
        return params_copy

    def get_video_details(self, bvid: str) -> Optional[Dict]:
        """
        获取视频详细信息
        
        Args:
            bvid: 视频BV号
            
        Returns:
            视频详细信息
        """
        url = f"{self.base_url}/x/web-interface/view"
        params = {'bvid': bvid}
        
        try:
            response = requests.get(url, headers=self.headers, params=params)
            response.raise_for_status()
            data = response.json()
            
            if data.get('code') == 0:
                return data.get('data')
            else:
                print(f"获取视频{bvid}详情失败: {data.get('message')}")
                return None
                
        except requests.RequestException as e:
            print(f"请求视频{bvid}详情失败: {e}")
            return None
    
    def save_to_csv(self, videos: List[Dict], filename: str = "bilibili_videos.csv"):
        """
        将视频信息保存到CSV文件
        
        Args:
            videos: 视频信息列表
            filename: 输出文件名
        """
        if not videos:
            print("没有视频数据需要保存")
            return
        
        fieldnames = [
            'aid', 'bvid', 'title', 'description', 'pic', 'author', 'mid',
            'created', 'length', 'play', 'comment', 'video_review', 'favorites',
            'coin', 'share', 'like', 'dislike', 'video_url', 'cover_url'
        ]
        
        with open(filename, 'w', newline='', encoding='utf-8-sig') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            writer.writeheader()
            
            for video in videos:
                # 构建完整的视频URL
                video_url = f"https://www.bilibili.com/video/{video.get('bvid', '')}"
                
                # 获取高清封面URL
                cover_url = video.get('pic', '')
                if cover_url and 'http' not in cover_url:
                    cover_url = f"https:{cover_url}"
                
                writer.writerow({
                    'aid': video.get('aid'),
                    'bvid': video.get('bvid'),
                    'title': video.get('title', '').replace('\n', ' ').replace('\r', ''),
                    'description': video.get('description', '').replace('\n', ' ').replace('\r', ''),
                    'pic': cover_url,
                    'author': video.get('author'),
                    'mid': video.get('mid'),
                    'created': time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(video.get('created', 0))),
                    'length': video.get('length'),
                    'play': video.get('play'),
                    'comment': video.get('comment'),
                    'video_review': video.get('video_review'),
                    'favorites': video.get('favorites'),
                    'coin': video.get('coin'),
                    'share': video.get('share'),
                    'like': video.get('like'),
                    'dislike': video.get('dislike'),
                    'video_url': video_url,
                    'cover_url': cover_url
                })
        
        print(f"视频信息已保存到 {filename}")
    
    def save_to_json(self, videos: List[Dict], filename: str = "bilibili_videos.json"):
        """
        将视频信息保存到JSON文件
        
        Args:
            videos: 视频信息列表
            filename: 输出文件名
        """
        if not videos:
            print("没有视频数据需要保存")
            return
        
        # 添加完整的URL信息
        for video in videos:
            video['video_url'] = f"https://www.bilibili.com/video/{video.get('bvid', '')}"
            video['cover_url'] = f"https:{video.get('pic', '')}" if video.get('pic') and 'http' not in video.get('pic') else video.get('pic')
            video['created_formatted'] = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(video.get('created', 0)))
        
        with open(filename, 'w', encoding='utf-8') as jsonfile:
            json.dump(videos, jsonfile, ensure_ascii=False, indent=2)
        
        print(f"视频信息已保存到 {filename}")
    
    def crawl_user_videos(self, mid: int, output_format: str = "both"):
        """
        主函数：爬取用户所有视频
        
        Args:
            mid: 用户mid
            output_format: 输出格式，可选"csv", "json", "both"
        """
        print(f"开始爬取用户 {mid} 的所有投稿视频...")
        
        # 获取视频列表
        videos = self.get_user_videos(mid)
        
        if not videos:
            print("未获取到任何视频")
            return
        
        # 创建输出目录
        output_dir = f"user_{mid}_videos"
        os.makedirs(output_dir, exist_ok=True)
        
        # 保存结果
        if output_format in ["csv", "both"]:
            csv_filename = os.path.join(output_dir, f"user_{mid}_videos.csv")
            self.save_to_csv(videos, csv_filename)
        
        if output_format in ["json", "both"]:
            json_filename = os.path.join(output_dir, f"user_{mid}_videos.json")
            self.save_to_json(videos, json_filename)
        
        print(f"爬取完成！共获取到 {len(videos)} 个视频")


def main():
    """主函数"""
    crawler = BilibiliVideoCrawler()
    
    # 示例：爬取用户视频
    # 请替换为实际的用户mid
    target_mid = input("请输入要爬取的用户mid: ").strip()
    
    try:
        mid = int(target_mid)
        crawler.crawl_user_videos(mid)
    except ValueError:
        print("请输入有效的用户mid（数字）")


if __name__ == "__main__":
    main()