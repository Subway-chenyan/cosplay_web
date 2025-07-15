# Cosplay舞台剧视频数据库项目架构

## 项目概述

构建一个专业的中国cosplay舞台剧视频数据库平台，支持视频管理、分类、展示和播放功能。

## 技术栈选择

### 后端技术栈

- **框架**: Django 4.0 + Django REST Framework
- **数据库**: PostgreSQL 13+
- **缓存**: Redis (用于会话和缓存)
- **任务队列**: Celery (用于视频信息抓取)
- **认证**: Django-allauth + JWT

### 前端技术栈

- **框架**: React 18 + TypeScript
- **状态管理**: Redux Toolkit + RTK Query
- **UI组件库**: Ant Design 或 Material-UI
- **样式**: Tailwind CSS + Styled Components
- **视频播放**: React Player + 自定义B站播放器组件
- **路由**: React Router 6

### 开发工具

- **代码质量**: ESLint + Prettier + Black
- **打包**: Vite (前端) + Django Webpack Loader
- **容器化**: Docker + Docker Compose
- **API文档**: DRF Spectacular (OpenAPI 3.0)

## 项目结构

```
cosplay_web/
├── backend/                    # Django后端
│   ├── cosplay_api/           # 主应用
│   │   ├── settings/
│   │   │   ├── base.py
│   │   │   ├── development.py
│   │   │   └── production.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── apps/                  # 应用模块
│   │   ├── videos/           # 视频管理
│   │   ├── groups/           # 社团管理
│   │   ├── competitions/     # 比赛管理
│   │   ├── tags/            # 标签管理
│   │   └── awards/          # 奖项管理
│   ├── utils/               # 工具函数
│   │   ├── bilibili_api.py  # B站API集成
│   │   └── validators.py    # 数据验证
│   ├── requirements.txt
│   └── manage.py
├── frontend/                  # React前端
│   ├── src/
│   │   ├── components/       # 通用组件
│   │   │   ├── VideoPlayer/
│   │   │   ├── TagFilter/
│   │   │   └── VideoCard/
│   │   ├── pages/           # 页面组件
│   │   │   ├── VideoList/
│   │   │   ├── VideoDetail/
│   │   │   ├── GroupList/
│   │   │   └── CompetitionList/
│   │   ├── store/           # Redux状态管理
│   │   ├── services/        # API服务
│   │   ├── hooks/           # 自定义Hooks
│   │   ├── utils/
│   │   └── types/           # TypeScript类型定义
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml
├── .env.example
└── README.md
```

## 核心功能实现

### 1. B站视频集成

```typescript
// 前端视频播放器组件
interface VideoPlayerProps {
  bvNumber: string;
  title: string;
  autoplay?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ bvNumber, title, autoplay = false }) => {
  const iframeUrl = `https://player.bilibili.com/player.html?bvid=${bvNumber}&autoplay=${autoplay ? 1 : 0}`;
  
  return (
    <div className="video-container">
      <iframe
        src={iframeUrl}
        width="100%"
        height="500"
        frameBorder="0"
        allowFullScreen
        title={title}
      />
    </div>
  );
};
```

### 2. 智能标签系统

```python
# 后端标签管理API
class TagViewSet(viewsets.ModelViewSet):
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
  
    @action(detail=False, methods=['get'])
    def categories(self, request):
        """获取所有标签分类"""
        categories = Tag.objects.values_list('category', flat=True).distinct()
        return Response(list(categories))
  
    @action(detail=False, methods=['get'])
    def popular(self, request):
        """获取热门标签"""
        popular_tags = Tag.objects.annotate(
            video_count=Count('video_tags')
        ).order_by('-video_count')[:20]
        return Response(TagSerializer(popular_tags, many=True).data)
```

### 3. 高级搜索和筛选

```typescript
// 前端搜索组件
interface SearchFilters {
  keyword?: string;
  tags?: number[];
  groups?: number[];
  yearRange?: [number, number];
  competition?: number;
  awards?: number[];
}

