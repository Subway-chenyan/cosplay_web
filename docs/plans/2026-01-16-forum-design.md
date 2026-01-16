# 论坛系统设计文档 (Forum System Design)

## 1. 概述
为 Cosplay 网站增加论坛功能，支持用户交流道具制作、剧本编排及招募找团。系统将深度集成现有的 Persona 5 (P5) UI 风格。

## 2. 核心功能
- **分区管理**: 支持动态分区（道具&舞美、剧本&编排、招募&找团）。
- **发帖系统**: 支持 TipTap 富文本编辑器，支持图文混排，无需审核。
- **互动系统**: 支持评论及对评论的回复（二级评论结构）。
- **鉴权集成**: 仅登录用户可发帖/评论，支持现有 JWT 认证。

## 3. 技术架构 (方案 A)

### 3.1 后端 (Django + DRF)
- **App 名称**: `forum`
- **模型设计**:
    - `ForumCategory`: `name`, `slug`, `description`, `icon`, `order`
    - `Post`: `title`, `content` (HTML/JSON), `author` (FK), `category` (FK), `view_count`, `created_at`
    - `Comment`: `post` (FK), `author` (FK), `content`, `parent` (Self-FK, nullable), `created_at`
- **API 路由**:
    - `GET /api/forum/categories/`: 获取分区列表
    - `GET /api/forum/posts/?category=xxx`: 按分区筛选帖子
    - `POST /api/forum/posts/`: 发布帖子 (需要认证)
    - `GET /api/forum/posts/{id}/`: 获取帖子详情及评论
    - `POST /api/forum/comments/`: 发布评论 (需要认证)

### 3.2 前端 (React + Tailwind + TipTap)
- **组件库**: 基于项目现有的 P5 自定义组件。
- **富文本**: `TipTap` + `StarterKit` + `Image` 扩展。
- **UI 风格**:
    - 使用 `p5-red`, `p5-black` 颜色体系。
    - 列表和详情页采用 `p5-skew` 倾斜效果和 `p5-halftone` 底纹。
    - 评论区采用对话框漫画风格。

## 4. 数据库变更
- 新增 `forum_category` 表。
- 新增 `forum_post` 表。
- 新增 `forum_comment` 表。

## 5. 交互流程
1. 用户进入 `/forum` 页面。
2. 侧边栏显示动态分区（倾斜效果）。
3. 选中分区后加载帖子列表（预告信风格卡片）。
4. 点击发帖按钮，弹出 P5 风格的 TipTap 编辑器。
5. 发送成功后跳转至详情页。

## 6. 安全与限制
- 后端进行权限校验（`IsAuthenticatedOrReadOnly`）。
- 前端对 HTML 内容进行 Sanitization (防止 XSS)。
- 图片上传限制大小（如 5MB）。

---
🤖 Generated with [Claude Code](https://claude.com/claude-code)
