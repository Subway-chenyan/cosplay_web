# Cosplay舞台剧视频数据库 - 前端

这是一个基于React + TypeScript + Tailwind CSS构建的现代化前端应用，用于展示cosplay舞台剧视频。

## 功能特性

### 🎭 主要功能
- **主页**: 展示精彩的舞台剧视频列表
- **社团页面**: 浏览和了解各个cosplay社团
- **比赛页面**: 查看历年比赛信息和作品
- **智能筛选**: 根据社团、比赛、标签进行多维度筛选
- **响应式设计**: 支持桌面端和移动端

### 🚀 技术栈
- **React 18** - 现代化UI框架
- **TypeScript** - 类型安全的JavaScript
- **Tailwind CSS** - 实用优先的CSS框架
- **Redux Toolkit** - 状态管理
- **React Router** - 路由管理
- **Vite** - 快速构建工具
- **Lucide React** - 美观的图标库

### 🎨 设计特点
- 现代化的渐变色彩搭配
- 精美的卡片式布局
- 流畅的动画效果
- 直观的用户交互
- 完善的筛选系统

## 快速开始

### 环境要求
- Node.js 16+
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

访问 http://localhost:3000 查看应用

### 构建生产版本
```bash
npm run build
```

### 预览构建结果
```bash
npm run preview
```

## 项目结构

```
src/
├── components/          # 可复用组件
│   ├── Header.tsx      # 头部导航
│   ├── Layout.tsx      # 布局组件
│   ├── VideoCard.tsx   # 视频卡片
│   └── VideoFilters.tsx # 筛选组件
├── pages/              # 页面组件
│   ├── HomePage.tsx    # 主页
│   ├── GroupsPage.tsx  # 社团页面
│   └── CompetitionsPage.tsx # 比赛页面
├── store/              # Redux状态管理
│   ├── store.ts        # Store配置
│   └── slices/         # Redux切片
├── types/              # TypeScript类型定义
└── App.tsx             # 主应用组件
```

## 主要页面

### 主页 (/)
- **Hero区域**: 展示网站介绍和统计数据
- **统计卡片**: 最新视频、热门推荐、社团展示
- **筛选面板**: 多维度筛选功能
- **视频网格**: 响应式视频卡片布局

### 社团页面 (/groups)
- **社团统计**: 活跃社团、认证社团、总成员数
- **社团卡片**: 显示社团信息、成员数、视频数
- **认证标识**: 区分认证社团和普通社团
- **社交链接**: 官网、哔哩哔哩等链接

### 比赛页面 (/competitions)
- **年份分组**: 按年份组织比赛信息
- **比赛状态**: 区分进行中和已结束的比赛
- **详细信息**: 比赛描述、特色功能
- **状态标识**: 直观的进度标识

## 筛选功能

### 多维度筛选
- **社团筛选**: 按社团名称筛选
- **比赛筛选**: 按比赛名称和年份筛选
- **标签筛选**: 按分类标签筛选
  - 游戏IP: 原神、王者荣耀、崩坏三、FGO等
  - 其他分类: 年份、地区等

### 交互特性
- **颜色编码**: 标签使用不同颜色区分
- **实时更新**: 筛选条件实时生效
- **状态保持**: 筛选状态在页面间保持
- **清除功能**: 一键清除所有筛选条件

## 响应式设计

### 断点设置
- **移动端**: < 768px
- **平板端**: 768px - 1024px
- **桌面端**: > 1024px

### 适配特性
- 导航菜单自动折叠
- 卡片网格自适应列数
- 筛选面板可折叠
- 触摸友好的交互

## 开发指南

### 添加新组件
1. 在 `src/components/` 创建组件文件
2. 使用TypeScript定义组件props
3. 遵循现有的样式规范
4. 导出并在需要的地方引入

### 状态管理
- 使用Redux Toolkit管理全局状态
- 每个数据类型对应一个slice
- 使用createAsyncThunk处理异步操作
- 组件中使用useSelector和useDispatch

### 样式规范
- 使用Tailwind CSS类名
- 遵循响应式设计原则
- 使用自定义CSS类处理复杂样式
- 保持设计的一致性

## 后端集成

### API接口
当前使用模拟数据，后续将集成以下API：
- `GET /api/videos/` - 获取视频列表
- `GET /api/groups/` - 获取社团列表
- `GET /api/competitions/` - 获取比赛列表
- `GET /api/tags/` - 获取标签列表

### 代理配置
Vite已配置API代理，将 `/api` 请求转发到 `http://localhost:8000`

## 部署

### 环境变量
创建 `.env` 文件：
```env
VITE_API_BASE_URL=http://localhost:8000
```

### 部署步骤
1. 构建项目: `npm run build`
2. 将 `dist/` 目录部署到服务器
3. 配置nginx反向代理
4. 设置API接口地址

## 贡献指南

1. Fork项目
2. 创建功能分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add amazing feature'`
4. 推送到分支: `git push origin feature/amazing-feature`
5. 提交Pull Request

## 许可证

本项目采用MIT许可证 - 查看 [LICENSE](LICENSE) 文件了解详情 