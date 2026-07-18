import { Suspense, lazy } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import { authService } from './services/authService'

// 路由级代码分割：除首页外的页面全部懒加载，避免首屏下载全部代码
// （ManagementPage 单文件超过 100KB，echarts/tiptap/MUI 等重依赖也随之拆分）
const GroupsPage = lazy(() => import('./pages/GroupsPage'))
const GroupDetailPage = lazy(() => import('./pages/GroupDetailPage'))
const CompetitionsPage = lazy(() => import('./pages/CompetitionsPage'))
const CompetitionDetailPage = lazy(() => import('./pages/CompetitionDetailPage'))
const ChinaJoy2026FinalistsPage = lazy(() => import('./pages/ChinaJoy2026FinalistsPage'))
const VideoDetailPage = lazy(() => import('./pages/VideoDetailPage'))
const DataImportPage = lazy(() => import('./pages/DataImportPage'))
const ManagementPage = lazy(() => import('./pages/ManagementPage'))
const ChoreoMasterPage = lazy(() => import('./pages/ChoreoMasterPage'))
const ForumHome = lazy(() => import('./pages/Forum/ForumHome'))
const ForumPostDetail = lazy(() => import('./pages/Forum/ForumPostDetail'))
const NewPost = lazy(() => import('./pages/Forum/NewPost'))
const EditPost = lazy(() => import('./pages/Forum/EditPost'))
const ForumAdmin = lazy(() => import('./pages/Forum/ForumAdmin'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const QQLoginCallbackPage = lazy(() => import('./pages/QQLoginCallbackPage'))
const RegisterPage = lazy(() => import('./pages/RegisterPage'))
const UserCenterPage = lazy(() => import('./pages/UserCenterPage'))

// 页面加载中的占位
function PageFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
    </div>
  )
}

// 需要登录的页面：未登录时重定向到登录页，并记录回跳地址
function RequireAuth({ children }: { children: JSX.Element }) {
  const location = useLocation()
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  return children
}

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
        <Suspense fallback={<PageFallback />}>
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
              <Route path="/forum/admin" element={<RequireAuth><ForumAdmin /></RequireAuth>} />
              <Route path="/forum/post/:id" element={<ForumPostDetail />} />
            </Route>
            <Route path="/forum/new" element={<RequireAuth><NewPost /></RequireAuth>} />
            <Route path="/forum/edit/:id" element={<RequireAuth><EditPost /></RequireAuth>} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/login/qq/callback" element={<QQLoginCallbackPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/user-center" element={<RequireAuth><UserCenterPage /></RequireAuth>} />
          </Routes>
        </Suspense>
      </div>
    </div>
  )
}

export default App
