# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cosplay舞台剧视频数据库 - A full-stack web application for managing cosplay competition videos, groups, awards, and forums.

**Tech Stack:**
- **Backend**: Django 4.2 + Django REST Framework + PostgreSQL
- **Frontend**: React 18 + TypeScript + Vite + Redux Toolkit + Tailwind CSS
- **Storage**: Cloudflare R2 for user avatars
- **Editor**: TipTap for forum posts with Persona 5 styling
- **Auth**: JWT tokens + django-allauth (social login support)

## Project Structure

```
cosplay_web/
├── backend/                    # Django backend
│   ├── manage.py              # Django management commands
│   ├── cosplay_api/           # Project settings
│   │   ├── settings.py        # Django configuration
│   │   └── urls.py            # Main URL routing
│   ├── apps/                  # Django apps (modular architecture)
│   │   ├── authentication/    # JWT auth, social login
│   │   ├── users/             # User profiles, avatar upload
│   │   ├── videos/            # Video CRUD, filters, bulk import
│   │   ├── groups/            # Club/group management
│   │   ├── competitions/      # Competition, event, schedule
│   │   ├── awards/            # Award records
│   │   ├── tags/              # Tag categories and management
│   │   ├── forum/             # Forum posts, comments, categories
│   │   ├── map/               # China map visualization data
│   │   └── feedback/          # User feedback system
│   └── requirements.txt
├── src/                       # React frontend
│   ├── pages/                 # Page components
│   ├── components/            # Reusable UI components
│   ├── services/              # API service layer (axios)
│   ├── store/                 # Redux slices
│   ├── types/                 # TypeScript types
│   └── styles/                # P5 theme CSS
└── bilibili_video_agent/      # Python agent for Bilibili video processing
```

## Common Commands

### Backend (Django)
```bash
cd backend

# Create/activate virtual environment (prefer uv)
uv venv
source .venv/bin/activate  # 或 `.venv\Scripts\activate` on Windows
# 注意：后续所有命令都在激活的虚拟环境中执行

# Install dependencies
pip install -r requirements.txt

# Database migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Run development server
python manage.py runserver

# Django Admin
# http://localhost:8000/admin/
# API Docs (Swagger): http://localhost:8000/api/docs/
# API Schema: http://localhost:8000/api/schema/
```

### Frontend (React + Vite)
```bash
# Install dependencies
npm install

# Development server (runs on http://localhost:5173/)
npm run dev

# Build for production
npm run build

# Lint
npm run lint

# Build choreomaster data separately
npm run build:choreomaster
```

### Bilibili Video Agent
```bash
cd bilibili_video_agent

# Install dependencies
pip install -r requirements.txt

# Run agent (for video fetching/processing)
python main.py
```

### Database Management
```bash
# Use db_manager.py for database backup/restore operations
# Note: This script is located in the project root directory

# Backup database
python db_manager.py backup

# Restore database from backup
python db_manager.py restore --backup-file database/backup_YYYYMMDD_HHMMSS.sql

# List available backups
python db_manager.py list-backups

# Check database container status
python db_manager.py status
```

### Project Startup Scripts
```bash
# Start all services (frontend, backend, Celery worker, Celery beat)
./start_all.sh

# Stop all services
./stop_all.sh

# Note: These scripts manage the entire development environment
# - Frontend (Vite dev server on port 5173)
# - Backend (Django dev server on port 8000)
# - Celery worker for async tasks
# - Celery beat for scheduled tasks
```

### Celery Tasks
```bash
cd backend
source .venv/bin/activate  # 确保虚拟环境已激活

# Start Celery worker (for async tasks)
celery -A cosplay_api worker --loglevel=info

# Start Celery beat scheduler (for periodic tasks)
celery -A cosplay_api beat --loglevel=info

# Run individual task manually
python manage.py shell
>>> from apps.videos.tasks import crawl_bilibili_videos_weekly
>>> crawl_bilibili_videos_weekly.delay()
```

## Architecture Notes

