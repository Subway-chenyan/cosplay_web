# Server-Side Filtering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将首页和比赛详情页迁移为服务端筛选，支持 URL 恢复、可靠分页/加载更多、竞态保护与自动化测试。

**Architecture:** 首页保留 `VideoViewSet`，通过严格 CSV UUID 筛选器和扩展关键词字段返回分页视频；比赛详情新增规范化参赛条目接口，在数据库统一获奖记录与未获奖视频后分页。前端新增彼此隔离的首页视频和比赛条目状态、URL 查询工具与筛选组件。

**Tech Stack:** Django 4.2、Django REST Framework、django-filter、PostgreSQL、React 18、Redux Toolkit、React Router、Axios、Vitest、TypeScript、Vite。

---

## 文件结构

- 新建 `backend/apps/videos/tests/test_filtering.py`：首页组合筛选、关键词去重、筛选选项接口测试。
- 修改 `backend/apps/videos/filters.py`：CSV UUID 多选验证与筛选。
- 修改 `backend/apps/videos/views.py`：扩展关键词字段、稳定排序和年份选项 action。
- 新建 `backend/apps/competitions/tests/test_entries.py`：比赛条目三种类型、组合条件、分页和选项测试。
- 新建 `backend/apps/competitions/entries.py`：统一条目查询、批量 hydration 和响应序列化。
- 修改 `backend/apps/competitions/views.py`：比赛搜索、`entries` 与 `filter_options` actions。
- 修改 `src/types/index.ts`：首页筛选、筛选选项和比赛条目类型。
- 新建 `src/features/serverFilters/query.ts`：URL 解析与序列化纯函数。
- 新建 `src/features/serverFilters/query.test.ts`：URL 纯函数测试。
- 新建 `src/store/slices/homeVideosSlice.ts`：首页结果与请求竞态状态。
- 新建 `src/store/slices/competitionEntriesSlice.ts`：比赛条目首次加载和追加状态。
- 修改 `src/store/store.ts`：注册两个独立 reducer。
- 修改 `src/services/videoService.ts`：CSV 参数、筛选选项、AbortSignal。
- 修改 `src/services/competitionService.ts`：比赛选项、条目和比赛搜索接口。
- 新建 `src/components/AsyncMultiSelect.tsx`：服务端搜索多选控件。
- 新建 `src/components/HomeServerFilters.tsx`：首页筛选草稿与应用/清除操作。
- 修改 `src/pages/HomePage.tsx`：接入 URL、独立状态和服务端筛选。
- 修改 `src/pages/CompetitionDetailPage.tsx`：移除全量预取和本地业务筛选，接入条目接口。
- 修改 `package.json`、`package-lock.json`：加入 Vitest 和测试脚本。

### Task 1: 首页后端组合筛选

**Files:**
- Create: `backend/apps/videos/tests/__init__.py`
- Create: `backend/apps/videos/tests/test_filtering.py`
- Modify: `backend/apps/videos/filters.py`
- Modify: `backend/apps/videos/views.py`

- [ ] **Step 1: 写失败测试**

使用 `APITestCase` 创建两个比赛、两个社团、多个年份视频和一条获奖记录。断言：

```python
response = self.client.get('/api/videos/', {
    'search': '目标剧目',
    'year': 2025,
    'competitions': f'{competition_a.id},{competition_b.id}',
    'groups': str(group_a.id),
})
self.assertEqual(response.status_code, 200)
self.assertEqual(response.data['count'], 1)
self.assertEqual(response.data['results'][0]['id'], str(target.id))
self.assertEqual(
    len({item['id'] for item in response.data['results']}),
    len(response.data['results']),
)
```

另测非法 UUID 返回 400，`/api/videos/filter-options/` 返回年份及准确数量。

- [ ] **Step 2: 运行测试确认失败**

Run: `backend\.venv\Scripts\python.exe backend\manage.py test apps.videos.tests.test_filtering -v 2`

Expected: FAIL，组合 UUID 参数或 `filter-options` 尚未实现。

