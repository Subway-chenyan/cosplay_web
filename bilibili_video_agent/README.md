# Bilibili 视频 Agent

一个小型工作流 Agent，用于在 Bilibili 搜索舞台剧/cosplay 视频，通过 LLM 提取结构化元数据，使用 PostgreSQL 的 pg_trgm 相似度在数据库中解析外键（competition/group），并生成插入记录的 SQL。基于 LangGraph/LangChain 构建。

## 功能
- 通过 CLI 使用关键词搜索 Bilibili 并分页
- LLM 辅助提取标题、表演者、日期等元数据
- 仅使用 PostgreSQL pg_trgm 相似度进行外键解析（已移除 ILIKE/Levenshtein）
- 通过环境变量配置相似度阈值（`FK_SIMILARITY_THRESHOLD`）
- 兼容从 `db.run` 返回的 UUID 字符串结果的健壮解析
- 生成参数安全的 SQL 以插入到你的数据库

## 视频检索参数（search_videos）
- 关键词：`keyword`（必填）
- 分页：`page`（默认 1）
- 时长过滤：`duration`
  - 支持单值或列表/元组；允许取值 `0,1,2,3,4`。
  - 当为 `None` 或未指定时，默认使用 `[2,3]`（10-30 分钟与 30-60 分钟）。
  - 当提供多个时长时，会分别检索并合并结果，按 `bvid` 去重。
- 排序：`order`
  - 默认 `pubdate`（发布时间）。当为 `pubdate` 时，本地也会按 `pubdate` 进行稳定排序。
  - 支持 `click, pubdate, dm, stow, score, coin, duration, totalrank, view` 等。
- 上传时间范围：`pubtime_begin_s`/`pubtime_end_s`
  - 单位为 Unix 秒；传入后将作为后端接口过滤，并在本地再做一次稳健过滤。
  - 可与 `duration`/`order` 同时使用。

## 日期范围检索（北京时间）
为便捷按自然日期检索，新增：
- `get_last_week_range_shanghai()`
  - 返回北京时间最近一周区间（起：今天 00:00:00 往前 6 天；止：今天 23:59:59），单位秒。
- `search_videos_by_date(keyword, page=1, duration=None, order='pubdate', begin_date=None, end_date=None, cookies=None)`
  - `begin_date`/`end_date` 接受 `YYYY-MM-DD` 字符串，分别转换为当天 `00:00:00` 与 `23:59:59`（Asia/Shanghai）。
  - 若两者都为空，自动使用最近一周区间。
  - 其他参数与 `search_videos` 保持一致。

## 使用示例（Python）
- 默认检索（10-60 分钟，按发布时间）：
```
from bilibili_video_agent.bilibili_api import search_videos
results = search_videos('舞台剧', page=1, cookies=cookies)
```
- 指定时长与排序：
```
results = search_videos('舞台剧', page=1, duration=3, order='view', cookies=cookies)
```
- 组合时长并按发布时间：
```
results = search_videos('舞台剧', page=1, duration=[2,3], order='pubdate', cookies=cookies)
```
- 上传时间范围（Unix 秒）：
```
results = search_videos('舞台剧', page=1, duration=[2,3], order='pubdate',
                        pubtime_begin_s=1760544000, pubtime_end_s=1761148799,
                        cookies=cookies)
```
- 最近一周（北京时间）包装函数：
```
from bilibili_video_agent.bilibili_api import search_videos_by_date
results = search_videos_by_date('舞台剧', page=1, duration=[2,3], order='pubdate', cookies=cookies)
```
- 自定义日期（北京时间）：
```
results = search_videos_by_date('舞台剧', page=1, duration=[2,3], order='pubdate',
                                begin_date='2025-10-16', end_date='2025-10-22',
                                cookies=cookies)
```

## 环境要求
- Python 3.11+（已在 3.12 测试）
- PostgreSQL，并在相关表上启用 `pg_trgm` 扩展
- 能访问 Bilibili API 的网络

## 快速开始

1) 克隆或下载本项目。

