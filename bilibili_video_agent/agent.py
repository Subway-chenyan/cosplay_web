import os
import uuid
import logging
import operator
from datetime import datetime, timezone
from typing import Annotated, Optional
from typing_extensions import TypedDict

from dotenv import load_dotenv

# LangGraph
from langgraph.graph import StateGraph, START, END

# LLM
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI

# Project modules
from .bilibili_api import search_videos_by_date, get_video_info
from .db import get_db

load_dotenv(dotenv_path='.env')

logger = logging.getLogger("bilibili-video-agent.workflow")
if not logger.handlers: 
    handler = logging.StreamHandler()
    fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(name)s: %(message)s")
    handler.setFormatter(fmt)
    logger.addHandler(handler)
logger.setLevel(logging.INFO)
# 添加相似度阈值（pg_trgm）配置：从 .env 读取 FK_SIMILARITY_THRESHOLD，默认 0.3
SIMILARITY_THRESHOLD = float(os.getenv("FK_SIMILARITY_THRESHOLD", "0.3"))


# -----------------------------
# Structured output for LLM extraction
# -----------------------------
class StageDramaMeta(BaseModel):
    """舞台剧视频元信息提取。
    输出字段：
    - competition: 比赛/活动名称（字符串，或 None）
    - group: 社团/团队名称（字符串，或 None）
    - drama_name: 舞台剧/作品名称（字符串，或 None）
    """
    competition: Optional[str] = Field(default=None, description="视频关联的比赛或活动名称。如无法判断可为空")
    group: Optional[str] = Field(default=None, description="视频关联的社团或团队名称。如无法判断可为空")
    drama_name: Optional[str] = Field(default=None, description="舞台剧名称。如无法判断可为空")


# 统一在下方的 _get_llm 中处理多种 API Key 的回退逻辑

def _get_llm() -> ChatOpenAI:
    openai_key = os.getenv("openai_api_key")
    if not openai_key:
        raise RuntimeError("openai_api_key 未设置。请在环境变量中配置后重试。")
    return ChatOpenAI(model="Qwen/Qwen3-Next-80B-A3B-Instruct", temperature=0, api_key=openai_key, base_url="https://api.siliconflow.cn/v1")


# -----------------------------
# LangGraph State definition
# -----------------------------
class State(TypedDict):
    # 输入
    bvid: str
    keyword: Optional[str]

    # 来自 B 站的原始数据
    video_info: dict

    # 分支一（基础字段）
    basic: dict  # {bv_number, title, url, thumbnail, year, description}

    # 分支二（LLM提取）
    meta: dict   # {competition, group, drama_name}

    # 外键解析
    foreign_keys: dict  # {competition_id, group_id}

    # 合并后的记录
    record: dict  # 完整映射到 videos_video 表所需字段

    # SQL 语句与执行结果
    sql: str
    executed: bool
    execution_output: str

    # 日志与错误汇总（LangGraph 聚合器）
    logs: Annotated[list[str], operator.add]
    errors: Annotated[list[str], operator.add]


# -----------------------------
# Nodes
# -----------------------------

def fetch_info(state: State) -> dict:
    """获取视频详情，准备基础字段。
    输入：State 中的 bvid。
    输出：
    - video_info: 从 B 站接口返回的原始字典
    - basic: 规范化后的基础字段字典（bv_number、title、description、url、thumbnail、year）
    - logs: 拉取与解析过程日志
    异常：捕获后写入 errors 并返回空 basic。
    """
    bvid = state["bvid"]
    try:
        info_resp = get_video_info(bvid)
        info = info_resp.get("data", {})
        title = info.get("title", "")
        desc = info.get("desc", "")
        pic = info.get("pic", "")
        pubdate = info.get("pubdate")  # epoch seconds
        year: Optional[int] = None
        if isinstance(pubdate, int):
            try:
                year = datetime.fromtimestamp(pubdate, tz=timezone.utc).year
            except Exception:
                year = None

        basic = {
            "bv_number": bvid,
            "title": title,
            "description": desc,
            "url": f"https://www.bilibili.com/video/{bvid}",
            "thumbnail": pic,
            "year": year,
        }
        return {
            "video_info": info,
            "basic": basic,
            "logs": [f"Fetched info for {bvid}: title='{title}'"]
        }
    except Exception as e:
        logger.exception("fetch_info failed for %s", bvid)
        return {"errors": [f"fetch_info error for {bvid}: {e}"], "video_info": {}, "basic": {}}


