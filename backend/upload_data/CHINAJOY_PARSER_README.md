# ChinaJoy视频解析脚本使用说明

## 功能概述

`parse_chinajoy_videos.py` 脚本用于将B站爬取的CSV视频数据转换为后端可导入的Excel格式，专门处理ChinaJoy Cosplay相关视频。

## 主要功能

1. **智能筛选**: 自动筛选包含"ChinaJoy"和"Cosplay"关键词的视频
2. **标题解析**: 从视频标题中提取以下信息：
   - 社团名称
   - 剧名/表演名称
   - 比赛名称
   - 年份
   - 赛区信息
   - 团体类型（大团体/小团体）

3. **数据增强**: 
   - 自动生成标签（IP类型、比赛类型、团体类型）
   - 提取省市信息
   - 生成完整的视频URL

4. **输出格式**: 生成符合后端导入模板的Excel文件

## 支持的标题格式

脚本能够解析以下格式的视频标题：

- `【上海赛区】八十一禁动漫社--永远的任天堂2 玩家之心（2025ChinaJoy Cosplay超级联赛总决赛）`
- `2025 ChinaJoy Cosplay超级联赛 北京赛区晋级赛`
- `2024ChinaJoy Cosplay超级联赛总决赛 【东北赛区】RPG零式--海贼王`
- `2023万达广场XChinaJoy Cosplay超级联赛总决赛`
- `2023万达广场×ChinaJoy Cosplay超级联赛北京赛区晋级赛`
- `2021.5.16ChinaJoy Cosplay超级联赛北京赛区晋级赛第二天`

## 使用方法

### 1. 安装依赖
```bash
pip install pandas openpyxl
```

### 2. 运行脚本
```bash
python3 parse_chinajoy_videos.py
```

### 3. 输出文件
- `chinajoy_videos_import.xlsx`: 可直接导入后端的Excel文件
- 控制台输出: 详细的解析统计报告

## 输出字段说明

生成的Excel文件包含以下字段：

| 字段名 | 说明 | 示例 |
|--------|------|------|
| bv_number | B站视频BV号 | BV1GGt5zUEAH |
| title | 视频标题 | 【上海赛区】八十一禁动漫社--永远的任天堂2... |
| url | 视频链接 | https://www.bilibili.com/video/BV1GGt5zUEAH |
| description | 视频描述 | 同标题 |
| thumbnail | 封面图片URL | http://i2.hdslb.com/bfs/archive/... |
| year | 比赛年份 | 2025 |
| group_name | 社团名称 | 八十一禁动漫社 |
| competition_name | 比赛名称 | ChinaJoy Cosplay超级联赛 |
| performance_name | 剧名/表演名称 | 永远的任天堂2 玩家之心 |
| tags | 自动生成标签 | 任天堂游戏:IP,ChinaJoy:其他,大团体:其他 |
| group_province | 社团省份 | 上海市 |
| group_city | 社团城市 | 上海市 |
| region | 赛区信息 | 上海赛区 |
| is_small_group | 是否小团体 | false |

## 解析统计

最新解析结果（基于385条原始数据）：
- **总筛选视频**: 105条ChinaJoy相关视频
- **年份覆盖**: 2019-2025年
- **社团数量**: 30个不同社团
- **解析成功率**: 100%（所有视频都成功解析出年份）

### 年份分布
- 2019年: 1个视频
- 2021年: 5个视频  
- 2023年: 37个视频
- 2024年: 31个视频
- 2025年: 31个视频

### 比赛类型
- ChinaJoy Cosplay超级联赛: 102个视频
- 其他相关比赛: 3个视频

## 文件结构

```
/home/ubuntu/cosplay_web/backend/upload_data/
├── parse_chinajoy_videos.py          # 主解析脚本
├── chinajoy_videos_import.xlsx       # 输出的Excel文件
├── check_results.py                  # 结果检查脚本
└── CHINAJOY_PARSER_README.md         # 本说明文档
```

## 注意事项

1. 脚本会自动覆盖已存在的输出文件
2. 确保CSV源文件路径正确
3. 如需修改输出路径，请编辑脚本中的相关配置
4. 脚本支持增量更新，可重复运行

## 技术特点

- **智能正则匹配**: 支持多种标题格式
- **容错处理**: 对解析失败的记录有完善的错误处理
- **数据验证**: 自动验证解析结果的完整性
- **性能优化**: 高效的数据处理和内存使用

---

*最后更新: 2024年12月*