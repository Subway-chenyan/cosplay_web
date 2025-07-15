import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { store } from './store';
import Layout from './components/Layout/Layout';
import HomePage from './pages/HomePage/HomePage';
import VideoListPage from './pages/VideoListPage/VideoListPage';
import './App.css';

// 简单的占位符页面组件
const SimplePage: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div style={{ padding: '40px', textAlign: 'center' }}>
    <h2 style={{ color: '#ff6b6b' }}>{title}</h2>
    <p style={{ color: '#b3b3b3', fontSize: '16px' }}>{description}</p>
  </div>
);

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <ConfigProvider
        locale={zhCN}
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: '#ff6b6b',
            colorBgBase: '#141414',
            colorTextBase: '#ffffff',
            colorBgContainer: '#1f1f1f',
            borderRadius: 8,
          },
        }}
      >
        <Router>
          <div className="App">
            <Layout>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/videos" element={<VideoListPage />} />
                <Route 
                  path="/groups" 
                  element={<SimplePage title="👥 社团列表" description="这里将显示所有cosplay社团信息" />} 
                />
                <Route 
                  path="/competitions" 
                  element={<SimplePage title="🏆 比赛列表" description="这里将显示所有cosplay比赛信息" />} 
                />
                <Route 
                  path="/performances" 
                  element={<SimplePage title="🎭 演出列表" description="这里将显示所有舞台剧演出信息" />} 
                />
                <Route 
                  path="/search" 
                  element={<SimplePage title="🔍 搜索结果" description="这里将显示搜索结果" />} 
                />
              </Routes>
            </Layout>
          </div>
        </Router>
      </ConfigProvider>
    </Provider>
  );
};

export default App; 