def llm_extract(state: State) -> dict:
    """使用 LLM 从视频标题与描述中提取 competition, group, drama_name。
    输入：State.video_info（title、desc）。
    输出：meta 字典（可能为空），包含 competition、group、drama_name；并记录日志。
    说明：当标题与描述均缺失时跳过并返回错误信息。
    """
    info = state.get("video_info", {})
    title = info.get("title", "")
    desc = info.get("desc", "")

    if not title and not desc:
        return {"meta": {}, "errors": ["llm_extract: 缺少标题与描述，跳过提取"]}

    try:
        llm = _get_llm()
        structured = llm.with_structured_output(StageDramaMeta)
        prompt = (
            "请从以下视频信息中提取舞台剧相关元数据，尽量从标题和描述推断：\n"
            "- competition: 关联的比赛或活动名称（例如 Chinajoy、BW、BML 等），无法判断则留空\n"
            "- group: 关联的社团/团队名称（例如 某某社团），无法判断则留空\n"
            "- drama_name: 舞台剧/作品名称（例如 龙族3勇气与命运），无法判断则留空\n"
            "请仅根据内容进行提取，不要臆造。\n\n"
            f"标题: {title}\n"
            f"描述: {desc}\n"
        )
        result: StageDramaMeta = structured.invoke(prompt)
        meta = result.model_dump()
        return {"meta": meta, "logs": [f"LLM extracted meta for '{title}': {meta}"]}
    except Exception as e:
        logger.exception("llm_extract failed: %s", e)
        return {"meta": {}, "errors": [f"llm_extract error: {e}"]}


# 新增节点：根据 LLM 输出到数据库中查询 competition_id 与 group_id

