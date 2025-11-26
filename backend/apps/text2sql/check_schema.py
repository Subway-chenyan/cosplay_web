#!/usr/bin/env python3
"""
获取真实的数据库表结构信息
"""

import os
from dotenv import load_dotenv
from langchain_community.utilities import SQLDatabase

# 加载环境变量
load_dotenv()

def build_database_uri() -> str:
    """构建数据库连接URI"""
    return (
        f"postgresql+psycopg2://"
        f"{os.getenv('POSTGRES_USER')}:"
        f"{os.getenv('POSTGRES_PASSWORD')}@"
        f"{os.getenv('POSTGRES_IP')}:"
        f"{os.getenv('POSTGRES_PORT')}/"
        f"{os.getenv('POSTGRES_DB')}"
    )

def get_database_schema():
    """获取数据库schema信息"""
    db_uri = build_database_uri()
    db = SQLDatabase.from_uri(db_uri)

    print("=== 数据库表列表 ===")
    tables = db.get_usable_table_names()
    print(tables)

    print("\n=== 表结构信息 ===")
    # 获取关键表的详细结构
    important_tables = ['awards_award', 'awards_awardrecord', 'competitions_competitionyear', 'videos_video', 'groups_group']

    schema_info = ""
    for table in important_tables:
        if table in tables:
            print(f"\n--- {table} 表结构 ---")
            try:
                schema = db.get_table_info([table])
                print(schema)
                schema_info += schema + "\n\n"
            except Exception as e:
                print(f"获取 {table} 表结构失败: {e}")

    return schema_info

def sample_data():
    """查看样例数据"""
    db_uri = build_database_uri()
    db = SQLDatabase.from_uri(db_uri)

    print("\n=== 样例数据 ===")

    # 查看2025年金奖相关数据
    query = """
    SELECT DISTINCT
        ar.video_id AS video_id,
        ar.group_id AS group_id,
        a.name AS award_name,
        cy.year AS competition_year,
        v.title AS video_title,
        g.name AS group_name
    FROM awards_awardrecord ar
    JOIN awards_award a ON a.id = ar.award_id
    JOIN competitions_competitionyear cy ON cy.id = ar.competition_year_id
    LEFT JOIN videos_video v ON v.id = ar.video_id
    LEFT JOIN groups_group g ON g.id = ar.group_id
    WHERE cy.year = 2025 AND a.name ILIKE '%金奖%'
    LIMIT 5;
    """

    try:
        result = db.run(query)
        print(f"查询结果:\n{result}")
    except Exception as e:
        print(f"查询失败: {e}")

if __name__ == "__main__":
    print("🔍 获取真实数据库结构信息")
    print("=" * 50)

    try:
        schema_info = get_database_schema()
        sample_data()

        # 保存schema信息到文件
        with open("real_schema.txt", "w", encoding="utf-8") as f:
            f.write(schema_info)
        print("\n✅ Schema信息已保存到 real_schema.txt")

    except Exception as e:
        print(f"❌ 执行失败: {e}")
        import traceback
        traceback.print_exc()