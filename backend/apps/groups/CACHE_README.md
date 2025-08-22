# 社团缓存系统使用指南

## 概述

为了提高社团页面地图模块的加载速度，我们实现了一套完整的Redis缓存系统。该系统包括：

- 省份统计数据缓存（15分钟）
- 城市统计数据缓存（15分钟）
- 社团列表数据缓存（10分钟）
- 地图GeoJSON数据缓存（24小时）

## 缓存配置

缓存配置位于 `cosplay_api/settings.py`：

```python
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': REDIS_URL,
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}
```

## 管理命令

### 1. 预热缓存

```bash
# 基本预热
python manage.py warm_cache

# 预热前先清除现有缓存
python manage.py warm_cache --clear-first
```

### 2. 清除缓存

```bash
# 清除所有社团相关缓存
python manage.py clear_cache

# 清除特定类型的缓存
python manage.py clear_cache --type province
python manage.py clear_cache --type city
python manage.py clear_cache --type list

# 清除指定省份的城市统计缓存
python manage.py clear_cache --type city --province 浙江省
```

### 3. 监控缓存

```bash
# 基本监控（30秒间隔，10次）
python manage.py cache_monitor

# 自定义监控间隔和次数
python manage.py cache_monitor --interval 60 --count 5

# JSON格式输出
python manage.py cache_monitor --json
```

## API接口

### 缓存管理接口

所有缓存管理接口都需要用户认证。

#### 清除缓存

```http
POST /api/groups/clear_cache/
Content-Type: application/json
Authorization: Bearer <token>

{
    "type": "all"  // all, province, city, list
}
```

#### 预热缓存

```http
POST /api/groups/warm_cache/
Authorization: Bearer <token>
```

#### 获取缓存信息

```http
GET /api/groups/cache_info/
Authorization: Bearer <token>
```

## 缓存策略

### 自动缓存更新

当社团数据发生变化时（创建、更新、删除），系统会自动清除相关缓存：

- 创建社团：清除所有缓存
- 更新社团：清除所有缓存
- 删除社团：清除所有缓存

### 缓存键命名规则

- 省份统计：`groups_by_province`
- 城市统计：`groups_by_city_{province}`
- 社团列表：`groups_list_page_{page_num}`
- 地图数据：`china_geojson`

### 缓存时间设置

- 省份统计：15分钟
- 城市统计：15分钟
- 社团列表：10分钟
- 地图GeoJSON：24小时

## 性能优化建议

### 1. 部署时预热缓存

在应用部署后，建议立即预热缓存：

```bash
python manage.py warm_cache --clear-first
```

### 2. 定期监控缓存

建议定期监控缓存使用情况，确保缓存正常工作：

```bash
python manage.py cache_monitor --interval 300 --count 12 > cache_monitor.log
```

### 3. 缓存失效策略

如果发现数据不一致，可以手动清除特定缓存：

```bash
# 清除省份统计缓存
python manage.py clear_cache --type province

# 清除特定省份的城市缓存
python manage.py clear_cache --type city --province 浙江省
```

## 故障排除

### 1. 缓存预热失败

检查Redis连接和数据库连接是否正常：

```bash
# 检查Redis连接
python manage.py shell
>>> from django.core.cache import cache
>>> cache.set('test', 'value')
>>> cache.get('test')
```

### 2. 缓存不生效

检查缓存装饰器是否正确应用：

```python
# 确保视图方法有缓存装饰器
@method_decorator(cache_page(60 * 15))
def by_province(self, request):
    # ...
```

### 3. 内存使用过高

如果Redis内存使用过高，可以：

1. 减少缓存时间
2. 清除不必要的缓存
3. 调整缓存策略

```bash
# 清除所有缓存
python manage.py clear_cache
```

## 监控和日志

缓存操作会记录到Django日志中，可以通过以下方式查看：

```python
import logging
logger = logging.getLogger('apps.groups.cache_utils')
```

日志级别：
- INFO：成功操作
- ERROR：失败操作
- DEBUG：详细调试信息