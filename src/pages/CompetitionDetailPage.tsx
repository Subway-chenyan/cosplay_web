import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store/store'
import { fetchCompetitions } from '../store/slices/competitionsSlice'
import { fetchCompetitionVideos } from '../store/slices/videosSlice'
import { fetchCompetitionAwards, fetchCompetitionAwardRecords } from '../store/slices/awardsSlice'
import { fetchGroups } from '../store/slices/groupsSlice'
import VideoCard from '../components/VideoCard'
import { 
  ArrowLeft, 
  Trophy, 
  Award,
  Calendar,
  Users,
  Play,
  Medal,
  Star,
  ChevronRight,
  Filter,
  X
} from 'lucide-react'

function CompetitionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { competitions } = useSelector((state: RootState) => state.competitions)
  const { videos } = useSelector((state: RootState) => state.videos)
  const { competitionAwards, awardRecords } = useSelector((state: RootState) => state.awards)
  const { groups } = useSelector((state: RootState) => state.groups)

  // 筛选状态
  const [selectedYear, setSelectedYear] = useState<number | null>(null)
  const [selectedAward, setSelectedAward] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'year' | 'award'>('year')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  useEffect(() => {
    if (competitions.length === 0) {
      dispatch(fetchCompetitions() as any)
    }
    if (groups.length === 0) {
      dispatch(fetchGroups() as any)
    }
  }, [dispatch, competitions.length, groups.length])

  // 获取比赛数据
  useEffect(() => {
    if (id) {
      setPage(1)
      setHasMore(true)
      dispatch(fetchCompetitionVideos({ competitionId: id, year: selectedYear || undefined, page: 1, pageSize: 100 }) as any)
      dispatch(fetchCompetitionAwards(id) as any)
      dispatch(fetchCompetitionAwardRecords({ competitionId: id }) as any)
    }
  }, [dispatch, id, selectedYear])

  const competition = competitions.find(c => c.id === id)
  
  // 获取该比赛的所有视频（fetchCompetitionVideos 已按 competitionId 拉取）
  const competitionVideos = videos

  // 获取所有年份
  const availableYears = [...new Set(competitionVideos
    .map(video => video.year)
    .filter(year => year !== null && year !== undefined)
  )].sort((a, b) => b - a) // 按年份倒序排列

  // 根据筛选条件获取视频
  const getFilteredVideos = () => {
    if (viewMode === 'year' && selectedYear) {
      return competitionVideos.filter(video => video.year === selectedYear)
    } else if (viewMode === 'award' && selectedAward) {
      return competitionVideos.filter(video => {
        return awardRecords.some(record => 
          record.video === video.id && record.award === selectedAward
        )
      })
    }
    return competitionVideos
  }

  const filteredVideos = getFilteredVideos()

  const handleVideoClick = (videoId: string) => {
    navigate(`/video/${videoId}`)
  }

  // 根据奖项名称创建奖项信息（动态生成）
  const createAwardInfo = (name: string) => {
    const lowerName = name.toLowerCase()
    
    // 根据奖项名称动态生成样式
    if (lowerName.includes('金') || lowerName.includes('gold') || lowerName.includes('一等奖')) {
      return {
        label: name,
        color: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        borderColor: 'border-yellow-200',
        icon: <Trophy className="w-5 h-5 text-yellow-600" />
      }
    } else if (lowerName.includes('银') || lowerName.includes('silver') || lowerName.includes('二等奖')) {
      return {
        label: name,
        color: 'bg-gray-100',
        textColor: 'text-gray-800',
        borderColor: 'border-gray-200',
        icon: <Medal className="w-5 h-5 text-gray-600" />
      }
    } else if (lowerName.includes('铜') || lowerName.includes('bronze') || lowerName.includes('三等奖')) {
      return {
        label: name,
        color: 'bg-orange-100',
        textColor: 'text-orange-800',
        borderColor: 'border-orange-200',
        icon: <Award className="w-5 h-5 text-orange-600" />
      }
    } else if (lowerName.includes('特别') || lowerName.includes('special') || lowerName.includes('优秀')) {
      return {
        label: name,
        color: 'bg-purple-100',
        textColor: 'text-purple-800',
        borderColor: 'border-purple-200',
        icon: <Star className="w-5 h-5 text-purple-600" />
      }
    } else if (lowerName.includes('最佳')) {
      return {
        label: name,
        color: 'bg-blue-100',
        textColor: 'text-blue-800',
        borderColor: 'border-blue-200',
        icon: <Trophy className="w-5 h-5 text-blue-600" />
      }
    } else {
      // 默认样式
      return {
        label: name,
        color: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-200',
        icon: <Award className="w-5 h-5 text-green-600" />
      }
    }
  }

  // 获取获奖视频（基于筛选条件）
  const getAwardedVideos = () => {
    const awardedVideos: { [awardId: string]: { award: any; videos: any[] } } = {}
    
    competitionAwards.forEach(award => {
      const videosForAward = filteredVideos.filter(video => {
        const awardRecord = awardRecords.find(record => 
          record.video === video.id && record.award === award.id
        )
        return awardRecord !== undefined
      })
      
      if (videosForAward.length > 0) {
        awardedVideos[award.id] = {
          award,
          videos: videosForAward
        }
      }
    })
    
    return awardedVideos
  }

  // 获取未获奖视频（基于筛选条件）
  const getUnawardedVideos = () => {
    return filteredVideos.filter(video => {
      const hasAward = awardRecords.some(record => record.video === video.id)
      return !hasAward
    })
  }

  // 获取没有视频的获奖记录（基于筛选条件）
  const getAwardRecordsWithoutVideo = () => {
    const recordsWithoutVideo: { [awardId: string]: { award: any; records: any[] } } = {}
    
    competitionAwards.forEach(award => {
      const recordsForAward = awardRecords.filter(record => 
        record.award === award.id && !record.video
      )
      
      if (recordsForAward.length > 0) {
        recordsWithoutVideo[award.id] = {
          award,
          records: recordsForAward
        }
      }
    })
    
    return recordsWithoutVideo
  }

  const awardedVideos = getAwardedVideos()
  const unawardedVideos = getUnawardedVideos()
  const awardRecordsWithoutVideo = getAwardRecordsWithoutVideo()

  // 重置筛选
  const resetFilters = () => {
    setSelectedYear(null)
    setSelectedAward(null)
    setViewMode('year')
    setPage(1)
    setHasMore(true)
  }

  // 加载更多视频
  const loadMoreVideos = async () => {
    if (!hasMore || isLoadingMore) return
    
    setIsLoadingMore(true)
    const nextPage = page + 1
    
    try {
      const response = await dispatch(fetchCompetitionVideos({ 
        competitionId: id!, 
        year: selectedYear || undefined, 
        page: nextPage, 
        pageSize: 100,
        append: true 
      }) as any)
      
      if (response.payload && response.payload.results.length < 100) {
        setHasMore(false)
      }
      setPage(nextPage)
    } finally {
      setIsLoadingMore(false)
    }
  }

  // 监听滚动事件实现无限滚动
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop 
        >= document.documentElement.offsetHeight - 100
      ) {
        loadMoreVideos()
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [page, hasMore, isLoadingMore, selectedYear])

  if (!competition) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-50 rounded-lg p-8 max-w-md mx-auto">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">比赛未找到</h3>
          <p className="text-gray-600 mb-4">请检查比赛链接是否正确</p>
          <Link to="/competitions" className="btn-primary">
            返回比赛列表
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 返回按钮 */}
      <div className="flex items-center">
        <Link
          to="/competitions"
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回比赛列表</span>
        </Link>
      </div>

      {/* 比赛头部信息 */}
      <div className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-2xl text-white p-8 shadow-xl">
        <div className="text-center">
          <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-4xl font-bold mb-4">{competition.name}</h1>
          
          <p className="text-xl text-yellow-100 max-w-3xl mx-auto leading-relaxed mb-8">
            {competition.description}
          </p>


        </div>
      </div>

      {/* 筛选器 */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center space-x-4 mb-4">
          <Filter className="w-6 h-6 text-gray-600" />
          <h2 className="text-xl font-bold text-gray-900">筛选条件</h2>
          {(selectedYear || selectedAward) && (
            <button
              onClick={resetFilters}
              className="flex items-center space-x-1 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X className="w-4 h-4" />
              <span className="text-sm">清除筛选</span>
            </button>
          )}
        </div>

        {/* 查看模式选择 */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => {
              setViewMode('year')
              setSelectedAward(null)
            }}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'year'
                ? 'bg-primary-100 text-primary-700 border border-primary-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            按年份查看
          </button>
          <button
            onClick={() => {
              setViewMode('award')
              setSelectedYear(null)
            }}
            className={`px-4 py-2 rounded-lg transition-colors ${
              viewMode === 'award'
                ? 'bg-primary-100 text-primary-700 border border-primary-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            按奖项查看
          </button>
        </div>

        {/* 年份筛选 */}
        {viewMode === 'year' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">选择年份</h3>
            <div className="flex flex-wrap gap-3">
              {availableYears.map(year => (
                <button
                  key={year}
                  onClick={() => setSelectedYear(year)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedYear === year
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {year}年
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 奖项筛选 */}
        {viewMode === 'award' && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">选择奖项</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {competitionAwards.map(award => {
                const awardInfo = createAwardInfo(award.name)
                return (
                  <button
                    key={award.id}
                    onClick={() => setSelectedAward(award.id)}
                    className={`p-3 rounded-lg transition-colors border ${
                      selectedAward === award.id
                        ? `${awardInfo.color} ${awardInfo.textColor} ${awardInfo.borderColor}`
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      {awardInfo.icon}
                      <span className="font-medium">{award.name}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* 当前筛选状态显示 */}
      {(selectedYear || selectedAward) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-blue-600" />
            <span className="text-blue-800 font-medium">
              当前筛选: 
              {selectedYear && ` ${selectedYear}年`}
              {selectedAward && ` ${competitionAwards.find(a => a.id === selectedAward)?.name}`}
            </span>
          </div>
        </div>
      )}

      {/* 获奖作品展示 */}
      {Object.keys(awardedVideos).length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <Trophy className="w-6 h-6 text-yellow-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              获奖作品
              {selectedYear && ` (${selectedYear}年)`}
              {selectedAward && ` (${competitionAwards.find(a => a.id === selectedAward)?.name})`}
            </h2>
          </div>
          
          {Object.entries(awardedVideos).map(([awardId, { award, videos }]) => {
            const awardInfo = createAwardInfo(award.name)
            return (
              <div key={awardId} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                {/* 奖项标题 */}
                <div className={`p-6 ${awardInfo.color} border-b ${awardInfo.borderColor}`}>
                  <div className="flex items-center space-x-3">
                    {awardInfo.icon}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{awardInfo.label}</h3>
                    </div>
                    <div className="ml-auto">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${awardInfo.color} ${awardInfo.textColor}`}>
                        {videos.length} 个作品
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* 视频网格 */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {videos.map((video) => (
                      <div key={video.id} className="relative">
                        <VideoCard
                          video={video}
                          onClick={() => handleVideoClick(video.id)}
                        />
                        {/* 奖项标识 */}
                        <div className={`absolute top-2 right-2 ${awardInfo.color} rounded-lg px-2 py-1 flex items-center space-x-1 shadow-sm backdrop-blur-sm`}>
                          {awardInfo.icon}
                          <span className={`text-xs font-medium ${awardInfo.textColor}`}>
                            {awardInfo.label}
                          </span>
                        </div>
                        {/* 年份标识 */}
                    {video.year && (
                      <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white rounded px-2 py-1 text-xs">
                        {video.year}年
                      </div>
                    )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 没有视频的获奖记录展示 */}
      {Object.keys(awardRecordsWithoutVideo).length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <Medal className="w-6 h-6 text-purple-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              获奖记录（无视频）
              {selectedYear && ` (${selectedYear}年)`}
              {selectedAward && ` (${competitionAwards.find(a => a.id === selectedAward)?.name})`}
            </h2>
          </div>
          
          {Object.entries(awardRecordsWithoutVideo).map(([awardId, { award, records }]) => {
            const awardInfo = createAwardInfo(award.name)
            return (
              <div key={awardId} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                {/* 奖项标题 */}
                <div className={`p-6 ${awardInfo.color} border-b ${awardInfo.borderColor}`}>
                  <div className="flex items-center space-x-3">
                    {awardInfo.icon}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{awardInfo.label}</h3>
                    </div>
                    <div className="ml-auto">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${awardInfo.color} ${awardInfo.textColor}`}>
                        {records.length} 个记录
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* 获奖记录列表 */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {records.map((record) => (
                      <div key={record.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="space-y-2">
                          {/* 剧名 */}
                          {record.drama_name && (
                            <div className="flex items-center space-x-2">
                              <Play className="w-4 h-4 text-gray-500" />
                              <span className="font-medium text-gray-900">{record.drama_name}</span>
                            </div>
                          )}
                          
                          {/* 社团名称 */}
                          {record.group_name && (
                            <div className="flex items-center space-x-2">
                              <Users className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-700">{record.group_name}</span>
                            </div>
                          )}
                          
                          {/* 描述 */}
                          {record.description && (
                            <div className="text-sm text-gray-600">
                              {record.description}
                            </div>
                          )}
                          
                          {/* 无视频提示 */}
                          <div className="flex items-center space-x-1 text-xs text-gray-500 bg-gray-100 rounded px-2 py-1">
                            <X className="w-3 h-3" />
                            <span>暂无视频</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 参与作品展示 */}
      {unawardedVideos.length > 0 && viewMode === 'year' && selectedYear && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* 标题 */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
            <div className="flex items-center space-x-3">
              <Users className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">参与作品 ({selectedYear}年)</h2>
                <p className="text-gray-600">其他参赛的优秀作品</p>
              </div>
              <div className="ml-auto">
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {unawardedVideos.length} 个作品
                </span>
              </div>
            </div>
          </div>
          
          {/* 视频网格 */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {unawardedVideos.map((video) => (
                <div key={video.id} className="relative">
                  <VideoCard
                    video={video}
                    onClick={() => handleVideoClick(video.id)}
                  />
                  {/* 年份标识 */}
                  {video.year && (
                    <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white rounded px-2 py-1 text-xs">
                      {video.year}年
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 空状态 */}
      {filteredVideos.length === 0 && (
        <div className="text-center py-12">
          <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无相关作品</h3>
          <p className="text-gray-600">
            {selectedYear && `${selectedYear}年`}
            {selectedAward && competitionAwards.find(a => a.id === selectedAward)?.name}
            暂无相关作品
          </p>
        </div>
      )}

      {/* 所有年份概览（当没有选择筛选时） */}
      {!selectedYear && !selectedAward && availableYears.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
            <div className="flex items-center space-x-3">
              <Calendar className="w-6 h-6 text-green-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">年份概览</h2>
                <p className="text-gray-600">选择年份查看详细内容</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableYears.map(year => {
                const yearVideos = competitionVideos.filter(v => v.year === year)
                const yearAwardedVideos = yearVideos.filter(video => {
                  return awardRecords.some(record => record.video === video.id)
                })
                
                return (
                  <div
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200 cursor-pointer hover:shadow-md transition-all"
                  >
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-2">{year}</div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>参赛作品: {yearVideos.length}</div>
                        <div>获奖作品: {yearAwardedVideos.length}</div>
                      </div>
                      <div className="mt-3">
                        <ChevronRight className="w-5 h-5 text-blue-600 mx-auto" />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CompetitionDetailPage