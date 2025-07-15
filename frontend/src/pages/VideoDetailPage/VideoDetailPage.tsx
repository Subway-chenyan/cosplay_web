import React from 'react';
import { Typography } from 'antd';

const { Title } = Typography;

const VideoDetailPage: React.FC = () => {
  return (
    <div>
      <Title level={2}>视频详情页面</Title>
      <p>这里将显示单个视频的详细信息和B站播放器</p>
    </div>
  );
};

export default VideoDetailPage; 