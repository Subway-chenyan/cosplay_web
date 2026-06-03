#!/usr/bin/env python3
"""
基于LangChain的SQL Agent，集成硅基流动（SiliconFlow）和PostgreSQL
使用现代化的create_agent和结构化输出功能
"""

import os
import json
import logging
from typing import Dict, List, Any, Optional, Union
from dotenv import load_dotenv

from pydantic import BaseModel, Field

# 加载环境变量
load_dotenv()

logger = logging.getLogger(__name__)


def _strip_code_fence(value: str) -> str:
    value = value.strip()
    if value.startswith("```"):
        value = re.sub(r"^```(?:sql)?\s*", "", value, flags=re.IGNORECASE)
        value = re.sub(r"\s*```$", "", value)
    return value.strip().rstrip(";")


def _is_safe_select(sql: str) -> bool:
    normalized = sql.strip().lower()
    return normalized.startswith(("select", "with")) and not FORBIDDEN_SQL_RE.search(sql)


FORBIDDEN_SQL_RE = re.compile(
    r"\b(insert|update|delete|drop|alter|truncate|create|grant|revoke|copy|call|execute)\b",
    re.IGNORECASE,
)


def _heuristic_sql(query: str) -> Optional[str]:
    """确定性SQL模板"""
    normalized = query.lower()

    # 模式1: ChinaJoy相关查询
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

    # 模式2: "最多"和"获奖"相关查询
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

    # 模式3: 查询特定奖项
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

    # 模式4: 同时获得金龙和CJ金奖的查询
    if ("同时获得" in query or "都获得" in query) and ("金龙" in query and "CJ" in query):
        return """
WITH teams_both_awards AS (
    SELECT DISTINCT g.id as group_id
    FROM groups_group g
    WHERE EXISTS (
        SELECT 1 FROM awards_awardrecord ar1
        JOIN awards_award a1 ON a1.id = ar1.award_id
        WHERE ar1.group_id = g.id
        AND (a1.name ILIKE '%金龙%' OR a1.name ILIKE '%金龙金奖%')
    )
    AND EXISTS (
        SELECT 1 FROM awards_awardrecord ar2
        JOIN awards_award a2 ON a2.id = ar2.award_id
        WHERE ar2.group_id = g.id
        AND (a2.name ILIKE '%CJ%' OR a2.name ILIKE '%ChinaJoy%' OR a2.name ILIKE '%CJ金奖%')
    )
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
FROM teams_both_awards tba
JOIN groups_group g ON g.id = tba.group_id
LEFT JOIN awards_awardrecord ar ON ar.group_id = g.id
LEFT JOIN awards_award a ON a.id = ar.award_id
LEFT JOIN competitions_competitionyear cy ON cy.id = ar.competition_year_id
LEFT JOIN competitions_competition c ON c.id = cy.competition_id
LEFT JOIN videos_video v ON v.id = ar.video_id
ORDER BY cy.year DESC, c.name ASC, a.name ASC, g.name ASC
LIMIT 80
""".strip()

    # 模式5: 动作设计奖项
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

    # 模式6: GDC/GDCoser相关查询
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
    """Generate read-only SQL through DeepSeek API."""

    api_key = os.getenv("SILICONFLOW_API_KEY")
    if not api_key:
        logger.warning("SILICONFLOW_API_KEY not found")
        return None

    base_url = os.getenv("SILICONFLOW_BASE_URL", "https://api.deepseek.com").rstrip("/")
    model = os.getenv("SILICONFLOW_MODEL", "deepseek-v4-flash")

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
            data=json.dumps({
                "model": model,
                "messages": [
                    {"role": "system", "content": "Return SQL only."},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0,
                "max_tokens": 1200,
                "enable_thinking": False,
            }),
            timeout=25,
        )

        if response.status_code == 200:
            payload = response.json()
            content = payload["choices"][0]["message"]["content"]
            sql = _strip_code_fence(content)

            logger.info("LLM raw response: %s", repr(content))
            logger.info("LLM stripped SQL: %s", repr(sql))

            if _is_safe_select(sql):
                logger.info("LLM generated SQL: %s", sql.replace("\n", " ")[:500])
                return sql
            else:
                # 详细记录为什么SQL不安全
                if not sql.strip():
                    logger.warning("LLM generated empty SQL")
                elif not sql.lower().startswith(("select", "with")):
                    logger.warning("LLM generated non-SELECT SQL: starts with %s", sql[:10].lower())
                elif FORBIDDEN_SQL_RE.search(sql):
                    logger.warning("LLM SQL contains forbidden keywords: %s", FORBIDDEN_SQL_RE.findall(sql))

                logger.warning("LLM generated unsafe or invalid SQL: %s", sql[:300])
        else:
            logger.warning("LLM API request failed: %s", response.status_code)

    except requests.exceptions.RequestException as e:
        logger.warning("LLM request failed: %s", e)
    except Exception as exc:
        logger.warning("LLM SQL generation failed, falling back to rule generator: %s", exc)

    return None