- [ ] **Step 3: 实现严格筛选与选项接口**

在 `filters.py` 定义：

```python
class UUIDInFilter(django_filters.BaseInFilter, django_filters.UUIDFilter):
    pass

class VideoFilter(django_filters.FilterSet):
    groups = UUIDInFilter(field_name='group_id', lookup_expr='in')
    competitions = UUIDInFilter(field_name='competition_id', lookup_expr='in')
```

在 `VideoViewSet` 中将 `search_fields` 扩展为视频、社团、比赛、奖项和剧目字段，将 `ordering` 设为 `['-created_at', '-id']`；新增 `filter_options` action，通过 `values('year').annotate(count=Count('id'))` 返回非空年份。

- [ ] **Step 4: 运行测试确认通过**

Run: `backend\.venv\Scripts\python.exe backend\manage.py test apps.videos.tests.test_filtering -v 2`

Expected: PASS。

- [ ] **Step 5: 提交**

```powershell
git add backend/apps/videos
git commit -m "feat: add server-side home video filters"
```

### Task 2: 比赛规范化条目接口

**Files:**
- Create: `backend/apps/competitions/tests/__init__.py`
- Create: `backend/apps/competitions/tests/test_entries.py`
- Create: `backend/apps/competitions/entries.py`
- Modify: `backend/apps/competitions/views.py`

- [ ] **Step 1: 写失败测试覆盖三类条目**

创建获奖视频、无视频获奖记录和未获奖视频，断言：

```python
response = self.client.get(
    f'/api/competitions/competitions/{competition.id}/entries/',
    {'year': 2025, 'page_size': 2},
)
self.assertEqual(response.status_code, 200)
self.assertEqual(response.data['count'], 3)
self.assertEqual(
    {item['kind'] for item in response.data['results']},
    {'awarded_video', 'award_without_video'},
)
self.assertIsNotNone(response.data['next'])
```

继续请求 `next` 并断言第三类为 `unawarded_video`、全部 `entry_id` 唯一。另测 `year + award`、外部比赛奖项返回 400 和 `filter-options` 完整列表。

- [ ] **Step 2: 运行测试确认失败**

Run: `backend\.venv\Scripts\python.exe backend\manage.py test apps.competitions.tests.test_entries -v 2`

Expected: FAIL，actions 尚不存在。

- [ ] **Step 3: 实现统一查询服务**

在 `entries.py` 中分别构造 `AwardRecord` 和无获奖 `Video` 的对齐 `values()` 查询，字段包含 `entry_id`、`kind`、`entry_year`、`sort_created`、`record_id`、`video_id`、`award_id`。筛选发生在 union 前，使用 `union(all=True).order_by('-entry_year', '-sort_created', '-entry_id')`。提供：

公开三个边界明确的函数：`build_competition_entries(competition, *, year=None, award=None)` 返回可分页的对齐行查询；`hydrate_competition_entries(rows)` 批量转换当前页；`get_competition_filter_options(competition)` 返回稳定选项和计数。

`hydrate_competition_entries` 批量查询 ID 并输出 `entry_id/kind/year/award/award_record/video`，禁止逐条数据库查询。

- [ ] **Step 4: 暴露 actions 与参数校验**

在 `CompetitionViewSet` 添加 `@action(detail=True, methods=['get'], url_path='entries')`，验证年份和奖项归属，调用 `paginate_queryset` 后 hydration；添加 `filter-options` action。为比赛列表配置 `SearchFilter` 和 `search_fields = ['name', 'description']`。

- [ ] **Step 5: 运行测试确认通过**

Run: `backend\.venv\Scripts\python.exe backend\manage.py test apps.competitions.tests.test_entries -v 2`

Expected: PASS。

- [ ] **Step 6: 运行两组后端回归测试并提交**

Run: `backend\.venv\Scripts\python.exe backend\manage.py test apps.videos.tests.test_filtering apps.competitions.tests.test_entries -v 2`

Expected: PASS。

