import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import GroupsPage from './pages/GroupsPage'
import GroupDetailPage from './pages/GroupDetailPage'
import CompetitionsPage from './pages/CompetitionsPage'
import CompetitionDetailPage from './pages/CompetitionDetailPage'
import VideoDetailPage from './pages/VideoDetailPage'
import DataImportPage from './pages/DataImportPage'
import ManagementPage from './pages/ManagementPage'
import ChoreoMasterPage from './pages/ChoreoMasterPage'
import ForumHome from './pages/Forum/ForumHome'
import ForumPostDetail from './pages/Forum/ForumPostDetail'
import NewPost from './pages/Forum/NewPost'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import UserCenterPage from './pages/UserCenterPage'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="/video/:id" element={<VideoDetailPage />} />
          <Route path="/groups" element={<GroupsPage />} />
          <Route path="/group/:id" element={<GroupDetailPage />} />
          <Route path="/competitions" element={<CompetitionsPage />} />
          <Route path="/competitions/:id" element={<CompetitionDetailPage />} />
          <Route path="/data-import" element={<DataImportPage />} />
          <Route path="/management" element={<ManagementPage />} />
          <Route path="/choreo" element={<ChoreoMasterPage />} />
          <Route path="/forum" element={<ForumHome />} />
          <Route path="/forum/post/:id" element={<ForumPostDetail />} />
        </Route>
        <Route path="/forum/new" element={<NewPost />} />
        {/* 认证相关路由（不需要 Layout） */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/user-center" element={<UserCenterPage />} />
      </Routes>
    </div>
  )
}

export default App