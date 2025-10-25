import os
import logging
from typing import Optional

from dotenv import load_dotenv
from langchain_community.utilities import SQLDatabase

load_dotenv()

logger = logging.getLogger("bilibili_agent.db")

# 默认从用户提供的数据库配置读取
DEFAULT_DB_URI = (
    f"postgresql+psycopg2://{os.getenv('POSTGRES_USER','cosplay_user')}:{os.getenv('POSTGRES_PASSWORD','cosplay_password_2024')}@"
    f"{os.getenv('POSTGRES_IP','101.43.104.55')}:{os.getenv('POSTGRES_PORT','5432')}/"
    f"{os.getenv('POSTGRES_DB','cosplay_db')}"
)


def get_db(uri: Optional[str] = None) -> SQLDatabase:
    """创建 LangChain SQLDatabase 实例"""
    db_uri = uri or DEFAULT_DB_URI
    return SQLDatabase.from_uri(db_uri)