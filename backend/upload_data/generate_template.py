#!/usr/bin/env python
"""
生成Excel数据导入模板
"""
import pandas as pd
import os
import sys

# 添加Django项目路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def generate_template():
    """生成Excel模板文件"""
    
    # 定义模板列
    columns = [
        # 视频基本信息 (必需字段)
        'bv_number',  # BV号 (必需，唯一)
        'title',      # 标题 (必需)
        'url',        # 视频链接 (必需)
        
        # 视频扩展信息
        'description',     # 描述
        'thumbnail',       # 缩略图链接
        'year',           # 视频年份
        
        # 关联实体名称
        'group_name',       # 社团名称
        'competition_name', # 比赛名称
        'tags',            # 标签 (格式: 标签名:分类,标签名:分类，分类仅支持：IP、风格、其他)
        
        # 社团扩展信息 (当社团不存在时用于创建)
        'group_description',  # 社团描述
        'group_founded_date', # 成立时间 (格式: YYYY-MM-DD)
        'group_province',     # 省份
        'group_city',        # 城市
        'group_location',     # 详细地址
        'group_website',      # 官方网站
        'group_email',        # 联系邮箱
        'group_phone',        # 联系电话
        'group_weibo',        # 微博链接
        'group_wechat',       # 微信号
        'group_qq_group',     # QQ群
        'group_bilibili',     # B站链接
        
        # 比赛扩展信息 (当比赛不存在时用于创建)
        'competition_description', # 比赛描述
        'competition_website',     # 比赛官网
        
        # 奖项信息（支持多个奖项，用逗号分隔）
        'award_names',        # 奖项名称（多个用逗号分隔）
        'award_years',        # 获奖年份（多个用逗号分隔）
        'award_descriptions', # 获奖描述（多个用逗号分隔）
    ]
    
    # 创建示例数据
    example_data = {
        'bv_number': ['BV1234567890', 'BV0987654321'],
        'title': ['示例视频1', '示例视频2'],
        'url': ['https://www.bilibili.com/video/BV1234567890', 'https://www.bilibili.com/video/BV0987654321'],
        'description': ['这是一个示例视频描述', ''],
        'thumbnail': ['https://example.com/thumb1.jpg', ''],
        'year': [2024, 2023],
        'group_name': ['示例社团A', '示例社团B'],
        'competition_name': ['全国Cosplay大赛', 'Anime Expo'],
        'tags': ['初音未来:IP,甜美:风格', '东方Project:IP,古风:风格'],
        'group_description': ['这是一个专业的Cosplay社团', ''],
        'group_founded_date': ['2020-01-01', ''],
        'group_province': ['北京市', '上海市'],
        'group_city': ['北京市', '上海市'],
        'group_location': ['朝阳区CBD', '浦东新区'],
        'group_website': ['https://example-group-a.com', ''],
        'group_email': ['contact@group-a.com', ''],
        'group_phone': ['13800138000', ''],
        'group_weibo': ['https://weibo.com/group-a', ''],
        'group_wechat': ['group_a_wechat', ''],
        'group_qq_group': ['123456789', ''],
        'group_bilibili': ['https://space.bilibili.com/123456', ''],
        'competition_description': ['国内最大的Cosplay比赛', '国际知名动漫展览'],
        'competition_website': ['https://cosplay-competition.com', 'https://anime-expo.com'],
        'award_names': ['最佳团体奖,最佳创意奖,观众选择奖', '最佳个人奖'],
        'award_years': ['2024,2024,2024', '2023'],
        'award_descriptions': ['获得团体组第一名,创意设计优秀,观众投票最高', '获得个人组金奖'],
    }
    
    # 创建DataFrame
    df = pd.DataFrame(example_data)
    
    # 创建输出目录
    output_dir = 'templates'
    os.makedirs(output_dir, exist_ok=True)
    
    # 生成模板文件
    template_path = os.path.join(output_dir, 'video_import_template.xlsx')
    
    with pd.ExcelWriter(template_path, engine='openpyxl') as writer:
        # 写入示例数据（作为导入模板使用）
        df.to_excel(writer, sheet_name='示例数据', index=False)
        
        # 创建字段说明
        field_descriptions = {
            '字段名': columns,
            '是否必需': [
                '是', '是', '是',  # bv_number, title, url
                '否', '否', '否',  # description, thumbnail, year
                '否', '否', '否',  # group_name, competition_name, tags
                '否', '否', '否', '否', '否', '否', '否', '否', '否', '否', '否', '否',  # group扩展字段
                '否', '否',  # competition扩展字段
                '否', '否', '否'   # award字段（支持多个）
            ],
            '说明': [
                'B站视频BV号，必须唯一',
                '视频标题',
                '视频链接',
                '视频描述',
                '缩略图链接',
                '视频年份',
                '所属社团名称，不存在则自动创建',
                '所属比赛名称，不存在则自动创建',
                '标签，格式：标签名:分类,标签名:分类，分类仅支持：IP、风格、其他',
                '社团描述(新建社团时使用)',
                '社团成立时间，格式：YYYY-MM-DD',
                '社团所在省份',
                '社团所在城市',
                '社团详细地址',
                '社团官网',
                '社团邮箱',
                '社团电话',
                '社团微博链接',
                '社团微信号',
                '社团QQ群',
                '社团B站链接',
                '比赛描述(新建比赛时使用)',
                '比赛官网',
                '奖项名称，多个奖项用逗号分隔，不存在则自动创建',
                '获奖年份，多个年份用逗号分隔，需与奖项数量对应',
                '获奖描述，多个描述用逗号分隔，需与奖项数量对应'
            ]
        }
        
        desc_df = pd.DataFrame(field_descriptions)
        desc_df.to_excel(writer, sheet_name='字段说明', index=False)
    
    print(f"✅ Excel模板已生成: {template_path}")
    print("\n📋 模板包含以下工作表:")
    print("  - 示例数据: 包含多奖项示例数据，可直接修改使用")
    print("  - 字段说明: 详细的字段说明文档")
    print("\n💡 导入说明:")
    print("  - 系统会自动使用第一个工作表（示例数据）进行导入")
    print("  - 支持一个视频设置多个奖项，用逗号分隔")
    print("  - 奖项名称、年份、描述的数量必须对应")
    
    return template_path

if __name__ == '__main__':
    generate_template()