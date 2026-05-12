---
name: Project Environment Setup
description: Virtual environment setup and service management commands for the cosplay_web project
type: project
originSessionId: 9ec8ffeb-7fa0-4ecb-95e5-cefa580e4017
---
## 项目环境配置

### Python 环境管理

**推荐使用 uv (更快的虚拟环境管理工具)**

```bash
# 创建虚拟环境
cd backend
uv venv

# 激活虚拟环境
source .venv/bin/activate  # Linux/Mac
.venv\Scripts\activate     # Windows

# 安装依赖
pip install -r requirements.txt

# 或者使用 uv 安装（更快）
uv pip install -r requirements.txt
```

**传统 virtualenv 方式**
```bash
# 创建虚拟环境
cd backend
python3 -m venv .venv

# 激活虚拟环境
source .venv/bin/activate

# 安装依赖
pip install -r requirements.txt
```

### 服务启动脚本

**完整启动所有服务 (推荐)**

```bash
# 使用项目自带的启动脚本
./start_all.sh

# 这个脚本会：
# 1. 构建前端 (npm run build + npm run preview)
# 2. 启动后端 (Django runserver)
# 3. 启动 PostgreSQL 数据库服务
# 4. 启动 Redis 服务
```

**手动启动服务**

**1. 启动数据库服务**
```bash
cd backend

# 启动 PostgreSQL
docker run -d --name cosplay_db \
  -e POSTGRES_DB=cosplay_db \
  -e POSTGRES_USER=cosplay_user \
  -e POSTGRES_PASSWORD=cosplay_password_2024 \
  -p 5433:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:15

# 启动 Redis
docker run -d --name cosplay_redis \
  -p 6379:6379 \
  redis:7-alpine
```

**2. 启动后端服务**
```bash
cd backend

# 激活虚拟环境
source .venv/bin/activate

# 运行数据库迁移
python manage.py makemigrations
python manage.py migrate

# 创建超级用户（如果需要）
python manage.py createsuperuser

# 启动开发服务器
python manage.py runserver 0.0.0.0:8000
```

**3. 启动前端服务**
```bash
# 在项目根目录
npm run dev          # 开发模式
npm run build        # 生产构建
npm run preview      # 生产预览
```

### 服务端口说明

- **前端开发服务器**: http://localhost:5173
- **前端预览服务器**: http://localhost:4173  
- **后端API服务器**: http://localhost:8000
- **数据库端口**: 5433 (避免与系统PostgreSQL冲突)
- **Redis端口**: 6379

### 快速重启命令

**重启后端服务**
```bash
cd backend
source .venv/bin/activate
pkill -f "python manage.py runserver"
python manage.py runserver 0.0.0.0:8000 &
```

**重启前端服务**
```bash
pkill -f "vite"
npm run preview &
```

**重启所有服务**
```bash
# 停止所有服务
pkill -f "python manage.py runserver"
pkill -f "vite"
pkill -f "npm"

# 重新启动
./start_all.sh
```

### 常用命令备忘

**数据库操作**
```bash
cd backend

# 查看数据库状态
python manage.py dbshell

# 创建迁移
python manage.py makemigrations

# 应用迁移
python manage.py migrate

# 查看URL配置
python manage.py show_urls
```

**前端开发**
```bash
# 安装依赖
npm install

# 开发模式（热重载）
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview

# 构建Choreomaster数据
npm run build:choreomaster
```

### 环境变量配置

**后端环境变量** (在 backend/.env)
```env
DEBUG=True
SECRET_KEY=your-secret-key

# 数据库配置
DB_NAME=cosplay_db
DB_USER=cosplay_user
DB_PASSWORD=cosplay_password_2024
DB_HOST=localhost
DB_PORT=5433

# Redis配置
REDIS_URL=redis://localhost:6379/0

# Cloudflare R2配置（用于头像存储）
R2_ACCESS_KEY_ID=your-r2-key
R2_SECRET_ACCESS_KEY=your-r2-secret
R2_BUCKET_NAME=cosdrama
R2_ENDPOINT_URL=https://your-r2-endpoint
```

**QQ Connect OAuth配置** (在项目根目录.env)
```env
QQ_CONNECT_APP_ID=your-app-id
QQ_CONNECT_CLIENT_SECRET=your-client-secret
QQ_CONNECT_CALLBACK_URL=https://your-domain.com/auth/qq/callback/
```

### 故障排除

**Django 迁移问题**
```bash
# 删除迁移文件（谨慎使用）
cd backend
find . -name "migrations" -type d -not -path "./venv/*" -exec rm -rf {} +
rm db.sqlite3

# 重新创建迁移
python manage.py makemigrations
python manage.py migrate
```

**端口占用问题**
```bash
# 查看端口占用
lsof -i :8000
lsof -i :5173

# 杀死占用进程
kill -9 <PID>
```

**虚拟环境问题**
```bash
# 删除旧虚拟环境
cd backend
rm -rf .venv

# 重新创建
uv venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 性能优化建议

1. **使用 uv 替代 pip**: uv 安装速度比 pip 快 5-10 倍
2. **使用 Docker Compose**: 对于生产环境，推荐使用 docker-compose.yml
3. **缓存静态文件**: 运行 `python manage.py collectstatic` 缓存静态文件
4. **数据库索引**: 确保数据库表有适当的索引以提高查询性能