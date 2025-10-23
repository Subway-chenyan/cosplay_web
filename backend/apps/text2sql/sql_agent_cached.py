#!/usr/bin/env python3
"""
基于LangChain的SQL Agent，集成硅基流动（SiliconFlow）和PostgreSQL
支持表结构缓存功能，避免重复查询数据库schema
"""

import os
import json
import time
from typing import Dict, List, Any, Optional
from pathlib import Path

from dotenv import load_dotenv
# 尝试使用 LangChain 的 OpenAI 适配器以连接硅基流动的 OpenAI 兼容接口
from langchain_siliconflow import ChatSiliconFlow
from langchain_community.utilities import SQLDatabase
from langchain_community.agent_toolkits import SQLDatabaseToolkit
from langchain_community.agent_toolkits.sql.base import create_sql_agent
from langchain.agents.agent_types import AgentType
from langchain_core.messages import SystemMessage

# 加载环境变量
load_dotenv()


class SQLAgent:
    """SQL查询代理"""
    
    def __init__(self):
        self.llm = None
        self.agent = None
    
    def connect_database(self):
        """连接PostgreSQL数据库"""
        db = SQLDatabase.from_uri(
            f"postgresql+psycopg2://{os.getenv('POSTGRES_USER')}:{os.getenv('POSTGRES_PASSWORD')}@{os.getenv('POSTGRES_IP')}:{os.getenv('POSTGRES_PORT')}/{os.getenv('POSTGRES_DB')}",
        )
        return db
        
    def initialize_llm(self):
        # 优先从环境变量读取，若无则使用用户提供的密钥
        api_key = os.getenv('SILICONFLOW_API_KEY') or os.getenv('OPENAI_API_KEY') or 'sk-tzuoghsbeczzlapwmuajduygjpqfckkaoptzphtllobvjtkr'
        base_url = os.getenv('SILICONFLOW_BASE_URL', 'https://api.siliconflow.cn/v1')
        # 模型可通过环境变量覆盖，默认选择一个对话/指令模型
        model = os.getenv('SILICONFLOW_MODEL', 'Qwen/Qwen3-Next-80B-A3B-Instruct')
        self.llm = ChatSiliconFlow(
            model=model,
            api_key=api_key,
            base_url=base_url,
            temperature=0,
        )
        
        print("🤖 SiliconFlow LLM 初始化成功")
        return self.llm
    
    def create_agent(self):
        """创建SQL Agent"""
        if self.llm is None:
            self.initialize_llm()
            
        # 连接数据库
        db = self.connect_database()
        
        # 创建自定义工具包，只包含需要的工具
        from langchain_community.agent_toolkits.sql.toolkit import SQLDatabaseToolkit
    
        # 自定义系统提示词
        system_prompt = f"""
你是一个专业的SQL数据库查询助手，专门与PostgreSQL数据库交互。

查询规则:
1. 使用sql_db_list_tables和sql_db_schema查询表结构；
2. 使用 sql_db_query_checker 验证SQL语句正确性
3. 使用 sql_db_query 执行查询
4. 除非用户指定数量，否则限制结果最多返回10条记录
5. 只查询相关字段，不要使用 SELECT *
6. 禁止执行任何DML语句 (INSERT, UPDATE, DELETE, DROP等)
7. 如果查询出错，请分析错误信息并重写查询

请用中文回答用户问题，并提供清晰的查询结果解释。
"""
        
        # 创建SQL Agent
        self.agent = create_sql_agent(
            llm=self.llm,
            toolkit=SQLDatabaseToolkit(db=db, llm=self.llm),
            agent_type=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
            verbose=True,
            system_message=SystemMessage(content=system_prompt),
        )
        
        print(f"📝 系统提示词: {system_prompt}")
        print("🎯 SQL Agent 创建成功")
        return self.agent
    
    def query(self, question: str) -> str:
        """执行查询"""
        if self.agent is None:
            self.create_agent()
            
        try:
            print(f"\n❓ 用户问题: {question}")
            print("🔍 正在分析并执行查询...")
            
            # 启用解析错误处理，让Agent在输出解析失败时自动重试
            result = self.agent.invoke({"input": question, "handle_parsing_errors": True})
            return result.get("output", "未获取到查询结果")
            
        except Exception as e:
            error_msg = f"查询执行失败: {str(e)}"
            print(f"❌ {error_msg}")
            return error_msg



def main():
    """主函数 - 演示SQL Agent使用"""
    print("🚀 启动LangChain SQL Agent (带缓存功能)")
    print("=" * 50)
    
    try:
        # 创建SQL Agent
        agent = SQLAgent()
        
        # 显示数据库信息
        db_info = agent.get_database_info()
        print("\n📊 数据库信息:")
        for key, value in db_info.items():
            print(f"  {key}: {value}")
        
        # 示例查询
        sample_queries = [
            "有哪些表可以查询？",
            "groups_group表的结构是什么？",
            "查询前5个活跃的团体信息",
            "统计每个省份有多少个团体"
        ]
        
        print(f"\n🎯 开始执行示例查询...")
        print("=" * 50)
        
        for i, query in enumerate(sample_queries, 1):
            print(f"\n【查询 {i}】")
            result = agent.query(query)
            print(f"💡 结果: {result}")
            print("-" * 30)
            
    except Exception as e:
        print(f"❌ 程序执行失败: {e}")


if __name__ == "__main__":
    main()