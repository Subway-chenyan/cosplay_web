import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { RootState, AppDispatch } from '../store/store'
import { fetchCompetitions, setCurrentPage } from '../store/slices/competitionsSlice'
import { Trophy, Calendar } from 'lucide-react'
import { Competition } from '../types'
import EventCalendar from '../components/EventCalendar'
import Pagination from '../components/Pagination'

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
    navigate(`/competitions/${competition.id}`)
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
      <div className="relative group mb-12">
        <div className="absolute inset-0 bg-black transform translate-x-2 translate-y-2 -skew-x-2 z-0"></div>
        <div className="relative z-10 bg-white border-4 border-black p-8 transform -skew-x-2">
          <div className="transform skew-x-2">
            <h1 className="text-5xl font-black text-black mb-4 uppercase italic border-b-8 border-p5-red inline-block" style={{ textShadow: '4px 4px 0px #d90614' }}>
              赛事档案 / BATTLE ARCHIVE
            </h1>
            <p className="block text-xl font-black italic bg-black text-white px-4 py-1 transform -skew-x-12 w-fit mb-4">
              持续更新中... / RECORDS SECURED
            </p>
          </div>
        </div>
      </div>

      {competitions && competitions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {competitions.map((competition) => (
            <div
              key={competition.id}
              className="relative group cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
              onClick={() => handleCompetitionClick(competition)}
            >
              {/* Background decoration */}
              <div className="absolute inset-0 bg-black transform translate-x-1 translate-y-1 -skew-x-1 border-2 border-gray-800 z-0 group-hover:bg-p5-red transition-colors"></div>

              <div className="relative z-10 bg-white border-2 border-black p-6 h-full flex flex-col overflow-hidden">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-black text-black uppercase transform -skew-x-6 border-b-4 border-p5-red inline-block pr-2 mb-2 group-hover:text-p5-red transition-colors leading-tight">
                      {competition.name}
                    </h3>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <div className="w-12 h-12 bg-black transform rotate-12 flex items-center justify-center border-2 border-p5-red group-hover:rotate-0 transition-transform">
                      <Trophy className="w-6 h-6 text-p5-red" />
                    </div>
                  </div>
                </div>

                {competition.description && (
                  <p className="text-xs text-gray-600 mb-4 line-clamp-3 font-medium border-l-2 border-gray-300 pl-2 italic">
                    {competition.description}
                  </p>
                )}

                <div className="mt-auto flex items-center justify-between text-xs font-black uppercase text-gray-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-3 h-3 text-p5-red" />
                      <span className="bg-black text-white px-1 transform skew-x-12 inline-block">
                        <span className="transform -skew-x-12 inline-block">载入 / LOADED</span>
                      </span>
                    </div>
                  </div>
                  {competition.website && (
                    <a
                      href={competition.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-p5-red hover:underline decoration-2 underline-offset-4"
                      onClick={(e) => e.stopPropagation()}
                    >
                      官方链接 / WEBSITE
                    </a>
                  )}
                </div>
                {/* Comic dots decoration at bottom */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black opacity-20" style={{ backgroundImage: 'radial-gradient(#d90614 20%, transparent 20%)', backgroundSize: '4px 4px' }}></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="relative p-20 text-center group/no-results overflow-hidden">
          <div className="absolute inset-0 bg-black transform -skew-y-1 z-0 border-y-8 border-p5-red shadow-2xl"></div>
          <div className="p5-halftone absolute inset-0 opacity-10 pointer-events-none"></div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="bg-white p-6 transform rotate-12 border-4 border-black shadow-[8px_8px_0_0_#d90614] mb-8">
              <Trophy className="w-20 h-20 text-black transform -rotate-12" />
            </div>
            <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4" style={{ textShadow: '4px 4px 0px #d90614' }}>
              暂无赛事情报 / NO INTEL FOUND
            </h3>
            <p className="bg-p5-red text-white px-8 py-2 font-black uppercase italic transform -skew-x-12 border-2 border-white">
              数据库中暂无记录 / ARCHIVE IS EMPTY
            </p>
          </div>
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalCount={pagination.count}
        pageSize={12}
        onPageChange={(page) => {
          dispatch(setCurrentPage(page))
          dispatch(fetchCompetitions({ page }))
          window.scrollTo({ top: 0, behavior: 'smooth' })
        }}
      />

      {/* Total Count Display */}
      {competitions.length > 0 && (
        <div className="text-center mt-12 mb-12">
          <div className="inline-block bg-black text-white px-6 py-1 transform -skew-x-12 border-2 border-p5-red shadow-[4px_4px_0_0_black]">
            <span className="transform skew-x-12 inline-block font-black italic uppercase tracking-tighter">
              已截获赛事日志: <span className="text-p5-red">{competitions.length}</span> / <span className="text-p5-red">{pagination.count}</span> BATTLE LOGS RECOVERED
            </span>
          </div>
        </div>
      )}

      {/* Event Calendar Section */}
      <div className="mt-16">
        <EventCalendar />
      </div>
    </div>
  )
}

export default CompetitionsPage