def resolve_foreign_keys(state: State) -> dict:
    """解析外键：将 meta 中的 competition / group 文本，使用 pg_trgm 相似度在 DB 中查找对应 uuid。
    - 相似度阈值从 .env 的 FK_SIMILARITY_THRESHOLD 读取（默认 0.3）。当最佳候选的 sim < 阈值时视为无匹配。
    - 新增：当社团 group 名称的最佳相似度低于阈值（或无匹配）时，自动创建新的社团记录，并返回其 ID 作为外键。
    返回：foreign_keys（competition_id, group_id）与过程日志；在失败时附加 errors。
    """
    meta = state.get("meta", {})
    comp_term = (meta.get("competition") or "").strip()
    group_term = (meta.get("group") or "").strip()

    def esc(s: str) -> str:
        return s.replace("'", "''")

    def fuzzy_lookup(db, table: str, name_col: str, term: str, threshold: float) -> tuple[Optional[str], Optional[str], list[str], Optional[float]]:
        """仅用 pg_trgm similarity 进行匹配，并应用阈值。返回 (id, matched_name, logs, best_sim)。
        当最高相似度 < threshold 时，视为无匹配并返回 (None, None, logs, best_sim)。
        """
        logs: list[str] = []
        matched_id: Optional[str] = None
        matched_name: Optional[str] = None
        best_sim: Optional[float] = None
        safe = esc(term)
        logs.append(f"[FK] Lookup '{term}' in {table}.{name_col} via pg_trgm (threshold={threshold})")

        # Ensure pg_trgm is available
        try:
            db.run("CREATE EXTENSION IF NOT EXISTS pg_trgm;")
        except Exception as e:
            logs.append(f"[FK] create pg_trgm ext error: {e}")

        # Query by similarity
        q = f"SELECT id, {name_col}, similarity({name_col}, '{safe}') AS sim FROM {table} ORDER BY sim DESC LIMIT 1;"
        try:
            rows = db.run(q)
            logs.append(f"[FK] pg_trgm query: {q} -> type={type(rows).__name__}")

            # Case 1: list/tuple/dict outputs
            if isinstance(rows, list) and rows:
                first = rows[0]
                if isinstance(first, tuple):
                    matched_id, matched_name = first[0], first[1]
                    sim = first[2] if len(first) > 2 else None
                elif isinstance(first, dict):
                    matched_id, matched_name = first.get("id"), first.get(name_col)
                    sim = first.get("sim")
                else:
                    matched_id = getattr(first, "id", None)
                    matched_name = getattr(first, name_col, None)
                    sim = getattr(first, "sim", None)
                logs.append(f"[FK] pg_trgm best -> id={matched_id}, name='{matched_name}', sim={sim}")
                # 应用阈值
                try:
                    best_sim = float(sim) if sim is not None else None
                except Exception:
                    best_sim = None
                if matched_id and best_sim is not None:
                    if best_sim >= threshold:
                        return matched_id, matched_name, logs, best_sim
                    else:
                        logs.append(f"[FK] best sim {best_sim} < threshold {threshold}; ignore match")
                        matched_id, matched_name = None, None
                elif matched_id and best_sim is None:
                    logs.append("[FK] sim is None; cannot apply threshold; treat as no match")
                    matched_id, matched_name = None, None

            # Case 2: string outputs (repr/JSON-quoted)
            elif isinstance(rows, str):
                s = rows.strip()
                logs.append(f"[FK] pg_trgm raw str length={len(s)}")
                # Unwrap outer quotes if present
                if s.startswith('"') and s.endswith('"'):
                    import json as _json
                    try:
                        s = _json.loads(s)
                        logs.append("[FK] Unwrapped JSON-quoted string")
                    except Exception as e:
                        logs.append(f"[FK] JSON unquote error: {e}")
                # Extract first tuple: supports UUID('...') or plain '...'
                import re
                m = re.search(r"\(\s*UUID\('([0-9a-fA-F\-]{36})'\)\s*,\s*'([^']+)'\s*(?:,\s*([0-9\.]+))?\s*\)", s)
                if not m:
                    m = re.search(r"\(\s*'([0-9a-fA-F\-]{36})'\s*,\s*'([^']+)'\s*(?:,\s*([0-9\.]+))?\s*\)", s)
                if m:
                    matched_id = m.group(1)
                    matched_name = m.group(2)
                    sim = m.group(3)
                    logs.append(f"[FK] parsed from str -> id={matched_id}, name='{matched_name}', sim={sim}")
                    # 应用阈值
                    try:
                        best_sim = float(sim) if sim is not None else None
                    except Exception:
                        best_sim = None
                    if matched_id and best_sim is not None:
                        if best_sim >= threshold:
                            return matched_id, matched_name, logs, best_sim
                        else:
                            logs.append(f"[FK] best sim {best_sim} < threshold {threshold}; ignore match")
                            matched_id, matched_name = None, None
                    elif matched_id and best_sim is None:
                        logs.append("[FK] sim is None; cannot apply threshold; treat as no match")
                        matched_id, matched_name = None, None
                else:
                    logs.append("[FK] parse str failed; no tuple match found")
            else:
                logs.append(f"[FK] unsupported rows type: {type(rows)}")
        except Exception as e:
            logs.append(f"[FK] pg_trgm query error: {e}")

        logs.append(f"[FK] No match found for '{term}'")
        return None, None, logs, best_sim

    def parse_returning_id(rows) -> Optional[str]:
        """健壮解析 INSERT ... RETURNING id 的返回值，兼容 list/tuple/dict/str。"""
        if rows is None:
            return None
        # list-like
        if isinstance(rows, list) and rows:
            first = rows[0]
            if isinstance(first, tuple):
                return first[0]
            if isinstance(first, dict):
                return first.get("id") or first.get("uuid")
            return getattr(first, "id", None)
        # plain string
        if isinstance(rows, str):
            s = rows.strip()
            import re
            m = re.search(r"UUID\('([0-9a-fA-F\-]{36})'\)", s)
            if not m:
                m = re.search(r"'([0-9a-fA-F\-]{36})'", s)
            if m:
                return m.group(1)
        return None

    def create_group_record(db, name: str) -> tuple[Optional[str], list[str], list[str]]:
        """当社团名匹配未达阈值时，自动在数据库创建社团记录。
        使用事务确保插入的原子性；返回 (new_group_id, logs, errors)。"""
        logs: list[str] = []
        errors: list[str] = []
        safe_name = esc(name)
        new_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        # 某些数据库模式对 groups_group.description 设为 NOT NULL，提供合理默认值以满足约束
        default_desc = esc("NULL")
        # 某些数据库模式对 groups_group.location 设为 NOT NULL，提供合理默认值以满足约束
        default_location = esc("Unknown")
        # 下列字段在数据库中被设为 NOT NULL，但未提供默认值，统一给予安全的占位默认值
        default_website = esc("")
        default_email = esc("")
        default_phone = esc("")
        default_weibo = esc("")
        default_wechat = esc("")
        default_qq_group = esc("")
        default_bilibili = esc("")
        default_city = esc("Unknown")
        default_province = esc("Unknown")
        # 非字符串类型直接以字面量插入
        default_is_active = "TRUE"
        default_video_count = "0"
        default_award_count = "0"
        insert_sql = (
            "INSERT INTO groups_group (id, name, description, location, website, email, phone, weibo, wechat, qq_group, bilibili, is_active, video_count, award_count, created_at, updated_at, city, province) "
            f"VALUES ('{new_id}', '{safe_name}', '{default_desc}', '{default_location}', '{default_website}', '{default_email}', '{default_phone}', '{default_weibo}', '{default_wechat}', '{default_qq_group}', '{default_bilibili}', {default_is_active}, {default_video_count}, {default_award_count}, '{now}', '{now}', '{default_city}', '{default_province}') RETURNING id;"
        )
        logs.append(f"[FK] Auto-create group: name='{name}', id={new_id}")
        try:
            # 显式事务，避免部分成功（插入失败不会留下半成品）
            try:
                db.run("BEGIN;")
            except Exception:
                # 某些驱动可能不需要/不支持显式 BEGIN；忽略即可
                pass
            rows = db.run(insert_sql)
            # 提交事务
            try:
                db.run("COMMIT;")
            except Exception:
                pass
            rid = parse_returning_id(rows) or new_id  # 多数驱动会返回 id；若不返回，使用我们指定的 new_id
            logs.append(f"[FK] Created group id='{rid}'")
            return rid, logs, errors
        except Exception as e:
            logs.append(f"[FK] create group error: {e}")
            # 回滚事务，避免部分成功
            try:
                db.run("ROLLBACK;")
            except Exception:
                pass
            errors.append(f"create_group_record failed: {e}")
            return None, logs, errors

    comp_id: Optional[str] = None
    group_id: Optional[str] = None
    logs: list[str] = []
    errors: list[str] = []

    try:
        db = get_db()
        if comp_term:
            cid, cname, clog, _ = fuzzy_lookup(db, "competitions_competition", "name", comp_term, SIMILARITY_THRESHOLD)
            logs.extend(clog)
            comp_id = cid
            if cname:
                logs.append(f"Competition matched name: {cname}")
            logs.append(f"Fuzzy lookup result for competition '{comp_term}': id={comp_id}")
        else:
            logs.append("No competition term provided; skip lookup.")

        if group_term:
            gid, gname, glog, best_sim = fuzzy_lookup(db, "groups_group", "name", group_term, SIMILARITY_THRESHOLD)
            logs.extend(glog)
            group_id = gid
            if gname:
                logs.append(f"Group matched name: {gname}")
            logs.append(f"Fuzzy lookup result for group '{group_term}': id={group_id}; best_sim={best_sim}")

            # 当未通过阈值（或无匹配）时，自动创建社团
            if group_id is None:
                logs.append(f"[FK] group '{group_term}' below threshold {SIMILARITY_THRESHOLD} or no match; auto-creating group")
                new_gid, cg_logs, cg_errs = create_group_record(db, group_term)
                logs.extend(cg_logs)
                if cg_errs:
                    errors.extend(cg_errs)
                group_id = new_gid
        else:
            logs.append("No group term provided; skip lookup.")

    except Exception as e:
        logger.exception("resolve_foreign_keys failed: %s", e)
        return {"foreign_keys": {}, "errors": [f"resolve_foreign_keys error: {e}"]}

    result = {"foreign_keys": {"competition_id": comp_id, "group_id": group_id}, "logs": logs}
    if errors:
        result["errors"] = errors
    return result


