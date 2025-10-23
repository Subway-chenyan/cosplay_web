#!/bin/bash

# Celery 服务启动脚本（启用后端虚拟环境，依赖已运行的 docker Redis）

set -e
PROJECT_ROOT=/home/ubuntu/cosplay_web
BACKEND_DIR=$PROJECT_ROOT/backend
VENV_BIN=$BACKEND_DIR/.venv/bin

# 激活虚拟环境（使用绝对路径执行）
source $BACKEND_DIR/.venv/bin/activate

cd $BACKEND_DIR

# 在虚拟环境中启动 Celery Worker 和 Beat
echo "正在启动 Celery Worker (venv)..."
$VENV_BIN/celery -A cosplay_api worker -l info --detach --pidfile=/tmp/celery_worker.pid --logfile=/tmp/celery_worker.log

sleep 2

echo "正在启动 Celery Beat (venv)..."
$VENV_BIN/celery -A cosplay_api beat -l info --detach --pidfile=/tmp/celery_beat.pid --logfile=/tmp/celery_beat.log

echo "Celery 服务启动完成!"
echo "- Worker 日志: /tmp/celery_worker.log"
echo "- Beat 日志: /tmp/celery_beat.log"