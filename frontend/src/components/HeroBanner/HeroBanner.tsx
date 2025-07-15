import React from 'react';
import { Carousel, Button, Typography, Space, Tag, Skeleton } from 'antd';
import { PlayCircleOutlined, EyeOutlined, CalendarOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useGetVideosQuery } from '../../services/videosApi';
import './HeroBanner.css';

const { Title, Text } = Typography;

const HeroBanner: React.FC = () => {
  const navigate = useNavigate();
  // 获取前几个视频作为精选视频
  const { data: videosResponse, isLoading } = useGetVideosQuery({
    ordering: '-view_count',
    page_size: 5
  });

  const handleWatchNow = (videoId: number) => {
    navigate(`/videos/${videoId}?autoplay=true`);
  };

  const handleViewDetails = (videoId: number) => {
    navigate(`/videos/${videoId}`);
  };

  const formatViewCount = (count: number): string => {
    if (count >= 10000) {
      return `${(count / 10000).toFixed(1)}万`;
    }
    return count.toLocaleString();
  };

  if (isLoading || !videosResponse?.results?.length) {
    return (
      <div className="hero-banner">
        <div className="hero-skeleton">
          <Skeleton.Image style={{ width: '100%', height: '100%' }} />
          <div className="hero-content-skeleton">
            <Skeleton active paragraph={{ rows: 4 }} />
          </div>
        </div>
      </div>
    );
  }

  const bannerVideos = videosResponse.results.slice(0, 5); // 取前5个作为轮播

  return (
    <div className="hero-banner">
      <Carousel
        autoplay
        autoplaySpeed={5000}
        dots={{ className: 'hero-dots' }}
        effect="fade"
        className="hero-carousel"
      >
        {bannerVideos.map((video) => (
          <div key={video.id} className="hero-slide">
            <div className="hero-background">
              <img
                src={video.thumbnail || '/default-banner.jpg'}
                alt={video.title}
                className="hero-image"
              />
              <div className="hero-overlay" />
              <div className="hero-gradient" />
            </div>
            
            <div className="hero-content">
              <div className="hero-info">
                <div className="hero-badges">
                  <Tag color="red" className="hero-tag">精选推荐</Tag>
                  <Tag color="gold" className="hero-tag">热门</Tag>
                </div>
                
                <Title level={1} className="hero-title">
                  {video.title}
                </Title>
                
                <div className="hero-meta">
                  <Space size="large" wrap>
                    <Space>
                      <EyeOutlined />
                      <Text className="hero-meta-text">
                        {formatViewCount(video.view_count)} 次观看
                      </Text>
                    </Space>
                    
                    {video.upload_date && (
                      <Space>
                        <CalendarOutlined />
                        <Text className="hero-meta-text">
                          {new Date(video.upload_date).getFullYear()}年
                        </Text>
                      </Space>
                    )}
                    
                    <Space>
                      <TeamOutlined />
                      <Text className="hero-meta-text">
                        舞台剧表演
                      </Text>
                    </Space>
                  </Space>
                </div>
                
                {video.description && (
                  <Text className="hero-description">
                    {video.description.length > 150 
                      ? `${video.description.substring(0, 150)}...`
                      : video.description
                    }
                  </Text>
                )}
                
                <div className="hero-tags">
                  <Tag color="blue">原神</Tag>
                  <Tag color="purple">2023年</Tag>
                  <Tag color="green">舞台剧</Tag>
                  <Tag color="orange">获奖作品</Tag>
                </div>
                
                <div className="hero-actions">
                  <Button
                    type="primary"
                    size="large"
                    icon={<PlayCircleOutlined />}
                    className="hero-play-btn"
                    onClick={() => handleWatchNow(video.id)}
                  >
                    立即观看
                  </Button>
                  
                  <Button
                    size="large"
                    ghost
                    className="hero-detail-btn"
                    onClick={() => handleViewDetails(video.id)}
                  >
                    查看详情
                  </Button>
                </div>
              </div>
              
              <div className="hero-preview">
                <div className="hero-preview-card">
                  <img
                    src={video.thumbnail || '/default-thumbnail.jpg'}
                    alt={video.title}
                    className="hero-preview-image"
                  />
                  <div className="hero-preview-overlay">
                    <PlayCircleOutlined className="hero-preview-play" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </Carousel>
      
      {/* 快速导航 */}
      <div className="hero-nav">
        <div className="hero-nav-item" onClick={() => navigate('/videos')}>
          <div className="hero-nav-icon">🎬</div>
          <Text className="hero-nav-text">全部视频</Text>
        </div>
        
        <div className="hero-nav-item" onClick={() => navigate('/videos?category=游戏IP')}>
          <div className="hero-nav-icon">🎮</div>
          <Text className="hero-nav-text">游戏IP</Text>
        </div>
        
        <div className="hero-nav-item" onClick={() => navigate('/groups')}>
          <div className="hero-nav-icon">👥</div>
          <Text className="hero-nav-text">知名社团</Text>
        </div>
        
        <div className="hero-nav-item" onClick={() => navigate('/competitions')}>
          <div className="hero-nav-icon">🏆</div>
          <Text className="hero-nav-text">精彩比赛</Text>
        </div>
      </div>
    </div>
  );
};

export default HeroBanner; 