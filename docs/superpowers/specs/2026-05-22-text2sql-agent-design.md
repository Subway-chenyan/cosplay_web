# Text2SQL 智能检索设计

## Overview

站内智能检索基于 LlamaIndex LLM 生成 PostgreSQL 只读 SQL，再由本地安全层执行并水合为前端卡片数据。用户通过自然语言查询 Cosplay 数据库，后端返回兼容 `AgentSearchResultPanel` 的结构化结果。

## Architecture

- **Text-to-SQL**: LlamaIndex LLM prompt adapter
- **LLM Provider**: DeepSeek 或 SiliconFlow 的 OpenAI-compatible API
- **Database**: PostgreSQL，只读连接执行 SQL
- **API**: Django REST Framework
- **Hydration**: 复用 ORM serializer，将 SQL rows 转为 group/video/award card data

核心流程：

```text
用户问题
  -> LlamaIndex LLM 生成单条 SELECT/WITH SQL
  -> validate_sql_safety 本地校验
  -> execute_sql_tool 只读执行，最多 50 行
  -> 本地后处理提取 video_id/group_id/award_record_id
  -> build_data_array 水合 ORM 对象
  -> 返回前端兼容响应
```

## Prompt Context

SQL 生成提示包含三类上下文：

- 白名单表 schema：来自 `backend/apps/text2sql/schema.py` 的 10 张核心表。
- 列值元数据：静态业务别名加只读数据库采样值，帮助模型正确拼写奖项、赛事、标签等专有名词，例如 `CJ -> ChinaJoy`、`动作奖 -> 国漫动作奖`。
- Few-shot SQL：包含“同时获得 A 奖和 B 奖”的 `GROUP BY ... HAVING` 示例、赛事获奖排行示例、标签/IP 视频搜索示例。

## Security

- LLM 生成的 SQL 始终视为不可信输入。
- 只允许单条 `SELECT` 或 `WITH ... SELECT`。
- 禁止写操作、DDL、多语句和非白名单表。
- PostgreSQL 连接设置 `default_transaction_read_only=on` 和 `statement_timeout=5000`。
- 后端自动追加 `LIMIT 50`，避免大结果集。

## API Contract

主要入口保持不变：

- `POST /api/videos/agent-search/`
- `POST /api/text2sql/query/`

响应继续包含：

- `natural_language_overview` / `answer`
- `ui_type`
- `title`
- `video_id_list`
- `group_id_list`
- `award_record_id_list`
- `data`
- `generated_sql` 或按需 `sql`

## Dependencies

智能检索依赖：

- `llama-index-core`
- `llama-index-llms-openai`
- `SQLAlchemy`
- `psycopg2-binary`

旧的 LangChain、LangGraph、deepagents 依赖已不再用于站内智能检索。
