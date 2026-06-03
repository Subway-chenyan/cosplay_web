from __future__ import annotations

import json
import logging
import os
import re
from typing import Optional

import requests

logger = logging.getLogger(__name__)


FORBIDDEN_SQL_RE = re.compile(
    r"\b(insert|update|delete|drop|alter|truncate|create|grant|revoke|copy|call|execute)\b",
    re.IGNORECASE,
)


SCHEMA_HINT = """
Available PostgreSQL tables:
- awards_award(id, name, competition_id)
- awards_awardrecord(id, award_id, group_id, video_id, competition_year_id, drama_name, description)
- competitions_competition(id, name, description, website)
- competitions_competitionyear(id, competition_id, year)
- groups_group(id, name, description, logo, province, city, location, website, bilibili, video_count, award_count, is_active)
- videos_video(id, bv_number, title, description, url, thumbnail, year, group_id, competition_id, created_at)

Required output columns when possible:
award_record_id, award_id, award_name, competition_year, competition_id, competition_name,
drama_name, award_description, group_id, group_name, group_description, group_logo,
group_province, group_city, group_location, group_video_count, group_award_count,
video_id, bv_number, video_title, video_description, video_url, video_thumbnail, video_year.
"""


def _strip_code_fence(value: str) -> str:
    value = value.strip()
    if value.startswith("```"):
        value = re.sub(r"^```(?:sql)?\s*", "", value, flags=re.IGNORECASE)
        value = re.sub(r"\s*```$", "", value)
    return value.strip().rstrip(";")


def _is_safe_select(sql: str) -> bool:
    normalized = sql.strip().lower()
    return normalized.startswith(("select", "with")) and not FORBIDDEN_SQL_RE.search(sql)