### Backend Architecture
- **Modular Django apps**: Each domain (videos, groups, forum, etc.) is a separate app under `apps/`
- **API design**: RESTful with DRF serializers, filters, and pagination
- **Authentication**: JWT tokens via `rest_framework_simplejwt`, supports refresh tokens
- **Social login**: django-allauth configured for Weibo and GitHub
- **Caching**: Redis-based caching for group stats (see `apps/groups/cache_utils.py`)
- **Async tasks**: Celery + Redis for background jobs
- **Admin interface**: Fully configured Django Admin for content management

### Frontend Architecture
- **State management**: Redux Toolkit with slices for videos, groups, competitions, awards, forum
- **API layer**: Centralized axios instance with interceptors for auth tokens
- **Routing**: React Router v6 with protected routes
- **Styling**: Tailwind CSS with custom Persona 5 theme (`src/styles/p5-theme.css`)
- **Editor**: TipTap-based rich text editor with P5 styling for forum posts
- **Security**: DOMPurify for XSS protection in forum content

### Key Features Implemented
- **Forum system**: Categories, posts, comments, edit/delete permissions, atomic view counting
- **User system**: Avatar upload (R2), default avatar fallback, role-based access
- **Video management**: Filters, search, bulk import from Excel
- **Competition schedules**: Region-based event display with video links
- **Feedback system**: Site suggestions and issue reporting

### Important Configuration
- **Environment variables**: Loaded from `.env` in project root (not in backend/)
- **CORS**: Configured for frontend-backend communication
- **R2 Storage**: User avatars stored in Cloudflare R2 bucket `cosdrama`
- **API base URL**: Uses Vite proxy in dev (`/api`), direct URL in production

## Development Guidelines

### When creating new features:
1. Backend: Create new Django app under `apps/` or add to existing app
2. Add DRF serializers, views, and URL patterns
3. Update OpenAPI schema with drf-spectacular decorators if needed
4. Frontend: Create service in `src/services/`, add Redux slice if state needed
5. Add page component in `src/pages/` or reusable component in `src/components/`

### Python environment management:
- Use `uv` for creating and managing Python virtual environments (preferred)

### Development tracking:
- Record completed features and unresolved issues in the development progress section below

### Cloudflare R2 Configuration:
- Bucket name: `cosdrama` (APAC region)
- Used for: User avatar uploads
- Credentials: Stored in `.env` file (AWS_S3_ACCESS_KEY_ID, AWS_S3_SECRET_ACCESS_KEY)
- S3 API endpoint: Configured in Django settings

---

## Agent skills

### Issue tracker

Issues 托管在 GitHub Issues。使用 `gh` CLI 进行创建和管理。详见 `docs/agents/issue-tracker.md`。

### Triage labels

使用中文标签：需要评估、需要信息、agent自动化、需要人工、不会修复。详见 `docs/agents/triage-labels.md`。

### Domain docs

单一上下文布局：`CONTEXT.md` + `docs/adr/` 在仓库根目录。详见 `docs/agents/domain.md`。

---

## 开发进度记录
### 2026-01-16: 论坛功能 (Forum)
- **后端**: 实现 Django forum App，包含分类、帖子、评论模型。支持原子浏览量统计及 N+1 查询优化。已修复发帖内容丢失及头像缺失导致的 500 错误。
- **前端**: 实现基于 TipTap 的 Persona 5 风格编辑器。
- **UI**: 完成列表页、详情页、发帖页。
- **安全**: 集成 DOMPurify 进行 XSS 防御。

### 2026-01-17: 用户系统与论坛增强
- **用户中心**:
  - 添加头像上传功能，集成 Cloudflare R2 存储。
  - 实现默认头像逻辑：无头像时显示昵称/用户名首字符（Persona 5 风格）。
- **论坛增强**:
  - 添加"我的帖子"筛选功能。
  - 实现帖子编辑与删除功能，并集成权限校验。
  - 配置 Django Admin 后台，支持管理论坛分类、帖子与评论。
- **页脚与反馈系统**:
  - 添加 P5 风格页脚组件，包含 GitHub 链接和开发者信息。
  - 实现用户反馈功能：支持站点建议、社团/奖项信息问题反馈。
  - 反馈弹窗支持登录/匿名用户提交。
  - 管理员用户中心新增反馈管理面板，支持查看、回复、状态管理。
  - Django Admin 后台支持反馈管理。