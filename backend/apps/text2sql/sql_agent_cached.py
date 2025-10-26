#!/usr/bin/env python3
"""
基于LangChain的SQL Agent，集成硅基流动（SiliconFlow）和PostgreSQL
使用现代化的create_agent和结构化输出功能
"""

import os
import json
from typing import Dict, List, Any, Optional, TypedDict, Union

from dotenv import load_dotenv
from langchain_siliconflow import ChatSiliconFlow
from langchain_community.utilities import SQLDatabase
from langchain_community.agent_toolkits import SQLDatabaseToolkit
from langchain.agents import create_agent
from pydantic import BaseModel, Field
from langchain.agents.structured_output import ToolStrategy

# 加载环境变量
load_dotenv()


class AgentOutput(BaseModel):
    """结构化输出类型定义。
    
    使用Pydantic BaseModel以获得更好的验证和序列化支持
    """
    natural_language_overview: str = Field(
        description="对查询结果的中文概述，禁止包含具体ID等敏感信息"
    )
    video_id_list: List[str] = Field(
        default_factory=list,
        description="相关视频ID列表（允许为空，字符串；支持UUID）"
    )
    group_id_list: List[str] = Field(
        default_factory=list,
        description="相关群组ID列表（允许为空，字符串；支持UUID）"
    )


class SQLAgent:
    """现代化的SQL查询代理
    
    基于LangChain的create_agent和结构化输出功能构建
    """
    
    def __init__(self):
        """初始化SQL Agent"""
        self.llm = None
        self.db = None
        self.agent = None
        self.db_uri = None
    
    def _build_database_uri(self) -> str:
        """构建数据库连接URI"""
        return (
            f"postgresql+psycopg2://"
            f"{os.getenv('POSTGRES_USER')}:"
            f"{os.getenv('POSTGRES_PASSWORD')}@"
            f"{os.getenv('POSTGRES_IP')}:"
            f"{os.getenv('POSTGRES_PORT')}/"
            f"{os.getenv('POSTGRES_DB')}"
        )
    
    def initialize_llm(self) -> ChatSiliconFlow:
        """初始化LLM模型
        
        Returns:
            配置好的ChatSiliconFlow实例
        """
        # 优先从环境变量读取配置
        api_key = (
            os.getenv('SILICONFLOW_API_KEY') or 
            os.getenv('OPENAI_API_KEY') or 
            'sk-tzuoghsbeczzlapwmuajduygjpqfckkaoptzphtllobvjtkr'
        )
        base_url = os.getenv('SILICONFLOW_BASE_URL', 'https://api.siliconflow.cn/v1')
        model = os.getenv('SILICONFLOW_MODEL', 'Qwen/Qwen3-Next-80B-A3B-Instruct')
        
        self.llm = ChatSiliconFlow(
            model=model,
            api_key=api_key,
            base_url=base_url,
            temperature=0,
        )
        
        print("🤖 SiliconFlow LLM 初始化成功")
        return self.llm
    
    def connect_database(self) -> SQLDatabase:
        """连接PostgreSQL数据库
        
        Returns:
            SQLDatabase实例
        """
        self.db_uri = self._build_database_uri()
        self.db = SQLDatabase.from_uri(self.db_uri)
        
        print("🗄️ PostgreSQL 数据库连接成功")
        return self.db

    def create_agent(self):
        """创建现代化的SQL Agent
        
        使用LangChain的create_sql_agent方法
        """
        if not self.llm:
            self.initialize_llm()
        if not self.db:
            self.connect_database()
        
        # 创建SQL工具包
        tools = SQLDatabaseToolkit(db=self.db, llm=self.llm).get_tools()
        for tool in tools:
            print(f"{tool.name}: {tool.description}\n")
        # breakpoint()
        # 使用create_agent创建agent
        self.agent = create_agent(
            self.llm,
            tools,
            response_format=ToolStrategy(AgentOutput)
        )
        
        print("🎯 现代化SQL Agent创建成功")
        return self.agent
    
    def invoke(self, query: str):
        """执行查询并返回结构化结果
        
        Args:
            query: 用户查询问题
            
        Returns:
            AgentOutput: 结构化查询结果
        """
        if not self.agent:
            self.create_agent()
            
        result = self.agent.invoke({
            "messages": [
                {"role": "system", "content": (
                    "你是一个严谨的SQL Agent。严格遵循以下流程并返回结构化结果：\n"
                    "- 目标：必须用数据库查询得到并填充 video_id_list 和 group_id_list（UUID）。禁止凭空推断。\n"
                    "- 步骤：\n"
                    "  1) 先用 sql_db_list_tables 了解表名；\n"
                    "  2) 用 sql_db_schema 查看关键表结构（awards_award、awards_awardrecord、competitions_competitionyear、videos_video、groups_group）；\n"
                    "  3) 在执行前用 sql_db_query_checker 校验 SQL；\n"
                    "  4) 用 sql_db_query 执行查询。\n"
                    "- SQL 必须包含 ID 字段：优先选择 ar.video_id AS video_id、ar.group_id AS group_id；如需从视频或社团表取，选择 v.id AS video_id、g.id AS group_id。\n"
                    "- 过滤条件建议：\n"
                    "  cy.year = <年份>；a.name ILIKE '%<奖项关键词>%'；并筛除 NULL（ar.video_id IS NOT NULL / ar.group_id IS NOT NULL）。\n"
                    "- 示例模板：\n"
                    "  SELECT DISTINCT ar.video_id AS video_id, ar.group_id AS group_id\n"
                    "  FROM awards_awardrecord ar\n"
                    "  JOIN awards_award a ON a.id = ar.award_id\n"
                    "  JOIN competitions_competitionyear cy ON cy.id = ar.competition_year_id\n"
                    "  WHERE cy.year = <YEAR> AND a.name ILIKE '%<AWARD>%'\n"
                    "    AND (ar.video_id IS NOT NULL OR ar.group_id IS NOT NULL);\n"
                    "- 返回规则：在完成查询且提取出 UUID 后，再调用结构化输出工具，\n"
                    "  将所有去重后的 video_id/group_id（字符串形式）填入对应列表；\n"
                    "  若确无记录，才允许返回空列表，并在概述中清楚说明未找到。\n"
                    "- 在natural_language_overview中概况查询结果，包括查询到的视频名称和社团名称等。\n"
                )},
                {"role": "user", "content": query}
            ]
        })
        print(result["structured_response"])
        # breakpoint()
        return result["structured_response"]
    
def main():
    """主函数 - 演示SQL Agent使用"""
    print("🚀 启动现代化LangChain SQL Agent")
    print("=" * 50)
    
    try:
        # 创建SQL Agent
        agent = SQLAgent()
        
        # 示例查询
        sample_queries = [
            "2025年获得chinajoy大团体金奖的团队？",
        ]
        
        print(f"\n🎯 开始执行示例查询...")
        print("=" * 50)
        
        for i, query in enumerate(sample_queries, 1):
            print(f"\n【查询 {i}】{query}")
            result = agent.invoke(query)
            print(f"💡 结果:")
            print(result)
            print("-" * 30)
            
    except Exception as e:
        print(f"❌ 程序执行失败: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()