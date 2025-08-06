#!/bin/bash

# 一键启动前后端脚本
# 作者: AI Assistant
# 用途: 同时启动前端和后端服务

echo "正在启动 Cosplay Web 应用..."
echo "=============================="

# 检查是否在正确的目录
if [ ! -f "package.json" ]; then
    echo "错误: 请在项目根目录运行此脚本"
    exit 1
fi

# 创建日志目录
mkdir -p logs

# 启动前端服务 (生产环境预览)
echo "启动前端服务 (端口 4173)..."
npm run preview > logs/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "前端服务 PID: $FRONTEND_PID"

# 等待前端服务启动
sleep 3

# 启动后端服务
echo "启动后端服务 (端口 8000)..."
cd backend
./start.sh > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "后端服务 PID: $BACKEND_PID"
cd ..

# 保存 PID 到文件，方便后续停止服务
echo $FRONTEND_PID > logs/frontend.pid
echo $BACKEND_PID > logs/backend.pid

echo "=============================="
echo "服务启动完成!"
echo "前端地址: http://localhost:4173/"
echo "后端地址: http://localhost:8000/"
echo "通过域名访问: http://www.cosdrama.cn (前端) | http://data.cosdrama.cn (后端)"
echo ""
echo "查看日志:"
echo "  前端日志: tail -f logs/frontend.log"
echo "  后端日志: tail -f logs/backend.log"
echo ""
echo "停止服务: ./stop_all.sh"
echo "=============================="

# 等待用户输入或信号
echo "按 Ctrl+C 停止所有服务"
trap 'echo "\n正在停止服务..."; kill $FRONTEND_PID $BACKEND_PID 2>/dev/null; echo "服务已停止"; exit 0' INT

# 保持脚本运行
while true; do
    sleep 1
done