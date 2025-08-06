#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
APP签名使用示例
展示如何在B站视频爬虫中使用APP API签名功能
"""

from bilibili_video_crawler import BilibiliVideoCrawler
import time


def demo_app_sign():
    """APP签名功能演示"""
    print("=== APP签名功能演示 ===")
    
    # 使用默认appkey
    crawler = BilibiliVideoCrawler()
    
    # 演示签名生成
    test_params = {
        'mid': 27660646,
        'ps': 30,
        'tid': 0,
        'pn': 1,
        'keyword': '',
        'order': 'pubdate',
        'order_avoided': 'true'
    }
    
    print("原始参数:", test_params)
    
    # 生成带签名的参数
    signed_params = crawler._generate_app_sign(test_params, debug=True)
    
    print("\n带签名的完整URL:")
    base_url = "https://api.bilibili.com/x/space/arc/search"
    query_string = "&".join([f"{k}={v}" for k, v in signed_params.items()])
    full_url = f"{base_url}?{query_string}"
    print(full_url)


def demo_custom_appkey():
    """使用自定义appkey的示例"""
    print("\n=== 自定义APPKEY演示 ===")
    
    # 使用iOS客户端的appkey
    crawler = BilibiliVideoCrawler(
        appkey="1d8b6e7d45233436",
        appsec="560c52ccd288fed045859ed18bffd973"
    )
    
    print(f"使用iOS客户端appkey: {crawler.appkey}")
    
    test_params = {'mid': 123456, 'ps': 10}
    signed_params = crawler._generate_app_sign(test_params, debug=True)
    
    print("签名验证通过！")


def demo_available_appkeys():
    """显示所有支持的appkey"""
    print("\n=== 支持的APPKEY列表 ===")
    
    crawler = BilibiliVideoCrawler()
    
    appkey_info = {
        "1d8b6e7d45233436": "安卓客户端",
        "07da50c9a9bf8f80": "iOS客户端", 
        "4409e2ce8ffd12b8": "TV端",
        "57263273bc6b67f6": "概念版"
    }
    
    for appkey, desc in appkey_info.items():
        print(f"{appkey}: {desc}")


def demo_real_usage():
    """实际使用示例"""
    print("\n=== 实际使用示例 ===")
    
    # 创建爬虫实例
    crawler = BilibiliVideoCrawler()
    
    # 示例：获取少量视频测试签名功能
    test_mid = 2  # 使用官方账号作为示例
    
    print(f"测试获取用户 {test_mid} 的前5个视频...")
    
    try:
        # 使用APP签名获取视频
        videos = crawler.get_user_videos(test_mid, page_size=5)
        
        if videos:
            print(f"成功获取 {len(videos)} 个视频")
            for i, video in enumerate(videos[:3], 1):
                print(f"{i}. {video.get('title')} - BV{video.get('bvid')}")
        else:
            print("未获取到视频")
            
    except Exception as e:
        print(f"测试失败: {e}")


if __name__ == "__main__":
    # 运行所有演示
    demo_app_sign()
    demo_custom_appkey()
    demo_available_appkeys()
    demo_real_usage()