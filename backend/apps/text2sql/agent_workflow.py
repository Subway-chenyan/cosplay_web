from __future__ import annotations

import logging
import re
from dataclasses import dataclass
from typing import Any, Dict, List, Literal, Optional, TypedDict

from django.db import connection
from pydantic import BaseModel, Field

from apps.text2sql.llm_sql_generator import generate_sql_via_llm

try:
    from langgraph.graph import END, START, StateGraph
except Exception:  # pragma: no cover - allows Django to boot before optional deps are installed
    END = START = StateGraph = None

logger = logging.getLogger(__name__)


UIType = Literal["video_grid", "group_list", "award_leaderboard", "mixed_text", "group_detail"]
IntentType = Literal["award_keyword", "top_gold_groups", "generic"]


FORBIDDEN_SQL_RE = re.compile(
    r"\b(insert|update|delete|drop|alter|truncate|create|grant|revoke|copy|call|execute)\b",
    re.IGNORECASE,
)


SCHEMAS: Dict[str, str] = {
    "awards_award": "awards_award(id, name, competition_id)",
    "awards_awardrecord": (
        "awards_awardrecord(id, award_id, group_id, video_id, competition_year_id, "
        "drama_name, description)"
    ),
    "competitions_competition": "competitions_competition(id, name, description, website)",
    "competitions_competitionyear": "competitions_competitionyear(id, competition_id, year)",
    "groups_group": (
        "groups_group(id, name, description, logo, province, city, location, website, "
        "bilibili, video_count, award_count, is_active)"
    ),
    "videos_video": (
        "videos_video(id, bv_number, title, description, url, thumbnail, year, "
        "group_id, competition_id)"
    ),
}


class AgentState(TypedDict, total=False):
    query: str
    intent_type: IntentType
    selected_schemas: List[str]
    generated_sql: str
    sql_error: str
    raw_data: List[Dict[str, Any]]
    final_response: Dict[str, Any]
    retry_count: int
    generated_by_llm: bool


@dataclass
class SQLTemplate:
    intent_type: IntentType
    ui_type: UIType
    title: str
    sql: str


class RenderComponent(BaseModel):
    ui_type: UIType = Field(description="前端渲染组件类型")
    title: str = Field(description="展示标题")
    summary: str = Field(description="查询结果概述")
    data: List[Any] = Field(default_factory=list, description="与 ui_type 对齐的结构化数据")


class AgentSearchResponseModel(RenderComponent):
    query: str
    answer_type: str
    sections: List[Dict[str, Any]] = Field(default_factory=list)
    natural_language_overview: str = ""
    video_id_list: List[str] = Field(default_factory=list)
    group_id_list: List[str] = Field(default_factory=list)
    debug: Dict[str, Any] = Field(default_factory=dict)

    class Config:
        extra = "allow"


def _escape_like(value: str) -> str:
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_").replace("'", "''")


def _looks_like_top_gold_query(query: str) -> bool:
    return any(word in query for word in ["最多", "最高", "榜", "排行", "第一"]) and any(
        word in query for word in ["金奖", "一等奖", "冠军"]
    )


def _extract_award_keywords(query: str) -> List[str]:
    keyword_groups = [
        ("动作", ["动作", "武打", "打戏", "动作设计"]),
        ("舞美", ["舞美", "舞台美术", "布景"]),
        ("服装", ["服装", "造型", "服化"]),
        ("人气", ["人气", "观众"]),
        ("剧本", ["剧本", "编剧", "剧情"]),
        ("表演", ["表演", "演技", "演员"]),
    ]
    for trigger, keywords in keyword_groups:
        if trigger in query:
            return keywords
    return []


def intent_schema_selector(state: AgentState) -> Dict[str, Any]:
    query = state["query"].strip()

    if FORBIDDEN_SQL_RE.search(query):
        return {
            "intent_type": "generic",
            "selected_schemas": [],
            "sql_error": "查询中包含不允许的数据库操作关键词。",
        }

    if _looks_like_top_gold_query(query):
        return {
            "intent_type": "top_gold_groups",
            "selected_schemas": [
                "awards_award",
                "awards_awardrecord",
                "competitions_competition",
                "competitions_competitionyear",
                "groups_group",
                "videos_video",
            ],
        }

    award_keywords = _extract_award_keywords(query)
    if award_keywords or "奖" in query or "获奖" in query:
        return {
            "intent_type": "award_keyword",
            "selected_schemas": [
                "awards_award",
                "awards_awardrecord",
                "competitions_competition",
                "competitions_competitionyear",
                "groups_group",
                "videos_video",
            ],
        }

    return {
        "intent_type": "generic",
        "selected_schemas": ["videos_video", "groups_group", "awards_award", "awards_awardrecord"],
    }