```powershell
git add backend/apps/competitions backend/apps/videos
git commit -m "feat: add paginated competition entries"
```

### Task 3: 前端查询协议与自动化测试

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/types/index.ts`
- Create: `src/features/serverFilters/query.ts`
- Create: `src/features/serverFilters/query.test.ts`

- [ ] **Step 1: 安装并配置 Vitest**

Run: `npm install --save-dev vitest`

在 `package.json` 增加 `"test": "vitest run"`。

- [ ] **Step 2: 写 URL 协议失败测试**

```typescript
it('normalizes home filters and resets invalid page', () => {
  const parsed = parseHomeFilterParams(new URLSearchParams(
    'q=原神&year=2025&competitions=b,a,a&groups=x&page=0',
  ))
  expect(parsed).toEqual({
    query: '原神', year: 2025, competitionIds: ['a', 'b'], groupIds: ['x'], page: 1,
  })
  expect(serializeHomeFilterParams(parsed).toString()).toBe(
    'q=%E5%8E%9F%E7%A5%9E&year=2025&competitions=a%2Cb&groups=x',
  )
})
```

另测比赛 `year`/`award`、空值、去重和稳定参数顺序。

- [ ] **Step 3: 运行测试确认失败**

Run: `npm test -- src/features/serverFilters/query.test.ts`

Expected: FAIL，模块不存在。

- [ ] **Step 4: 实现类型和纯函数**

定义 `HomeFilterState`、`CompetitionFilterState`、`FilterOption`、`CompetitionEntry` 与分页类型；实现 parse/serialize，统一 CSV 去重、排序、年份和页码校验。

- [ ] **Step 5: 运行测试确认通过并提交**

Run: `npm test -- src/features/serverFilters/query.test.ts`

Expected: PASS。

```powershell
git add package.json package-lock.json src/types src/features
git commit -m "test: define filter URL contracts"
```

### Task 4: 独立请求状态和服务层

**Files:**
- Modify: `src/services/videoService.ts`
- Modify: `src/services/competitionService.ts`
- Create: `src/store/slices/homeVideosSlice.ts`
- Create: `src/store/slices/competitionEntriesSlice.ts`
- Create: `src/store/slices/serverFilterSlices.test.ts`
- Modify: `src/store/store.ts`

- [ ] **Step 1: 写竞态和追加失败测试**

使用 reducer action 测试：不同 `requestId` 的旧 fulfilled 不覆盖当前首页结果；比赛加载更多 rejected 保留已有条目和 `next`；fulfilled 按 `entry_id` 去重。

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- src/store/slices/serverFilterSlices.test.ts`

Expected: FAIL，reducers 尚不存在。

- [ ] **Step 3: 实现服务方法**

`videoService.getVideos` 接受 `signal` 并把多选显式编码为 CSV；新增 `getFilterOptions`。`competitionService` 新增：

```typescript
getFilterOptions(id: string, signal?: AbortSignal): Promise<CompetitionFilterOptions>
getEntries(id: string, filters: CompetitionFilterState, page?: number, signal?: AbortSignal): Promise<PaginatedResponse<CompetitionEntry>>
getEntriesByUrl(nextUrl: string, signal?: AbortSignal): Promise<PaginatedResponse<CompetitionEntry>>
```

- [ ] **Step 4: 实现 slices**

两个 thunk 使用 `thunkAPI.signal`。首页 state 记录 `currentRequestId`；比赛 state 分离 `loading`、`loadingMore`、`error`、`loadMoreError`，仅当前请求可改写状态，追加时使用 `Set(entry_id)` 去重。

- [ ] **Step 5: 测试、类型检查并提交**

Run: `npm test -- src/store/slices/serverFilterSlices.test.ts`

Run: `npx tsc --noEmit`

Expected: 全部通过。

```powershell
git add src/services src/store
git commit -m "feat: add isolated server filter state"
```

### Task 5: 首页筛选 UI 迁移