def merge_data(state: State) -> dict:
    """合并基础字段、LLM 提取结果与外键解析结果，形成完整记录。
    输入：basic、meta、foreign_keys。
    输出：record（用于生成 SQL 语句的完整结构）与日志。
    注意：保留 meta 中的原始文本（competition/group/drama_name）作为记录中的非表字段，方便后续审计与改进。
    """
    basic = state.get("basic", {})
    meta = state.get("meta", {})
    fks = state.get("foreign_keys", {})

    if not basic:
        return {"errors": ["merge_data: 缺少基础字段，无法合并"]}

    record = {
        "id": str(uuid.uuid4()),
        "bv_number": basic.get("bv_number"),
        "title": basic.get("title"),
        "description": basic.get("description") or "",
        "url": basic.get("url"),
        "thumbnail": basic.get("thumbnail") or "",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "competition_id": fks.get("competition_id"),
        "group_id": fks.get("group_id"),
        "uploaded_by_id": None,
        "year": basic.get("year"),
        # 保留提取到的原始文本（非表字段，用于日志/后续处理）
        "competition": meta.get("competition"),
        "group": meta.get("group"),
        "drama_name": meta.get("drama_name"),
    }
    return {"record": record, "logs": [f"Merged record for BV {record['bv_number']} with FK: {fks}"]}


