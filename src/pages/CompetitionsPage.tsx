import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { RootState } from '../store/store'
import { fetchCompetitions } from '../store/slices/competitionsSlice'
import { Trophy, Calendar, Award, Users } from 'lucide-react'

function CompetitionsPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { competitions, loading, error } = useSelector((state: RootState) => state.competitions)

  useEffect(() => {
    dispatch(fetchCompetitions() as any)
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
        </div>
      </div>
    )
  }

  // 按年份分组比赛
  const competitionsByYear = competitions.reduce((acc, competition) => {
    const year = competition.year
    if (!acc[year]) {
      acc[year] = []
    }
    acc[year].push(competition)
    return acc
  }, {} as Record<number, typeof competitions>)

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
            了解各类cosplay比赛，见证精彩时刻
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
              ({competitionsByYear[year].length} 项比赛)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {competitionsByYear[year].map((competition) => (
              <div
                key={competition.id}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 card-hover border border-gray-200 cursor-pointer"
                onClick={() => handleCompetitionClick(competition.id)}
              >
                <div className="p-6">
                  {/* Competition Header */}
                  <div className="flex items-start space-x-4 mb-4">
                    <div className="bg-gradient-to-br from-yellow-400 to-orange-500 p-3 rounded-lg flex-shrink-0">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {competition.name}
                      </h3>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>{competition.year}年</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-6 line-clamp-3">
                    {competition.description}
                  </p>

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center text-sm">
                      <Award className="w-4 h-4 text-yellow-500 mr-2" />
                      <span className="text-gray-600">专业评审团</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Users className="w-4 h-4 text-blue-500 mr-2" />
                      <span className="text-gray-600">多元化参赛作品</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Trophy className="w-4 h-4 text-orange-500 mr-2" />
                      <span className="text-gray-600">丰厚奖品</span>
                    </div>
                  </div>

                  {/* Competition Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {competition.year === new Date().getFullYear() ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          进行中
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          已结束
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                      查看详情 →
                    </div>
                  </div>
                </div>

                {/* Highlight for current year */}
                {competition.year === new Date().getFullYear() && (
                  <div className="h-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-b-lg"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Empty State */}
      {competitions.length === 0 && (
        <div className="text-center py-12">
          <div className="bg-gray-50 rounded-lg p-8">
            <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无比赛</h3>
            <p className="text-gray-600">目前还没有比赛信息</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default CompetitionsPage 