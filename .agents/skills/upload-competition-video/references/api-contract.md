# API Contract: Upload Competition Video

Use these endpoints for the cosplay_web Django backend.

Set the backend entrypoint to:

```bash
API_BASE="https://data.cosdrama.cn/api"
```

## Authentication

Login:

```bash
curl -sS -X POST "$API_BASE/auth/login/" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"chenyan123"}'
```

Use the returned access token:

```bash
AUTH=(-H "Authorization: Bearer $ACCESS_TOKEN")
```

Authenticated writes require a user that can manage videos. The default account is `admin` / `chenyan123` unless the user provides another credential.

## Get Bilibili Metadata

```bash
curl -sS -X POST "$API_BASE/videos/bilibili-metadata/" \
  "${AUTH[@]}" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://www.bilibili.com/video/BV.../"}'
```

Response fields:

```json
{
  "bv_number": "BV...",
  "title": "...",
  "description": "...",
  "thumbnail": "https://...",
  "url": "https://www.bilibili.com/video/BV.../",
  "year": 2026
}
```

## Discover Competitions And Events

Fetch competitions:

```bash
curl -sS "$API_BASE/competitions/competitions/?page_size=1000"
```

Fetch events:

```bash
curl -sS "$API_BASE/competitions/events/?page_size=1000"
```

Fetch a competition schedule:

```bash
curl -sS "$API_BASE/competitions/competitions/$COMPETITION_ID/schedule/"
```

DRF may return either a paginated object with `results` or a bare list. Handle both.

Event fields used for matching:

```json
{
  "id": "uuid",
  "start_date": "2026-08-01",
  "end_date": "2026-08-02",
  "competition": "competition-uuid",
  "competition_name": "ChinaJoy",
  "title": "2026 ChinaJoy Cosplay 嘉年华 华东赛区决赛",
  "description": "...",
  "region": "华东",
  "stage": "final",
  "stage_display": "决赛"
}
```

## Create Video

Required fields: `bv_number`, `title`, `url`.

Recommended payload:

```bash
curl -sS -X POST "$API_BASE/videos/" \
  "${AUTH[@]}" \
  -H "Content-Type: application/json" \
  -d '{
    "bv_number": "BV...",
    "title": "原始B站标题或清洗后的剧名标题",
    "description": "B站简介；追加结构化识别信息如 剧名/赛区/阶段",
    "url": "https://www.bilibili.com/video/BV.../",
    "thumbnail": "https://...",
    "competition": "competition-uuid",
    "group": "group-uuid-if-known",
    "year": 2026
  }'
```

The API sets `uploaded_by` from the authenticated user.

## Link Video To Event

Preferred endpoint:

```bash
curl -sS -X POST "$API_BASE/competitions/events/$EVENT_ID/link_video/" \
  "${AUTH[@]}" \
  -H "Content-Type: application/json" \
  -d '{"video_id":"VIDEO_UUID"}'
```

Equivalent endpoint:

```bash
curl -sS -X POST "$API_BASE/videos/$VIDEO_ID/link_event/" \
  "${AUTH[@]}" \
  -H "Content-Type: application/json" \
  -d '{"event_id":"EVENT_UUID"}'
```

## Duplicate Handling

Check first:

```bash
curl -sS "$API_BASE/videos/?search=BV..."
```

If a matching `bv_number` exists, do not `POST /videos/`. Ask whether to link the existing video to the event. If yes, call the link endpoint with the existing video id.

## Inference Prompt Template

Use this compact extraction frame when reasoning from metadata:

```text
从 B 站视频标题和简介中提取：
competition = 比赛/活动名
year = 赛事年份，优先标题/简介中的年份
drama_name = 舞台剧/作品名
region = 分赛区/城市/站点
stage = preliminary|advancing|final
group = 社团/团队名

只根据文本和现有赛事列表判断。没有明确证据则留空并向用户确认。
```
