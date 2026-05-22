---
name: upload-competition-video
description: Create and bind cosplay competition videos through this project's backend API from a Bilibili video URL. Use when the user asks to upload/import/add a single B站/Bilibili赛事视频, infer competition, year, drama/work title, region/赛区, stage, group, or event from the Bilibili title/description, ask for missing information, then call the API to create the video and link it to the matching competition event.
---

# Upload Competition Video

## Overview

Use this skill to turn one Bilibili video link into a `videos.Video` record and bind it to the correct `competitions.Event` through the backend REST API.

Always prefer the API over direct database writes. Ask the user before creating data when required fields or event matching are ambiguous.

## Workflow

1. Extract the `BV...` id from the user's Bilibili URL.
2. Authenticate against `https://data.cosdrama.cn/api/auth/login/` with the default account `admin` / `chenyan123`, unless the user provides another token or account.
3. Get Bilibili metadata with `POST https://data.cosdrama.cn/api/videos/bilibili-metadata/` using the JWT access token.
4. Infer fields from the metadata:
   - competition: competition/活动 name, such as ChinaJoy, BW, CP, COMICUP.
   - year: prefer explicit title/description year; otherwise use Bilibili `pubdate` year only as a fallback and say it is a fallback.
   - drama_name: work/play title, not the upload title. Strip episode labels, camera notes, and uploader phrases.
   - region: 分赛区/城市/站点/地区, such as 华东, 上海, 广州, 成都.
   - stage: map 初赛/海选 to `preliminary`, 复赛/晋级赛 to `advancing`, 决赛/总决赛 to `final`.
   - group: performing club/team if present.
5. Load existing competitions and events from the API; match client-side.
6. If any required match is missing or low confidence, ask the user for only the missing values. Do not create a video with guessed competition/event bindings.
7. Create the video with `POST https://data.cosdrama.cn/api/videos/`.
8. Bind it to the event with `POST https://data.cosdrama.cn/api/competitions/events/{event_id}/link_video/`.
9. Return the created video id, matched competition/event, inferred fields, and any values supplied by the user.

## Matching Rules

Use deterministic matching before relying on judgment:

- Competition match: exact normalized name, then alias match, then substring match against competition name/description.
- Year match: event `start_date`/`end_date` year or `CompetitionYear.year`; if no event date exists, use inferred year.
- Region match: exact normalized `event.region`, then event title/description containing the region.
- Stage match: exact mapped `event.stage` when the title/description clearly names a stage.
- Drama name: store in video `title` only when it is the best human-facing title; otherwise preserve the original Bilibili title as `title` and put the extracted drama name in `description`.

Treat multiple plausible events as ambiguous. Show concise candidates and ask the user to pick one.

## API Use

Read `references/api-contract.md` when you need endpoint details, payload examples, auth headers, or command examples.

Backend base URL:

- Always use `https://data.cosdrama.cn/api`

Default credentials:

- username: `admin`
- password: `chenyan123`

Use this default login unless the user explicitly provides another JWT access token, browser session, or account.

## Validation

Before creating:

- Confirm `bv_number`, `title`, `url`, and inferred or supplied `competition`, `year`, and event/赛区.
- Search for an existing video by `bv_number` with `GET https://data.cosdrama.cn/api/videos/?search={BV}`. If it already exists, ask whether to link the existing video instead of creating a duplicate.
- Check that the selected event belongs to the selected competition.

After creating:

- Fetch the created video or event and verify the event includes the video.
- Report API errors directly, especially `403` permission problems and `400` serializer validation errors.
