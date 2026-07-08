import { Routes, Route, useLocation } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import GroupsPage from './pages/GroupsPage'
import GroupDetailPage from './pages/GroupDetailPage'
import CompetitionsPage from './pages/CompetitionsPage'
import CompetitionDetailPage from './pages/CompetitionDetailPage'
import ChinaJoy2026FinalistsPage from './pages/ChinaJoy2026FinalistsPage'
import VideoDetailPage from './pages/VideoDetailPage'
import DataImportPage from './pages/DataImportPage'
import ManagementPage from './pages/ManagementPage'
import ChoreoMasterPage from './pages/ChoreoMasterPage'
import ForumHome from './pages/Forum/ForumHome'
import ForumPostDetail from './pages/Forum/ForumPostDetail'
import NewPost from './pages/Forum/NewPost'
import EditPost from './pages/Forum/EditPost'
import ForumAdmin from './pages/Forum/ForumAdmin'
import LoginPage from './pages/LoginPage'
import QQLoginCallbackPage from './pages/QQLoginCallbackPage'
import RegisterPage from './pages/RegisterPage'
import UserCenterPage from './pages/UserCenterPage'

function P5MinimalBackground() {
  return (
    <div className="absolute inset-0 z-0 bg-black pointer-events-none">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "url('/assets/new_ui/back.png')",
          backgroundPosition: 'top center',
          backgroundRepeat: 'repeat-y',
          backgroundSize: '100% auto',
        }}
      />
      <div className="absolute inset-0 bg-black/18" />
    </div>
  )
}

function App() {
  const location = useLocation()
  const usesHomeVisual = location.pathname === '/' || location.pathname === '/choreo'

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {!usesHomeVisual && <P5MinimalBackground />}

      <div className="relative z-10">
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="/video/:id" element={<VideoDetailPage />} />
            <Route path="/groups" element={<GroupsPage />} />
            <Route path="/group/:id" element={<GroupDetailPage />} />
            <Route path="/competitions" element={<CompetitionsPage />} />
            <Route path="/competitions/chinajoy-2026-finalists" element={<ChinaJoy2026FinalistsPage />} />
            <Route path="/competitions/:id" element={<CompetitionDetailPage />} />
            <Route path="/data-import" element={<DataImportPage />} />
            <Route path="/management" element={<ManagementPage />} />
            <Route path="/choreo" element={<ChoreoMasterPage />} />
            <Route path="/forum" element={<ForumHome />} />
            <Route path="/forum/admin" element={<ForumAdmin />} />
            <Route path="/forum/post/:id" element={<ForumPostDetail />} />
          </Route>
          <Route path="/forum/new" element={<NewPost />} />
          <Route path="/forum/edit/:id" element={<EditPost />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/login/qq/callback" element={<QQLoginCallbackPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/user-center" element={<UserCenterPage />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