def route_by_complexity(state: AgentState) -> str:
    """Always route to LLM — rule-based path removed per user request."""
    return "llm_sql_generator"


def _award_rows_sql(where_clause: str, limit: int = 80) -> str:
    return f"""
SELECT
    ar.id::text AS award_record_id,
    a.id::text AS award_id,
    a.name AS award_name,
    cy.year AS competition_year,
    c.id::text AS competition_id,
    c.name AS competition_name,
    ar.drama_name,
    ar.description AS award_description,
    g.id::text AS group_id,
    g.name AS group_name,
    g.description AS group_description,
    g.logo AS group_logo,
    g.province AS group_province,
    g.city AS group_city,
    g.location AS group_location,
    g.video_count AS group_video_count,
    g.award_count AS group_award_count,
    v.id::text AS video_id,
    v.bv_number,
    v.title AS video_title,
    v.description AS video_description,
    v.url AS video_url,
    v.thumbnail AS video_thumbnail,
    v.year AS video_year
FROM awards_awardrecord ar
JOIN awards_award a ON a.id = ar.award_id
JOIN competitions_competitionyear cy ON cy.id = ar.competition_year_id
JOIN competitions_competition c ON c.id = cy.competition_id
LEFT JOIN groups_group g ON g.id = ar.group_id
LEFT JOIN videos_video v ON v.id = ar.video_id
WHERE {where_clause}
ORDER BY cy.year DESC, c.name ASC, a.name ASC, g.name ASC
LIMIT {limit}
""".strip()