const VideoSearch: React.FC = () => {
  const [filters, setFilters] = useState<SearchFilters>({});
  const { data: videos, isLoading } = useGetVideosQuery(filters);
  
  return (
    <div className="search-container">
      <SearchBar onSearch={(keyword) => setFilters({...filters, keyword})} />
      <TagFilter onTagChange={(tags) => setFilters({...filters, tags})} />
      <GroupFilter onGroupChange={(groups) => setFilters({...filters, groups})} />
      <YearRangeFilter onYearChange={(yearRange) => setFilters({...filters, yearRange})} />
    
      <VideoGrid videos={videos} loading={isLoading} />
    </div>
  );
};
```

## 数据库扩展设计

### 新增表结构

```sql
-- 用户表（支持多用户管理）
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(20) DEFAULT 'viewer', -- admin, editor, viewer
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 视频收藏表
CREATE TABLE video_favorites (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, video_id)
);

-- 视频评分表
CREATE TABLE video_ratings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, video_id)
);

-- 数据导入日志表
CREATE TABLE import_logs (
    id SERIAL PRIMARY KEY,
    file_name VARCHAR(255),
    import_type VARCHAR(50), -- videos, groups, competitions, etc.
    status VARCHAR(20), -- pending, processing, completed, failed
    total_records INTEGER,
    success_records INTEGER,
    error_records INTEGER,
    error_details TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API设计优化

### RESTful API增强

```python
# 视频API增强版本
class VideoViewSet(viewsets.ModelViewSet):
    queryset = Video.objects.all()
    serializer_class = VideoSerializer
    filterset_class = VideoFilter
    ordering_fields = ['upload_date', 'view_count', 'performance_date']
    search_fields = ['title', 'description']
  
    @action(detail=True, methods=['post'])
    def favorite(self, request, pk=None):
        """收藏视频"""
        video = self.get_object()
        favorite, created = VideoFavorite.objects.get_or_create(
            user=request.user, video=video
        )
        return Response({'favorited': created})
  
    @action(detail=True, methods=['post'])
    def rate(self, request, pk=None):
        """评分视频"""
        video = self.get_object()
        rating_value = request.data.get('rating')
        rating, created = VideoRating.objects.update_or_create(
            user=request.user, video=video,
            defaults={'rating': rating_value}
        )
        return Response({'rating': rating.rating})
  
    @action(detail=False, methods=['get'])
    def trending(self, request):
        """获取热门视频"""
        trending_videos = Video.objects.annotate(
            avg_rating=Avg('video_ratings__rating'),
            favorite_count=Count('video_favorites')
        ).order_by('-view_count', '-favorite_count')[:20]
      
        serializer = self.get_serializer(trending_videos, many=True)
        return Response(serializer.data)
```

## 部署和运维

### Docker配置

```yaml
# docker-compose.yml
version: '3.8'

services:
  db:
    image: postgres:13
    environment:
      POSTGRES_DB: cosplay_db
      POSTGRES_USER: cosplay_user
      POSTGRES_PASSWORD: your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:6
    ports:
      - "6379:6379"

  backend:
    build: ./backend
    volumes:
      - ./backend:/app
    ports:
      - "8000:8000"
    depends_on:
      - db
      - redis
    environment:
      - DATABASE_URL=postgresql://cosplay_user:your_password@db:5432/cosplay_db
      - REDIS_URL=redis://redis:6379/0

  frontend:
    build: ./frontend
    volumes:
      - ./frontend:/app
    ports:
      - "3000:3000"
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
```

## 开发阶段规划

### 第一阶段：基础功能 (2-3周)

1. 数据库设计和部署
2. 后端API开发
3. 前端基础页面搭建
4. B站视频播放功能

### 第二阶段：核心功能 (2-3周)

1. 标签系统和搜索功能
2. 社团和比赛管理页面
3. 奖项展示功能
4. 数据导入功能

### 第三阶段：优化和扩展 (2-3周)

1. 用户系统和权限管理
2. 收藏和评分功能
3. 数据分析和统计
4. 性能优化和部署

## 扩展功能建议

1. **移动端适配**: 使用React Native或PWA技术
2. **数据分析**: 集成图表库，展示统计信息
3. **社区功能**: 用户评论、讨论区
4. **推荐系统**: 基于用户行为的智能推荐
5. **API开放**: 为第三方开发者提供API接口
6. **多语言支持**: 国际化和本地化

这个架构设计具有良好的可扩展性，可以根据实际需求逐步完善和优化。
