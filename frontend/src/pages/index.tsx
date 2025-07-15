// 页面组件占位符

import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

// 创建通用占位符组件
const createPlaceholder = (title: string, description: string) => {
  const Component: React.FC = () => (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <Title level={2}>{title}</Title>
      <p style={{ color: '#b3b3b3', fontSize: '16px' }}>{description}</p>
    </div>
  );
  return Component;
};

// 导出所有页面组件
export const GroupDetailPage = createPlaceholder(
  '社团详情页面', 
  '这里将显示社团的详细信息、作品和获奖记录'
);

// 导入实际的比赛页面组件
export { default as CompetitionListPage } from './CompetitionListPage/CompetitionListPage';
export { default as CompetitionDetailPage } from './CompetitionDetailPage/CompetitionDetailPage';

export const PerformanceListPage = createPlaceholder(
  '剧目列表页面', 
  '这里将显示所有cosplay剧目信息'
);

export const PerformanceDetailPage = createPlaceholder(
  '剧目详情页面', 
  '这里将显示剧目的详细信息和相关视频'
);

export const SearchResultsPage = createPlaceholder(
  '搜索结果页面', 
  '这里将显示搜索结果，支持多维度筛选'
); 