def sql_generator(state: AgentState) -> Dict[str, Any]:
    if state.get("sql_error") and not state.get("selected_schemas"):
        return {}

    query = state["query"].strip()
    intent_type = state.get("intent_type", "generic")
    retry_count = state.get("retry_count", 0)
    previous_error = state.get("sql_error") or ""

    if retry_count > 0 and previous_error and intent_type != "generic":
        safe_query = _escape_like(query)
        sql = f"""
SELECT
    v.id::text AS video_id,
    v.bv_number,
    v.title AS video_title,
    v.description AS video_description,
    v.url AS video_url,
    v.thumbnail AS video_thumbnail,
    v.year AS video_year,
    g.id::text AS group_id,
    g.name AS group_name,
    g.description AS group_description,
    g.logo AS group_logo,
    g.province AS group_province,
    g.city AS group_city,
    g.location AS group_location,
    g.video_count AS group_video_count,
    g.award_count AS group_award_count,
    c.id::text AS competition_id,
    c.name AS competition_name
FROM videos_video v
LEFT JOIN groups_group g ON g.id = v.group_id
LEFT JOIN competitions_competition c ON c.id = v.competition_id
WHERE v.title ILIKE '%{safe_query}%'
   OR v.description ILIKE '%{safe_query}%'
   OR g.name ILIKE '%{safe_query}%'
   OR c.name ILIKE '%{safe_query}%'
ORDER BY v.year DESC NULLS LAST, v.created_at DESC
LIMIT 60
""".strip()
        return {"generated_sql": sql, "intent_type": "generic", "sql_error": ""}

    if intent_type == "top_gold_groups":
        sql = """
WITH gold_records AS (
    SELECT
        ar.id,
        ar.award_id,
        ar.group_id,
        ar.video_id,
        ar.competition_year_id
    FROM awards_awardrecord ar
    JOIN awards_award a ON a.id = ar.award_id
    WHERE ar.group_id IS NOT NULL
      AND (
        a.name ILIKE '%金奖%'
        OR a.name ILIKE '%一等奖%'
        OR a.name ILIKE '%冠军%'
      )
      AND NOT (a.name ILIKE '%金龙奖%' AND a.name NOT ILIKE '%金奖%')
),
group_counts AS (
    SELECT group_id, COUNT(*) AS gold_award_count
    FROM gold_records
    GROUP BY group_id
),
max_count AS (
    SELECT MAX(gold_award_count) AS value FROM group_counts
)
SELECT
    ar.id::text AS award_record_id,
    a.id::text AS award_id,
    a.name AS award_name,
    cy.year AS competition_year,
    c.id::text AS competition_id,
    c.name AS competition_name,
    ar.drama_name,
    ar.description AS award_description,
    gc.gold_award_count,
    g.id::text AS group_id,
    g.name AS group_name,
    g.description AS group_description,
    g.logo AS group_logo,
    g.province AS group_province,
    g.city AS group_city,
    g.location AS group_location,
    g.video_count AS group_video_count,
    g.award_count AS group_award_count,
    v.id::text AS video_id,
    v.bv_number,
    v.title AS video_title,
    v.description AS video_description,
    v.url AS video_url,
    v.thumbnail AS video_thumbnail,
    v.year AS video_year
FROM gold_records gr
JOIN group_counts gc ON gc.group_id = gr.group_id
JOIN max_count mc ON mc.value = gc.gold_award_count
JOIN awards_awardrecord ar ON ar.id = gr.id
JOIN awards_award a ON a.id = ar.award_id
JOIN competitions_competitionyear cy ON cy.id = ar.competition_year_id
JOIN competitions_competition c ON c.id = cy.competition_id
JOIN groups_group g ON g.id = ar.group_id
LEFT JOIN videos_video v ON v.id = ar.video_id
ORDER BY gc.gold_award_count DESC, g.name ASC, cy.year DESC, c.name ASC
LIMIT 120
""".strip()
        return {"generated_sql": sql}

    if intent_type == "award_keyword":
        keywords = _extract_award_keywords(query) or [query.replace("获得", "").replace("获取", "").replace("团队", "").strip()]
        escaped = [_escape_like(k) for k in keywords if k.strip()]
        if not escaped:
            escaped = ["奖"]
        conditions = " OR ".join([f"a.name ILIKE '%{kw}%'" for kw in escaped])
        return {"generated_sql": _award_rows_sql(f"({conditions}) AND (ar.group_id IS NOT NULL OR ar.video_id IS NOT NULL)")}

    safe_query = _escape_like(query)
    sql = f"""
SELECT
    v.id::text AS video_id,
    v.bv_number,
    v.title AS video_title,
    v.description AS video_description,
    v.url AS video_url,
    v.thumbnail AS video_thumbnail,
    v.year AS video_year,
    g.id::text AS group_id,
    g.name AS group_name,
    g.description AS group_description,
    g.logo AS group_logo,
    g.province AS group_province,
    g.city AS group_city,
    g.location AS group_location,
    g.video_count AS group_video_count,
    g.award_count AS group_award_count,
    c.id::text AS competition_id,
    c.name AS competition_name
FROM videos_video v
LEFT JOIN groups_group g ON g.id = v.group_id
LEFT JOIN competitions_competition c ON c.id = v.competition_id
WHERE v.title ILIKE '%{safe_query}%'
   OR v.description ILIKE '%{safe_query}%'
   OR g.name ILIKE '%{safe_query}%'
   OR c.name ILIKE '%{safe_query}%'
ORDER BY v.year DESC NULLS LAST, v.created_at DESC
LIMIT 60
""".strip()
    return {"generated_sql": sql}


def llm_sql_generator(state: AgentState) -> Dict[str, Any]:
    query = state.get("query", "").strip()
    sql = generate_sql_via_llm(query)

    if not sql:
        logger.warning("LLM SQL generation returned empty, falling back to rule")
        return sql_generator(state)

    return {
        "generated_sql": sql,
        "intent_type": state.get("intent_type", "generic"),
        "sql_error": "",
        "generated_by_llm": True,
    }


def _validate_sql(sql: str) -> Optional[str]:
    normalized = sql.strip().strip(";")
    if not normalized.lower().startswith(("select", "with")):
        return "只允许 SELECT / WITH 查询。"
    if FORBIDDEN_SQL_RE.search(normalized):
        return "SQL 中包含不允许的写入或 DDL 操作。"
    if "select *" in normalized.lower():
        return "SQL 必须显式声明字段，不能使用 SELECT *。"
    return None