def compose_sql(state: State) -> dict:
    """根据记录生成 INSERT 语句。
    - 外键 competition_id / group_id 按 uuid 字符串写入；为 None 时生成 NULL。
    - 该处使用简单的转义（esc）；生产环境建议改为参数化查询或 ORM。
    输出：sql 字符串与日志。
    """
    r = state.get("record", {})
    if not r:
        return {"errors": ["compose_sql: 缺少记录，无法生成 SQL"]}

    def esc(s: Optional[str]) -> str:
        if s is None:
            return "NULL"
        return "'" + str(s).replace("'", "''") + "'"

    def val_int(i: Optional[object]) -> str:
        if i is None:
            return "NULL"
        try:
            return str(int(i))
        except Exception:
            return "NULL"

    sql = f"""
    INSERT INTO videos_video (
        id, bv_number, title, description, url, thumbnail,
        created_at, updated_at, competition_id, group_id, uploaded_by_id, year
    ) VALUES (
        {esc(r['id'])}, {esc(r['bv_number'])}, {esc(r['title'])}, {esc(r['description'])},
        {esc(r['url'])}, {esc(r['thumbnail'])},
        {esc(r['created_at'])}, {esc(r['updated_at'])},
        {esc(r.get('competition_id'))}, {esc(r.get('group_id'))}, NULL, {r['year'] if r['year'] is not None else 'NULL'}
    )
    ON CONFLICT (bv_number) DO UPDATE SET
        competition_id = COALESCE(videos_video.competition_id, EXCLUDED.competition_id),
        group_id = COALESCE(videos_video.group_id, EXCLUDED.group_id),
        updated_at = EXCLUDED.updated_at;
    """.strip()

    return {"sql": sql, "logs": ["Composed SQL INSERT."]}


def db_insert(state: State) -> dict:
    """执行数据库插入。
    输入：compose_sql 生成的 sql。
    输出：executed（布尔）、execution_output（字符串）、日志。
    异常：捕获后写入 errors。
    """
    sql = state.get("sql", "")
    if not sql:
        return {"errors": ["db_insert: 缺少 SQL，跳过执行"], "executed": False, "execution_output": ""}

    try:
        db = get_db()
        output = db.run(sql)
        logger.info("DB insert result: %s", output)
        return {"executed": True, "execution_output": str(output), "logs": ["DB insert executed."]}
    except Exception as e:
        logger.exception("db_insert failed: %s", e)
        return {"executed": False, "execution_output": "", "errors": [f"db_insert error: {e}"]}


