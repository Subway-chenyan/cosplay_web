import React from 'react';
import { Card, Typography, Space, Tag, Button, Tooltip } from 'antd';
import { PlayCircleOutlined, EyeOutlined, HeartOutlined, StarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Video } from '../../types/video';
import './VideoCard.css';

const { Text, Title } = Typography;
const { Meta } = Card;

interface VideoCardProps {
  video: Video;
  showDescription?: boolean;
  size?: 'small' | 'default' | 'large';
}

const VideoCard: React.FC<VideoCardProps> = ({ 
  video, 
  showDescription = false, 
  size = 'default' 
}) => {
  const navigate = useNavigate();

  const handleCardClick = () => {
    navigate(`/videos/${video.id}`);
  };

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/videos/${video.id}?autoplay=true`);
  };

  const formatDuration = (duration?: number): string => {
    if (!duration) return '';
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatViewCount = (count: number): string => {
    if (count >= 10000) {
      return `${(count / 10000).toFixed(1)}万`;
    }
    return count.toLocaleString();
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays}天前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}周前`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}个月前`;
    return `${Math.floor(diffDays / 365)}年前`;
  };

  return (
    <Card
      className={`video-card video-card-${size}`}
      hoverable
      onClick={handleCardClick}
      cover={
        <div className="video-thumbnail">
          <img
            src={video.thumbnail || '/default-thumbnail.jpg'}
            alt={video.title}
            className="thumbnail-image"
          />
          <div className="thumbnail-overlay">
            <Button
              type="primary"
              shape="circle"
              size="large"
              icon={<PlayCircleOutlined />}
              className="play-button"
              onClick={handlePlayClick}
            />
          </div>
          <div className="video-duration">
            {formatDuration(0)} {/* TODO: 添加时长字段 */}
          </div>
          <div className="video-quality">
            HD
          </div>
        </div>
      }
      actions={size !== 'small' ? [
        <Tooltip title="观看次数">
          <Space>
            <EyeOutlined />
            <Text>{formatViewCount(video.view_count)}</Text>
          </Space>
        </Tooltip>,
        <Tooltip title="收藏">
          <HeartOutlined />
        </Tooltip>,
        <Tooltip title="评分">
          <Space>
            <StarOutlined />
            <Text>8.5</Text> {/* TODO: 添加评分字段 */}
          </Space>
        </Tooltip>,
      ] : undefined}
    >
      <Meta
        title={
          <Tooltip title={video.title}>
            <Title level={5} className="video-title" ellipsis={{ rows: 2 }}>
              {video.title}
            </Title>
          </Tooltip>
        }
        description={
          <div className="video-meta">
            {showDescription && video.description && (
              <Text type="secondary" className="video-description" ellipsis={{ rows: 2 }}>
                {video.description}
              </Text>
            )}
            
            <div className="video-info">
              <Space size="small" wrap>
                <Text type="secondary" className="upload-date">
                  {formatDate(video.upload_date)}
                </Text>
                {video.performance_date && (
                  <Text type="secondary" className="performance-date">
                    演出: {formatDate(video.performance_date)}
                  </Text>
                )}
              </Space>
            </div>

            {/* 标签 */}
            <div className="video-tags">
              <Tag color="red" size="small">原神</Tag>
              <Tag color="blue" size="small">2023年</Tag>
              <Tag color="green" size="small">舞台剧</Tag>
            </div>
          </div>
        }
      />
    </Card>
  );
};

export default VideoCard; 