def sql_executor(state: AgentState) -> Dict[str, Any]:
    sql = state.get("generated_sql", "")
    validation_error = _validate_sql(sql)
    if validation_error:
        return {
            "sql_error": validation_error,
            "raw_data": [],
            "retry_count": state.get("retry_count", 0) + 1,
        }

    try:
        with connection.cursor() as cursor:
            cursor.execute("SET statement_timeout TO 3000")
            try:
                cursor.execute(sql)
                columns = [col[0] for col in cursor.description]
                raw_data = [dict(zip(columns, row)) for row in cursor.fetchall()]
            finally:
                cursor.execute("RESET statement_timeout")
        return {"raw_data": raw_data, "sql_error": ""}
    except Exception as exc:
        logger.exception("agent SQL execution failed")
        return {
            "raw_data": [],
            "sql_error": str(exc),
            "retry_count": state.get("retry_count", 0) + 1,
        }


def should_retry_or_format(state: AgentState) -> str:
    sql_error = state.get("sql_error")
    retry_count = state.get("retry_count", 0)

    if sql_error:
        if state.get("generated_by_llm", False) and retry_count < 3:
            return "sql_generator"
        if retry_count < 3:
            return "sql_generator"

    if state.get("generated_by_llm", False):
        return "llm_post_processor"

    return "response_formatter"


def llm_post_processor(state: AgentState) -> Dict[str, Any]:
    """Enrich LLM SQL results with full award record data for the formatter.

    LLM often generates clean group-level SQL (e.g. HAVING COUNT = 3) that
    doesn't include award_record/video/competition columns. This step extracts
    matched group/video IDs and re-queries with the standard award-rows template.
    """
    if not state.get("generated_by_llm"):
        return {}

    raw_data = state.get("raw_data", [])
    if not raw_data:
        return {}

    # If the SQL already returned the standard row shape, keep it exact.
    # Re-querying by group_id alone can pull unrelated videos from the same team.
    if any(row.get("video_id") or row.get("award_record_id") for row in raw_data):
        return {}

    group_ids = sorted({str(r["group_id"]) for r in raw_data if r.get("group_id")})
    if not group_ids:
        return {}

    ids_literal = ", ".join(f"'{gid}'" for gid in group_ids)
    where = f"ar.group_id IN ({ids_literal})"
    follow_up_sql = _award_rows_sql(where, limit=200)

    try:
        with connection.cursor() as cursor:
            cursor.execute("SET statement_timeout TO 5000")
            try:
                cursor.execute(follow_up_sql)
                columns = [col[0] for col in cursor.description]
                enriched = [dict(zip(columns, row)) for row in cursor.fetchall()]
            finally:
                cursor.execute("RESET statement_timeout")

        if enriched:
            logger.info(
                "LLM post-processor enriched %d group(s) -> %d award record(s)",
                len(group_ids), len(enriched),
            )
            return {"raw_data": enriched}
        logger.warning("LLM post-processor found 0 records for %d group(s)", len(group_ids))
        return {}
    except Exception as exc:
        logger.warning("LLM follow-up enrichment failed, keeping original data: %s", exc)
        return {}


def _final_response(final: Dict[str, Any]) -> Dict[str, Any]:
    try:
        return AgentSearchResponseModel(**final).model_dump()
    except Exception:
        logger.exception("agent response validation failed")
        return final


