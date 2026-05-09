import os
import logging
from typing import Optional
import psycopg2
from psycopg2 import pool

logger = logging.getLogger("bilibili_agent.db")

class DatabaseManager:
    """数据库管理器"""

    def __init__(self):
        # 直接使用环境变量，避免Django依赖
        self.host = os.getenv('DB_HOST', 'localhost')
        self.port = os.getenv('DB_PORT', '5433')
        self.database = os.getenv('DB_NAME', 'cosplay_db')
        self.user = os.getenv('DB_USER', 'cosplay_user')
        self.password = os.getenv('DB_PASSWORD', 'cosplay_password_2024')
        logger.info(f"使用环境变量数据库配置: {self.host}:{self.port}/{self.database}")

    def get_connection(self):
        """获取数据库连接"""
        try:
            conn = psycopg2.connect(
                host=self.host,
                port=self.port,
                database=self.database,
                user=self.user,
                password=self.password
            )
            logger.info(f"数据库连接成功: {self.host}:{self.port}/{self.database}")
            return conn
        except Exception as e:
            logger.error(f"数据库连接失败: {e}")
            raise

    def run(self, query, params=None):
        """执行SQL查询"""
        conn = None
        try:
            conn = self.get_connection()
            with conn.cursor() as cursor:
                if params:
                    cursor.execute(query, params)
                else:
                    cursor.execute(query)

                # 如果是查询操作，获取结果
                if query.strip().lower().startswith(('select', 'show', 'describe', 'explain')):
                    result = cursor.fetchall()
                    # 获取列名
                    if cursor.description:
                        columns = [desc[0] for desc in cursor.description]
                        # 如果只有一行，返回字典
                        if len(result) == 1:
                            return {columns[i]: result[0][i] for i in range(len(columns))}
                        # 否则返回列表
                        return [dict(zip(columns, row)) for row in result]
                    return result
                else:
                    # 更新操作，返回影响的行数
                    conn.commit()
                    return cursor.rowcount
        except Exception as e:
            logger.error(f"SQL执行失败: {e}")
            if conn:
                conn.rollback()
            raise
        finally:
            if conn:
                conn.close()

# 全局数据库管理器实例
db_manager = DatabaseManager()

def get_db():
    """获取数据库操作对象"""
    return db_manager