def _heuristic_sql(query: str) -> Optional[str]:
    normalized = query.lower()

    if ("cj" in normalized or "chinajoy" in normalized or "china joy" in normalized):
        return """
WITH cj_awards AS (
    SELECT DISTINCT ar.group_id, COUNT(*) as award_count
    FROM awards_awardrecord ar
    JOIN awards_award a ON a.id = ar.award_id
    JOIN competitions_competitionyear cy ON cy.id = ar.competition_year_id
    JOIN competitions_competition c ON c.id = cy.competition_id
    WHERE ar.group_id IS NOT NULL
      AND (c.name ILIKE '%ChinaJoy%' OR c.name ILIKE '%CJ%' OR c.description ILIKE '%ChinaJoy%' OR c.description ILIKE '%CJ%')
      AND (a.name ILIKE '%金奖%' OR a.name ILIKE '%一等奖%' OR a.name ILIKE '%冠军%')
    GROUP BY ar.group_id
)
SELECT DISTINCT
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
    v.year AS video_year,
    ca.award_count as chinajoy_award_count
FROM awards_awardrecord ar
JOIN awards_award a ON a.id = ar.award_id
JOIN competitions_competitionyear cy ON cy.id = ar.competition_year_id
JOIN competitions_competition c ON c.id = cy.competition_id
LEFT JOIN groups_group g ON g.id = ar.group_id
LEFT JOIN videos_video v ON v.id = ar.video_id
LEFT JOIN cj_awards ca ON ca.group_id = g.id
WHERE ar.group_id IS NOT NULL
  AND (c.name ILIKE '%ChinaJoy%' OR c.name ILIKE '%CJ%' OR c.description ILIKE '%ChinaJoy%' OR c.description ILIKE '%CJ%')
  AND (a.name ILIKE '%金奖%' OR a.name ILIKE '%一等奖%' OR a.name ILIKE '%冠军%')
ORDER BY cy.year DESC, c.name ASC, a.name ASC, g.name ASC, ca.award_count DESC
LIMIT 80
""".strip()

    if "火影" in query or "naruto" in normalized:
        return """
WITH matched_videos AS (
    SELECT
        v.id AS video_id,
        v.group_id
    FROM videos_video v
    WHERE v.title ILIKE '%火影%'
       OR v.description ILIKE '%火影%'
),
matched_awards AS (
    SELECT
        ar.id AS award_record_id,
        ar.group_id,
        ar.video_id
    FROM awards_awardrecord ar
    WHERE ar.drama_name ILIKE '%火影%'
       OR ar.description ILIKE '%火影%'
),
matched AS (
    SELECT group_id, video_id, NULL::uuid AS award_record_id
    FROM matched_videos
    WHERE group_id IS NOT NULL
    UNION
    SELECT group_id, video_id, award_record_id
    FROM matched_awards
    WHERE group_id IS NOT NULL OR video_id IS NOT NULL
)
SELECT DISTINCT
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
FROM matched m
LEFT JOIN awards_awardrecord ar ON (ar.group_id = m.group_id OR ar.video_id = m.video_id)
LEFT JOIN awards_award a ON a.id = ar.award_id
LEFT JOIN competitions_competitionyear cy ON cy.id = ar.competition_year_id
LEFT JOIN competitions_competition c ON c.id = cy.competition_id
LEFT JOIN groups_group g ON g.id = m.group_id
LEFT JOIN videos_video v ON v.id = m.video_id
ORDER BY cy.year DESC, c.name ASC, a.name ASC, g.name ASC
LIMIT 80
""".strip()

    # 模式3: "最多"和"获奖"相关查询
    if ("最多" in normalized and ("获奖" in normalized or "奖" in normalized)):
        return """
SELECT DISTINCT
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
WHERE ar.group_id IS NOT NULL
ORDER BY cy.year DESC, c.name ASC, a.name ASC, g.award_count DESC, g.name ASC
LIMIT 80
""".strip()

    # 模式4: 查询特定奖项
    if ("金奖" in normalized or ("一等奖" in normalized) or ("冠军" in normalized)):
        return """
SELECT DISTINCT
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
WHERE ar.group_id IS NOT NULL
  AND (a.name ILIKE '%金奖%' OR a.name ILIKE '%一等奖%' OR a.name ILIKE '%冠军%')
ORDER BY cy.year DESC, c.name ASC, a.name ASC, g.name ASC
LIMIT 80
""".strip()

    if "火影" in query or "naruto" in normalized:
        return """
WITH matched_videos AS (
    SELECT
        v.id AS video_id,
        v.group_id
    FROM videos_video v
    WHERE v.title ILIKE '%火影%'
       OR v.description ILIKE '%火影%'
),
matched_awards AS (
    SELECT
        ar.id AS award_record_id,
        ar.group_id,
        ar.video_id
    FROM awards_awardrecord ar
    WHERE ar.drama_name ILIKE '%火影%'
       OR ar.description ILIKE '%火影%'
),
matched AS (
    SELECT group_id, video_id, NULL::uuid AS award_record_id
    FROM matched_videos
    WHERE group_id IS NOT NULL
    UNION
    SELECT group_id, video_id, award_record_id
    FROM matched_awards
    WHERE group_id IS NOT NULL OR video_id IS NOT NULL
)
SELECT DISTINCT
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
FROM matched m
LEFT JOIN videos_video v ON v.id = m.video_id
LEFT JOIN awards_awardrecord ar ON ar.id = m.award_record_id OR ar.video_id = m.video_id
LEFT JOIN awards_award a ON a.id = ar.award_id
LEFT JOIN competitions_competitionyear cy ON cy.id = ar.competition_year_id
LEFT JOIN competitions_competition c ON c.id = COALESCE(cy.competition_id, v.competition_id)
JOIN groups_group g ON g.id = COALESCE(m.group_id, v.group_id, ar.group_id)
ORDER BY g.name ASC, v.year DESC NULLS LAST, v.title ASC
LIMIT 200
""".strip()

    # 模式5: 同时获得多个奖项的查询
    if ("同时获得" in query or "都获得" in query or "和" in query and "获得" in query):
        # 提取奖项名称
        awards = []
        if "金龙" in query and "金奖" in query:
            awards.append("金龙金奖")
        if "CJ" in query and "金奖" in query:
            awards.append("CJ金奖")
        if "ChinaJoy" in query and "金奖" in query:
            awards.append("ChinaJoy金奖")
        if len(awards) < 2:
            # 如果没有找到两个奖项，使用更灵活的匹配
            if "金龙" in query:
                awards.append("金龙")
            if "CJ" in query:
                awards.append("CJ")
            if "金奖" in query and "金奖" not in awards:
                awards.append("金奖")

        if len(awards) >= 2:
            # 构建查询条件
            award_conditions = " OR ".join([f"a.name ILIKE '%{award}%'" for award in awards])

            return f"""
WITH group_awards AS (
    SELECT
        ar.group_id,
        COUNT(DISTINCT CASE
            WHEN a.name ILIKE '%金龙%' OR a.name ILIKE '%金龙金奖%' THEN ar.id
            ELSE NULL
        END) as dragon_count,
        COUNT(DISTINCT CASE
            WHEN a.name ILIKE '%CJ%' OR a.name ILIKE '%ChinaJoy%' OR a.name ILIKE '%CJ金奖%' THEN ar.id
            ELSE NULL
        END) as cj_count,
        COUNT(DISTINCT CASE
            WHEN a.name ILIKE '%金奖%' THEN ar.id
            ELSE NULL
        END) as gold_count
    FROM awards_awardrecord ar
    JOIN awards_award a ON a.id = ar.award_id
    WHERE ar.group_id IS NOT NULL
      AND (a.name ILIKE '%金龙%' OR a.name ILIKE '%金龙金奖%'
           OR a.name ILIKE '%CJ%' OR a.name ILIKE '%ChinaJoy%' OR a.name ILIKE '%CJ金奖%'
           OR a.name ILIKE '%金奖%')
    GROUP BY ar.group_id
)
SELECT DISTINCT
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
    v.year AS video_year,
    ga.dragon_count,
    ga.cj_count,
    ga.gold_count
FROM group_awards ga
JOIN groups_group g ON g.id = ga.group_id
LEFT JOIN awards_awardrecord ar ON ar.group_id = g.id
LEFT JOIN awards_award a ON a.id = ar.award_id
LEFT JOIN competitions_competitionyear cy ON cy.id = ar.competition_year_id
LEFT JOIN competitions_competition c ON c.id = cy.competition_id
LEFT JOIN videos_video v ON v.id = ar.video_id
WHERE (ga.dragon_count > 0 AND ga.cj_count > 0)  -- 同时获得金龙和CJ金奖
   OR (ga.dragon_count > 0 AND ga.gold_count > ga.dragon_count)  -- 金龙金奖和其他金奖
   OR (ga.cj_count > 0 AND ga.gold_count > ga.cj_count)  -- CJ金奖和其他金奖
   OR (ga.gold_count >= 2)  -- 至少两个金奖
ORDER BY ga.dragon_count DESC, ga.cj_count DESC, ga.gold_count DESC, g.name ASC
LIMIT 80
"""
SELECT DISTINCT
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
    v.year AS video_year,
    ma.award_count as multiple_awards_count
