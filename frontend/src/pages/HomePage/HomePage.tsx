import React, { useState } from 'react';
import { Row, Col, Typography, Card, Button, Tag, Space, Skeleton, Input, Select, Empty } from 'antd';
import { PlayCircleOutlined, FireOutlined, StarOutlined, EyeOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useGetVideosQuery } from '../../services/videosApi';
import { useGetTagsQuery } from '../../services/tagsApi';
import VideoCard from '../../components/VideoCard/VideoCard';
import HeroBanner from '../../components/HeroBanner/HeroBanner';
import './HomePage.css';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [orderBy, setOrderBy] = useState('-view_count');
  
  // API调用
  const { data: videosResponse, isLoading: videosLoading, error: videosError } = useGetVideosQuery({
    search: searchTerm,
    tags: selectedTags,
    ordering: orderBy,
    page_size: 12
  });
  
  // 获取热门视频（使用相同的API，但是不同参数）
  const { data: trendingResponse, isLoading: trendingLoading } = useGetVideosQuery({
    ordering: '-view_count',
    page_size: 6
  });
  
  const { data: tagsResponse, isLoading: tagsLoading } = useGetTagsQuery({
    page_size: 20
  });

  const videos = videosResponse?.results || [];
  const trendingVideos = trendingResponse?.results || [];
  const tags = tagsResponse?.results || [];

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const handleTagSelect = (tagIds: number[]) => {
    setSelectedTags(tagIds);
  };

  const handleTagClick = (tagId: number, tagName: string) => {
    setSelectedTags([tagId]);
  };

  const handleViewMore = (path: string) => {
    navigate(path);
  };

  return (
    <div className="homepage">
      {/* 英雄横幅区域 */}
      <HeroBanner />

      {/* 搜索和筛选区域 */}
      <section className="search-section">
        <div className="search-container">
          <div className="search-bar">
            <Search
              placeholder="搜索cosplay舞台剧视频..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleSearch}
              style={{ width: '100%' }}
            />
          </div>
          
          <div className="filter-bar">
            <Space wrap>
              <Select
                mode="multiple"
                placeholder="选择标签"
                style={{ minWidth: 200 }}
                value={selectedTags}
                onChange={handleTagSelect}
                allowClear
                loading={tagsLoading}
              >
                {tags.map(tag => (
                  <Option key={tag.id} value={tag.id}>
                    {tag.name} {tag.category && `(${tag.category})`}
                  </Option>
                ))}
              </Select>
              
              <Select
                placeholder="排序方式"
                style={{ width: 150 }}
                value={orderBy}
                onChange={setOrderBy}
              >
                <Option value="-view_count">观看量最高</Option>
                <Option value="-created_at">最新上传</Option>
                <Option value="-performance_date">最新演出</Option>
                <Option value="title">按标题排序</Option>
              </Select>
            </Space>
          </div>
        </div>
      </section>

      {/* 视频展示区域 */}
      <section className="videos-section">
        <div className="section-header">
          <Title level={2} className="section-title">
            <FireOutlined className="section-icon" />
            {searchTerm || selectedTags.length > 0 ? '搜索结果' : '热门舞台剧'}
          </Title>
          {videosResponse?.count && (
            <Text type="secondary">共找到 {videosResponse.count} 个视频</Text>
          )}
        </div>

        {videosError ? (
          <div className="error-section">
            <Empty
              description="加载失败，请重试"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          <Row gutter={[16, 16]}>
            {videosLoading ? (
              Array.from({ length: 12 }).map((_, index) => (
                <Col key={index} xs={12} sm={8} md={6} lg={4} xl={3}>
                  <Card
                    cover={<Skeleton.Image style={{ width: '100%', height: 200 }} />}
                    className="video-card-skeleton"
                  >
                    <Skeleton active paragraph={{ rows: 2 }} />
                  </Card>
                </Col>
              ))
            ) : videos.length > 0 ? (
              videos.map((video) => (
                <Col key={video.id} xs={12} sm={8} md={6} lg={4} xl={3}>
                  <VideoCard video={video} />
                </Col>
              ))
            ) : (
              <Col span={24}>
                <Empty
                  description="暂无视频数据"
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              </Col>
            )}
          </Row>
        )}
      </section>

      {/* 热门视频区域 */}
      <section className="trending-section">
        <div className="section-header">
          <Title level={2} className="section-title">
            <StarOutlined className="section-icon" />
            热门视频
          </Title>
          <Button 
            type="link" 
            onClick={() => handleViewMore('/videos?ordering=-view_count')}
            className="view-more-btn"
          >
            查看更多 →
          </Button>
        </div>

        <Row gutter={[16, 16]}>
          {trendingLoading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <Col key={index} xs={24} sm={12} md={8}>
                <Card className="trending-card-skeleton">
                  <Skeleton.Image style={{ width: 120, height: 80 }} />
                  <div className="trending-content">
                    <Skeleton active paragraph={{ rows: 2 }} />
                  </div>
                </Card>
              </Col>
            ))
          ) : (
            trendingVideos?.slice(0, 6).map((video, index) => (
              <Col key={video.id} xs={24} sm={12} md={8}>
                <Card 
                  className="trending-card"
                  onClick={() => navigate(`/videos/${video.id}`)}
                >
                  <div className="trending-rank">{index + 1}</div>
                  <div className="trending-thumbnail">
                    <img src={video.thumbnail || '/default-thumbnail.jpg'} alt={video.title} />
                    <div className="play-overlay">
                      <PlayCircleOutlined />
                    </div>
                  </div>
                  <div className="trending-content">
                    <Title level={5} className="trending-title" ellipsis={{ rows: 2 }}>
                      {video.title}
                    </Title>
                    <Space className="trending-meta">
                      <Text type="secondary">
                        <EyeOutlined /> {video.view_count?.toLocaleString()}
                      </Text>
                      <Text type="secondary">
                        {video.upload_date}
                      </Text>
                    </Space>
                  </div>
                </Card>
              </Col>
            ))
          )}
        </Row>
      </section>

      {/* 热门标签区域 */}
      <section className="tags-section">
        <div className="section-header">
          <Title level={2} className="section-title">
            热门标签
          </Title>
        </div>

        <div className="tags-container">
          {tagsLoading ? (
            Array.from({ length: 10 }).map((_, index) => (
              <Skeleton.Button key={index} active size="large" style={{ width: 100, margin: '4px' }} />
            ))
          ) : (
            tags?.slice(0, 15).map((tag) => (
              <Tag
                key={tag.id}
                className="popular-tag"
                color="red"
                onClick={() => handleTagClick(tag.id, tag.name)}
              >
                {tag.name}
                {tag.category && <span className="tag-category">({tag.category})</span>}
              </Tag>
            ))
          )}
        </div>
      </section>

      {/* 分类导航区域 */}
      <section className="categories-section">
        <div className="section-header">
          <Title level={2} className="section-title">
            浏览分类
          </Title>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8} md={6}>
            <Card 
              className="category-card"
              onClick={() => navigate('/videos?category=游戏IP')}
              cover={
                <div className="category-cover" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  <div className="category-icon">🎮</div>
                </div>
              }
            >
              <Card.Meta title="游戏IP" description="原神、崩坏3、明日方舟等" />
            </Card>
          </Col>
          
          <Col xs={12} sm={8} md={6}>
            <Card 
              className="category-card"
              onClick={() => navigate('/videos?category=类型')}
              cover={
                <div className="category-cover" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                  <div className="category-icon">🎭</div>
                </div>
              }
            >
              <Card.Meta title="表演类型" description="舞台剧、个人solo、群体表演" />
            </Card>
          </Col>
          
          <Col xs={12} sm={8} md={6}>
            <Card 
              className="category-card"
              onClick={() => navigate('/groups')}
              cover={
                <div className="category-cover" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                  <div className="category-icon">👥</div>
                </div>
              }
            >
              <Card.Meta title="社团" description="知名cosplay社团" />
            </Card>
          </Col>
          
          <Col xs={12} sm={8} md={6}>
            <Card 
              className="category-card"
              onClick={() => navigate('/competitions')}
              cover={
                <div className="category-cover" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                  <div className="category-icon">🏆</div>
                </div>
              }
            >
              <Card.Meta title="比赛" description="各类cosplay比赛" />
            </Card>
          </Col>
        </Row>
      </section>

      {/* 统计信息区域 */}
      <section className="stats-section">
        <Row gutter={[32, 32]} justify="center">
          <Col xs={12} sm={6}>
            <div className="stat-item">
              <div className="stat-number">{videosResponse?.count || 0}+</div>
              <div className="stat-label">精彩视频</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="stat-item">
              <div className="stat-number">100+</div>
              <div className="stat-label">优秀社团</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="stat-item">
              <div className="stat-number">50+</div>
              <div className="stat-label">经典剧目</div>
            </div>
          </Col>
          <Col xs={12} sm={6}>
            <div className="stat-item">
              <div className="stat-number">10+</div>
              <div className="stat-label">知名比赛</div>
            </div>
          </Col>
        </Row>
      </section>
    </div>
  );
};

export default HomePage; 