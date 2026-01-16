# Cosplay舞台剧视频数据库项目架构

## 项目概述

构建一个专业的中国cosplay舞台剧视频数据库平台，支持视频管理、分类、展示和播放功能。

## 技术栈选择

### 后端技术栈

- **框架**: Django 4.2 + Django REST Framework
- **数据库**: PostgreSQL 13+
- **缓存**: Redis (用于会话和缓存)
- **任务队列**: Celery (用于视频信息抓取)
- **认证**: djangorestframework-simplejwt (JWT认证)
- **API文档**: DRF Spectacular (OpenAPI 3.0)

### 前端技术栈

- **框架**: React 18 + TypeScript
- **状态管理**: Redux Toolkit
- **UI样式**: Tailwind CSS (Persona 5风格)
- **视频播放**: B站iframe播放器
- **路由**: React Router 6
- **构建工具**: Vite

### 开发工具

- **代码质量**: ESLint + Prettier
- **打包**: Vite
- **容器化**: Docker + Docker Compose
- **版本控制**: Git

## 项目结构

```
cosplay_web/
├── backend/                    # Django后端
│   ├── cosplay_api/           # 主应用
│   │   ├── settings.py       # 配置文件
│   │   ├── urls.py           # 主路由
│   │   └── wsgi.py
│   ├── apps/                  # 应用模块
│   │   ├── videos/           # 视频管理
│   │   │   ├── models.py     # Video模型
│   │   │   ├── serializers.py
│   │   │   ├── views.py      # 视频API、数据导入API
│   │   │   └── urls.py
│   │   ├── groups/           # 社团管理
│   │   │   ├── models.py     # Group模型
│   │   │   └── ...
│   │   ├── users/            # 用户认证和管理 ✨新增
│   │   │   ├── models.py     # User模型（角色权限）
│   │   │   ├── serializers.py # 用户资料、角色申请序列化器
│   │   │   ├── views.py      # 注册、登录、角色审批API
│   │   │   └── urls.py
│   │   ├── competitions/     # 比赛管理
│   │   ├── tags/            # 标签管理
│   │   ├── awards/          # 奖项管理
│   │   └── text2sql/        # SQL Agent智能搜索
│   ├── upload_data/          # 数据导入工具
│   │   ├── import_data.py    # Excel数据导入
│   │   ├── generate_template.py
│   │   └── config.json
│   ├── requirements.txt
│   └── manage.py
├── src/                       # React前端
│   ├── components/            # 通用组件
│   │   ├── Header.tsx        # 页头导航（含登录状态）✨更新
│   │   ├── Layout.tsx        # 布局组件
│   │   ├── SearchableMultiSelectModal.tsx ✨新增
│   │   └── RoleApprovalPanel.tsx ✨新增
│   ├── pages/                 # 页面组件
│   │   ├── HomePage.tsx      # 主页
│   │   ├── LoginPage.tsx     # 登录页 ✨新增
│   │   ├── RegisterPage.tsx  # 注册页 ✨新增
│   │   ├── UserCenterPage.tsx # 用户中心 ✨新增
│   │   ├── DataImportPage.tsx # 数据导入（权限控制）✨更新
│   │   ├── ManagementPage.tsx # 数据管理
│   │   ├── ChoreoMasterPage.tsx # 队形编排工具
│   │   ├── GroupsPage.tsx
│   │   ├── GroupDetailPage.tsx
│   │   ├── CompetitionsPage.tsx
│   │   └── VideoDetailPage.tsx
│   ├── store/
│   │   └── slices/
│   │       ├── dataImportSlice.ts ✨更新（移除upload_key）
│   │       └── authSlice.ts
│   ├── services/
│   │   └── api.ts           # API服务封装 ✨更新
│   ├── App.tsx              # 路由配置
│   └── main.tsx
├── public/
│   └── assets/
│       └── logo.png         # Logo图片 ✨新增
├── docker-compose.yml
├── .env
└── README.md
```

## 核心功能实现

### 1. 用户认证系统 ✨已实现

#### JWT认证流程

```python
# 后端 - apps/users/views.py
from rest_framework_simplejwt.views import TokenObtainPairView

class CustomTokenObtainPairView(TokenObtainPairView):
    """自定义JWT获取视图"""
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        # 返回用户信息
        if response.status_code == 200:
            user = request.user
            response.data['user'] = {
                'id': str(user.id),
                'username': user.username,
                'email': user.email,
                'role': user.role
            }
        return response
```

```typescript
// 前端 - services/api.ts
class ApiService {
  async login(username: string, password: string) {
    const response = await axiosInstance.post('/api/token/', {
      username,
      password
    })
    // 存储token
    localStorage.setItem('access_token', response.data.access)
    localStorage.setItem('refresh_token', response.data.refresh)
    return response.data
  }

  async register(data: RegisterData) {
    return await axiosInstance.post('/api/users/register/', data)
  }
}
```

