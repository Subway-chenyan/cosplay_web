import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { RootState, AppDispatch } from '../store/store'
import { fetchCompetitions } from '../store/slices/competitionsSlice'
import { Trophy, Calendar, Award, Users } from 'lucide-react'

function CompetitionsPage() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { competitions, loading, error } = useSelector((state: RootState) => state.competitions)

  useEffect(() => {
    dispatch(fetchCompetitions())
  }, [dispatch])

  const handleCompetitionClick = (competitionId: string) => {
    navigate(`/competition/${competitionId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载比赛...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-red-600">加载失败: {error}</p>
          <button
            onClick={() => dispatch(fetchCompetitions())}
            className="mt-4 btn-primary"
          >
            重新加载
          </button>
        </div>
      </div>
    )
  }

  // 按年份分组比赛
  const competitionsByYear = competitions?.reduce((acc, competition) => {
    const year = competition.year
    if (!acc[year]) {
      acc[year] = []
    }
    acc[year].push(competition)
    return acc
  }, {} as Record<number, typeof competitions>) || {}

  const years = Object.keys(competitionsByYear)
    .map(Number)
    .sort((a, b) => b - a) // 降序排列，最新年份在前

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg text-white p-8">
        <div className="text-center">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-yellow-100" />
          <h1 className="text-4xl font-bold mb-2">比赛展示</h1>
          <p className="text-xl text-yellow-100">
            历年Cosplay舞台剧比赛合集
          </p>
        </div>
      </div>



      {/* Competitions by Year */}
      {years.map((year) => (
        <div key={year} className="space-y-4">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-900">{year}年</h2>
            <span className="text-sm text-gray-500">
              ({competitionsByYear[year]?.length || 0} 项比赛)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(competitionsByYear[year] || []).map((competition) => (
              <div
                key={competition.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handleCompetitionClick(competition.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {competition.name}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {competition.description}
                    </p>
                  </div>
                  
                  <div className="ml-4 flex flex-col items-center">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-2">
                      <Trophy className="w-6 h-6 text-yellow-600" />
                    </div>
                    <span className="text-xs text-gray-500">{competition.year}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center space-x-1">
                      <Award className="w-4 h-4" />
                    </span>
                    <span className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                    </span>
                  </div>
                  <span className="text-primary-600 font-medium">查看详情 →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {years.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-gray-50 rounded-lg p-8">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无比赛</h3>
            <p className="text-gray-600">目前还没有比赛信息</p>
          </div>
        </div>
      )}

      {/* Stats Section
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">比赛统计</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600 mb-2">
              {competitions?.length || 0}
            </div>
            <div className="text-gray-600">总比赛数</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-secondary-600 mb-2">
              {years.length}
            </div>
            <div className="text-gray-600">参与年份</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600 mb-2">
              {Math.max(...years, 0) || '暂无'}
            </div>
            <div className="text-gray-600">最新年份</div>
          </div>
        </div>
      </div> */}
    </div>
  )
}

export default CompetitionsPage 