# Cosplay舞台剧视频数据库 - 第一阶段规划

## 1. 设计并实现数据库表结构

### 1.1 数据库选型

我们选择 **PostgreSQL** 作为本项目的数据库系统，原因如下：
- 优秀的关系型数据库功能
- 强大的JSON支持，便于存储半结构化数据
- 良好的全文搜索支持
- 开源且成熟的社区支持

### 1.2 数据库表设计

基于需求分析，我们设计以下表结构：

#### 视频表 (videos)
```sql
CREATE TABLE videos (
    id SERIAL PRIMARY KEY,
    bv_number VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    thumbnail TEXT,
    description TEXT,
    upload_date DATE,
    view_count INTEGER DEFAULT 0,
    performance_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 社团表 (groups)
```sql
CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    logo TEXT,
    founded_date DATE,
    description TEXT,
    website TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 比赛表 (competitions)
```sql
CREATE TABLE competitions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    year INTEGER,
    location VARCHAR(100),
    website TEXT,
    description TEXT,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 奖项表 (awards)
```sql
CREATE TABLE awards (
    id SERIAL PRIMARY KEY,
    competition_id INTEGER REFERENCES competitions(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    rank INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 剧目表 (performances)
```sql
CREATE TABLE performances (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    group_id INTEGER REFERENCES groups(id),
    original_work VARCHAR(255),
    description TEXT,
    type VARCHAR(50),
    debut_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 标签表 (tags)
```sql
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    category VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name, category)
);
```

#### 视频-标签关联表 (video_tags)
```sql
CREATE TABLE video_tags (
    id SERIAL PRIMARY KEY,
    video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(video_id, tag_id)
);
```

#### 视频-社团关联表 (video_groups)
```sql
CREATE TABLE video_groups (
    id SERIAL PRIMARY KEY,
    video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
    group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(video_id, group_id)
);
```

#### 视频-剧目关联表 (video_performances)
```sql
CREATE TABLE video_performances (
    id SERIAL PRIMARY KEY,
    video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
    performance_id INTEGER REFERENCES performances(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(video_id, performance_id)
);
```

#### 获奖记录表 (award_records)
```sql
CREATE TABLE award_records (
    id SERIAL PRIMARY KEY,
    award_id INTEGER REFERENCES awards(id) ON DELETE CASCADE,
    video_id INTEGER REFERENCES videos(id),
    performance_id INTEGER REFERENCES performances(id),
    group_id INTEGER REFERENCES groups(id),
    year INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 1.3 索引策略

为提高查询性能，我们将添加以下索引：

```sql
-- 视频表索引
CREATE INDEX idx_videos_title ON videos(title);
CREATE INDEX idx_videos_upload_date ON videos(upload_date);
CREATE INDEX idx_videos_performance_date ON videos(performance_date);

-- 社团表索引
CREATE INDEX idx_groups_name ON groups(name);

-- 比赛表索引
CREATE INDEX idx_competitions_name ON competitions(name);
CREATE INDEX idx_competitions_year ON competitions(year);

-- 标签表索引
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_tags_category ON tags(category);

-- 剧目表索引
CREATE INDEX idx_performances_title ON performances(title);
CREATE INDEX idx_performances_group_id ON performances(group_id);

-- 获奖记录表索引
CREATE INDEX idx_award_records_year ON award_records(year);
CREATE INDEX idx_award_records_award_id ON award_records(award_id);
CREATE INDEX idx_award_records_group_id ON award_records(group_id);
```

## 2. 开发基础RESTful API

我们将使用Django REST Framework构建API，这是一个强大的、灵活的工具包，用于构建Web API。

### 2.1 项目设置

```bash
# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate  # Windows

# 安装依赖
pip install django djangorestframework psycopg2-binary django-cors-headers python-dotenv

# 创建项目
django-admin startproject cosplay_api .
cd cosplay_api

# 创建应用
python manage.py startapp videos
```

### 2.2 API端点设计

我们将实现以下RESTful API端点：

#### 视频相关API
- `GET /api/videos/` - 获取视频列表（支持分页、过滤和排序）
- `GET /api/videos/{id}/` - 获取单个视频详情
- `POST /api/videos/` - 创建新视频
- `PUT /api/videos/{id}/` - 更新视频
- `DELETE /api/videos/{id}/` - 删除视频
- `GET /api/videos/{id}/tags/` - 获取视频相关的标签
- `GET /api/videos/{id}/groups/` - 获取视频相关的社团
- `GET /api/videos/{id}/performances/` - 获取视频相关的剧目
- `GET /api/videos/{id}/awards/` - 获取视频获得的奖项

#### 社团相关API
- `GET /api/groups/` - 获取社团列表
- `GET /api/groups/{id}/` - 获取单个社团详情
- `POST /api/groups/` - 创建新社团
- `PUT /api/groups/{id}/` - 更新社团
- `DELETE /api/groups/{id}/` - 删除社团
- `GET /api/groups/{id}/videos/` - 获取社团相关的视频
- `GET /api/groups/{id}/performances/` - 获取社团的剧目
- `GET /api/groups/{id}/awards/` - 获取社团获得的奖项

#### 剧目相关API
- `GET /api/performances/` - 获取剧目列表
- `GET /api/performances/{id}/` - 获取单个剧目详情
- `POST /api/performances/` - 创建新剧目
- `PUT /api/performances/{id}/` - 更新剧目
- `DELETE /api/performances/{id}/` - 删除剧目
- `GET /api/performances/{id}/videos/` - 获取剧目相关的视频
- `GET /api/performances/{id}/awards/` - 获取剧目获得的奖项

#### 比赛相关API
- `GET /api/competitions/` - 获取比赛列表
- `GET /api/competitions/{id}/` - 获取单个比赛详情
- `POST /api/competitions/` - 创建新比赛
- `PUT /api/competitions/{id}/` - 更新比赛
- `DELETE /api/competitions/{id}/` - 删除比赛
- `GET /api/competitions/{id}/awards/` - 获取比赛的奖项

#### 奖项相关API
- `GET /api/awards/` - 获取奖项列表
- `GET /api/awards/{id}/` - 获取单个奖项详情
- `POST /api/awards/` - 创建新奖项
- `PUT /api/awards/{id}/` - 更新奖项
- `DELETE /api/awards/{id}/` - 删除奖项
- `GET /api/awards/{id}/records/` - 获取此奖项的获奖记录

#### 标签相关API
- `GET /api/tags/` - 获取标签列表
- `GET /api/tags/{id}/` - 获取单个标签详情
- `POST /api/tags/` - 创建新标签
- `PUT /api/tags/{id}/` - 更新标签
- `DELETE /api/tags/{id}/` - 删除标签
- `GET /api/tags/{id}/videos/` - 获取标签相关的视频

### 2.3 API架构实现

#### 基础模型设计

我们将在`models.py`中定义所有数据模型，对应到数据库表。

#### 序列化器设计

为每个模型创建序列化器，用于数据转换和验证。

#### 视图设计

使用Django REST Framework的ViewSet实现各个API端点。

#### 权限控制

添加基本的权限控制，如管理员独有的创建、更新和删除权限。

#### API文档

使用Django REST Framework的内置文档系统生成API文档。

#### CSV/JSON导入格式

定义标准的CSV/JSON格式，用于批量导入数据：

- 视频导入格式
- 社团导入格式
- 比赛导入格式
- 剧目导入格式
- 标签导入格式

### 3.3 管理后台导入界面

基于Django管理后台，添加自定义操作用于数据导入：

- 视频批量导入界面
- 从B站直接采集视频信息功能
- 导入历史记录及状态追踪

## 5. 技术要求

### 5.1 开发环境

- Python 3.8+
- PostgreSQL 13+
- Django 4.0+
- Django REST Framework 3.13+

### 5.2 依赖项

```
django==4.0.0
djangorestframework==3.13.0
psycopg2-binary==2.9.3
django-cors-headers==3.11.0
python-dotenv==0.19.2
requests==2.27.1
pandas==1.3.5
```

### 5.3 开发规范

- 遵循PEP8代码风格
- 使用Black进行代码格式化
- 所有函数和类添加文档字符串
- 使用类型注解提高代码可读性