2) 创建并填写环境变量。在 `bilibili_video_agent/` 中放置一个 `.env` 文件，先仅保留键名，随后在本地填入值。可参考随项目提供的 `.env` 模板。

3) 安装依赖：

```
pip install -r bilibili_video_agent/requirements.txt
```

4) 运行 CLI：

```
python3 -m bilibili-video-agent.cli "chinajoy舞台剧" --page 1 --limit 4
```

可按需修改关键词、页码与每页数量。

### CLI 使用（新增日期选项）
- 指定最近一周（北京时间）：
```
python3 -m bilibili_video_agent.cli "cos舞台剧" --last-week --page 1 --limit -1
```
说明：当使用 `--last-week` 时，`--begin-date` 与 `--end-date` 将被忽略。

- 指定自定义日期区间（北京时间）：
```
python -m bilibili_video_agent.cli "chinajoy" --begin-date 2025-10-16 --end-date 2025-10-22 --page 1 --limit 5
```
说明：日期格式为 `YYYY-MM-DD`；内部会转换为当天 00:00:00 与 23:59:59（Asia/Shanghai）。

- 其他参数：
  - `--duration`：传入两个值表示区间，例如 `2 3`；不传时默认使用 `[2,3]`。
  - `--order`：排序方式，默认 `pubdate`。

## 环境变量
在 `bilibili_video_agent/.env` 中放置如下键，并在本地设置具体值（请勿将真实密钥提交到版本库）：

- POSTGRES_DB
- POSTGRES_USER
- POSTGRES_PASSWORD
- POSTGRES_IP
- POSTGRES_PORT
- openai_api_key
- GEMINI_API_KEY
- Bilibili_Cookies
- FK_SIMILARITY_THRESHOLD

说明：
- 未设置时，`FK_SIMILARITY_THRESHOLD` 默认值为 0.3，用于控制外键解析时 pg_trgm 相似度的接受阈值。如果没有候选项达到该阈值，则对应外键（competition_id/group_id）保持 `None`。
- `Bilibili_Cookies` 可提升访问某些 Bilibili 接口的成功率。

## PostgreSQL 设置
确保在用于匹配的数据库/表上启用并可用 `pg_trgm` 扩展。例如：

```
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

同时为参与相似度查询的列创建合适索引以提升性能，例如：

```
CREATE INDEX IF NOT EXISTS idx_competitions_name_trgm ON competitions USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_groups_name_trgm ON groups USING gin (name gin_trgm_ops);
```

## 相似度阈值说明
- 仅使用 pg_trgm 相似度。
- 只有当候选的相似度 >= `FK_SIMILARITY_THRESHOLD` 时，才会选择该候选作为外键。
- 若不满足阈值要求，则外键保持未设置，以避免误关联。

## 日志与排障
- 工作流会以 `[FK]` 标签记录外键查找，并打印候选名称、相似度分值以及是否通过阈值判断。
- 若访问 Bilibili 接口出现连接错误，请稍后重试，或检查 cookies/网络设置是否有效。
- 如果数据库返回字符串化的行，Agent 包含解析逻辑以处理 UUID 与类似 `repr` 的输出。

## 项目结构

```
bilibili_video_agent/
├── agent.py            # 工作流图与节点函数
├── bilibili_api.py     # 调用 Bilibili 的 API 工具
├── cli.py              # 命令行入口
├── db.py               # 数据库辅助函数
├── requirements.txt    # 本包的 Python 依赖
├── README.md           # 此文档
└── .env                # 仅包含键名的模板（请勿提交真实密钥）
```

## 开发说明
- `agent.py` 中的节点函数包含详细的文档字符串，便于理解。
- Agent 会从 `.env` 读取 `FK_SIMILARITY_THRESHOLD`，如未设置则回退到 0.3。
- 未来可扩展 Top-K 候选查看、别名映射与更好的规范化处理。

## 安全
- 请勿提交真实密钥。仅保留 `.env` 中的键名，并在本地设置值。
- 生产环境可考虑使用 direnv 或 Docker secrets 等方式管理机密。

## 许可
如果计划开源，可添加许可证（例如 MIT）。目前尚未指定。
