# Cosplay舞台剧视频数据库后端

这是一个基于Django和Django REST Framework构建的cosplay舞台剧视频数据库后端系统。

## 项目结构

```
backend/
├── manage.py                  # Django管理命令
├── requirements.txt           # Python依赖
├── cosplay_api/              # Django项目配置
│   ├── settings.py           # 项目设置
│   ├── urls.py               # URL配置
│   ├── wsgi.py               # WSGI配置
│   └── asgi.py               # ASGI配置
└── apps/                     # 应用模块
    ├── authentication/       # 认证应用
    ├── users/                # 用户管理
    ├── videos/               # 视频管理
    ├── groups/               # 社团管理
    ├── tags/                 # 标签管理
    ├── performances/         # 演出管理
    ├── competitions/         # 比赛管理
    └── awards/               # 奖项管理
```

## 功能特性

### 用户系统
- 用户注册、登录、登出
- 基于JWT的认证
- 用户角色管理（管理员、编辑、查看者）
- 用户资料和设置管理

### 视频管理
- 视频上传和管理
- 视频收藏和评分
- 视频评论系统
- 视频观看记录
- 支持多种过滤和搜索

### 社团管理
- 社团创建和管理
- 社团成员管理
- 社团关注功能

### 标签系统
- 多分类标签（游戏IP、动漫IP、年份、类型、风格等）
- 标签与视频的关联

### 演出管理
- 演出信息管理
- 演出与视频的关联
- 演出类型分类

### 比赛和奖项
- 比赛信息管理
- 奖项设置
- 获奖记录管理

## 快速开始

### 1. 环境要求
- Python 3.8+
- PostgreSQL
- Redis (可选)

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
             http://localhost:8000/admin/

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
- `POST /api/videos/{id}/toggle_favorite/` - 切换收藏状态
- `POST /api/videos/{id}/rate/` - 评分视频
- `GET /api/videos/{id}/comments/` - 获取视频评论

### 社团相关
- `GET /api/groups/` - 获取社团列表
- `POST /api/groups/` - 创建社团
- `GET /api/groups/{id}/` - 获取社团详情

### 标签相关
- `GET /api/tags/` - 获取标签列表
- `POST /api/tags/` - 创建标签

### 演出相关
- `GET /api/performances/` - 获取演出列表
- `POST /api/performances/` - 创建演出

### 比赛相关
- `GET /api/competitions/` - 获取比赛列表
- `POST /api/competitions/` - 创建比赛

### 奖项相关
- `GET /api/awards/` - 获取奖项列表
- `POST /api/awards/` - 创建奖项

## 数据模型

### 核心模型
- `User` - 用户模型
- `Video` - 视频模型
- `Group` - 社团模型
- `Tag` - 标签模型
- `Performance` - 演出模型
- `Competition` - 比赛模型
- `Award` - 奖项模型

### 关联模型
- `VideoFavorite` - 视频收藏
- `VideoRating` - 视频评分
- `VideoComment` - 视频评论
- `GroupMember` - 社团成员
- `VideoTag` - 视频标签关联
- `PerformanceVideo` - 演出视频关联
- `AwardRecord` - 获奖记录

## 权限系统

系统使用基于角色的权限控制：
- **管理员(admin)**: 拥有所有权限
- **编辑(editor)**: 可以编辑内容
- **查看者(viewer)**: 只能查看内容

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

## 故障排除

### 常见问题
1. **数据库连接错误**: 检查数据库配置和服务状态
2. **导入错误**: 确保所有依赖都已安装
3. **权限错误**: 检查用户角色和权限设置
4. **CORS错误**: 检查CORS设置

### 日志查看
```bash
# 查看Django日志
tail -f django.log

# 查看容器日志
docker logs -f container_name
```

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 发起Pull Request

## 许可证

本项目采用MIT许可证。 