#!/usr/bin/env python3
"""
测试特殊查询：多奖项、特定奖项、简称匹配等
"""

import os
import sys
import importlib.util
import logging

# 配置日志
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

def load_heuristic_sql():
    """加载_heuristic_sql函数"""
    spec = importlib.util.spec_from_file_location("llm_sql_generator",
        "/home/ubuntu/cosplay_web/backend/apps/text2sql/llm_sql_generator.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module._heuristic_sql

def test_special_queries():
    """测试特殊查询"""

    _heuristic_sql = load_heuristic_sql()

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
            # 显示查询的关键字
            if "金龙" in query and "CJ" in query:
                if "金龙" in deterministic_sql and "CJ" in deterministic_sql:
                    print("  - ✅ 正确识别了金龙和CJ两个奖项")
                elif ("金龙" in deterministic_sql or "金龙金奖" in deterministic_sql) and ("CJ" in deterministic_sql or "ChinaJoy" in deterministic_sql):
                    print("  - ✅ 正确识别了金龙和CJ相关奖项")
                else:
                    print("  - ❌ 未能正确识别所有奖项")
            elif "动作设计" in query:
                if "动作设计" in deterministic_sql or "动作" in deterministic_sql:
                    print("  - ✅ 正确识别了动作设计奖项")
                else:
                    print("  - ❌ 未能正确识别动作设计奖项")
            elif "GDC" in query or "GDCoser" in query:
                if "GDC" in deterministic_sql or "GDCoser" in deterministic_sql:
                    print("  - ✅ 正确识别了GDC")
                else:
                    print("  - ❌ 未能正确识别GDC")
        else:
            print("❌ 没有找到确定性模板")

        print("\n" + "=" * 60)

if __name__ == "__main__":
    test_special_queries()