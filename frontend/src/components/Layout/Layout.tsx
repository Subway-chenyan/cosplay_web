import React, { useState } from 'react';
import { Layout as AntLayout, Menu, Input, Button, Space, Avatar, Dropdown } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  SearchOutlined,
  HomeOutlined,
  PlayCircleOutlined,
  TeamOutlined,
  TrophyOutlined,
  FireOutlined,
  TagsOutlined,
  UserOutlined,
  MenuOutlined,
} from '@ant-design/icons';
import './Layout.css';

const { Header, Sider, Content } = AntLayout;
const { Search } = Input;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = (value: string) => {
    if (value.trim()) {
      navigate(`/search?q=${encodeURIComponent(value.trim())}`);
    }
  };

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '/videos',
      icon: <PlayCircleOutlined />,
      label: '视频',
    },
    {
      key: '/groups',
      icon: <TeamOutlined />,
      label: '社团',
    },
    {
      key: '/competitions',
      icon: <TrophyOutlined />,
      label: '比赛',
    },
    {
      key: '/performances',
      icon: <FireOutlined />,
      label: '剧目',
    },
    {
      type: 'divider',
    },
    {
      key: 'categories',
      label: '分类',
      icon: <TagsOutlined />,
      children: [
        {
          key: '/videos?category=游戏IP',
          label: '游戏IP',
        },
        {
          key: '/videos?category=年份',
          label: '年份',
        },
        {
          key: '/videos?category=类型',
          label: '类型',
        },
        {
          key: '/videos?category=风格',
          label: '风格',
        },
      ],
    },
  ];

  const userMenuItems = [
    {
      key: 'profile',
      label: '个人资料',
      icon: <UserOutlined />,
    },
    {
      key: 'favorites',
      label: '我的收藏',
    },
    {
      key: 'ratings',
      label: '我的评分',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: '退出登录',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    if (key.startsWith('/')) {
      navigate(key);
    }
  };

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      {/* 顶部导航栏 */}
      <Header className="layout-header">
        <div className="header-content">
          <div className="header-left">
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              className="menu-trigger"
            />
            <div className="logo" onClick={() => navigate('/')}>
              <FireOutlined style={{ fontSize: '24px', color: '#ff6b6b' }} />
              <span className="logo-text">Cosplay舞台剧</span>
            </div>
          </div>

          <div className="header-center">
            <Search
              placeholder="搜索视频、社团、剧目..."
              allowClear
              enterButton={<SearchOutlined />}
              size="large"
              onSearch={handleSearch}
              style={{ width: '100%', maxWidth: '500px' }}
            />
          </div>

          <div className="header-right">
            <Space>
              <Button type="primary" ghost>
                登录
              </Button>
              <Dropdown
                menu={{
                  items: userMenuItems,
                  onClick: ({ key }) => {
                    if (key === 'logout') {
                      // 处理退出登录
                    } else {
                      navigate(`/${key}`);
                    }
                  },
                }}
                placement="bottomRight"
              >
                <Avatar
                  style={{ backgroundColor: '#ff6b6b', cursor: 'pointer' }}
                  icon={<UserOutlined />}
                />
              </Dropdown>
            </Space>
          </div>
        </div>
      </Header>

      <AntLayout>
        {/* 侧边导航栏 */}
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          width={200}
          className="layout-sider"
        >
          <Menu
            mode="inline"
            selectedKeys={[location.pathname]}
            items={menuItems}
            onClick={handleMenuClick}
            style={{ height: '100%', borderRight: 0 }}
          />
        </Sider>

        {/* 主内容区域 */}
        <Content className="layout-content">
          <div className="content-wrapper">
            {children}
          </div>
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout; 