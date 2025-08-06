import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { RootState, AppDispatch } from '../store/store'
import { fetchCompetitions, setCurrentPage } from '../store/slices/competitionsSlice'
import { Trophy, Calendar, Award, Users, Loader } from 'lucide-react'
import { Competition } from '../types'

function CompetitionsPage() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { competitions, loading, error, pagination, currentPage } = useSelector((state: RootState) => state.competitions)

  useEffect(() => {
    if (competitions.length === 0) {
      dispatch(fetchCompetitions({ page: 1 }))
    }
  }, [dispatch, competitions.length])

  const handleCompetitionClick = (competition: Competition) => {
    navigate(`/competition/${competition.id}`)
  }

  const handleLoadMore = () => {
    if (pagination.next && !loading) {
      dispatch(setCurrentPage(currentPage + 1))
      dispatch(fetchCompetitions({ page: currentPage + 1 }))
    }
  }

  if (loading && competitions.length === 0) {
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">比赛活动</h1>
        <p className="text-gray-600">
          探索各类精彩的Cosplay比赛活动
        </p>
      </div>

      {competitions && competitions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {competitions.map((competition) => (
            <div
              key={competition.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleCompetitionClick(competition)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {competition.name}
                  </h3>
                </div>
                <div className="flex-shrink-0 ml-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>

              {competition.description && (
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {competition.description}
                </p>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>创建时间</span>
                  </div>
                </div>
                {competition.website && (
                  <a
                    href={competition.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700"
                    onClick={(e) => e.stopPropagation()}
                  >
                    官网
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">暂无比赛数据</p>
        </div>
      )}

      {/* Load More Button */}
      {pagination.next && (
        <div className="text-center mt-8">
          <button
            onClick={handleLoadMore}
            className="btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin mr-2" />
                加载中...
              </>
            ) : (
              '加载更多比赛'
            )}
          </button>
        </div>
      )}

      {/* Total Count Display */}
      {competitions.length > 0 && (
        <div className="text-center mt-4 text-sm text-gray-500">
          已显示 {competitions.length} / {pagination.count} 个比赛
        </div>
      )}
    </div>
  )
}

export default CompetitionsPage