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
  Skeleton, 
  Empty,
  Pagination,
  Statistic,
  Select,
  DatePicker
} from 'antd';
import { 
  SearchOutlined, 
  TrophyOutlined, 
  CalendarOutlined, 
  EnvironmentOutlined,
  EyeOutlined,
  TeamOutlined,
  GiftOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useGetCompetitionsQuery } from '../../services/competitionsApi';
import './CompetitionListPage.css';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Meta } = Card;
const { Option } = Select;
const { RangePicker } = DatePicker;

const CompetitionListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const { data: competitionsResponse, isLoading, error } = useGetCompetitionsQuery({
    search: searchTerm,
    year: selectedYear,
    page: currentPage,
    page_size: pageSize
  });

  const competitions = competitionsResponse?.results || [];
  const total = competitionsResponse?.count || 0;

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleYearChange = (year: number | null) => {
    setSelectedYear(year || undefined);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleCompetitionClick = (competitionId: number) => {
    navigate(`/competitions/${competitionId}`);
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '未知';
    return dayjs(dateString).format('YYYY年MM月DD日');
  };

  const getCompetitionStatus = (startDate?: string, endDate?: string) => {
    if (!startDate || !endDate) return { status: 'unknown', text: '未知状态', color: 'default' };
    
    const now = dayjs();
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    
    if (now.isBefore(start)) {
      return { status: 'upcoming', text: '即将开始', color: 'blue' };
    } else if (now.isAfter(end)) {
      return { status: 'finished', text: '已结束', color: 'green' };
    } else {
      return { status: 'ongoing', text: '进行中', color: 'orange' };
    }
  };

  // 生成年份选项
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - i);

  return (
    <div className="competition-list-page">
      {/* 页面头部 */}
      <div className="page-header">
        <div className="header-content">
          <Title level={1} className="page-title">
            <TrophyOutlined className="title-icon" />
            Cosplay比赛
          </Title>
          <Text className="page-description">
            参与精彩的cosplay比赛，展示你的才华，赢取丰厚奖励
          </Text>
        </div>
      </div>

      {/* 搜索和筛选区域 */}
      <div className="search-section">
        <div className="search-container">
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} md={12}>
              <Search
                placeholder="搜索比赛名称..."
                allowClear
                enterButton={<SearchOutlined />}
                size="large"
                onSearch={handleSearch}
                className="search-input"
              />
            </Col>
            <Col xs={24} md={12}>
              <Space size="middle" wrap>
                <Select
                  placeholder="选择年份"
                  allowClear
                  style={{ width: 200 }}
                  size="large"
                  onChange={handleYearChange}
                  className="year-select"
                >
                  {yearOptions.map(year => (
                    <Option key={year} value={year}>{year}年</Option>
                  ))}
                </Select>
              </Space>
            </Col>
          </Row>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="stats-bar">
        <Space size="large" wrap>
          <Statistic 
            title="比赛总数" 
            value={total} 
            prefix={<TrophyOutlined />}
          />
          <Statistic 
            title="当前显示" 
            value={competitions.length} 
            prefix={<EyeOutlined />}
          />
          <Statistic 
            title="进行中比赛" 
            value={competitions.filter(c => getCompetitionStatus(c.start_date, c.end_date).status === 'ongoing').length}
            prefix={<CalendarOutlined />}
          />
        </Space>
      </div>

      {/* 比赛列表 */}
      <div className="competitions-section">
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
                    <Card className="competition-card-skeleton">
                      <Skeleton.Image 
                        active 
                        style={{ width: '100%', height: 200, marginBottom: 16 }}
                      />
                      <Skeleton active paragraph={{ rows: 4 }} />
                    </Card>
                  </Col>
                ))
              ) : competitions.length > 0 ? (
                competitions.map((competition) => {
                  const statusInfo = getCompetitionStatus(competition.start_date, competition.end_date);
                  return (
                    <Col key={competition.id} xs={24} sm={12} md={8} lg={6}>
                      <Card
                        className="competition-card"
                        hoverable
                        onClick={() => handleCompetitionClick(competition.id)}
                        cover={
                          <div className="competition-cover">
                            <div className="competition-image">
                              <TrophyOutlined style={{ fontSize: 48, color: '#fff' }} />
                            </div>
                            <div className="competition-status">
                              <Tag color={statusInfo.color} className="status-tag">
                                {statusInfo.text}
                              </Tag>
                            </div>
                          </div>
                        }
                        actions={[
                          <div key="date" className="card-action">
                            <CalendarOutlined />
                            <Text>{formatDate(competition.start_date)}</Text>
                          </div>,
                          <div key="location" className="card-action">
                            <EnvironmentOutlined />
                            <Text>{competition.location || '待定'}</Text>
                          </div>,
                          <div key="participants" className="card-action">
                            <TeamOutlined />
                            <Text>查看详情</Text>
                          </div>
                        ]}
                      >
                        <Meta
                          title={
                            <div className="competition-title">
                              <Title level={4} ellipsis={{ rows: 1 }}>
                                {competition.name}
                              </Title>
                            </div>
                          }
                          description={
                            <div className="competition-description">
                              {competition.description ? (
                                <Paragraph 
                                  ellipsis={{ rows: 3 }}
                                  className="description-text"
                                >
                                  {competition.description}
                                </Paragraph>
                              ) : (
                                <Text type="secondary">暂无描述</Text>
                              )}
                              
                              <div className="competition-details">
                                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                                  {competition.start_date && competition.end_date && (
                                    <div className="detail-item">
                                      <CalendarOutlined className="detail-icon" />
                                      <Text className="detail-text">
                                        {formatDate(competition.start_date)} ~ {formatDate(competition.end_date)}
                                      </Text>
                                    </div>
                                  )}
                                  {competition.location && (
                                    <div className="detail-item">
                                      <EnvironmentOutlined className="detail-icon" />
                                      <Text className="detail-text">{competition.location}</Text>
                                    </div>
                                  )}
                                </Space>
                              </div>
                              
                              <div className="competition-tags">
                                <Tag color="purple">比赛</Tag>
                                {competition.start_date && (
                                  <Tag color="blue">{dayjs(competition.start_date).format('YYYY')}年</Tag>
                                )}
                                {statusInfo.status === 'ongoing' && (
                                  <Tag color="red">热门</Tag>
                                )}
                              </div>
                            </div>
                          }
                        />
                      </Card>
                    </Col>
                  );
                })
              ) : (
                <Col span={24}>
                  <Empty
                    description={searchTerm || selectedYear ? "未找到相关比赛" : "暂无比赛数据"}
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

export default CompetitionListPage; 