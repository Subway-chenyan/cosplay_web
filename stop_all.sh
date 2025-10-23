#!/bin/bash

# 一键停止前端、后端与 Celery
set -e

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$PROJECT_ROOT/logs"

echo "正在停止 Cosplay Web 应用服务..."
echo "=============================="

# 停止前端
if [ -f "$LOG_DIR/frontend.pid" ]; then
    FRONTEND_PID=$(cat "$LOG_DIR/frontend.pid")
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "停止前端服务 (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID || true
    else
        echo "前端服务未运行"
    fi
    rm -f "$LOG_DIR/frontend.pid"
else
    echo "未找到前端服务 PID 文件"
fi

# 停止后端
if [ -f "$LOG_DIR/backend.pid" ]; then
    BACKEND_PID=$(cat "$LOG_DIR/backend.pid")
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "停止后端服务 (PID: $BACKEND_PID)..."
        kill $BACKEND_PID || true
    else
        echo "后端服务未运行"
    fi
    rm -f "$LOG_DIR/backend.pid"
else
    echo "未找到后端服务 PID 文件"
fi

# 停止 Celery Worker
if [ -f /tmp/celery_worker.pid ]; then
    WORKER_PID=$(cat /tmp/celery_worker.pid)
    if ps -p $WORKER_PID > /dev/null; then
        echo "停止 Celery Worker (PID: $WORKER_PID)..."
        kill -TERM $WORKER_PID || true
        sleep 2
        if ps -p $WORKER_PID > /dev/null; then
            echo "强制停止 Worker..."
            kill -KILL $WORKER_PID || true
        fi
    fi
    rm -f /tmp/celery_worker.pid
else
    echo "未找到 Worker PID 文件，尝试通过进程名停止..."
    pkill -f "celery.*worker" 2>/dev/null || true
fi

# 停止 Celery Beat
if [ -f /tmp/celery_beat.pid ]; then
    BEAT_PID=$(cat /tmp/celery_beat.pid)
    if ps -p $BEAT_PID > /dev/null; then
        echo "停止 Celery Beat (PID: $BEAT_PID)..."
        kill -TERM $BEAT_PID || true
        sleep 2
        if ps -p $BEAT_PID > /dev/null; then
            echo "强制停止 Beat..."
            kill -KILL $BEAT_PID || true
        fi
    fi
    rm -f /tmp/celery_beat.pid
else
    echo "未找到 Beat PID 文件，尝试通过进程名停止..."
    pkill -f "celery.*beat" 2>/dev/null || true
fi

# 额外清理：杀死可能残留的进程
echo "清理残留进程..."
pkill -f "npm run preview" 2>/dev/null || true
pkill -f "vite preview" 2>/dev/null || true
pkill -f "python.*manage.py" 2>/dev/null || true

# 非交互清理日志（可选：通过参数控制）
if [ "$1" == "--clean-logs" ]; then
  rm -f /tmp/celery_worker.log /tmp/celery_beat.log "$LOG_DIR/frontend.log" "$LOG_DIR/backend.log" || true
  echo "日志文件已清理"
fi

echo "=============================="
echo "所有服务已停止!"
echo "=============================="