### 2. 角色权限系统 ✨已实现

#### 用户角色层级

```python
# apps/users/models.py
class User(AbstractUser):
    ROLE_CHOICES = [
        ('viewer', '查看者'),
        ('contributor', '贡献者'),
        ('editor', '编辑者'),
        ('admin', '管理员'),
    ]

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='viewer')

    # 扩展字段
    nickname = models.CharField(max_length=100, blank=True)
    bio = models.TextField(blank=True)
    avatar = models.ImageField(upload_to='avatars/', blank=True, null=True)

    # 多对多关联
    groups = models.ManyToManyField('groups.Group', blank=True, related_name='members')
    performed_videos = models.ManyToManyField('videos.Video', blank=True, related_name='performers')

    # 角色申请
    role_application_pending = models.BooleanField(default=False)
    role_application_reason = models.TextField(blank=True)
    role_application_date = models.DateTimeField(null=True, blank=True)

    def can_import_data(self):
        """检查是否可以导入数据（贡献者及以上）"""
        return self.role in ['contributor', 'editor', 'admin']

    def can_manage_data(self):
        """检查是否可以管理数据（编辑及以上）"""
        return self.role in ['editor', 'admin']

    def can_approve_roles(self):
        """检查是否可以审批角色申请（仅管理员）"""
        return self.role == 'admin'
```

#### 权限检查API

```python
# apps/users/views.py
class UserViewSet(viewsets.ModelViewSet):
    @action(detail=False, methods=['post'], url_path='apply-role')
    def apply_for_contributor(self, request):
        """申请成为贡献者"""
        if user.role_application_pending:
            raise ValidationError("您已有待审核的申请")
        if user.role in ['admin', 'editor', 'contributor']:
            raise ValidationError("您已经是贡献者或更高权限")

        user.role_application_pending = True
        user.role_application_reason = request.data.get('reason')
        user.role_application_date = timezone.now()
        user.save()
        return Response({'detail': '申请已提交，请等待管理员审核'})

    @action(detail=False, methods=['get'], url_path='list-role-applications')
    def list_role_applications(self, request):
        """获取所有待审批的角色申请（仅管理员）"""
        if not request.user.can_approve_roles():
            return Response({'detail': '权限不足'}, status=403)

        pending_users = User.objects.filter(role_application_pending=True)
        return Response({'results': applications})

    @action(detail=False, methods=['post'], url_path='approve-role-application')
    def approve_role_application(self, request):
        """审批角色申请"""
        if not request.user.can_approve_roles():
            return Response({'detail': '权限不足'}, status=403)

        user_id = request.data.get('user_id')
        target_role = request.data.get('target_role')
        action = request.data.get('action')  # 'approve' or 'reject'

        user = User.objects.get(id=user_id)
        if action == 'approve':
            user.role = target_role
            user.role_application_pending = False
            user.save()
        return Response({'detail': f'已将用户 {user.username} 角色更改为 {target_role}'})
```

### 3. 数据导入权限控制 ✨已优化

```python
# apps/videos/views.py
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def download_template(request):
    """下载导入模板"""
    if not request.user.can_import_data():
        return Response({
            'error': '权限不足，需要贡献者及以上权限'
        }, status=status.HTTP_403_FORBIDDEN)
    # ... 模板下载逻辑

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def start_import(request):
    """开始数据导入"""
    if not request.user.can_import_data():
        return Response({
            'error': '权限不足，需要贡献者及以上权限'
        }, status=status.HTTP_403_FORBIDDEN)
    # ... 导入逻辑
```

### 4. 用户中心功能 ✨已实现

```typescript
// pages/UserCenterPage.tsx
function UserCenterPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    nickname: '',
    bio: '',
    group_ids: [] as string[],
    performed_video_ids: [] as string[],
  })

  // 自动分页获取所有社团（456个）和视频（531个）
  const fetchGroups = async () => {
    let allGroups: Group[] = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      const response = await fetch(`/api/groups/?page=${page}&page_size=1000`)
      if (response.ok) {
        const data = await response.json()
        allGroups = [...allGroups, ...(data.results || data)]
        hasMore = data.next ? true : false
        page++
      } else {
        hasMore = false
      }
    }
    setAvailableGroups(allGroups)
  }

  // 保存用户资料
  const handleSave = async () => {
    const response = await fetch('/api/users/update-profile/', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(editForm)
    })
    // ... 处理响应
  }

  return (
    <div className="user-center">
      {/* 个人信息编辑 */}
      {/* 社团关联（可搜索选择） */}
      {/* 参演视频关联（可搜索选择） */}
      {/* 角色申请表单 */}
      {/* 数据导入/管理入口（根据权限显示） */}
      {/* 管理员审批面板（仅admin可见） */}
    </div>
  )
}
```