def _group_from_row(row: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if not row.get("group_id"):
        return None
    return {
        "id": row.get("group_id"),
        "name": row.get("group_name") or "",
        "description": row.get("group_description") or "",
        "logo": row.get("group_logo") or "",
        "province": row.get("group_province") or "",
        "city": row.get("group_city") or "",
        "location": row.get("group_location") or "",
        "video_count": row.get("group_video_count") or 0,
        "award_count": row.get("group_award_count") or 0,
    }


def _video_from_row(row: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    if not row.get("video_id"):
        return None
    return {
        "id": row.get("video_id"),
        "bv_number": row.get("bv_number") or "",
        "title": row.get("video_title") or "",
        "description": row.get("video_description") or "",
        "url": row.get("video_url") or "",
        "thumbnail": row.get("video_thumbnail") or "",
        "year": row.get("video_year"),
        "group": row.get("group_id"),
        "group_name": row.get("group_name") or "",
        "competition": row.get("competition_id"),
        "competition_name": row.get("competition_name") or "",
        "tags": [],
        "created_at": "",
        "updated_at": "",
    }


def _award_record_from_row(row: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": row.get("award_record_id"),
        "award": row.get("award_id"),
        "award_name": row.get("award_name") or "",
        "competition_name": row.get("competition_name") or "",
        "competition_year": row.get("competition_year"),
        "drama_name": row.get("drama_name") or "",
        "description": row.get("award_description") or "",
        "video": row.get("video_id"),
        "video_title": row.get("video_title") or "",
        "group": row.get("group_id"),
        "group_name": row.get("group_name") or "",
    }


def response_formatter(state: AgentState) -> Dict[str, Any]:
    query = state["query"]
    raw_data = state.get("raw_data", [])
    intent_type = state.get("intent_type", "generic")
    sql_error = state.get("sql_error") or ""

    if sql_error:
        final = {
            "query": query,
            "answer_type": "error",
            "ui_type": "mixed_text",
            "title": "智能检索暂时无法完成",
            "summary": f"检索执行失败：{sql_error}",
            "data": [],
            "sections": [],
            "debug": {
                "selected_schemas": state.get("selected_schemas", []),
                "generated_sql": state.get("generated_sql", ""),
            },
            "natural_language_overview": f"检索执行失败：{sql_error}",
            "video_id_list": [],
            "group_id_list": [],
        }
        return {"final_response": _final_response(final)}

    video_ids = sorted({str(row["video_id"]) for row in raw_data if row.get("video_id")})
    group_ids = sorted({str(row["group_id"]) for row in raw_data if row.get("group_id")})

    if not raw_data:
        final = {
            "query": query,
            "answer_type": intent_type,
            "ui_type": "mixed_text",
            "title": "没有找到匹配结果",
            "summary": "当前数据库中没有查到符合条件的获奖记录、视频或团队。",
            "data": [],
            "sections": [],
            "debug": {
                "selected_schemas": state.get("selected_schemas", []),
                "generated_sql": state.get("generated_sql", ""),
            },
            "natural_language_overview": "当前数据库中没有查到符合条件的结果。",
            "video_id_list": [],
            "group_id_list": [],
        }
        return {"final_response": _final_response(final)}

    if intent_type == "top_gold_groups":
        groups: Dict[str, Dict[str, Any]] = {}
        for row in raw_data:
            group = _group_from_row(row)
            if not group:
                continue
            group_id = group["id"]
            entry = groups.setdefault(
                group_id,
                {
                    "group": group,
                    "metrics": {"gold_award_count": row.get("gold_award_count") or 0},
                    "award_records": [],
                    "videos": [],
                },
            )
            award_record = _award_record_from_row(row)
            entry["award_records"].append(award_record)
            video = _video_from_row(row)
            if video and video["id"] not in {v["id"] for v in entry["videos"]}:
                entry["videos"].append(video)

        items = sorted(groups.values(), key=lambda item: (-item["metrics"]["gold_award_count"], item["group"]["name"]))
        top_count = items[0]["metrics"]["gold_award_count"] if items else 0
        names = "、".join(item["group"]["name"] for item in items)
        summary = f"金奖数量最多的团队为 {names}，共获得 {top_count} 个金奖相关奖项。"
        final = {
            "query": query,
            "answer_type": "top_gold_groups",
            "ui_type": "award_leaderboard",
            "title": "金奖最多团队",
            "summary": summary,
            "data": items,
            "sections": [{"type": "leaderboard", "title": "金奖最多团队", "items": items}],
            "debug": {
                "selected_schemas": state.get("selected_schemas", []),
                "generated_sql": state.get("generated_sql", ""),
            },
            "natural_language_overview": summary,
            "video_id_list": video_ids,
            "group_id_list": group_ids,
        }
        return {"final_response": _final_response(final)}

    rows = []
    for row in raw_data:
        rows.append(
            {
                "award_record": _award_record_from_row(row) if row.get("award_record_id") else None,
                "group": _group_from_row(row),
                "video": _video_from_row(row),
                "competition": {
                    "id": row.get("competition_id"),
                    "name": row.get("competition_name") or "",
                    "year": row.get("competition_year"),
                },
            }
        )

    if intent_type == "award_keyword":
        # Group by group — each entry has {group, videos[], award_records[]}
        grouped: Dict[str, Dict[str, Any]] = {}
        for row in raw_data:
            group = _group_from_row(row)
            if not group:
                continue
            gid = group["id"]
            if gid not in grouped:
                grouped[gid] = {"group": group, "award_records": [], "videos": []}
            grouped[gid]["award_records"].append(_award_record_from_row(row))
            video = _video_from_row(row)
            if video and video["id"] not in {v["id"] for v in grouped[gid]["videos"]}:
                grouped[gid]["videos"].append(video)

        items = sorted(grouped.values(), key=lambda it: it["group"]["name"])
        summary = f"共找到 {len(raw_data)} 条相关获奖记录，涉及 {len(group_ids)} 个团队和 {len(video_ids)} 个视频。"
        ui_type: UIType = "group_detail"
        title = "相关奖项获奖团队与视频"
    else:
        summary = f"共找到 {len(raw_data)} 条相关记录。"
        ui_type = "video_grid" if video_ids else "group_list"
        title = "智能检索结果"

    final = {
        "query": query,
        "answer_type": intent_type,
        "ui_type": ui_type,
        "title": title,
        "summary": summary,
        "data": items if intent_type == "award_keyword" else rows,
        "sections": [{"type": ui_type, "title": title, "items": items if intent_type == "award_keyword" else rows}],
        "debug": {
            "selected_schemas": state.get("selected_schemas", []),
            "generated_sql": state.get("generated_sql", ""),
        },
        "natural_language_overview": summary,
        "video_id_list": video_ids,
        "group_id_list": group_ids,
    }
    return {"final_response": _final_response(final)}


def _run_without_langgraph(initial_state: AgentState) -> AgentState:
    state: AgentState = dict(initial_state)
    state.update(intent_schema_selector(state))

    route = route_by_complexity(state)
    while True:
        if route == "llm_sql_generator":
            state.update(llm_sql_generator(state))
            if state.get("sql_error"):
                state["generated_by_llm"] = False
                state.update(sql_generator(state))
        else:
            state.update(sql_generator(state))

        state.update(sql_executor(state))

        if not state.get("sql_error") or state.get("retry_count", 0) >= 3:
            break

        if state.get("generated_by_llm"):
            state["generated_by_llm"] = False
            route = "sql_generator"

    for node in [llm_post_processor, response_formatter]:
        state.update(node(state))
    return state


def build_agent_graph():
    if StateGraph is None:
        return None

    graph = StateGraph(AgentState)
    graph.add_node("intent_schema_selector", intent_schema_selector)
    graph.add_node("sql_generator", sql_generator)
    graph.add_node("llm_sql_generator", llm_sql_generator)
    graph.add_node("sql_executor", sql_executor)
    graph.add_node("llm_post_processor", llm_post_processor)
    graph.add_node("response_formatter", response_formatter)

    graph.add_edge(START, "intent_schema_selector")
    graph.add_conditional_edges(
        "intent_schema_selector",
        route_by_complexity,
        {"sql_generator": "sql_generator", "llm_sql_generator": "llm_sql_generator"},
    )
    graph.add_edge("sql_generator", "sql_executor")
    graph.add_edge("llm_sql_generator", "sql_executor")
    graph.add_conditional_edges(
        "sql_executor",
        should_retry_or_format,
        {
            "sql_generator": "sql_generator",
            "response_formatter": "response_formatter",
            "llm_post_processor": "llm_post_processor",
        },
    )
    graph.add_edge("llm_post_processor", "response_formatter")
    graph.add_edge("response_formatter", END)
    return graph.compile()


def run_agent_search(query: str) -> Dict[str, Any]:
    initial_state: AgentState = {
        "query": query,
        "retry_count": 0,
        "raw_data": [],
        "selected_schemas": [],
    }

    graph = build_agent_graph()
    if graph is None:
        final_state = _run_without_langgraph(initial_state)
    else:
        try:
            # Prefer the lightweight path — LangGraph invoke adds ~20s overhead
            # with LangSmith tracing for a simple linear workflow.
            final_state = _run_without_langgraph(initial_state)
        except Exception:
            logger.exception("lightweight path failed, falling back to LangGraph invoke")
            final_state = graph.invoke(initial_state)

    return final_state["final_response"]
