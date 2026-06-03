#!/usr/bin/env python3
"""
调试SQL生成
"""

import os
import sys
import importlib.util

def load_heuristic_sql():
    """加载_heuristic_sql函数"""
    spec = importlib.util.spec_from_file_location("llm_sql_generator",
        "/home/ubuntu/cosplay_web/backend/apps/text2sql/llm_sql_generator.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module._heuristic_sql

def debug_queries():
    """调试查询"""

    _heuristic_sql = load_heuristic_sql()

    queries = [
        "同时获得金龙金奖和CJ金奖的团队有哪些",
        "金龙金奖和CJ金奖都获得的团队",
    ]

    for query in queries:
        print(f"\n【查询】{query}")
        print("-" * 40)

        sql = _heuristic_sql(query)
        if sql:
            print("SQL包含了以下关键词:")
            keywords = ["金龙", "CJ", "ChinaJoy", "金龙金奖", "CJ金奖"]
            for keyword in keywords:
                if keyword in sql:
                    print(f"  ✅ {keyword}")
                else:
                    print(f"  ❌ {keyword}")

            # 检查EXISTS子句
            if "EXISTS" in sql:
                print("  ✅ 使用了EXISTS子句进行多奖项查询")

            # 显示部分SQL
            lines = sql.split('\n')
            for i, line in enumerate(lines):
                if "金龙" in line or "CJ" in line:
                    print(f"    第{i+1}行: {line.strip()}")

if __name__ == "__main__":
    debug_queries()