### 5. 搜索多选模态框组件 ✨已实现

```typescript
// components/SearchableMultiSelectModal.tsx
interface SearchableMultiSelectModalProps {
  isOpen: boolean
  title: string
  options: SelectOption[]
  selectedIds: string[]
  onSelect: (ids: string[]) => void
  onClose: () => void
  searchPlaceholder?: string
}

function SearchableMultiSelectModal({
  isOpen,
  title,
  options,
  selectedIds,
  onSelect,
  onClose,
  searchPlaceholder = "搜索..."
}: SearchableMultiSelectModalProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="searchable-modal">
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="options-list">
          {filteredOptions.map(option => (
            <label key={option.value}>
              <input
                type="checkbox"
                checked={selectedIds.includes(option.value)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onSelect([...selectedIds, option.value])
                  } else {
                    onSelect(selectedIds.filter(id => id !== option.value))
                  }
                }}
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>
    </Modal>
  )
}
```

### 6. B站视频集成

```typescript
// 前端视频播放器组件
interface VideoPlayerProps {
  bvNumber: string
  title: string
  autoplay?: boolean
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  bvNumber,
  title,
  autoplay = false
}) => {
  const iframeUrl = `https://player.bilibili.com/player.html?bvid=${bvNumber}&autoplay=${autoplay ? 1 : 0}`

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
  )
}
```

### 7. 高级搜索和筛选

```typescript
// 前端搜索组件
interface SearchFilters {
  keyword?: string
  tags?: number[]
  groups?: number[]
  yearRange?: [number, number]
  competition?: number
  awards?: number[]
}

