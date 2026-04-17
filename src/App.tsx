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
import EditPost from './pages/Forum/EditPost'
import LoginPage from './pages/LoginPage'
import QQLoginCallbackPage from './pages/QQLoginCallbackPage'
import RegisterPage from './pages/RegisterPage'
import UserCenterPage from './pages/UserCenterPage'

function App() {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(135deg, #000000 0%, #120001 14%, #3a0006 32%, #8f000f 54%, #250003 76%, #000000 100%)',
        }}
      />
      <div
        className="fixed -left-[18%] top-0 h-full w-[52%] z-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(255,18,36,0.55) 0%, rgba(145,0,12,0.22) 100%)',
          transform: 'skewX(-22deg)',
          boxShadow: '0 0 120px rgba(217,6,20,0.28)',
        }}
      />
      <div
        className="fixed left-[20%] top-0 h-full w-[22%] z-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.09) 0%, rgba(255,255,255,0.015) 100%)',
          transform: 'skewX(-22deg)',
        }}
      />
      <div
        className="fixed left-[38%] top-0 h-full w-[28%] z-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(255,0,30,0.42) 0%, rgba(115,0,10,0.18) 100%)',
          transform: 'skewX(-22deg)',
        }}
      />
      <div
        className="fixed left-[58%] top-0 h-full w-[18%] z-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(255,255,255,0.065) 0%, rgba(255,255,255,0.01) 100%)',
          transform: 'skewX(-22deg)',
        }}
      />
      <div
        className="fixed right-[-14%] top-0 h-full w-[42%] z-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)',
          transform: 'skewX(-22deg)',
        }}
      />
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-70"
        style={{
          background:
            'linear-gradient(135deg, transparent 0%, transparent 18%, rgba(255,255,255,0.06) 18%, rgba(255,255,255,0.06) 25%, transparent 25%, transparent 45%, rgba(255,255,255,0.04) 45%, rgba(255,255,255,0.04) 52%, transparent 52%, transparent 72%, rgba(255,255,255,0.03) 72%, rgba(255,255,255,0.03) 77%, transparent 77%, transparent 100%)',
        }}
      />
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 14% 18%, rgba(255,80,80,0.22) 0%, rgba(255,80,80,0) 24%), radial-gradient(circle at 52% 12%, rgba(255,20,40,0.18) 0%, rgba(255,20,40,0) 20%), radial-gradient(circle at 82% 16%, rgba(217,6,20,0.18) 0%, rgba(217,6,20,0) 22%), radial-gradient(circle at 70% 78%, rgba(120,0,0,0.28) 0%, rgba(120,0,0,0) 28%)',
        }}
      />

      <div className="relative z-10">
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
