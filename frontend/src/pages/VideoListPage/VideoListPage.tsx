import React, { useState } from 'react';
import { 
  Typography, 
  Row, 
  Col, 
  Input, 
  Select, 
  Pagination, 
  Card, 
  Skeleton, 
  Empty, 
  Space, 
  Button,
  Tag
} from 'antd';
import { 
  SearchOutlined, 
  FilterOutlined,
  SortAscendingOutlined 
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useGetVideosQuery } from '../../services/videosApi';
import { useGetTagsQuery } from '../../services/tagsApi';
import VideoCard from '../../components/VideoCard/VideoCard';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const VideoListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // 从URL参数获取初始状态
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [orderBy, setOrderBy] = useState(searchParams.get('ordering') || '-created_at');
  const [currentPage, setCurrentPage] = useState(parseInt(searchParams.get('page') || '1'));
  const pageSize = 20;

  // API调用
  const { data: videosResponse, isLoading: videosLoading, error: videosError } = useGetVideosQuery({
    search: searchTerm,
    tags: selectedTags,
    ordering: orderBy,
    page: currentPage,
    page_size: pageSize
  });

  const { data: tagsResponse, isLoading: tagsLoading } = useGetTagsQuery({
    page_size: 50
  });

  const videos = videosResponse?.results || [];
  const total = videosResponse?.count || 0;
  const tags = tagsResponse?.results || [];

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
    updateURL({ search: value, page: 1 });
  };

  const handleTagSelect = (tagIds: number[]) => {
    setSelectedTags(tagIds);
    setCurrentPage(1);
    updateURL({ tags: tagIds, page: 1 });
  };

  const handleOrderChange = (value: string) => {
    setOrderBy(value);
    setCurrentPage(1);
    updateURL({ ordering: value, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateURL({ page });
    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const updateURL = (params: Record<string, any>) => {
    const newSearchParams = new URLSearchParams(searchParams);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== '' && !(Array.isArray(value) && value.length === 0)) {
        if (Array.isArray(value)) {
          newSearchParams.set(key, value.join(','));
        } else {
          newSearchParams.set(key, value.toString());
        }
      } else {
        newSearchParams.delete(key);
      }
    });
    
    setSearchParams(newSearchParams);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTags([]);
    setOrderBy('-created_at');
    setCurrentPage(1);
    setSearchParams({});
  };

  return (
    <div style={{ padding: '20px' }}>
      {/* 页面头部 */}
      <div style={{ marginBottom: '24px' }}>
        <Title level={2} style={{ color: '#ffffff', marginBottom: '8px' }}>
          🎬 视频列表
        </Title>
        <Text style={{ color: '#b3b3b3', fontSize: '16px' }}>
          发现精彩的cosplay舞台剧视频，支持搜索和筛选功能
        </Text>
      </div>

      {/* 搜索和筛选区域 */}
      <Card 
        style={{ 
          background: '#1f1f1f', 
          border: '1px solid #2f2f2f',
          marginBottom: '24px'
        }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} md={8}>
            <Search
              placeholder="搜索视频标题、描述..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onSearch={handleSearch}
            />
          </Col>
          
          <Col xs={24} md={8}>
            <Select
              mode="multiple"
              placeholder="选择标签"
              style={{ width: '100%' }}
              size="large"
              value={selectedTags}
              onChange={handleTagSelect}
              allowClear
              loading={tagsLoading}
              maxTagCount={2}
            >
              {tags.map(tag => (
                <Option key={tag.id} value={tag.id}>
                  {tag.name} {tag.category && `(${tag.category})`}
                </Option>
              ))}
            </Select>
          </Col>
          
          <Col xs={24} md={8}>
            <Space style={{ width: '100%' }}>
              <Select
                placeholder="排序方式"
                style={{ width: '150px' }}
                size="large"
                value={orderBy}
                onChange={handleOrderChange}
              >
                <Option value="-created_at">最新上传</Option>
                <Option value="-view_count">观看量最高</Option>
                <Option value="-performance_date">最新演出</Option>
                <Option value="title">按标题排序</Option>
              </Select>
              
              <Button 
                icon={<FilterOutlined />}
                onClick={clearFilters}
                style={{ color: '#ff6b6b', borderColor: '#ff6b6b' }}
              >
                清除筛选
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 结果统计 */}
      <div style={{ marginBottom: '16px' }}>
        <Space>
          <Text style={{ color: '#ffffff', fontSize: '16px' }}>
            共找到 <span style={{ color: '#ff6b6b', fontWeight: 'bold' }}>{total}</span> 个视频
          </Text>
          {(searchTerm || selectedTags.length > 0) && (
            <Tag color="blue">
              {searchTerm && `搜索: ${searchTerm}`}
              {searchTerm && selectedTags.length > 0 && ' | '}
              {selectedTags.length > 0 && `已选 ${selectedTags.length} 个标签`}
            </Tag>
          )}
        </Space>
      </div>

      {/* 视频列表 */}
      {videosError ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <Empty
            description={
              <span style={{ color: '#b3b3b3' }}>
                加载失败，请重试
              </span>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      ) : (
        <>
          <Row gutter={[16, 16]}>
            {videosLoading ? (
              Array.from({ length: pageSize }).map((_, index) => (
                <Col key={index} xs={12} sm={8} md={6} lg={4} xl={3}>
                  <Card
                    cover={<Skeleton.Image style={{ width: '100%', height: 200 }} />}
                    style={{ 
                      background: '#1f1f1f', 
                      border: '1px solid #2f2f2f' 
                    }}
                  >
                    <Skeleton active paragraph={{ rows: 2 }} />
                  </Card>
                </Col>
              ))
            ) : videos.length > 0 ? (
              videos.map((video) => (
                <Col key={video.id} xs={12} sm={8} md={6} lg={4} xl={3}>
                  <VideoCard video={video} showDescription />
                </Col>
              ))
            ) : (
              <Col span={24}>
                <div style={{ textAlign: 'center', padding: '60px 20px' }}>
                  <Empty
                    description={
                      <span style={{ color: '#b3b3b3' }}>
                        {searchTerm || selectedTags.length > 0 
                          ? '未找到符合条件的视频' 
                          : '暂无视频数据'
                        }
                      </span>
                    }
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                </div>
              </Col>
            )}
          </Row>

          {/* 分页 */}
          {total > pageSize && (
            <div style={{ 
              textAlign: 'center', 
              marginTop: '40px',
              padding: '20px 0'
            }}>
              <Pagination
                current={currentPage}
                total={total}
                pageSize={pageSize}
                onChange={handlePageChange}
                showSizeChanger={false}
                showQuickJumper
                showTotal={(total, range) => 
                  <Text style={{ color: '#b3b3b3' }}>
                    第 {range[0]}-{range[1]} 条，共 {total} 条
                  </Text>
                }
                style={{
                  '& .ant-pagination-item-active': {
                    background: '#ff6b6b',
                    borderColor: '#ff6b6b'
                  }
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default VideoListPage; 