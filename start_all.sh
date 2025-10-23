#!/bin/bash

# 一键启动前端、后端与 Celery（使用后端虚拟环境）
set -e

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
VENV_BIN="$BACKEND_DIR/.venv/bin"
LOG_DIR="$PROJECT_ROOT/logs"

mkdir -p "$LOG_DIR"

echo "正在后台启动服务..."

# 启动前端（vite preview）
npm run preview > "$LOG_DIR/frontend.log" 2>&1 &
echo $! > "$LOG_DIR/frontend.pid"

# 启动后端（Django）
cd "$BACKEND_DIR"
source "$VENV_BIN/activate"
python3 manage.py runserver > "$LOG_DIR/backend.log" 2>&1 &
echo $! > "$LOG_DIR/backend.pid"
cd "$PROJECT_ROOT"

# 启动 Celery Worker 和 Beat（确保在 backend 目录下以便导入 cosplay_api）
cd "$BACKEND_DIR"
echo "正在启动 Celery Worker (venv)..."
"$VENV_BIN/celery" -A cosplay_api worker -l info --detach --pidfile=/tmp/celery_worker.pid --logfile=/tmp/celery_worker.log
sleep 2
echo "正在启动 Celery Beat (venv)..."
"$VENV_BIN/celery" -A cosplay_api beat -l info --detach --pidfile=/tmp/celery_beat.pid --logfile=/tmp/celery_beat.log
cd "$PROJECT_ROOT"

echo "服务已在后台启动"
echo "前端: http://localhost:4173/"
echo "后端: http://localhost:8000/"
echo "Celery Worker 日志: /tmp/celery_worker.log"
echo "Celery Beat 日志: /tmp/celery_beat.log"