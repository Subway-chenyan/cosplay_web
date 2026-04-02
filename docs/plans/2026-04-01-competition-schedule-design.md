# 赛程模块设计文档

## 概述
在比赛页面中新增"赛程"标签页，展示当前进行中的赛事完整历程。支持按赛区和阶段分组展示、管理员关联视频、比赛结束后数据实时同步到比赛详情页。

## 决策记录

| 决策项 | 选择 | 理由 |
|--------|------|------|
| 阶段划分 | Event 加 stage 字段（初赛/复赛/决赛） | 用户明确要求 |
| 赛区划分 | Event 加 region 字段 | CJ 比赛有明确赛区结构 |
| 视频存储 | 关联现有 Video 模型（M2M） | 复用现有视频系统 |
| 归档方式 | 实时同步显示 | 同一份数据，多处展示 |
| 页面位置 | 嵌入比赛页标签页 | 用户选择 |

## 后端改动

### 1. Event 模型新增字段

```python
class Event(models.Model):
    # 现有字段...
    region = models.CharField(max_length=100, blank=True, verbose_name='赛区')
    stage = models.CharField(
        max_length=20,
        choices=[('preliminary', '初赛'), ('advancing', '复赛'), ('final', '决赛')],
        blank=True,
        verbose_name='赛事阶段'
    )
    videos = models.ManyToManyField(
        'videos.Video',
        blank=True,
        related_name='events',
        verbose_name='关联视频'
    )
```

### 2. Serializer 变更

- EventSerializer: 增加 `region`、`stage` 字段，增加 `videos` 嵌套序列化
- videos 字段输出：bv_number、title、url、thumbnail

### 3. 新增 API 端点

| 方法 | 路径 | 说明 | 权限 |
|------|------|------|------|
| GET | `/api/competitions/events/active/` | 获取当前进行中/即将开始的赛事 | AllowAny |
| GET | `/api/competitions/competitions/{id}/schedule/` | 获取某比赛的完整赛程 | AllowAny |
| POST | `/api/competitions/events/{id}/link_video/` | 管理员关联视频到赛事 | IsAuthenticated |
| POST | `/api/competitions/events/{id}/unlink_video/` | 取消关联视频 | IsAuthenticated |

**active 接口逻辑**：
- 返回 `end_date >= today` 或 `start_date >= today - 30天` 的赛事
- 按 competition → region → stage 分组
- 包含关联视频数据

**schedule 接口逻辑**：
- 返回某比赛所有 Event
- 按 region → stage → start_date 排序
- 包含关联视频数据

### 4. Admin 变更

- EventAdmin 增加 region 和 stage 的 list_filter
- 增加 videos 的 filter_horizontal

### 5. 数据迁移

- 为现有 Event 数据设置合理的 region 和 stage 值（通过 title 解析）
- 空白迁移脚本，包含数据回填逻辑

## 前端改动

### 1. CompetitionsPage 标签页结构

将现有比赛列表改为两个标签页：
- **比赛列表**：现有内容不变
- **当前赛程**：新增赛程视图

### 2. 赛程标签页布局

```
┌──────────────────────────────────────────┐
│  比赛筛选器（下拉选择：CJ / 其他比赛）     │
├──────────────────────────────────────────┤
│  📅 CJ（ChinaJoy）2026 赛程               │
│                                          │
│  ▼ 北京赛区                               │
│    ┌────────────────────────────────┐    │
│    │ 初赛                           │    │
│    │  🏟 北京 5.2-5.3 北京展览馆     │    │
│    │  🏟 天津 5.2-5.3 天津大悦城     │    │
│    │                                │    │
│    │ 复赛                           │    │
│    │  🎯 北京 6.19 凯德mall大兴      │    │
│    └────────────────────────────────┘    │
│                                          │
│  ▼ 西北赛区                               │
│    ┌────────────────────────────────┐    │
│    │ 初赛                           │    │
│    │  🏟 西安 5.3-5.4 星悦MALL      │    │
│    │  🏟 渭南 5.16-5.17 吾悦广场    │    │
│    │  🏟 兰州 5.1-5.2 甘肃科技馆    │    │
│    │                                │    │
│    │ 复赛                           │    │
│    │  🎯 西安 6.19 万和城购物中心    │    │
│    └────────────────────────────────┘    │
│  ...                                     │
├──────────────────────────────────────────┤
│  📅 其他比赛                              │
│  时间线：初赛 → 决赛                       │
└──────────────────────────────────────────┘
```

**视觉设计**：
- Persona 5 风格，红色/黑色主题
- 赛区用折叠面板（Accordion）展示
- 阶段用不同图标区分：初赛(🏟)、复赛(🎯)、决赛(🏆)
- 已结束的赛事灰化处理
- 赛事卡片可展开显示详情（地点、联系方式、视频）

### 3. CompetitionDetailPage 增强

- 在比赛详情页增加"赛程"区块
- 展示该比赛完整的赛程时间线
- 按赛区/阶段分组（与赛程标签页相同的展示逻辑）
- 每个赛事的视频可直接播放（Bilibili 嵌入）

### 4. 管理员视频关联功能

- 每个赛程条目上有"关联视频"按钮（仅管理员可见）
- 点击后弹窗，可搜索现有 Video 记录（按标题/BV号搜索）
- 选择后调用 link_video API 关联
- 已关联的视频显示在赛程卡片中，支持取消关联

### 5. 前端服务层

eventService.ts 新增：
- `getActiveEvents()` — 获取当前活跃赛事
- `getCompetitionSchedule(competitionId)` — 获取比赛赛程
- `linkVideo(eventId, videoId)` — 关联视频
- `unlinkVideo(eventId, videoId)` — 取消关联

### 6. 组件结构

```
src/
├── components/
│   └── schedule/
│       ├── ScheduleTab.tsx          # 赛程标签页主组件
│       ├── CompetitionSchedule.tsx  # 单个比赛的赛程视图
│       ├── RegionAccordion.tsx      # 赛区折叠面板
│       ├── StageGroup.tsx           # 阶段分组（初赛/复赛/决赛）
│       ├── EventCard.tsx            # 单个赛事卡片
│       └── VideoLinkModal.tsx       # 视频关联弹窗
├── pages/
│   ├── CompetitionsPage.tsx         # 改造为标签页结构
│   └── CompetitionDetailPage.tsx    # 增加赛程区块
```

## 阶段说明

- **初赛 (preliminary)**：CJ 的预选赛，其他比赛的初赛
- **复赛 (advancing)**：CJ 的晋级赛，其他比赛的复赛/半决赛
- **决赛 (final)**：所有比赛的决赛

CJ 比赛三阶段全部使用，其他比赛只用初赛和决赛。
