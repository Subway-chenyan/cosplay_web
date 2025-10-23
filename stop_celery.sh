#!/bin/bash

# Celery 服务停止脚本

echo "正在停止 Celery 服务..."

# 停止 Celery Worker
if [ -f /tmp/celery_worker.pid ]; then
    WORKER_PID=$(cat /tmp/celery_worker.pid)
    if ps -p $WORKER_PID > /dev/null; then
        echo "停止 Celery Worker (PID: $WORKER_PID)..."
        kill -TERM $WORKER_PID
        sleep 2
        if ps -p $WORKER_PID > /dev/null; then
            echo "强制停止 Worker..."
            kill -KILL $WORKER_PID
        fi
    fi
    rm -f /tmp/celery_worker.pid
else
    echo "未找到 Worker PID 文件，尝试通过进程名停止..."
    pkill -f "celery.*worker"
fi

# 停止 Celery Beat
if [ -f /tmp/celery_beat.pid ]; then
    BEAT_PID=$(cat /tmp/celery_beat.pid)
    if ps -p $BEAT_PID > /dev/null; then
        echo "停止 Celery Beat (PID: $BEAT_PID)..."
        kill -TERM $BEAT_PID
        sleep 2
        if ps -p $BEAT_PID > /dev/null; then
            echo "强制停止 Beat..."
            kill -KILL $BEAT_PID
        fi
    fi
    rm -f /tmp/celery_beat.pid
else
    echo "未找到 Beat PID 文件，尝试通过进程名停止..."
    pkill -f "celery.*beat"
fi

echo "Celery 服务已停止"

# 清理日志文件（可选）
read -p "是否清理日志文件? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    rm -f /tmp/celery_worker.log /tmp/celery_beat.log
    echo "日志文件已清理"
fi