FROM multiple_awards ma
JOIN groups_group g ON g.id = ma.group_id
LEFT JOIN awards_awardrecord ar ON ar.group_id = g.id
LEFT JOIN awards_award a ON a.id = ar.award_id
LEFT JOIN competitions_competitionyear cy ON cy.id = ar.competition_year_id
LEFT JOIN competitions_competition c ON c.id = cy.competition_id
LEFT JOIN videos_video v ON v.id = ar.video_id
WHERE ma.group_id IS NOT NULL
ORDER BY ma.award_count DESC, g.name ASC, cy.year DESC
LIMIT 80
""".strip()

    # 模式6: 特定奖项名称查询（如"动作设计奖"）
    if "动作设计" in query or "最佳动作" in query or "动作奖" in query:
        return """
SELECT DISTINCT
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
WHERE ar.group_id IS NOT NULL
  AND (a.name ILIKE '%动作设计%' OR a.name ILIKE '%最佳动作%' OR a.name ILIKE '%动作奖%')
ORDER BY cy.year DESC, c.name ASC, a.name ASC, g.name ASC
LIMIT 80
""".strip()

    # 模式7: GDC/GDCoser相关查询
    if "GDC" in query or "GDCoser" in query:
        return """
SELECT DISTINCT
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
    ar.id::text AS award_record_id,
    a.id::text AS award_id,
    a.name AS award_name,
    cy.year AS competition_year,
    c.id::text AS competition_id,
    c.name AS competition_name
