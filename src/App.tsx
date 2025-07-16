import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import GroupsPage from './pages/GroupsPage'
import GroupDetailPage from './pages/GroupDetailPage'
import CompetitionsPage from './pages/CompetitionsPage'
import CompetitionDetailPage from './pages/CompetitionDetailPage'
import VideoDetailPage from './pages/VideoDetailPage'
import DataImportPage from './pages/DataImportPage'

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
          <Route path="/competition/:id" element={<CompetitionDetailPage />} />
          <Route path="/data-import" element={<DataImportPage />} />
        </Route>
      </Routes>
    </div>
  )
}

export default App 