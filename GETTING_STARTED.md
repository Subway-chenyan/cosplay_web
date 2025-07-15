# 快速开始指南

欢迎使用Cosplay舞台剧视频数据库项目！本指南将帮助您在10分钟内搭建并运行整个系统。

## 🚀 三种部署方式

### 方式一：Docker一键部署（推荐）

这是最简单的方式，适合快速体验和生产部署。

```bash
# 1. 确保已安装Docker和Docker Compose
docker --version
docker-compose --version

# 2. 启动所有服务
docker-compose up -d

# 3. 等待服务启动（通常需要2-3分钟）
docker-compose logs -f

# 4. 访问应用
# 前端: http://localhost:3000
# 后端: http://localhost:8000  
# API文档: http://localhost:8000/api/docs/
```

### 方式二：本地开发环境

适合开发者和需要自定义的用户。

#### 步骤1: 设置数据库

```bash
# 安装PostgreSQL（如果尚未安装）
# Ubuntu/Debian:
sudo apt-get install postgresql postgresql-contrib

# macOS (使用Homebrew):
brew install postgresql

# Windows: 下载并安装PostgreSQL

# 创建数据库
sudo -u postgres createdb cosplay_db
sudo -u postgres createuser cosplay_user

# 导入数据库结构
psql -U cosplay_user -d cosplay_db -f database/init.sql
```

#### 步骤2: 设置后端

```bash
# 进入后端目录
cd backend

# 创建虚拟环境
python3 -m venv venv

# 激活虚拟环境
source venv/bin/activate  # Linux/Mac
# 或
venv\Scripts\activate     # Windows

# 安装依赖
pip install -r requirements.txt

# 创建环境配置文件
cp ../env_template.txt .env
# 编辑 .env 文件，配置数据库连接信息

# 运行数据库迁移
python manage.py makemigrations
python manage.py migrate

# 创建超级用户
python manage.py createsuperuser

# 启动开发服务器
python manage.py runserver
```

#### 步骤3: 设置前端

```bash
# 新开一个终端，进入前端目录
cd frontend

# 安装Node.js依赖
npm install

# 启动开发服务器
npm run dev
```

### 方式三：生产环境部署

适合正式环境部署。

```bash
# 1. 修改环境配置
cp env_template.txt .env
# 编辑.env文件，设置生产环境配置

# 2. 使用生产配置启动
docker-compose --profile production up -d

# 3. 配置Nginx（可选）
# 详见project_architecture.md中的部署配置部分
```

## 📝 验证安装

### 检查后端服务

```bash
# 访问API健康检查
curl http://localhost:8000/api/health/

# 查看API文档
curl http://localhost:8000/api/docs/

# 获取视频列表
curl http://localhost:8000/api/videos/
```

### 检查前端服务

1. 打开浏览器访问 http://localhost:3000
2. 应该看到cosplay视频数据库主页
3. 尝试搜索和筛选功能

### 检查数据库

```bash
# 连接数据库
psql -U cosplay_user -d cosplay_db

# 查看表结构
\dt

# 查看示例数据
SELECT * FROM videos LIMIT 5;
SELECT * FROM groups;
SELECT * FROM tags;
```

## 🎯 第一次使用

### 1. 登录管理后台

- 访问 http://localhost:8000/admin/
- 使用之前创建的超级用户账号登录

### 2. 添加第一个视频

```bash
# 方法1: 通过API
curl -X POST http://localhost:8000/api/videos/ \
  -H "Content-Type: application/json" \
  -d '{
    "bv_number": "BV1234567890",
    "title": "测试cosplay视频",
    "url": "https://www.bilibili.com/video/BV1234567890",
    "description": "这是一个测试视频"
  }'

# 方法2: 通过管理后台
# 在浏览器中访问 http://localhost:8000/admin/videos/video/
# 点击"添加视频"按钮
```

### 3. 创建标签和分类

```bash
# 添加游戏IP标签
curl -X POST http://localhost:8000/api/tags/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "原神",
    "category": "游戏IP"
  }'

# 添加年份标签
curl -X POST http://localhost:8000/api/tags/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "2024年",
    "category": "年份"
  }'
```

### 4. 创建社团信息

```bash
curl -X POST http://localhost:8000/api/groups/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试cosplay社",
    "description": "这是一个测试社团",
    "founded_date": "2023-01-01"
  }'
```

## 🔧 常见问题解决

### 数据库连接问题

```bash
# 检查PostgreSQL是否运行
sudo systemctl status postgresql

# 检查数据库是否存在
sudo -u postgres psql -l | grep cosplay_db

# 重置数据库（如果需要）
sudo -u postgres dropdb cosplay_db
sudo -u postgres createdb cosplay_db
psql -U cosplay_user -d cosplay_db -f database/init.sql
```

### 端口占用问题

```bash
# 检查端口占用
lsof -i :3000  # 前端端口
lsof -i :8000  # 后端端口
lsof -i :5432  # 数据库端口

# 修改端口配置
# 在docker-compose.yml中修改端口映射
# 或在.env文件中设置不同的端口
```

### Docker问题

```bash
# 清理Docker容器和镜像
docker-compose down
docker system prune -a

# 重新构建镜像
docker-compose build --no-cache
docker-compose up -d
```

### 权限问题

```bash
# Linux/Mac权限问题
sudo chown -R $USER:$USER ./backend
sudo chown -R $USER:$USER ./frontend

# 数据库权限问题
sudo -u postgres psql
GRANT ALL PRIVILEGES ON DATABASE cosplay_db TO cosplay_user;
```

## 📊 示例数据

系统已经包含了一些示例数据：

- 3个示例社团（星河cosplay社、梦境工作室、次元空间）
- 3个示例比赛（全国cosplay大赛、次元文化节、漫展cosplay比赛）
- 11个示例标签（原神、崩坏3、明日方舟等）
- 3个示例视频和剧目

您可以基于这些示例数据开始体验系统功能。

## 🎨 自定义配置

### 修改标签分类

编辑 `database/init.sql` 文件中的标签数据：

```sql
INSERT INTO tags (name, category) VALUES 
('您的标签', '您的分类'),
('另一个标签', '另一个分类');
```

### 修改界面配置

编辑前端配置文件：
- `frontend/src/config/app.ts` - 应用配置
- `frontend/src/styles/` - 样式配置
- `frontend/src/components/` - 组件配置

### 修改API配置

编辑后端配置文件：
- `backend/cosplay_api/settings/` - Django设置
- `backend/apps/*/models.py` - 数据模型
- `backend/apps/*/serializers.py` - API序列化器

## 📱 下一步

系统搭建完成后，您可以：

1. **添加真实数据**: 替换示例数据为真实的cosplay视频信息
2. **自定义界面**: 根据需求修改前端界面和功能
3. **扩展功能**: 基于现有架构添加新功能
4. **部署上线**: 使用生产环境配置部署到服务器

## 💡 提示

- 定期备份数据库数据
- 监控系统性能和日志
- 保持依赖包的更新
- 遵循最佳实践进行开发

如果遇到问题，请查看详细的项目文档或在GitHub提交Issue。

---

**🎭 现在开始享受您的cosplay视频数据库之旅吧！** 