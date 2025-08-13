#!/bin/bash
echo "正在后台启动服务..."
npm run preview > logs/frontend.log 2>&1 &
echo $! > logs/frontend.pid

cd backend
source .venv/bin/activate
python3 manage.py runserver > ../logs/backend.log 2>&1 &
echo $! > ../logs/backend.pid
cd ..

echo "服务已在后台启动"
echo "前端: http://localhost:4173/"
echo "后端: http://localhost:8000/"