const VideoSearch: React.FC = () => {
  const [filters, setFilters] = useState<SearchFilters>({})
  const { data: videos, isLoading } = useGetVideosQuery(filters)

  return (
    <div className="search-container">
      <SearchBar onSearch={(keyword) => setFilters({...filters, keyword})} />
      <TagFilter onTagChange={(tags) => setFilters({...filters, tags})} />
      <GroupFilter onGroupChange={(groups) => setFilters({...filters, groups})} />
      <YearRangeFilter onYearChange={(yearRange) => setFilters({...filters, yearRange})} />

      <VideoGrid videos={videos} loading={isLoading} />
    </div>
  )
}
```

## API端点总览

### 认证相关

```
POST   /api/token/                    # 获取JWT token
POST   /api/token/refresh/            # 刷新JWT token
POST   /api/users/register/           # 用户注册
GET    /api/users/me/                 # 获取当前用户信息
PATCH  /api/users/update-profile/     # 更新用户资料
POST   /api/users/apply-role/         # 申请角色提升
GET    /api/users/list-role-applications  # 获取待审批申请（admin）
POST   /api/users/approve-role-application  # 审批角色申请（admin）
```

### 视频相关

```
GET    /api/videos/                   # 视频列表
GET    /api/videos/:id/               # 视频详情
GET    /api/videos/agent-search/      # Agent智能搜索
GET    /api/videos/search-groups/     # 搜索社团
POST   /api/videos/bulk-import/       # 批量导入
```

### 数据导入（权限控制）

```
GET    /api/videos/import/template/   # 下载导入模板（需贡献者+）
POST   /api/videos/import/start/      # 开始导入（需贡献者+）
GET    /api/videos/import/status/:id/ # 查询导入状态（需贡献者+）
```

### 社团相关

```
GET    /api/groups/                   # 社团列表
GET    /api/groups/:id/               # 社团详情
GET    /api/groups/:id/videos/        # 社团的视频
```

## 数据库设计

### 用户表（已实现）

```sql
CREATE TABLE users_user (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(150) UNIQUE NOT NULL,
    email VARCHAR(254) UNIQUE NOT NULL,
    password VARCHAR(128) NOT NULL,

    -- 基本信息
    nickname VARCHAR(100),
    bio TEXT,
    avatar VARCHAR(100),

    -- 角色权限
    role VARCHAR(20) DEFAULT 'viewer',

    -- 角色申请
    role_application_pending BOOLEAN DEFAULT FALSE,
    role_application_reason TEXT,
    role_application_date TIMESTAMP,

    -- 权限字段
    is_active BOOLEAN DEFAULT TRUE,
    is_staff BOOLEAN DEFAULT FALSE,
    is_superuser BOOLEAN DEFAULT FALSE,

    -- 时间戳
    date_joined TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户-社团关联表
CREATE TABLE users_user_groups (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users_user(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups_group(id) ON DELETE CASCADE,
    UNIQUE(user_id, group_id)
);

-- 用户-参演视频关联表
CREATE TABLE users_user_performed_videos (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users_user(id) ON DELETE CASCADE,
    video_id UUID REFERENCES videos_video(id) ON DELETE CASCADE,
    UNIQUE(user_id, video_id)
);
```

### 视频表

```sql
CREATE TABLE videos_video (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bv_number VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    url VARCHAR(500),
    thumbnail VARCHAR(500),

    -- 关联字段
    group_id UUID REFERENCES groups_group(id),
    competition_id UUID REFERENCES competitions_competition(id),
    award_id UUID REFERENCES awards_award(id),
    year INTEGER,

    -- 统计字段
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,

    -- 元数据
    tags JSONB,

    -- 时间戳
    upload_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 前端路由配置

```typescript
// App.tsx
<Routes>
  <Route path="/" element={<Layout />}>
    <Route index element={<HomePage />} />
    <Route path="/video/:id" element={<VideoDetailPage />} />
    <Route path="/groups" element={<GroupsPage />} />
    <Route path="/group/:id" element={<GroupDetailPage />} />
    <Route path="/competitions" element={<CompetitionsPage />} />
    <Route path="/competitions/:id" element={<CompetitionDetailPage />} />
    <Route path="/data-import" element={<DataImportPage />} />
    <Route path="/management" element={<ManagementPage />} />
    <Route path="/choreo" element={<ChoreoMasterPage />} />
  </Route>

  {/* 认证相关路由（不需要 Layout） */}
  <Route path="/login" element={<LoginPage />} />
  <Route path="/register" element={<RegisterPage />} />
  <Route path="/user-center" element={<UserCenterPage />} />
</Routes>
```

## 部署配置

### 环境变量

```bash
# .env
SECRET_KEY=your-secret-key
DEBUG=True
DJANGO_ENV=development

# 数据库配置
DB_NAME=cosplay_db
DB_USER=cosplay_user
DB_PASSWORD=cosplay_password_2024
DB_HOST=localhost
DB_PORT=5433

# Redis配置
REDIS_URL=redis://localhost:6379/0

# 允许的主机
ALLOWED_HOSTS=localhost,127.0.0.1,0.0.0.0,data.cosdrama.cn,www.cosdrama.cn

# CORS配置
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### Docker Compose

```yaml
version: '3.8'

services:
  db:
    image: postgres:13
    environment:
      POSTGRES_DB: cosplay_db
      POSTGRES_USER: cosplay_user
      POSTGRES_PASSWORD: cosplay_password_2024
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5433:5432"

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

  frontend:
    build: .
    volumes:
      - ./src:/app/src
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

## 开发状态

### ✅ 已完成功能

1. **用户认证系统**
   - JWT登录/注册
   - Token刷新机制
   - 权限验证中间件

2. **角色权限管理**
   - 四级角色体系（viewer/contributor/editor/admin）
   - 权限检查方法
   - 角色申请和审批工作流

3. **用户中心**
   - 个人资料编辑
   - 社团/视频关联（支持搜索多选）
   - 自动分页获取大量数据
   - 角色申请入口
   - 管理员审批面板

4. **数据导入权限控制**
   - 基于角色的访问控制
   - 移除upload_key验证
   - 用户友好的错误提示

5. **前端组件**
   - Header导航（登录状态显示）
   - SearchableMultiSelectModal（搜索多选模态框）
   - RoleApprovalPanel（角色审批面板）
   - Logo展示（带旋转动画）

6. **路由和链接**
   - 修复API路径（连字符vs下划线）
   - 社团/视频详情页跳转修复
   - 移动端响应式优化

### 🚧 进行中

- 视频收藏和评分
- 数据分析和统计
- 移动端PWA适配

### 📋 计划中

- 用户评论系统
- 智能推荐算法
- 多语言支持
- API开放平台

## 开发指南

### 后端开发

```bash
# 进入后端目录
cd backend

# 激活虚拟环境
source venv/bin/activate

# 运行开发服务器
python manage.py runserver

# 创建迁移
python manage.py makemigrations

# 应用迁移
python manage.py migrate

# 创建超级用户
python manage.py createsuperuser

# 访问API文档
# http://localhost:8000/api/docs/
```

### 前端开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 类型检查
npx tsc --noEmit

# 代码格式化
npm run lint
```

### 测试账户

```
管理员账户：
用户名: subway
密码: chenyan

或

用户名: admin
密码: admin123456
```

## 贡献指南

1. Fork项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 许可证

本项目采用 MIT 许可证

## 联系方式

- 项目主页: https://github.com/Subway-chenyan/cosplay_web
- 邮箱: subwaycy@gmail.com

---

**最后更新**: 2025-01-16
