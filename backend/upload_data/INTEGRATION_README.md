# 数据导入功能集成说明

## 概述

本文档说明了重构后的数据导入功能，该功能已集成到Web应用中，提供了完整的前端界面和密钥验证机制。

## 🔧 后端配置

### 1. 密钥配置

在 `backend/upload_data/config.json` 文件中配置上传密钥：

```json
{
  "upload_key": "cosplay_upload_key_2024",
  "max_file_size": 52428800,
  "allowed_extensions": [".xlsx", ".xls", ".csv"],
  "rate_limit": {
    "requests_per_minute": 10,
    "requests_per_hour": 60
  },
  "settings": {
    "auto_create_missing": true,
    "validate_required_fields": true,
    "log_level": "INFO"
  }
}
```

### 2. API端点

重构后的系统提供以下API端点：

- `POST /api/videos/import/verify-key/` - 验证上传密钥
- `GET /api/videos/import/template/` - 下载导入模板
- `POST /api/videos/import/start/` - 开始数据导入
- `GET /api/videos/import/status/<task_id>/` - 查询导入状态

## 🌐 前端使用

### 1. 访问导入页面

在浏览器中访问 `/data-import` 页面。

### 2. 密钥验证

1. 首次访问时会显示密钥验证界面
2. 输入在 `config.json` 中配置的密钥
3. 点击"验证密钥"按钮
4. 验证成功后会自动跳转到数据导入界面

### 3. 数据导入流程

1. **下载模板**：点击"下载导入模板"获取Excel模板文件
2. **填写数据**：按照模板格式填写要导入的数据
3. **选择文件**：拖拽或点击选择准备好的Excel文件
4. **配置选项**：
   - 选择数据类型（视频、社团、标签、比赛）
   - 可选择"仅验证数据"模式进行测试
5. **开始导入**：点击"开始导入"按钮
6. **查看结果**：实时查看导入进度和结果

## 🔒 安全特性

### 密钥验证
- 所有导入操作都需要提供有效的上传密钥
- 密钥通过配置文件管理，可以随时更换
- 前端会在每次API调用时携带密钥

### 文件验证
- 限制文件格式（仅支持Excel和CSV）
- 限制文件大小（默认50MB）
- 服务器端验证文件内容

### 错误处理
- 详细的错误信息反馈
- 按行显示数据验证错误
- 警告信息提示

## 🚀 技术实现

### 后端集成
- 直接集成原有的 `upload_data` 工程
- 使用Django REST Framework提供API
- 异步任务处理，支持大文件导入
- 线程安全的任务状态管理

### 前端实现
- React + TypeScript
- Redux Toolkit状态管理
- 实时轮询任务状态
- 响应式设计，支持移动端

## 📊 监控和日志

### 任务状态
- 实时显示导入进度
- 成功/失败统计
- 详细的错误和警告信息

### 历史记录
- 保存导入任务历史
- 可查看过往导入结果
- 支持任务状态追踪

## ⚙️ 配置选项

### 上传限制
```json
{
  "max_file_size": 52428800,  // 50MB
  "allowed_extensions": [".xlsx", ".xls", ".csv"]
}
```

### 速率限制
```json
{
  "rate_limit": {
    "requests_per_minute": 10,
    "requests_per_hour": 60
  }
}
```

### 导入设置
```json
{
  "settings": {
    "auto_create_missing": true,      // 自动创建缺失的关联数据
    "validate_required_fields": true, // 验证必填字段
    "log_level": "INFO"              // 日志级别
  }
}
```

## 🔄 数据模板

系统支持以下数据类型的导入模板：

1. **视频数据** - 包含视频信息、社团、比赛、奖项等
2. **社团数据** - 社团基本信息和联系方式
3. **标签数据** - 标签名称和分类
4. **比赛数据** - 比赛基本信息

每个模板都包含：
- 示例数据工作表
- 空白导入模板
- 详细的字段说明

## 🆘 故障排除

### 常见问题

1. **密钥验证失败**
   - 检查 `config.json` 中的密钥配置
   - 确保前端输入的密钥正确

2. **文件上传失败**
   - 检查文件格式是否支持
   - 确认文件大小在限制范围内

3. **导入数据失败**
   - 检查Excel文件格式
   - 确认必填字段已填写
   - 查看详细错误信息

4. **任务状态异常**
   - 检查后端服务是否正常运行
   - 查看服务器日志

### 日志位置
- 后端日志：`backend/django.log`
- 导入日志：控制台输出

## 📝 开发说明

如需修改密钥或其他配置，请编辑：
- 密钥配置：`backend/upload_data/config.json`
- API视图：`backend/apps/videos/views.py`
- 前端页面：`src/pages/DataImportPage.tsx`
- 状态管理：`src/store/slices/dataImportSlice.ts`

重启服务后配置即可生效。 