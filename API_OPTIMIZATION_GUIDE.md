# API优化指南：大量视频数据筛选与分页

## 问题总结
当前API默认每页仅返回20个视频，对于大量数据筛选效率较低。本指南提供完整的优化方案。

## 后端优化

### 1. 分页配置优化
- **默认分页**：每页20条（保持不变）
- **最大分页**：每页1000条（新配置）
- **动态分页**：支持通过`page_size`参数自定义

### 2. 新增优化API端点

#### 2.1 比赛视频统计端点
```
GET /api/videos/competition/{competition_id}/stats/
```
**功能**：获取比赛视频的年份分布、总数、奖项统计
**返回**：
```json
{
  "total_videos": 1500,
  "year_distribution": [
    {"year": 2023, "count": 500},
    {"year": 2022, "count": 600},
    {"year": 2021, "count": 400}
  ],
  "award_distribution": [
    {"award__name": "金奖", "count": 50},
    {"award__name": "银奖", "count": 80}
  ]
}
```

#### 2.2 优化视频列表端点
```
GET /api/videos/competition/{competition_id}/optimized/
```
**参数**：
- `year`：按年份筛选
- `award`：按奖项筛选
- `page_size`：每页数量（最大500）
- `ordering`：排序字段（year, -year, play_count, -play_count, like_count, -like_count）

**示例**：
```
/api/videos/competition/1ba718fd-d838-4245-b213-bb7aee201255/optimized/?year=2023&page_size=100&ordering=-play_count
```

### 3. 分页类配置
- **标准分页**：每页20条
- **大容量分页**：每页100条，最大500条
- **优化分页**：每页50条，支持动态调整

## 前端优化

### 1. 使用新的优化服务
```typescript
import optimizedVideoService from '../services/optimizedVideoService'

// 获取统计信息
const stats = await optimizedVideoService.getCompetitionStats(competitionId)

// 获取优化视频列表
const videos = await optimizedVideoService.getCompetitionVideosOptimized({
  competitionId,
  year: 2023,
  pageSize: 100,
  ordering: '-play_count'
})
```

### 2. 并行数据加载
```typescript
// 并行获取所有年份数据
const years = [2023, 2022, 2021]
const yearVideos = await optimizedVideoService.getCompetitionVideosBatch(competitionId, years)
```

### 3. 缓存优化
```typescript
// 使用缓存友好的API
const cachedVideos = await optimizedVideoService.getCachedCompetitionVideos(
  competitionId,
  selectedYear,
  page,
  100
)
```

## 最佳实践

### 1. 数据加载策略
- **首次加载**：使用统计端点获取年份分布
- **分页加载**：每页100-200条数据
- **预加载**：基于用户行为预加载相邻年份数据

### 2. 筛选优化
- **年份筛选**：直接使用年份参数，避免前端过滤
- **排序优化**：使用后端排序，减少数据传输
- **分页导航**：提供总页数和当前页信息

### 3. 性能建议
- **分页大小**：移动端50条，桌面端100条
- **缓存策略**：5分钟缓存，减少重复请求
- **错误处理**：优雅降级，支持重试机制

## 使用示例

### 完整的比赛详情页实现
```typescript
// 1. 获取统计信息
const stats = await optimizedVideoService.getCompetitionStats(competitionId)

// 2. 基于统计信息展示年份选项
const availableYears = stats.year_distribution.map(item => item.year)

// 3. 根据用户选择加载对应年份视频
const videos = await optimizedVideoService.getCompetitionVideosOptimized({
  competitionId,
  year: selectedYear,
  pageSize: 100
})
```

### 批量数据获取
```typescript
// 一次性获取所有年份数据
const allYears = stats.year_distribution.map(item => item.year)
const allData = await optimizedVideoService.getCompetitionVideosBatch(
  competitionId,
  allYears,
  200
)
```

## 测试验证

### 1. 验证分页功能
```bash
# 测试不同分页大小
curl "http://localhost:8000/api/videos/?competition=1ba718fd-d838-4245-b213-bb7aee201255&page_size=50"
curl "http://localhost:8000/api/videos/?competition=1ba718fd-d838-4245-b213-bb7aee201255&page_size=200"
```

### 2. 验证优化端点
```bash
# 测试统计端点
curl "http://localhost:8000/api/videos/competition/1ba718fd-d838-4245-b213-bb7aee201255/stats/"

# 测试优化视频列表
curl "http://localhost:8000/api/videos/competition/1ba718fd-d838-4245-b213-bb7aee201255/optimized/?year=2023&page_size=100"
```

## 总结
通过后端分页优化、新增专用API端点和前端高效数据加载策略，系统现在能够：
- 支持每页最多1000条数据
- 提供年份和奖项的快速筛选
- 实现并行数据加载和缓存优化
- 提供完整的统计信息用于智能加载

这些优化确保了即使在处理大量视频数据时，系统也能保持快速响应和良好的用户体验。