# -----------------------------
# Build graph
# -----------------------------

def build_graph():
    """构建工作流图（LangGraph）。
    节点顺序：
    START -> fetch_info -> llm_extract -> resolve_fk -> merge_data -> compose_sql -> db_insert -> END
    每个节点的输入/输出参阅其函数注释。
    """
    builder = StateGraph(State)

    builder.add_node("fetch_info", fetch_info)
    builder.add_node("llm_extract", llm_extract)
    builder.add_node("resolve_fk", resolve_foreign_keys)
    builder.add_node("merge_data", merge_data)
    builder.add_node("compose_sql", compose_sql)
    builder.add_node("db_insert", db_insert)

    builder.add_edge(START, "fetch_info")
    builder.add_edge("fetch_info", "llm_extract")
    builder.add_edge("llm_extract", "resolve_fk")
    builder.add_edge("resolve_fk", "merge_data")
    builder.add_edge("merge_data", "compose_sql")
    builder.add_edge("compose_sql", "db_insert")
    builder.add_edge("db_insert", END)

    return builder.compile()


# -----------------------------
# External API
# -----------------------------

def run_workflow_for_keywords(keyword: str, page: int = 1, limit: int = 5, duration: list[int] | None = None, order: str = "pubdate", begin_date: str | None = None, end_date: str | None = None, last_week: bool = False):
    """按照关键词检索 B 站舞台剧相关视频，并对前 N 个结果执行工作流。
    参数：
    - keyword: 搜索关键词
    - page: 页码（默认 1）
    - limit: 处理视频条数上限（默认 5）
    - duration: 视频时长范围（默认 None，内部将按 search_videos 默认 [2,3] 处理）
    - order: 排序方式（默认 "pubdate"）
    - begin_date: 开始日期（YYYY-MM-DD），为空时根据 last_week 决定是否使用最近一周
    - end_date: 结束日期（YYYY-MM-DD），为空时根据 last_week 决定是否使用最近一周
    - last_week: 显式使用最近一周（北京时间）区间；为 True 时忽略 begin_date / end_date
    返回：每条视频的处理结果列表（包含 sql、record、logs、errors 等）。
    """
    logger.info(
        "Searching videos for keyword='%s', page=%s, order=%s, last_week=%s, begin_date=%s, end_date=%s",
        keyword, page, order, last_week, begin_date, end_date,
    )

    effective_begin = None if last_week else begin_date
    effective_end = None if last_week else end_date

    results = search_videos_by_date(
        keyword,
        page=page,
        duration=duration,
        order=order,
        begin_date=effective_begin,
        end_date=effective_end,
    )
    if not results:
        logger.warning("No search results for keyword '%s'", keyword)
        return []

    graph = build_graph()

    processed = []
    for idx, item in enumerate(results[:limit]):
        bvid = item.get("bvid", "")
        title = item.get("title", "")
        logger.info("Processing #%s: %s - %s", idx + 1, bvid, title)
        try:
            result = graph.invoke({
                "bvid": bvid,
                "keyword": keyword,
                "logs": [],
                "errors": [],
            })
            processed.append({
                "bvid": bvid,
                "title": title,
                "sql": result.get("sql"),
                "executed": result.get("executed", False),
                "execution_output": result.get("execution_output"),
                "record": result.get("record"),
                "logs": result.get("logs", []),
                "errors": result.get("errors", []),
            })
        except Exception as e:
            logger.exception("Workflow failed for %s", bvid)
            processed.append({
                "bvid": bvid,
                "title": title,
                "sql": None,
                "executed": False,
                "execution_output": "",
                "record": None,
                "logs": [f"Workflow error: {e}"],
                "errors": [str(e)],
            })

    return processed