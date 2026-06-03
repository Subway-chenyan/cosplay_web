#!/usr/bin/env python3
"""
测试特殊查询：多奖项、特定奖项、简称匹配等
"""

import os
import sys
import django

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cosplay_api.settings')
django.setup()

from apps.text2sql.llm_sql_generator import generate_sql_via_llm, _heuristic_sql
import logging

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

def test_special_queries():
    """测试特殊查询"""

    # 特殊测试查询
    test_queries = [
        "同时获得金龙金奖和CJ金奖的团队有哪些",
        "动作设计奖项有哪些视频",
        "GDC有哪些视频",
        "GDCoser有哪些视频",
        "CJ金奖的团队有哪些",
        "金龙金奖和CJ金奖都获得的团队",
        "动作设计奖的视频",
    ]

    print("=" * 60)
    print("测试特殊查询")
    print("=" * 60)

    for query in test_queries:
        print(f"\n【查询】{query}")
        print("-" * 40)

        # 检查确定性模板
        deterministic_sql = _heuristic_sql(query)
        if deterministic_sql:
            print("✅ 使用确定性SQL模板")
            print(f"🔧 SQL长度: {len(deterministic_sql)} 字符")
            # 查询是否包含关键字段
            if "GROUP BY" in deterministic_sql:
                print("  - 包含GROUP BY，支持聚合查询")
            if "HAVING" in deterministic_sql:
                print("  - 包含HAVING，支持条件过滤")
            if "LIMIT" in deterministic_sql:
                print("  - 包含LIMIT，限制结果数量")
        else:
            print("❌ 没有找到确定性模板")

        print("\n" + "=" * 60)

if __name__ == "__main__":
    test_special_queries()