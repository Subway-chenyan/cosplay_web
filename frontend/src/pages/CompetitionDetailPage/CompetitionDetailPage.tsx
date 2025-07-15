import React from 'react';
import { 
  Typography, 
  Card, 
  Row, 
  Col, 
  Tag, 
  Space, 
  Skeleton, 
  Empty,
  Button,
  Descriptions,
  Avatar,
  List,
  Statistic
} from 'antd';
import { 
  TrophyOutlined, 
  CalendarOutlined, 
  EnvironmentOutlined,
  TeamOutlined,
  GiftOutlined,
  ArrowLeftOutlined,
  LinkOutlined,
  PlayCircleOutlined,
  StarOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetCompetitionQuery } from '../../services/competitionsApi';
import { useGetAwardsQuery } from '../../services/awardsApi';
import './CompetitionDetailPage.css';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const CompetitionDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const competitionId = parseInt(id || '0', 10);

  const { data: competition, isLoading, error } = useGetCompetitionQuery(competitionId);
  const { data: awardsResponse } = useGetAwardsQuery({ competition: competitionId });

  const awards = awardsResponse?.results || [];

  const handleBack = () => {
    navigate('/competitions');
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '未知';
    return dayjs(dateString).format('YYYY年MM月DD日 HH:mm');
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

  if (isLoading) {
    return (
      <div className="competition-detail-page">
        <div className="page-container">
          <Skeleton.Avatar active size={64} style={{ marginBottom: 24 }} />
          <Skeleton active paragraph={{ rows: 8 }} />
        </div>
      </div>
    );
  }

  if (error || !competition) {
    return (
      <div className="competition-detail-page">
        <div className="page-container">
          <Empty
            description="比赛不存在或加载失败"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
          <Button 
            type="primary" 
            icon={<ArrowLeftOutlined />}
            onClick={handleBack}
            style={{ marginTop: 16 }}
          >
            返回比赛列表
          </Button>
        </div>
      </div>
    );
  }

  const statusInfo = getCompetitionStatus(competition.start_date, competition.end_date);

  return (
    <div className="competition-detail-page">
      {/* 返回按钮 */}
      <div className="back-button-container">
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          className="back-button"
        >
          返回比赛列表
        </Button>
      </div>

      {/* 比赛头部 */}
      <div className="competition-header">
        <div className="header-content">
          <div className="competition-hero">
            <div className="hero-icon">
              <TrophyOutlined style={{ fontSize: 64, color: '#fbbf24' }} />
            </div>
            <div className="hero-info">
              <div className="status-section">
                <Tag color={statusInfo.color} className="status-tag-large">
                  {statusInfo.text}
                </Tag>
              </div>
              <Title level={1} className="competition-title">
                {competition.name}
              </Title>
              <div className="competition-meta">
                <Space size="large" wrap>
                  <div className="meta-item">
                    <CalendarOutlined className="meta-icon" />
                    <span>{formatDate(competition.start_date)}</span>
                  </div>
                  {competition.location && (
                    <div className="meta-item">
                      <EnvironmentOutlined className="meta-icon" />
                      <span>{competition.location}</span>
                    </div>
                  )}
                </Space>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="page-container">
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            {/* 比赛描述 */}
            <Card className="section-card" title="比赛简介">
              {competition.description ? (
                <Paragraph className="description-text">
                  {competition.description}
                </Paragraph>
              ) : (
                <Text type="secondary">暂无比赛描述</Text>
              )}
            </Card>

            {/* 比赛详情 */}
            <Card className="section-card" title="比赛详情">
              <Descriptions column={1} className="competition-descriptions">
                <Descriptions.Item label="比赛名称">
                  {competition.name}
                </Descriptions.Item>
                <Descriptions.Item label="开始时间">
                  {formatDate(competition.start_date)}
                </Descriptions.Item>
                <Descriptions.Item label="结束时间">
                  {formatDate(competition.end_date)}
                </Descriptions.Item>
                <Descriptions.Item label="比赛地点">
                  {competition.location || '待定'}
                </Descriptions.Item>
                <Descriptions.Item label="比赛状态">
                  <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
                </Descriptions.Item>
                {competition.website && (
                  <Descriptions.Item label="官方网站">
                    <Button 
                      type="link" 
                      icon={<LinkOutlined />}
                      onClick={() => window.open(competition.website, '_blank')}
                      className="website-link"
                    >
                      查看官网
                    </Button>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>

            {/* 获奖作品 */}
            {awards.length > 0 && (
              <Card 
                className="section-card" 
                title={
                  <Space>
                    <GiftOutlined />
                    <span>获奖作品</span>
                  </Space>
                }
              >
                <List
                  itemLayout="horizontal"
                  dataSource={awards}
                  renderItem={(award) => (
                    <List.Item
                      className="award-item"
                      actions={[
                        <Button 
                          type="text" 
                          icon={<PlayCircleOutlined />}
                          onClick={() => navigate(`/videos`)}
                          className="watch-button"
                        >
                          查看相关视频
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <div className="award-rank">
                            <StarOutlined style={{ color: '#fbbf24' }} />
                          </div>
                        }
                        title={
                          <div className="award-title">
                            <span className="award-name">{award.name}</span>
                            <Tag color="gold" className="award-tag">
                              奖项
                            </Tag>
                          </div>
                        }
                        description={
                          <div className="award-description">
                            {award.description && (
                              <Text className="award-desc">{award.description}</Text>
                            )}
                            <div className="award-rank-info">
                              <TrophyOutlined style={{ marginRight: 8 }} />
                              <Text>排名：{award.rank || '特别奖'}</Text>
                            </div>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            )}
          </Col>

          <Col xs={24} lg={8}>
            {/* 比赛统计 */}
            <Card className="section-card" title="比赛统计">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic
                    title="奖项数量"
                    value={awards.length}
                    prefix={<GiftOutlined />}
                    className="stat-item"
                  />
                </Col>
                <Col span={12}>
                  <Statistic
                    title="竞赛排名"
                    value={awards.filter(award => award.rank).length}
                    prefix={<PlayCircleOutlined />}
                    className="stat-item"
                  />
                </Col>
              </Row>
            </Card>

            {/* 快速操作 */}
            <Card className="section-card" title="快速操作">
              <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                {competition.website && (
                  <Button 
                    type="default" 
                    icon={<LinkOutlined />}
                    onClick={() => window.open(competition.website, '_blank')}
                    block
                    className="action-button"
                  >
                    访问官网
                  </Button>
                )}
                <Button 
                  type="default" 
                  icon={<TeamOutlined />}
                  onClick={() => navigate('/groups')}
                  block
                  className="action-button"
                >
                  查看社团
                </Button>
                <Button 
                  type="default" 
                  icon={<PlayCircleOutlined />}
                  onClick={() => navigate('/')}
                  block
                  className="action-button"
                >
                  浏览视频
                </Button>
              </Space>
            </Card>

            {/* 相关信息 */}
            <Card className="section-card" title="温馨提示">
              <div className="info-content">
                <Paragraph className="info-text">
                  💡 点击获奖作品可以观看对应的精彩视频
                </Paragraph>
                <Paragraph className="info-text">
                  🏆 查看更多比赛信息请访问官方网站
                </Paragraph>
                <Paragraph className="info-text">
                  📱 关注我们获取最新比赛动态
                </Paragraph>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default CompetitionDetailPage; 