FROM videos_video v
LEFT JOIN groups_group g ON g.id = v.group_id
LEFT JOIN awards_awardrecord ar ON ar.video_id = v.id
LEFT JOIN awards_award a ON a.id = ar.award_id
LEFT JOIN competitions_competitionyear cy ON cy.id = ar.competition_year_id
LEFT JOIN competitions_competition c ON c.id = cy.competition_id
WHERE v.group_id IS NOT NULL
  AND (v.title ILIKE '%GDC%' OR v.description ILIKE '%GDC%'
       OR v.title ILIKE '%GDCoser%' OR v.description ILIKE '%GDCoser%'
       OR c.name ILIKE '%GDC%' OR c.description ILIKE '%GDC%'
       OR c.name ILIKE '%GDCoser%' OR c.description ILIKE '%GDCoser%')
ORDER BY v.year DESC, v.title ASC
LIMIT 80
""".strip()

    return None


def generate_sql_via_llm(query: str) -> Optional[str]:
    """Generate read-only SQL through SiliconFlow's OpenAI-compatible API.

    A deterministic fallback covers common production searches so the agent can
    still run when the LLM endpoint is unavailable during local development.
    """
    deterministic_sql = _heuristic_sql(query)
    if deterministic_sql:
        logger.info("Using deterministic Text2SQL template for query: %s", query[:120])
        return deterministic_sql

    provider = os.getenv("TEXT2SQL_PROVIDER", "").strip().lower()
    if provider != "siliconflow":
        return None

    api_key = os.getenv("SILICONFLOW_API_KEY")
    if not api_key:
        logger.warning("TEXT2SQL_PROVIDER=siliconflow but SILICONFLOW_API_KEY is empty")
        return None

    base_url = os.getenv("SILICONFLOW_BASE_URL", "https://api.siliconflow.cn/v1").rstrip("/")
    model = os.getenv("SILICONFLOW_MODEL", "Qwen/Qwen3.6-27B")
    prompt = (
        "You are a PostgreSQL Text2SQL engine for a cosplay stage video database. "
        "Return one safe read-only SQL query only. No markdown, no explanation. "
        "Use ILIKE for fuzzy Chinese matching. Never use SELECT *. "
        "For award/team/video searches, include the required aliases when possible.\n\n"
        f"{SCHEMA_HINT}\n\nUser query: {query}"
    )

    try:
        response = requests.post(
            f"{base_url}/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            data=json.dumps(
                {
                    "model": model,
                    "messages": [
                        {"role": "system", "content": "Return SQL only."},
                        {"role": "user", "content": prompt},
                    ],
                    "temperature": 0,
                    "max_tokens": 1200,
                    "enable_thinking": False,
                }
            ),
            timeout=25,
        )
        response.raise_for_status()
        payload = response.json()
        sql = _strip_code_fence(payload["choices"][0]["message"]["content"])
        logger.info("LLM raw response: %s", repr(payload["choices"][0]["message"]["content"]))
        logger.info("LLM stripped SQL: %s", repr(sql))

        if _is_safe_select(sql):
            logger.info("LLM generated SQL: %s", sql.replace("\n", " ")[:500])
            return sql

        # 详细记录为什么SQL不安全
        if not sql.strip():
            logger.warning("LLM generated empty SQL")
        elif not sql.lower().startswith(("select", "with")):
            logger.warning("LLM generated non-SELECT SQL: starts with %s", sql[:10].lower())
        elif FORBIDDEN_SQL_RE.search(sql):
            logger.warning("LLM SQL contains forbidden keywords: %s", FORBIDDEN_SQL_RE.findall(sql))

        logger.warning("LLM generated unsafe or invalid SQL: %s", sql[:300])
    except Exception as exc:
        logger.warning("LLM SQL generation failed, falling back to rule generator: %s", exc)

    return None
