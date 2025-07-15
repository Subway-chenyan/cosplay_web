# Cosplay舞台剧视频数据库

一个专业的中国cosplay舞台剧视频数据库平台，支持视频管理、分类、展示和播放功能。

## 🎭 项目特性

- **视频管理**: 支持B站视频链接，内嵌播放功能
- **智能分类**: 多维度标签系统（年份/社团/剧目类型/比赛类型）
- **完整数据库**: 包含视频、社团、比赛、奖项等完整信息
- **现代化界面**: React + TypeScript + Ant Design
- **RESTful API**: Django REST Framework 提供强大的后端支持
- **容器化部署**: Docker Compose 一键部署

## 🚀 快速开始

### 环境要求

- Docker & Docker Compose
- Node.js 16+ (开发环境)
- Python 3.8+ (开发环境)
- PostgreSQL 13+ (生产环境)

### 使用Docker部署 (推荐)

```bash
# 克隆项目
git clone <项目地址>
cd cosplay_web

# 启动所有服务
docker-compose up -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

访问地址：
- 前端: http://localhost:3000
- 后端API: http://localhost:8000
- 数据库: localhost:5432

### 本地开发环境

#### 1. 设置数据库

```bash
# 创建PostgreSQL数据库
createdb cosplay_db

# 导入数据库结构
psql cosplay_db < database/init.sql
```

#### 2. 启动后端

```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
# 或 venv\Scripts\activate  # Windows

# 安装依赖
pip install -r requirements.txt

# 设置环境变量
cp .env.example .env
# 编辑.env文件配置数据库连接

# 运行迁移
python manage.py makemigrations
python manage.py migrate

# 创建超级用户
python manage.py createsuperuser

# 启动开发服务器
python manage.py runserver
```

#### 3. 启动前端

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

## 📊 数据库结构

### 核心表

- **videos**: 视频信息表（BV号、标题、链接、简介等）
- **groups**: 社团信息表（名称、成立时间、简介、获奖历史等）
- **competitions**: 比赛信息表（名称、官网、奖项等）
- **performances**: 剧目信息表（标题、类型、首演日期等）
- **tags**: 标签信息表（支持分类标签）
- **awards**: 奖项信息表
- **award_records**: 获奖记录表

### 关联表

- **video_tags**: 视频-标签关联
- **video_groups**: 视频-社团关联
- **video_performances**: 视频-剧目关联

### 扩展表

- **users**: 用户管理
- **video_favorites**: 视频收藏
- **video_ratings**: 视频评分
- **import_logs**: 数据导入日志

## 🎯 核心功能

### 1. 视频管理

- B站视频内嵌播放
- 视频信息自动抓取
- 多维度标签分类
- 搜索和筛选功能

### 2. 社团管理

- 社团信息展示
- 社团作品统计
- 获奖历史记录

### 3. 比赛管理

- 比赛信息维护
- 奖项设置
- 获奖记录管理

### 4. 数据分析

- 热门视频统计
- 社团表现分析
- 比赛数据可视化

## 🔧 API文档

### 主要端点

```
GET /api/videos/          # 获取视频列表
GET /api/videos/{id}/     # 获取视频详情
GET /api/groups/          # 获取社团列表  
GET /api/competitions/    # 获取比赛列表
GET /api/tags/            # 获取标签列表
GET /api/awards/          # 获取奖项列表
```

### 搜索和筛选

```
GET /api/videos/?search=关键词
GET /api/videos/?tags=1,2,3
GET /api/videos/?groups=1,2
GET /api/videos/?year=2023
GET /api/videos/?ordering=-view_count
```

详细API文档：http://localhost:8000/api/docs/

## 🎨 前端组件

### 核心组件

- **VideoPlayer**: B站视频播放器
- **VideoCard**: 视频卡片展示
- **TagFilter**: 标签筛选器
- **SearchBar**: 搜索栏
- **VideoGrid**: 视频网格布局

### 页面结构

```
src/
├── components/       # 通用组件
├── pages/           # 页面组件
│   ├── VideoList/   # 视频列表页
│   ├── VideoDetail/ # 视频详情页
│   ├── GroupList/   # 社团列表页
│   └── ...
├── store/           # Redux状态管理
├── services/        # API服务
└── types/           # TypeScript类型定义
```

## 📱 部署配置

### 生产环境部署

```bash
# 使用生产配置启动
docker-compose --profile production up -d

# 或使用环境变量
export DJANGO_ENV=production
docker-compose up -d
```

### 环境配置

```bash
# .env 配置示例
DATABASE_URL=postgresql://user:password@localhost:5432/cosplay_db
REDIS_URL=redis://localhost:6379/0
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com
```

## 🔄 数据导入

### 支持格式

- CSV文件批量导入
- JSON格式导入
- B站视频信息自动抓取

### 导入示例

```python
# 视频数据导入
python manage.py import_videos videos.csv

# 社团数据导入
python manage.py import_groups groups.json
```

## 🧪 开发指南

### 后端开发

```bash
# 创建新的Django应用
python manage.py startapp new_app

# 运行测试
python manage.py test

# 代码格式化
black .
```

### 前端开发

```bash
# 类型检查
npm run type-check

# 代码规范检查
npm run lint

# 构建生产版本
npm run build
```

## 📈 扩展功能

### 已规划功能

- [ ] 移动端适配 (PWA)
- [ ] 用户评论系统
- [ ] 智能推荐算法
- [ ] 数据可视化大屏
- [ ] 多语言支持
- [ ] API接口开放

### 自定义扩展

项目采用模块化设计，支持：

- 自定义标签分类
- 自定义数据字段
- 自定义API端点
- 自定义前端组件

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交代码
4. 创建 Pull Request

## 📄 许可证

本项目采用 MIT 许可证

## 📞 联系我们

- 问题反馈: [GitHub Issues]
- 功能建议: [GitHub Discussions]

---

**🎭 让我们一起打造最棒的cosplay舞台剧视频数据库！** 