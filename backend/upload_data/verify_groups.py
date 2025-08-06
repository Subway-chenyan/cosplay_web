#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import pandas as pd

# 读取生成的Excel文件
df = pd.read_excel('chinajoy_videos_import.xlsx')

# 查找特定社团
test_groups = df[df['group_name'].isin(['鉴茶院叁处', '九重天ACG协会'])]

print('=== 验证特定社团解析结果 ===')
print(f'找到的测试社团数量: {len(test_groups)}')
print()

for _, row in test_groups.iterrows():
    print(f'社团: {row["group_name"]}')
    print(f'标题: {row["title"]}')
    print(f'年份: {row["year"]}')
    print(f'比赛: {row["competition_name"]}')
    print('-' * 50)

# 显示所有包含"鉴茶院"的社团
print('\n=== 所有包含"鉴茶院"的社团 ===')
jiancha_groups = df[df['group_name'].str.contains('鉴茶院', na=False)]
for group_name in jiancha_groups['group_name'].unique():
    count = len(jiancha_groups[jiancha_groups['group_name'] == group_name])
    print(f'{group_name}: {count}个视频')

print('\n验证完成！')