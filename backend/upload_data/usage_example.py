#!/usr/bin/env python
"""
使用示例脚本
演示如何使用数据导入工具
"""

def show_usage():
    """显示使用说明"""
    print("📚 数据快速导入工具使用示例")
    print("=" * 50)
    
    print("\n1️⃣ 生成Excel模板:")
    print("   python generate_template.py")
    print("   生成文件: templates/video_import_template.xlsx")
    
    print("\n2️⃣ 填写Excel数据:")
    print("   打开生成的Excel文件，在'导入模板'工作表中填写数据")
    print("   参考'示例数据'工作表和'字段说明'工作表")
    
    print("\n3️⃣ 导入数据到数据库:")
    print("   python import_data.py templates/video_import_template.xlsx 示例数据")
    print("   或")
    print("   python import_data.py your_data.xlsx 导入模板")
    
    print("\n📋 必填字段:")
    print("   - bv_number: BV号 (必须唯一)")
    print("   - title: 视频标题")
    print("   - url: 视频链接")
    
    print("\n🔄 自动创建功能:")
    print("   - 不存在的社团将根据group_*字段自动创建")
    print("   - 不存在的比赛将根据competition_*字段自动创建")
    print("   - 不存在的奖项将自动创建")
    print("   - 标签按格式'标签名:分类'自动创建")
    
    print("\n🏷️ 标签格式示例:")
    print("   初音未来:IP,2024:年份,北京:地区")
    
    print("\n📂 文件结构:")
    print("   upload_data/")
    print("   ├── generate_template.py    # 生成模板")
    print("   ├── import_data.py         # 导入数据")
    print("   ├── requirements.txt       # 依赖包")
    print("   ├── README.md             # 详细说明")
    print("   └── templates/            # 模板文件")
    print("       └── video_import_template.xlsx")
    
    print("\n💡 使用提示:")
    print("   - 建议分批导入，每批不超过1000条")
    print("   - 导入前请备份数据库")
    print("   - 检查BV号唯一性避免重复")
    print("   - 日期格式使用 YYYY-MM-DD")

if __name__ == '__main__':
    show_usage() 