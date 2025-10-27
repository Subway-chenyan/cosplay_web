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
from langchain_core.tools import Tool
from pydantic import BaseModel, Field
from langchain.agents.structured_output import ToolStrategy

# 加载环境变量
load_dotenv()


# 数据库Schema信息（简化版本）
DATABASE_SCHEMA = """
数据库表结构信息：

1. awards_award (奖项表)
   - id: UUID (主键)
   - name: VARCHAR(100) (奖项名称，如"倩女幽魂-金奖")
   - competition_id: UUID (外键)

2. awards_awardrecord (奖项记录表)
   - id: UUID (主键)
   - award_id: UUID (外键->awards_award)
   - group_id: UUID (外键->groups_group，可为空)
   - video_id: UUID (外键->videos_video，可为空)
   - competition_year_id: UUID (外键->competitions_competitionyear)
   - drama_name: VARCHAR(200) (剧目名称)

3. competitions_competitionyear (比赛年份表)
   - id: UUID (主键)
   - year: INTEGER (年份，如2025)
   - competition_id: UUID (外键)

4. groups_group (团队表)
   - id: UUID (主键)
   - name: VARCHAR(100) (团队名称)

5. videos_video (视频表)
   - id: UUID (主键)
   - title: VARCHAR(255) (视频标题)

关键关系：
- awards_awardrecord 连接 awards_award (award_id)
- awards_awardrecord 连接 groups_group (group_id)
- awards_awardrecord 连接 videos_video (video_id)
- awards_awardrecord 连接 competitions_competitionyear (competition_year_id)

样例数据：
- awards_award: "倩女幽魂-金奖", "剑网3-铜奖"
- competitions_competitionyear: year=2025
- groups_group: "时钟塔天体科", "十方自在", "潮汐剧团", "渡劫弥坚"
- awards_awardrecord: 包含video_id和group_id的UUID记录
"""


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

    def create_custom_tools(self):
        """创建自定义SQL工具集，禁用表信息获取功能"""
        if not self.db:
            self.connect_database()

        # 获取原始工具包但只保留查询相关工具
        original_toolkit = SQLDatabaseToolkit(db=self.db, llm=self.llm)
        all_tools = original_toolkit.get_tools()

        # 筛选需要的工具：只保留SQL查询和检查工具
        custom_tools = []
        for tool in all_tools:
            if tool.name in ['sql_db_query', 'sql_db_query_checker']:
                custom_tools.append(tool)

        print(f"🔧 自定义SQL工具集创建成功，包含 {len(custom_tools)} 个工具")
        return custom_tools

    def create_agent(self):
        """创建现代化的SQL Agent

        使用自定义工具集和预加载的schema信息
        """
        if not self.llm:
            self.initialize_llm()

        # 创建自定义工具集
        tools = self.create_custom_tools()

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

        result = self.agent.invoke(
            {
            "messages": [
                {"role": "system", "content": (
                    "你是一个智能的SQL Agent。严格遵循以下流程并返回结构化结果：\n"
                    "- 目标：必须用数据库查询得到并填充 video_id_list 和 group_id_list（UUID）。禁止凭空推断。\n"
                    "- 数据库Schema信息（已预加载）：\n"
                    f"{DATABASE_SCHEMA}\n"
                    "- 步骤：\n"
                    "  1) 分析用户查询，提取关键词；\n"
                    "  2) **智能模糊查询**：使用多种匹配策略生成SQL；\n"
                    "  3) 在执行前用 sql_db_query_checker 校验 SQL；\n"
                    "  4) 用 sql_db_query 执行查询；\n"
                    "  5) **重要**：仔细解析查询结果，提取所有非空的UUID值。\n"
                    "- **智能模糊查询策略**：\n"
                    "  * **完全匹配**：a.name ILIKE '%完整短语%'\n"
                    "  * **部分匹配**：a.name ILIKE '%关键词1%' AND a.name ILIKE '%关键词2%'\n"
                    "  * **独立匹配**：a.name ILIKE '%关键词1%' OR a.name ILIKE '%关键词2%'\n"
                    "  * **词根匹配**：提取关键词的主要部分进行匹配\n"
                    "- SQL 模板示例：\n"
                    "  -- 对于查询'最佳动作奖'，应该生成类似这样的查询：\n"
                    "  SELECT DISTINCT ar.video_id AS video_id, ar.group_id AS group_id\n"
                    "  FROM awards_awardrecord ar\n"
                    "  JOIN awards_award a ON a.id = ar.award_id\n"
                    "  WHERE (a.name ILIKE '%最佳动作奖%'              -- 完全匹配\n"
                    "     OR a.name ILIKE '%动作%奖%')               -- 包含式匹配2\n"
                    "    AND (ar.video_id IS NOT NULL OR ar.group_id IS NOT NULL);\n"
                    "- **关键词提取技巧**：\n"
                    "  * '最佳动作奖' → 关键词：['动作']\n"
                    "  * '金奖' → 关键词：['金奖', '金']\n"
                    "  * '团体奖' → 关键词：['团体奖', '团体']\n"
                    "  * 为每个关键词生成多种匹配组合\n"
                    "- **查询优化原则**：\n"
                    "  * 优先使用最具体的匹配条件\n"
                    "  * 使用OR连接所有可能的匹配方式\n"
                    "  * 确保查询条件覆盖所有可能的变体\n"
                    "- SQL 必须包含 ID 字段：优先选择 ar.video_id AS video_id、ar.group_id AS group_id；如需从视频或社团表取，选择 v.id AS video_id、g.id AS group_id。\n"
                    "- **结果处理规则**：\n"
                    "  * 查询结果格式通常为：[(UUID('video_id1'), UUID('group_id1')), (UUID('video_id2'), UUID('group_id2')), ...]\n"
                    "  * 提取所有非空的UUID，转换为字符串格式\n"
                    "  * video_id_list 包含所有video_id的字符串形式\n"
                    "  * group_id_list 包含所有group_id的字符串形式\n"
                    "  * 若某个字段为None，则跳过该值\n"
                    "  * **严禁编造UUID**：只有在查询结果中确实存在的UUID才能使用\n"
                    "- 在natural_language_overview中说明查询结果情况：\n"
                    "  * 如果找到记录：说明找到了哪些团队和视频，以及使用了哪种匹配方式\n"
                    "  * 如果没有找到记录：明确说明未找到相关记录\n"
                    "- 注意：不要使用 sql_db_list_tables 或 sql_db_schema 工具，所有schema信息已在上述提供。"
                )},
                {"role": "user", "content": query},
            ]
        },
        {"recursion_limit": 40}
        )
        print(result)
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
            "获得过最佳动作奖的社团有哪些？请列出相关信息",
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