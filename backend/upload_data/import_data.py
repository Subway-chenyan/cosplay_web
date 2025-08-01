#!/usr/bin/env python
"""
数据导入脚本
从Excel文件导入视频数据到数据库
"""
import os
import sys
import pandas as pd
from datetime import datetime

# 添加Django项目路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 配置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cosplay_api.settings')

try:
    import django
    from django.db import transaction
    django.setup()
    
    from apps.videos.models import Video
    from apps.groups.models import Group
    from apps.competitions.models import Competition
    from apps.awards.models import Award, AwardRecord
    from apps.tags.models import Tag, VideoTag
except ImportError:
    # 如果在非Django环境下运行，这些导入会在实际运行时解决
    pass


class DataImporter:
    """数据导入器"""
    
    def __init__(self):
        self.success_count = 0
        self.error_count = 0
        self.errors = []
    
    def log_error(self, row_num, error_msg):
        """记录错误"""
        self.error_count += 1
        self.errors.append(f"第{row_num}行: {error_msg}")
        print(f"❌ 第{row_num}行错误: {error_msg}")
    
    def get_or_create_group(self, row, group_name):
        """获取或创建社团"""
        if not group_name:
            return None
            
        try:
            # 从地区字段中提取省份和城市
            location = row.get('group_location', '')
            province = row.get('group_province', '')
            city = row.get('group_city', '')
            
            # 如果没有提供省份和城市，尝试从location中提取
            if location and not (province and city):
                # 简单的分割逻辑，假设格式为"省份 城市 详细地址"
                parts = location.split()
                if len(parts) >= 2:
                    if not province:
                        province = parts[0]
                    if not city:
                        city = parts[1]
            
            group, created = Group.objects.get_or_create(
                name=group_name,
                defaults={
                    'description': row.get('group_description', ''),
                    'founded_date': self.parse_date(row.get('group_founded_date')),
                    'province': province,
                    'city': city,
                    'location': location,
                    'website': row.get('group_website', ''),
                    'email': row.get('group_email', ''),
                    'phone': row.get('group_phone', ''),
                    'weibo': row.get('group_weibo', ''),
                    'wechat': row.get('group_wechat', ''),
                    'qq_group': row.get('group_qq_group', ''),
                    'bilibili': row.get('group_bilibili', ''),
                }
            )
            
            if created:
                print(f"✅ 创建新社团: {group_name}")
            
            return group
            
        except Exception as e:
            print(f"❌ 创建社团失败: {e}")
            return None
    
    def get_or_create_competition(self, row, competition_name):
        """获取或创建比赛"""
        if not competition_name:
            return None
            
        try:
            competition, created = Competition.objects.get_or_create(
                name=competition_name,
                defaults={
                    'description': row.get('competition_description', ''),
                    'website': row.get('competition_website', ''),
                }
            )
            
            if created:
                print(f"✅ 创建新比赛: {competition_name}")
            
            return competition
            
        except Exception as e:
            print(f"❌ 创建比赛失败: {e}")
            return None
    
    def get_or_create_award(self, competition, award_name):
        """获取或创建奖项"""
        if not award_name or not competition:
            return None
            
        try:
            award, created = Award.objects.get_or_create(
                name=award_name,
                competition=competition
            )
            
            if created:
                print(f"✅ 创建新奖项: {competition.name} - {award_name}")
            
            return award
            
        except Exception as e:
            print(f"❌ 创建奖项失败: {e}")
            return None
    
    def create_tags(self, video, tags_str):
        """创建标签关联"""
        if not tags_str:
            return
            
        try:
            # 解析标签字符串: "标签名:分类,标签名:分类"
            tag_items = [item.strip() for item in str(tags_str).split(',') if item.strip()]
            
            # 允许的标签分类
            allowed_categories = ['IP', '风格', '其他']
            
            for tag_item in tag_items:
                if ':' in tag_item:
                    tag_name, tag_category = tag_item.split(':', 1)
                    tag_name = tag_name.strip()
                    tag_category = tag_category.strip()
                    
                    # 验证标签分类
                    if tag_category not in allowed_categories:
                        print(f"⚠️ 跳过无效标签分类: {tag_category}，仅支持: {', '.join(allowed_categories)}")
                        continue
                else:
                    tag_name = tag_item.strip()
                    tag_category = '其他'
                
                if tag_name:
                    # 获取或创建标签
                    tag, created = Tag.objects.get_or_create(
                        name=tag_name,
                        category=tag_category,
                        defaults={'description': f'自动创建的{tag_category}标签'}
                    )
                    
                    if created:
                        print(f"✅ 创建新标签: {tag_name} ({tag_category})")
                    
                    # 创建视频标签关联
                    VideoTag.objects.get_or_create(video=video, tag=tag)
                    
        except Exception as e:
            print(f"❌ 创建标签失败: {e}")
    
    def create_multiple_awards(self, video, competition, row):
        """创建多个奖项和获奖记录"""
        if not competition:
            return
            
        award_names_str = row.get('award_names', '')
        award_years_str = row.get('award_years', '')
        award_descriptions_str = row.get('award_descriptions', '')
        
        # 如果没有奖项信息，尝试旧格式
        if not award_names_str:
            award_names_str = row.get('award_name', '')
            award_years_str = row.get('award_year', '')
            award_descriptions_str = row.get('award_description', '')
        
        if not award_names_str:
            return
            
        try:
            # 解析多个奖项（用逗号分隔）
            award_names = [name.strip() for name in str(award_names_str).split(',') if name.strip()]
            award_years = [year.strip() for year in str(award_years_str).split(',') if year.strip()] if award_years_str else []
            award_descriptions = [desc.strip() for desc in str(award_descriptions_str).split(',') if desc.strip()] if award_descriptions_str else []
            
            print(f"🏆 处理奖项: {len(award_names)}个奖项")
            print(f"   奖项名称: {award_names}")
            print(f"   年份数量: {len(award_years)}, 内容: {award_years}")
            print(f"   描述数量: {len(award_descriptions)}")
            
            # 确保年份和描述数量与奖项数量匹配
            while len(award_years) < len(award_names):
                award_years.append('')
            while len(award_descriptions) < len(award_names):
                award_descriptions.append('')
            
            # 为每个奖项创建记录
            for i, award_name in enumerate(award_names):
                if award_name:
                    print(f"   正在处理奖项 {i+1}: {award_name}")
                    award = self.get_or_create_award(competition, award_name)
                    if award:
                        award_year = award_years[i] if i < len(award_years) else ''
                        award_description = award_descriptions[i] if i < len(award_descriptions) else ''
                        
                        self.create_award_record(video, award, award_year, award_description)
                    else:
                        print(f"❌ 无法创建奖项: {award_name}")
                    
        except Exception as e:
            print(f"❌ 创建多个奖项失败: {e}")
            import traceback
            print(f"详细错误: {traceback.format_exc()}")

    def create_award_record(self, video, award, award_year, award_description):
        """创建获奖记录"""
        if not award:
            return
            
        try:
            # 处理年份：如果没有提供年份，使用视频的比赛年份或当前年份
            year = None
            if award_year and str(award_year).strip():
                try:
                    year = int(str(award_year).strip())
                except ValueError:
                    print(f"⚠️ 无效的年份格式: {award_year}，使用默认年份")
            
            # 如果还是没有有效年份，使用默认年份
            if year is None:
                if video.year:
                    year = video.year
                else:
                    from datetime import datetime
                    year = datetime.now().year
                print(f"💡 使用默认年份: {year}")
            
            award_record, created = AwardRecord.objects.get_or_create(
                award=award,
                video=video,
                year=year,
                defaults={
                    'description': award_description or '',
                    'group': video.group
                }
            )
            
            if created:
                print(f"✅ 创建获奖记录: {video.title} - {award.name} ({year})")
            else:
                print(f"ℹ️ 获奖记录已存在: {video.title} - {award.name} ({year})")
                
        except Exception as e:
            print(f"❌ 创建获奖记录失败: {e}")
            import traceback
            print(f"详细错误: {traceback.format_exc()}")
    
    def parse_date(self, date_str):
        """解析日期字符串"""
        if not date_str or pd.isna(date_str):
            return None
            
        try:
            if isinstance(date_str, str):
                return datetime.strptime(date_str, '%Y-%m-%d').date()
            return date_str
        except:
            return None
    
    def clean_value(self, value):
        """清理数据值"""
        if pd.isna(value):
            return ''
        return str(value).strip()
    
    @transaction.atomic
    def import_row(self, row_num, row):
        """导入单行数据"""
        try:
            # 清理数据
            row = {k: self.clean_value(v) for k, v in row.items()}
            
            # 检查必需字段
            bv_number = row.get('bv_number')
            title = row.get('title')
            url = row.get('url')
            
            if not bv_number or not title or not url:
                self.log_error(row_num, "缺少必需字段 (bv_number, title, url)")
                return False
            
            # 检查BV号是否已存在
            if Video.objects.filter(bv_number=bv_number).exists():
                self.log_error(row_num, f"BV号已存在: {bv_number}")
                return False
            
            # 创建关联实体
            group = self.get_or_create_group(row, row.get('group_name'))
            competition = self.get_or_create_competition(row, row.get('competition_name'))
            
            # 创建视频
            video = Video.objects.create(
                bv_number=bv_number,
                title=title,
                description=row.get('description', ''),
                url=url,
                thumbnail=row.get('thumbnail', ''),
                group=group,
                competition=competition,
                year=int(row['year']) if row.get('year') else None
            )
            
            print(f"✅ 创建视频: {title} ({bv_number})")
            
            # 创建标签关联
            self.create_tags(video, row.get('tags'))
            
            # 创建奖项和获奖记录（支持多个奖项）
            self.create_multiple_awards(video, competition, row)
            
            self.success_count += 1
            return True
            
        except Exception as e:
            self.log_error(row_num, f"处理数据时发生错误: {str(e)}")
            return False
    
    def import_from_excel(self, file_path, sheet_name=None):
        """从Excel文件导入数据"""
        try:
            print(f"📖 开始读取Excel文件: {file_path}")
            
            # 读取Excel文件
            if sheet_name:
                df = pd.read_excel(file_path, sheet_name=sheet_name)
            else:
                # 自动选择第一个数据工作表
                xl = pd.ExcelFile(file_path)
                sheet_name = xl.sheet_names[0]
                df = pd.read_excel(file_path, sheet_name=sheet_name)
            
            print(f"📋 使用工作表: {sheet_name}")
            print(f"📊 共找到 {len(df)} 行数据")
            
            # 导入数据
            for index, row in df.iterrows():
                row_num = index + 2  # Excel行号 (从第2行开始)
                print(f"\n🔄 处理第{row_num}行...")
                self.import_row(row_num, row)
            
            # 输出结果
            print(f"\n{'='*50}")
            print(f"📈 导入完成!")
            print(f"✅ 成功: {self.success_count} 条")
            print(f"❌ 失败: {self.error_count} 条")
            
            if self.errors:
                print(f"\n💥 错误详情:")
                for error in self.errors:
                    print(f"  {error}")
            
        except Exception as e:
            print(f"❌ 读取Excel文件失败: {e}")


def main():
    """主函数"""
    if len(sys.argv) < 2:
        print("使用方法: python import_data.py <excel_file_path> [sheet_name]")
        print("示例: python import_data.py data.xlsx")
        print("示例: python import_data.py data.xlsx 导入模板")
        return
    
    file_path = sys.argv[1]
    sheet_name = sys.argv[2] if len(sys.argv) > 2 else None
    
    if not os.path.exists(file_path):
        print(f"❌ 文件不存在: {file_path}")
        return
    
    importer = DataImporter()
    importer.import_from_excel(file_path, sheet_name)


if __name__ == '__main__':
    main()