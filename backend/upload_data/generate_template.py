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
        'competition_year', # 比赛年份
        
        # 关联实体名称
        'group_name',       # 社团名称
        'competition_name', # 比赛名称
        'tags',            # 标签 (格式: 标签名:分类,标签名:分类)
        
        # 社团扩展信息 (当社团不存在时用于创建)
        'group_description',  # 社团描述
        'group_founded_date', # 成立时间 (格式: YYYY-MM-DD)
        'group_location',     # 所在地
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
        
        # 奖项信息
        'award_name',        # 奖项名称
        'award_year',        # 获奖年份
        'award_description', # 获奖描述
    ]
    
    # 创建示例数据
    example_data = {
        'bv_number': ['BV1234567890', 'BV0987654321'],
        'title': ['示例视频1', '示例视频2'],
        'url': ['https://www.bilibili.com/video/BV1234567890', 'https://www.bilibili.com/video/BV0987654321'],
        'description': ['这是一个示例视频描述', ''],
        'thumbnail': ['https://example.com/thumb1.jpg', ''],
        'competition_year': [2024, 2023],
        'group_name': ['示例社团A', '示例社团B'],
        'competition_name': ['全国Cosplay大赛', 'Anime Expo'],
        'tags': ['初音未来:IP,2024:年份', '东方Project:IP'],
        'group_description': ['这是一个专业的Cosplay社团', ''],
        'group_founded_date': ['2020-01-01', ''],
        'group_location': ['北京', '上海'],
        'group_website': ['https://example-group-a.com', ''],
        'group_email': ['contact@group-a.com', ''],
        'group_phone': ['13800138000', ''],
        'group_weibo': ['https://weibo.com/group-a', ''],
        'group_wechat': ['group_a_wechat', ''],
        'group_qq_group': ['123456789', ''],
        'group_bilibili': ['https://space.bilibili.com/123456', ''],
        'competition_description': ['国内最大的Cosplay比赛', '国际知名动漫展览'],
        'competition_website': ['https://cosplay-competition.com', 'https://anime-expo.com'],
        'award_name': ['最佳团体奖', '最佳个人奖'],
        'award_year': [2024, 2023],
        'award_description': ['获得团体组第一名', '获得个人组金奖'],
    }
    
    # 创建DataFrame
    df = pd.DataFrame(example_data)
    
    # 创建输出目录
    output_dir = 'templates'
    os.makedirs(output_dir, exist_ok=True)
    
    # 生成模板文件
    template_path = os.path.join(output_dir, 'video_import_template.xlsx')
    
    with pd.ExcelWriter(template_path, engine='openpyxl') as writer:
        # 写入示例数据
        df.to_excel(writer, sheet_name='示例数据', index=False)
        
        # 创建空模板
        empty_df = pd.DataFrame(data=None, columns=columns)
        empty_df.to_excel(writer, sheet_name='导入模板', index=False)
        
        # 创建字段说明
        field_descriptions = {
            '字段名': columns,
            '是否必需': [
                '是', '是', '是',  # bv_number, title, url
                '否', '否', '否',  # description, thumbnail, competition_year
                '否', '否', '否',  # group_name, competition_name, tags
                '否', '否', '否', '否', '否', '否', '否', '否', '否', '否',  # group扩展字段
                '否', '否',  # competition扩展字段
                '否', '否', '否'   # award字段
            ],
            '说明': [
                'B站视频BV号，必须唯一',
                '视频标题',
                '视频链接',
                '视频描述',
                '缩略图链接',
                '比赛年份',
                '所属社团名称，不存在则自动创建',
                '所属比赛名称，不存在则自动创建',
                '标签，格式：标签名:分类,标签名:分类',
                '社团描述(新建社团时使用)',
                '社团成立时间，格式：YYYY-MM-DD',
                '社团所在地',
                '社团官网',
                '社团邮箱',
                '社团电话',
                '社团微博链接',
                '社团微信号',
                '社团QQ群',
                '社团B站链接',
                '比赛描述(新建比赛时使用)',
                '比赛官网',
                '奖项名称，不存在则自动创建',
                '获奖年份',
                '获奖描述'
            ]
        }
        
        desc_df = pd.DataFrame(field_descriptions)
        desc_df.to_excel(writer, sheet_name='字段说明', index=False)
    
    print(f"✅ Excel模板已生成: {template_path}")
    print("\n📋 模板包含以下工作表:")
    print("  - 示例数据: 包含两行示例数据")
    print("  - 导入模板: 空白模板，用于填写数据")
    print("  - 字段说明: 详细的字段说明文档")
    
    return template_path

if __name__ == '__main__':
    generate_template() 