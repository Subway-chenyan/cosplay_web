"""
Hardcoded database schema for the 10 target tables used by text2sql.

No database queries at runtime -- the schema is embedded as a Python
data structure so the LLM prompt is built purely from memory.
"""

ALLOWED_TABLES: frozenset[str] = frozenset({
    "groups_group",
    "videos_video",
    "competitions_competition",
    "competitions_competitionyear",
    "competitions_event",
    "competitions_event_videos",
    "awards_award",
    "awards_awardrecord",
    "tags_tag",
    "tags_videotag",
})

_TABLES: list[dict] = [
    {
        "name": "groups_group",
        "description": "社团/团体 —— 存储 cosplay 社团的基本信息、联系方式和统计数据",
        "columns": [
            {"column": "id", "type": "uuid", "pk": True, "fk": None, "comment": "主键"},
            {"column": "name", "type": "varchar(100)", "pk": False, "fk": None, "comment": "社团名称, 唯一"},
            {"column": "description", "type": "text", "pk": False, "fk": None, "comment": "社团简介"},
            {"column": "logo", "type": "varchar", "pk": False, "fk": None, "comment": "Logo URL, 可为空"},
            {"column": "founded_date", "type": "date", "pk": False, "fk": None, "comment": "成立日期, 可为空"},
            {"column": "location", "type": "varchar", "pk": False, "fk": None, "comment": "所在地"},
            {"column": "website", "type": "varchar", "pk": False, "fk": None, "comment": "网站"},
            {"column": "email", "type": "varchar", "pk": False, "fk": None, "comment": "邮箱"},
            {"column": "phone", "type": "varchar(20)", "pk": False, "fk": None, "comment": "电话"},
            {"column": "weibo", "type": "varchar", "pk": False, "fk": None, "comment": "微博"},
            {"column": "wechat", "type": "varchar(50)", "pk": False, "fk": None, "comment": "微信"},
            {"column": "qq_group", "type": "varchar(20)", "pk": False, "fk": None, "comment": "QQ群"},
            {"column": "bilibili", "type": "varchar", "pk": False, "fk": None, "comment": "B站主页"},
            {"column": "is_active", "type": "boolean", "pk": False, "fk": None, "comment": "是否活跃"},
            {"column": "video_count", "type": "integer", "pk": False, "fk": None, "comment": "作品数量"},
            {"column": "award_count", "type": "integer", "pk": False, "fk": None, "comment": "获奖数量"},
            {"column": "created_at", "type": "timestamp", "pk": False, "fk": None, "comment": "创建时间"},
            {"column": "updated_at", "type": "timestamp", "pk": False, "fk": None, "comment": "更新时间"},
            {"column": "created_by_id", "type": "bigint", "pk": False, "fk": "users_user.id", "comment": "创建者ID, 可为空"},
        ],
    },
    {
        "name": "videos_video",
        "description": "视频 —— 存储 cosplay 舞台剧视频的详细信息和关联关系",
        "columns": [
            {"column": "id", "type": "uuid", "pk": True, "fk": None, "comment": "主键"},
            {"column": "bv_number", "type": "varchar(20)", "pk": False, "fk": None, "comment": "B站BV号, 唯一"},
            {"column": "title", "type": "varchar(255)", "pk": False, "fk": None, "comment": "视频标题"},
            {"column": "description", "type": "text", "pk": False, "fk": None, "comment": "视频描述"},
            {"column": "url", "type": "varchar", "pk": False, "fk": None, "comment": "视频链接"},
            {"column": "thumbnail", "type": "varchar", "pk": False, "fk": None, "comment": "缩略图URL"},
            {"column": "year", "type": "integer", "pk": False, "fk": None, "comment": "年份, 可为空"},
            {"column": "group_id", "type": "uuid", "pk": False, "fk": "groups_group.id", "comment": "所属社团ID, 可为空"},
            {"column": "competition_id", "type": "uuid", "pk": False, "fk": "competitions_competition.id", "comment": "关联比赛ID, 可为空"},
            {"column": "uploaded_by_id", "type": "bigint", "pk": False, "fk": "users_user.id", "comment": "上传者ID, 可为空"},
            {"column": "created_at", "type": "timestamp", "pk": False, "fk": None, "comment": "创建时间"},
            {"column": "updated_at", "type": "timestamp", "pk": False, "fk": None, "comment": "更新时间"},
        ],
    },
    {
        "name": "competitions_competition",
        "description": "比赛/赛事 —— 存储顶级赛事的基本信息",
        "columns": [
            {"column": "id", "type": "uuid", "pk": True, "fk": None, "comment": "主键"},
            {"column": "name", "type": "varchar(100)", "pk": False, "fk": None, "comment": "赛事名称"},
            {"column": "description", "type": "text", "pk": False, "fk": None, "comment": "赛事描述"},
            {"column": "website", "type": "varchar", "pk": False, "fk": None, "comment": "官网链接"},
            {"column": "banner_image", "type": "varchar", "pk": False, "fk": None, "comment": "Banner图片URL"},
            {"column": "banner_gradient", "type": "jsonb", "pk": False, "fk": None, "comment": "Banner渐变色配置(JSON)"},
            {"column": "award_display_order", "type": "jsonb", "pk": False, "fk": None, "comment": "奖项展示顺序(JSON)"},
            {"column": "created_at", "type": "timestamp", "pk": False, "fk": None, "comment": "创建时间"},
            {"column": "updated_at", "type": "timestamp", "pk": False, "fk": None, "comment": "更新时间"},
        ],
    },
    {
        "name": "competitions_competitionyear",
        "description": "赛事年份 —— 记录每届赛事的年度信息",
        "columns": [
            {"column": "id", "type": "uuid", "pk": True, "fk": None, "comment": "主键"},
            {"column": "competition_id", "type": "uuid", "pk": False, "fk": "competitions_competition.id CASCADE", "comment": "所属赛事ID"},
            {"column": "year", "type": "integer", "pk": False, "fk": None, "comment": "年份"},
            {"column": "description", "type": "text", "pk": False, "fk": None, "comment": "描述"},
            {"column": "created_at", "type": "timestamp", "pk": False, "fk": None, "comment": "创建时间"},
            {"column": "updated_at", "type": "timestamp", "pk": False, "fk": None, "comment": "更新时间"},
        ],
    },
    {
        "name": "competitions_event",
        "description": "赛事活动/分站赛 —— 记录具体赛事活动的详细信息",
        "columns": [
            {"column": "id", "type": "uuid", "pk": True, "fk": None, "comment": "主键"},
            {"column": "competition_id", "type": "uuid", "pk": False, "fk": "competitions_competition.id CASCADE", "comment": "所属赛事ID"},
            {"column": "start_date", "type": "date", "pk": False, "fk": None, "comment": "开始日期, 可为空"},
            {"column": "end_date", "type": "date", "pk": False, "fk": None, "comment": "结束日期, 可为空"},
            {"column": "title", "type": "varchar(200)", "pk": False, "fk": None, "comment": "活动标题"},
            {"column": "description", "type": "text", "pk": False, "fk": None, "comment": "活动描述"},
            {"column": "contact", "type": "varchar(200)", "pk": False, "fk": None, "comment": "联系方式"},
            {"column": "website", "type": "varchar", "pk": False, "fk": None, "comment": "官网链接"},
            {"column": "promotional_image", "type": "varchar", "pk": False, "fk": None, "comment": "宣传图URL"},
            {"column": "region", "type": "varchar(100)", "pk": False, "fk": None, "comment": "地区"},
            {"column": "stage", "type": "varchar(20)", "pk": False, "fk": None, "comment": "阶段: preliminary(初赛)/advancing(晋级赛)/final(决赛)/空字符串"},
            {"column": "created_at", "type": "timestamp", "pk": False, "fk": None, "comment": "创建时间"},
            {"column": "updated_at", "type": "timestamp", "pk": False, "fk": None, "comment": "更新时间"},
        ],
    },
    {
        "name": "competitions_event_videos",
        "description": "赛事活动-视频关联表 —— 多对多关系",
        "columns": [
            {"column": "id", "type": "integer", "pk": True, "fk": None, "comment": "自增主键"},
            {"column": "event_id", "type": "uuid", "pk": False, "fk": "competitions_event.id", "comment": "赛事活动ID"},
            {"column": "video_id", "type": "uuid", "pk": False, "fk": "videos_video.id", "comment": "视频ID"},
        ],
    },
    {
        "name": "awards_award",
        "description": "奖项 —— 定义比赛中的各种奖项类别",
        "columns": [
            {"column": "id", "type": "uuid", "pk": True, "fk": None, "comment": "主键"},
            {"column": "competition_id", "type": "uuid", "pk": False, "fk": "competitions_competition.id CASCADE", "comment": "所属赛事ID"},
            {"column": "name", "type": "varchar(100)", "pk": False, "fk": None, "comment": "奖项名称"},
            {"column": "created_at", "type": "timestamp", "pk": False, "fk": None, "comment": "创建时间"},
            {"column": "updated_at", "type": "timestamp", "pk": False, "fk": None, "comment": "更新时间"},
        ],
    },
    {
        "name": "awards_awardrecord",
        "description": "获奖记录 —— 记录具体的获奖信息, 关联奖项、年份、社团和视频",
        "columns": [
            {"column": "id", "type": "uuid", "pk": True, "fk": None, "comment": "主键"},
            {"column": "award_id", "type": "uuid", "pk": False, "fk": "awards_award.id CASCADE", "comment": "奖项ID"},
            {"column": "competition_year_id", "type": "uuid", "pk": False, "fk": "competitions_competitionyear.id CASCADE", "comment": "赛事年份ID"},
            {"column": "group_id", "type": "uuid", "pk": False, "fk": "groups_group.id", "comment": "获奖社团ID, 可为空"},
            {"column": "video_id", "type": "uuid", "pk": False, "fk": "videos_video.id", "comment": "获奖视频ID, 可为空"},
            {"column": "drama_name", "type": "varchar(200)", "pk": False, "fk": None, "comment": "剧目名称"},
            {"column": "description", "type": "text", "pk": False, "fk": None, "comment": "描述"},
            {"column": "created_at", "type": "timestamp", "pk": False, "fk": None, "comment": "创建时间"},
            {"column": "updated_at", "type": "timestamp", "pk": False, "fk": None, "comment": "更新时间"},
        ],
    },
    {
        "name": "tags_tag",
        "description": "标签 —— 用于视频分类的标签体系, 支持IP/风格等类别",
        "columns": [
            {"column": "id", "type": "uuid", "pk": True, "fk": None, "comment": "主键"},
            {"column": "name", "type": "varchar(50)", "pk": False, "fk": None, "comment": "标签名称"},
            {"column": "category", "type": "varchar(20)", "pk": False, "fk": None, "comment": "类别: IP/style/other"},
            {"column": "description", "type": "text", "pk": False, "fk": None, "comment": "标签描述"},
            {"column": "color", "type": "varchar(7)", "pk": False, "fk": None, "comment": "颜色值, 默认#007bff"},
            {"column": "usage_count", "type": "integer", "pk": False, "fk": None, "comment": "使用次数"},
            {"column": "is_active", "type": "boolean", "pk": False, "fk": None, "comment": "是否启用"},
            {"column": "is_featured", "type": "boolean", "pk": False, "fk": None, "comment": "是否推荐"},
            {"column": "created_at", "type": "timestamp", "pk": False, "fk": None, "comment": "创建时间"},
            {"column": "updated_at", "type": "timestamp", "pk": False, "fk": None, "comment": "更新时间"},
        ],
    },
    {
        "name": "tags_videotag",
        "description": "视频-标签关联表 —— 多对多关系",
        "columns": [
            {"column": "id", "type": "integer", "pk": True, "fk": None, "comment": "自增主键"},
            {"column": "video_id", "type": "uuid", "pk": False, "fk": "videos_video.id", "comment": "视频ID"},
            {"column": "tag_id", "type": "uuid", "pk": False, "fk": "tags_tag.id", "comment": "标签ID"},
            {"column": "created_at", "type": "timestamp", "pk": False, "fk": None, "comment": "创建时间"},
        ],
    },
]

