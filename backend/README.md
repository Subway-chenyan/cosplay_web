# Cosplay舞台剧视频数据库后端

这是一个基于Django和Django REST Framework构建的cosplay舞台剧视频数据库后端系统。

## 项目结构

```
backend/
├── manage.py                  # Django管理命令
├── requirements.txt           # Python依赖
├── cosplay_api/               # Django项目配置
│   ├── settings.py            # 项目设置
│   ├── urls.py                # URL配置
│   ├── wsgi.py                # WSGI配置
│   └── asgi.py                # ASGI配置
└── apps/                      # 应用模块
    ├── authentication/        # 认证应用
    ├── users/                 # 用户管理
    ├── videos/                # 视频管理
    ├── groups/                # 社团管理
    ├── tags/                  # 标签管理
    ├── competitions/          # 比赛管理
    └── awards/                # 奖项管理
```

## 功能特性

### 用户系统
- 仅支持管理员/编辑用户，无注册功能
- 基于JWT的认证
- 用户角色管理（管理员、编辑）

### 视频管理
- 视频上传和管理
- 支持多种过滤和搜索

### 社团管理
- 社团创建和管理

### 标签系统
- 多分类标签（如游戏IP、年份、地区等）
- 标签与视频的关联

### 比赛和奖项
- 比赛信息管理（仅保留名称、年份、描述）
- 奖项设置（无rank字段）
- 获奖记录管理

## 快速开始

### 1. 环境要求
- Python 3.8+
- PostgreSQL

### 2. 安装依赖
```bash
pip install -r requirements.txt
```

### 3. 配置环境变量
复制 `../env_template.txt` 为 `.env` 并修改相应配置:
```bash
cp ../env_template.txt .env
```

### 4. 数据库迁移
```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. 创建超级用户
```bash
python manage.py createsuperuser
```

### 6. 启动服务器
```bash
python manage.py runserver
```

## API文档

服务器启动后，可以通过以下地址访问API文档：
- Swagger UI: http://localhost:8000/api/docs/
- ReDoc: http://localhost:8000/api/redoc/
- 原始Schema: http://localhost:8000/api/schema/
- 管理后台: http://localhost:8000/admin/

## 主要API端点

### 认证相关
- `POST /api/token/` - 获取JWT令牌
- `POST /api/token/refresh/` - 刷新JWT令牌
- `POST /api/auth/login/` - 用户登录
- `POST /api/auth/logout/` - 用户登出
- `GET /api/auth/me/` - 获取当前用户信息

### 视频相关
- `GET /api/videos/` - 获取视频列表
- `POST /api/videos/` - 创建视频
- `GET /api/videos/{id}/` - 获取视频详情
- `PUT /api/videos/{id}/` - 更新视频
- `DELETE /api/videos/{id}/` - 删除视频

### 社团相关
- `GET /api/groups/` - 获取社团列表
- `POST /api/groups/` - 创建社团
- `GET /api/groups/{id}/` - 获取社团详情

### 标签相关
- `GET /api/tags/` - 获取标签列表
- `POST /api/tags/` - 创建标签

### 比赛相关
- `GET /api/competitions/` - 获取比赛列表
- `POST /api/competitions/` - 创建比赛

### 奖项相关
- `GET /api/awards/` - 获取奖项列表
- `POST /api/awards/` - 创建奖项

## 数据模型

### 核心模型
- `User` - 用户模型（仅管理员/编辑）
- `Video` - 视频模型
- `Group` - 社团模型
- `Tag` - 标签模型
- `Competition` - 比赛模型
- `Award` - 奖项模型
- `AwardRecord` - 获奖记录

## 权限系统

系统使用基于角色的权限控制：
- **管理员(admin)**: 拥有所有权限
- **编辑(editor)**: 可以编辑内容

## 过滤和搜索

API支持多种过滤和搜索功能：
- 按时间范围过滤
- 按状态过滤
- 全文搜索
- 标签过滤
- 分类过滤

## 部署说明

### 生产环境配置
1. 设置 `DEBUG=False`
2. 配置安全设置
3. 使用生产级数据库
4. 配置静态文件服务
5. 配置日志记录

### 使用Docker
```bash
# 构建镜像
docker build -t cosplay-backend .

# 运行容器
docker run -p 8000:8000 cosplay-backend
```

## 开发指南

### 添加新的API端点
1. 在相应的应用中创建序列化器
2. 创建视图类
3. 配置URL路由
4. 添加权限控制
5. 更新API文档

### 数据库迁移
```bash
# 创建迁移文件
python manage.py makemigrations

# 应用迁移
python manage.py migrate
```

### 运行测试
```bash
python manage.py test
```

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 发起Pull Request

## 许可证

本项目采用MIT许可证。 