**Files:**
- Create: `src/components/AsyncMultiSelect.tsx`
- Create: `src/components/HomeServerFilters.tsx`
- Modify: `src/pages/HomePage.tsx`

- [ ] **Step 1: 实现服务端搜索多选控件**

控件包含搜索输入、300ms 防抖、加载/错误状态、复选结果和已选 chips。搜索响应只更新可选项，不删除当前已选值；卸载或新搜索时取消旧请求。

- [ ] **Step 2: 实现首页草稿筛选组件**

组件 props 明确为 `value/onApply/onClear/years/loadCompetitions/loadGroups`。比赛、社团只改草稿；应用按钮一次提交；清空按钮恢复空筛选。

- [ ] **Step 3: 迁移 HomePage**

使用 `useSearchParams` 解析 URL，以 `homeVideos` slice 为结果来源。普通搜索回车与应用筛选写入 URL；页码写入 URL；`popstate`/刷新从 URL 重新请求。保留智能检索分支。重新筛选时旧结果使用淡化遮罩，失败保留旧结果并显示重试。

- [ ] **Step 4: 构建和测试**

Run: `npm test`

Run: `npm run build:main`

Expected: PASS，TypeScript 与 Vite 构建成功。

- [ ] **Step 5: 提交**

```powershell
git add src/components src/pages/HomePage.tsx
git commit -m "feat: add home server filters"
```

### Task 6: 比赛详情页迁移

**Files:**
- Modify: `src/pages/CompetitionDetailPage.tsx`

- [ ] **Step 1: 替换数据来源**

移除 `fetchCompetitionVideos`、`fetchCompetitionAwardRecords`、1000 条预取、`filteredVideos` 和滚动监听。使用 URL 中 `year/award` 请求 `competitionEntries`，从独立 `filter-options` 获取完整年份和奖项。

- [ ] **Step 2: 改为可组合筛选**

年份和奖项控件同时显示且互不清除。每次变化更新 URL、清空旧条目并请求第一页；清除按钮移除两个参数。

- [ ] **Step 3: 以条目做展示分组**

仅按后端已筛选条目的 `award.id` 分组；`award === null` 进入“参与作品”。`awarded_video` 渲染 `VideoCard`，`award_without_video` 渲染 `NoVideoAwardCard`。按钮使用 `next` 控制“加载更多/重试加载”，不再自动监听全页滚动。

- [ ] **Step 4: 构建和回归测试**

Run: `npm test`

Run: `npm run build:main`

Expected: PASS。

- [ ] **Step 5: 提交**

```powershell
git add src/pages/CompetitionDetailPage.tsx
git commit -m "feat: migrate competition filters to backend"
```

### Task 7: 数据库迁移检查与全链路验证

**Files:**
- Modify only if generated: `backend/apps/*/migrations/*.py`

- [ ] **Step 1: 检查模型迁移**

Run: `backend\.venv\Scripts\python.exe backend\manage.py makemigrations --check --dry-run`

Expected: `No changes detected`。若确有模型变化，生成迁移、审阅 SQL 并运行迁移测试；本设计预计不新增模型迁移。

- [ ] **Step 2: 运行后端完整测试**

Run: `backend\.venv\Scripts\python.exe backend\manage.py test -v 2`

Expected: PASS。

- [ ] **Step 3: 运行前端完整验证**

Run: `npm test`

Run: `npm run build:main`

Expected: PASS。

- [ ] **Step 4: 对当前数据库应用已有迁移**

Run: `backend\.venv\Scripts\python.exe backend\manage.py migrate`

Expected: 所有迁移应用成功，`showmigrations --plan` 不再显示待应用项。

- [ ] **Step 5: 浏览器端到端验证**

启动服务后验证：首页关键词/年份/比赛多选/社团多选/组合、清空、分页、刷新和前进后退；比赛详情年份、奖项、组合、清空和加载更多；检查空结果、重试状态、错误覆盖层和控制台错误。

- [ ] **Step 6: 最终提交**

```powershell
git add -A
git commit -m "test: verify server-side filtering migration"
```
