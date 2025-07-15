import React, { useState } from 'react';
import { 
  Typography, 
  Card, 
  Row, 
  Col, 
  Input, 
  Button, 
  Space, 
  Tag, 
  Avatar, 
  Skeleton, 
  Empty,
  Pagination,
  Statistic
} from 'antd';
import { 
  SearchOutlined, 
  TeamOutlined, 
  CalendarOutlined, 
  TrophyOutlined,
  EyeOutlined,
  LinkOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useGetGroupsQuery } from '../../services/groupsApi';
import './GroupListPage.css';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Meta } = Card;

const GroupListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const { data: groupsResponse, isLoading, error } = useGetGroupsQuery({
    search: searchTerm,
    page: currentPage,
    page_size: pageSize
  });

  const groups = groupsResponse?.results || [];
  const total = groupsResponse?.count || 0;

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleGroupClick = (groupId: number) => {
    navigate(`/groups/${groupId}`);
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '未知';
    const date = new Date(dateString);
    return date.getFullYear().toString();
  };

  return (
    <div className="group-list-page">
      {/* 页面头部 */}
      <div className="page-header">
        <div className="header-content">
          <Title level={1} className="page-title">
            <TeamOutlined className="title-icon" />
            Cosplay社团
          </Title>
          <Text className="page-description">
            发现优秀的cosplay社团，欣赏精彩的舞台剧作品
          </Text>
        </div>
      </div>

      {/* 搜索区域 */}
      <div className="search-section">
        <div className="search-container">
          <Search
            placeholder="搜索社团名称..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            onSearch={handleSearch}
            className="search-input"
          />
        </div>
      </div>

      {/* 统计信息 */}
      <div className="stats-bar">
        <Space size="large">
          <Statistic 
            title="社团总数" 
            value={total} 
            prefix={<TeamOutlined />}
          />
          <Statistic 
            title="当前显示" 
            value={groups.length} 
            prefix={<EyeOutlined />}
          />
        </Space>
      </div>

      {/* 社团列表 */}
      <div className="groups-section">
        {error ? (
          <div className="error-section">
            <Empty
              description="加载失败，请重试"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          </div>
        ) : (
          <>
            <Row gutter={[24, 24]}>
              {isLoading ? (
                Array.from({ length: pageSize }).map((_, index) => (
                  <Col key={index} xs={24} sm={12} md={8} lg={6}>
                    <Card className="group-card-skeleton">
                      <Skeleton.Avatar 
                        active 
                        size={80} 
                        style={{ marginBottom: 16 }}
                      />
                      <Skeleton active paragraph={{ rows: 3 }} />
                    </Card>
                  </Col>
                ))
              ) : groups.length > 0 ? (
                groups.map((group) => (
                  <Col key={group.id} xs={24} sm={12} md={8} lg={6}>
                    <Card
                      className="group-card"
                      hoverable
                      onClick={() => handleGroupClick(group.id)}
                      cover={
                        <div className="group-cover">
                          <Avatar
                            size={80}
                            src={group.logo}
                            icon={<TeamOutlined />}
                            className="group-avatar"
                          />
                        </div>
                      }
                      actions={[
                        <div key="founded" className="card-action">
                          <CalendarOutlined />
                          <Text>{formatDate(group.founded_date)}年成立</Text>
                        </div>,
                        group.website && (
                          <div 
                            key="website" 
                            className="card-action"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(group.website, '_blank');
                            }}
                          >
                            <LinkOutlined />
                            <Text>官网</Text>
                          </div>
                        )
                      ].filter(Boolean)}
                    >
                      <Meta
                        title={
                          <div className="group-title">
                            <Title level={4} ellipsis={{ rows: 1 }}>
                              {group.name}
                            </Title>
                          </div>
                        }
                        description={
                          <div className="group-description">
                            {group.description ? (
                              <Paragraph 
                                ellipsis={{ rows: 3 }}
                                className="description-text"
                              >
                                {group.description}
                              </Paragraph>
                            ) : (
                              <Text type="secondary">暂无简介</Text>
                            )}
                            
                            <div className="group-tags">
                              <Tag color="blue">活跃社团</Tag>
                              {group.founded_date && (
                                new Date().getFullYear() - new Date(group.founded_date).getFullYear() >= 3 && (
                                  <Tag color="gold">资深社团</Tag>
                                )
                              )}
                            </div>
                          </div>
                        }
                      />
                    </Card>
                  </Col>
                ))
              ) : (
                <Col span={24}>
                  <Empty
                    description={searchTerm ? "未找到相关社团" : "暂无社团数据"}
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                  />
                </Col>
              )}
            </Row>

            {/* 分页 */}
            {total > pageSize && (
              <div className="pagination-container">
                <Pagination
                  current={currentPage}
                  total={total}
                  pageSize={pageSize}
                  onChange={handlePageChange}
                  showSizeChanger={false}
                  showQuickJumper
                  showTotal={(total, range) => 
                    `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
                  }
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default GroupListPage; 