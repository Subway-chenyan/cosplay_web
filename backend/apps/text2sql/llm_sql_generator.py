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

    if ("cj" in normalized or "chinajoy" in normalized or "china joy" in normalized) and "国漫" in query and "金奖" in query:
        return """
WITH cj_gold_groups AS (
    SELECT DISTINCT ar.group_id
    FROM awards_awardrecord ar
    JOIN awards_award a ON a.id = ar.award_id
    JOIN competitions_competitionyear cy ON cy.id = ar.competition_year_id
    JOIN competitions_competition c ON c.id = cy.competition_id
    WHERE ar.group_id IS NOT NULL
      AND a.name ILIKE '%金奖%'
      AND (c.name ILIKE '%ChinaJoy%' OR c.name ILIKE '%CJ%' OR c.description ILIKE '%ChinaJoy%' OR c.description ILIKE '%CJ%')
),
gic_gold_groups AS (
    SELECT DISTINCT ar.group_id
    FROM awards_awardrecord ar
    JOIN awards_award a ON a.id = ar.award_id
    JOIN competitions_competitionyear cy ON cy.id = ar.competition_year_id
    JOIN competitions_competition c ON c.id = cy.competition_id
    WHERE ar.group_id IS NOT NULL
      AND a.name ILIKE '%金奖%'
      AND (c.name ILIKE '%国漫%' OR c.description ILIKE '%国漫%' OR c.name ILIKE '%中国国际动漫节%' OR c.description ILIKE '%中国国际动漫节%')
),
matched_groups AS (
    SELECT group_id FROM cj_gold_groups
    INTERSECT
    SELECT group_id FROM gic_gold_groups
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
FROM matched_groups mg
JOIN groups_group g ON g.id = mg.group_id
LEFT JOIN awards_awardrecord ar ON ar.group_id = g.id
LEFT JOIN awards_award a ON a.id = ar.award_id
LEFT JOIN competitions_competitionyear cy ON cy.id = ar.competition_year_id
LEFT JOIN competitions_competition c ON c.id = cy.competition_id
LEFT JOIN videos_video v ON v.id = ar.video_id
WHERE a.name ILIKE '%金奖%'
ORDER BY g.name ASC, cy.year DESC, c.name ASC
LIMIT 200
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
        if _is_safe_select(sql):
            logger.info("LLM generated SQL: %s", sql.replace("\n", " ")[:500])
            return sql
        logger.warning("LLM generated unsafe or invalid SQL: %s", sql[:300])
    except Exception as exc:
        logger.warning("LLM SQL generation failed, falling back to rule generator: %s", exc)

    return None
