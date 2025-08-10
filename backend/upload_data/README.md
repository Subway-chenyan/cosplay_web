# 数据快速导入工具

## 简介

这是一个用于快速导入Cosplay视频数据的工具，支持从Excel文件批量导入视频、社团、比赛、奖项等相关数据。

## 功能特性

✨ **生成Excel模板**: 自动生成包含所有必要字段的Excel导入模板  
🚀 **批量数据导入**: 从Excel文件批量导入视频数据到数据库  
🔄 **自动创建关联**: 自动创建不存在的社团、比赛、奖项等关联数据  
📊 **详细反馈**: 提供详细的导入进度和错误信息  
🛡️ **事务安全**: 使用数据库事务确保数据一致性  

## 安装依赖

```bash
pip install -r requirements.txt
```

## 使用方法

### 1. 生成Excel模板

```bash
cd backend/upload_data
python generate_template.py
```

生成的模板文件位置: `templates/video_import_template.xlsx`

模板包含两个工作表:
- **示例数据**: 包含多奖项示例数据，可直接修改使用
- **字段说明**: 详细的字段说明和要求

💡 **导入说明**: 系统会自动使用第一个工作表进行导入，现在支持一个视频设置多个奖项。

### 2. 填写Excel数据

打开生成的模板文件，在"导入模板"工作表中填写数据。

#### 必填字段
- `bv_number`: B站视频BV号 (必须唯一)
- `title`: 视频标题
- `url`: 视频链接

#### 可选字段
- `description`: 视频描述
- `thumbnail`: 缩略图链接
- `year`: 视频年份 (视频基础属性)
- `group_name`: 所属社团名称
- `competition_name`: 所属比赛名称
- `tags`: 标签 (格式: `标签名:分类,标签名:分类`，分类仅支持：IP、风格、其他)

#### 扩展字段
当指定的社团、比赛不存在时，可填写相应的扩展字段来创建新的实体:

**社团扩展字段**:
- `group_description`: 社团描述
- `group_founded_date`: 成立时间 (格式: YYYY-MM-DD)
- `group_province`: 所在省份
- `group_city`: 所在城市
- `group_location`: 详细地址
- `group_website`: 官方网站
- `group_email`: 联系邮箱
- `group_phone`: 联系电话
- 等等...

**比赛扩展字段**:
- `competition_description`: 比赛描述
- `competition_website`: 比赛官网

**奖项字段**（支持多个奖项）:
- `award_names`: 奖项名称（多个用逗号分隔）
- `award_years`: 获奖年份（多个用逗号分隔，需与奖项数量对应）
- `award_descriptions`: 获奖描述（多个用逗号分隔，需与奖项数量对应）

### 3. 执行数据导入

```bash
cd backend/upload_data
python import_data.py <excel_file_path> [sheet_name]
```

**示例**:
```bash
# 使用默认工作表
python import_data.py templates/video_import_template.xlsx

# 指定工作表
python import_data.py data.xlsx test
```

## 数据导入规则

### 🔄 自动创建逻辑

1. **社团**: 如果`group_name`指定的社团不存在，将使用提供的`group_*`字段自动创建
2. **比赛**: 如果`competition_name`指定的比赛不存在，将使用提供的`competition_*`字段自动创建  
3. **奖项**: 如果`award_name`指定的奖项不存在，将在对应比赛下自动创建
4. **标签**: 如果标签不存在，将根据指定分类自动创建

### 📋 标签格式说明

标签字段支持多个标签，格式为: `标签名:分类,标签名:分类`

**支持的分类**:
- IP (包括游戏IP、动漫IP等)
- 风格 (如古风、现代、甜美、帅气等)
- 其他

**示例**:
```
初音未来:IP,甜美:风格,测试标签:其他
```

**注意**: 年份现在是视频的基础属性，不再通过标签关联，请使用 `year` 字段。视频的地区信息将自动从关联的社团地区获取。

### 🏆 多奖项格式说明

一个视频可以获得同一比赛下的多个奖项，使用逗号分隔：

**示例**:
- `award_names`: `最佳团体奖,最佳创意奖,观众选择奖`
- `award_years`: `2024,2024,2024`
- `award_descriptions`: `获得团体组第一名,创意设计优秀,观众投票最高`

### ⚠️ 注意事项

1. **BV号更新**: 当BV号已存在时，系统会自动更新现有视频的所有相关数据（包括视频信息、标签、获奖记录等），而不是报错
2. **日期格式**: 日期字段请使用 YYYY-MM-DD 格式 (如: 2024-01-01)
3. **URL格式**: 网址字段需要包含完整的协议 (如: https://)
4. **事务回滚**: 如果某行数据导入失败，只有该行会被跳过，其他数据不受影响

## 输出信息

导入过程中会显示详细的进度信息:

```
🔄 处理第2行...
✅ 创建新社团: 示例社团A
✅ 创建新比赛: 全国Cosplay大赛  
✅ 创建新标签: 初音未来 (IP)
✅ 创建新标签: 甜美 (风格)
✅ 创建视频: 示例视频1 (BV1234567890)
✅ 创建新奖项: 全国Cosplay大赛 - 最佳团体奖
✅ 创建获奖记录: 示例视频1 - 最佳团体奖 (2024)

==================================================
📈 导入完成!
✅ 成功: 2 条
```

## 错误处理

如果导入过程中出现错误，会显示具体的错误信息:

```
❌ 第3行错误: 缺少必需字段 (bv_number, title, url)
❌ 第4行错误: BV号已存在: BV1234567890
```

## 目录结构

```
upload_data/
├── generate_template.py    # 生成Excel模板脚本
├── import_data.py         # 数据导入脚本  
├── requirements.txt       # 依赖包列表
├── README.md             # 使用说明
└── templates/            # 生成的模板文件目录
    └── video_import_template.xlsx
```

## 技术说明

- **Django集成**: 脚本直接使用Django ORM，确保与后端数据模型一致
- **事务安全**: 每行数据使用独立事务，避免批量回滚
- **错误容错**: 单行错误不会影响其他数据的导入
- **关联创建**: 智能识别并创建缺失的关联实体

## 数据结构更新说明

### 主要变更 (2024年更新)

1. **UUID主键**: 所有模型现在使用UUID作为主键，替代了之前的自增整数ID
2. **比赛年份模型**: 新增`CompetitionYear`模型，用于管理比赛的年份信息
3. **获奖记录关联**: `AwardRecord`现在通过`CompetitionYear`关联比赛年份，而不是直接使用年份字段

### 更新后的数据模型关系

```
Video (视频) - UUID主键
├── Group (社团) - UUID主键, ForeignKey
├── Competition (比赛) - UUID主键, ForeignKey  
├── Tags (标签) - UUID主键, ManyToMany
└── AwardRecord (获奖记录) - UUID主键
    ├── Award (奖项) - UUID主键, ForeignKey to Competition
    └── CompetitionYear (比赛年份) - UUID主键, ForeignKey to Competition
```

### 兼容性说明
- Excel导入格式保持不变，系统会自动处理UUID生成和CompetitionYear创建
- 现有数据导入脚本已更新以支持新结构
- 所有UUID字段由系统自动生成，无需手动填写

## 常见问题

**Q: 如何处理大量数据？**  
A: 建议分批导入，每批不超过1000条记录

**Q: 导入失败如何处理？**  
A: 检查错误信息，修正Excel数据后重新导入

**Q: 如何更新已存在的数据？**  
A: 目前不支持更新，需要先删除再重新导入

**Q: 支持哪些Excel格式？**  
A: 支持 .xlsx 和 .xls 格式