RELATIONSHIPS: str = """\
## Table Relationships

| From Table              | From Column        | To Table                        | To Column |
|-------------------------|--------------------|---------------------------------|-----------|
| videos_video            | group_id           | groups_group                    | id        |
| videos_video            | competition_id     | competitions_competition        | id        |
| videos_video            | uploaded_by_id     | users_user                      | id        |
| competitions_competitionyear | competition_id | competitions_competition        | id        |
| competitions_event      | competition_id     | competitions_competition        | id        |
| competitions_event_videos | event_id          | competitions_event              | id        |
| competitions_event_videos | video_id          | videos_video                    | id        |
| awards_award            | competition_id     | competitions_competition        | id        |
| awards_awardrecord      | award_id           | awards_award                    | id        |
| awards_awardrecord      | competition_year_id| competitions_competitionyear    | id        |
| awards_awardrecord      | group_id           | groups_group                    | id        |
| awards_awardrecord      | video_id           | videos_video                    | id        |
| tags_videotag           | video_id           | videos_video                    | id        |
| tags_videotag           | tag_id             | tags_tag                        | id        |
| groups_group            | created_by_id      | users_user                      | id        |
"""


def get_tables() -> list[dict]:
    """Return a list of table summaries (name + description)."""
    return [{"name": t["name"], "description": t["description"]} for t in _TABLES]


def get_table_schema(table_name: str) -> dict:
    """Return the full schema dict for *table_name*, or an error dict.

    Returns ``{'error': '...'}`` when *table_name* is not in
    :data:`ALLOWED_TABLES`.
    """
    if table_name not in ALLOWED_TABLES:
        return {"error": f"Unknown table: {table_name}"}
    for t in _TABLES:
        if t["name"] == table_name:
            return t
    # Should be unreachable given the frozenset check, but be safe.
    return {"error": f"Table metadata missing: {table_name}"}
