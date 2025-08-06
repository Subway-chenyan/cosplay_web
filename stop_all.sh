#!/bin/bash

# 停止所有服务脚本
# 作者: AI Assistant
# 用途: 停止前端和后端服务

echo "正在停止 Cosplay Web 应用服务..."
echo "=============================="

# 检查 PID 文件是否存在
if [ -f "logs/frontend.pid" ]; then
    FRONTEND_PID=$(cat logs/frontend.pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "停止前端服务 (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        echo "前端服务已停止"
    else
        echo "前端服务未运行"
    fi
    rm -f logs/frontend.pid
else
    echo "未找到前端服务 PID 文件"
fi

if [ -f "logs/backend.pid" ]; then
    BACKEND_PID=$(cat logs/backend.pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "停止后端服务 (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        echo "后端服务已停止"
    else
        echo "后端服务未运行"
    fi
    rm -f logs/backend.pid
else
    echo "未找到后端服务 PID 文件"
fi

# 额外清理：杀死可能残留的进程
echo "清理残留进程..."
pkill -f "npm run preview" 2>/dev/null || true
pkill -f "vite preview" 2>/dev/null || true
pkill -f "python.*manage.py" 2>/dev/null || true

echo "=============================="
echo "所有服务已停止!"
echo "=============================="