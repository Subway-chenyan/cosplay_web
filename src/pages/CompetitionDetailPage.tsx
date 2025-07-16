import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store/store'
import { fetchCompetitions } from '../store/slices/competitionsSlice'
import { fetchVideos, fetchCompetitionVideos } from '../store/slices/videosSlice'
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
  Filter,
  ChevronDown
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
  const [selectedAward, setSelectedAward] = useState<string>('all')
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all')
  const [showFilters, setShowFilters] = useState(false)

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
      dispatch(fetchCompetitionVideos({ competitionId: id }) as any)
      dispatch(fetchCompetitionAwards(id) as any)
      dispatch(fetchCompetitionAwardRecords({ competitionId: id }) as any)
    }
  }, [dispatch, id])

  const competition = competitions.find(c => c.id === id)
  
  // 获取该比赛的所有视频（通过比赛ID筛选）
  const competitionVideos = videos.filter(video => 
    video.competition === competition?.id
  )

  // 获取可用的年份列表
  const availableYears = [...new Set(competitionVideos
    .map(video => video.competition_year)
    .filter(year => year !== undefined)
  )].sort((a, b) => (b as number) - (a as number))

  // 根据实际的奖项数据构建奖项类型列表
  const createAwardTypeFromLevel = (level: string) => {
    const lowerLevel = level.toLowerCase()
    
    // 根据level字符串判断奖项类型
    if (lowerLevel.includes('金') || lowerLevel.includes('gold') || lowerLevel === '1') {
      return {
        value: level,
        label: level.includes('金') ? level : '金奖',
        color: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        icon: <Trophy className="w-4 h-4 text-yellow-600" />
      }
    } else if (lowerLevel.includes('银') || lowerLevel.includes('silver') || lowerLevel === '2') {
      return {
        value: level,
        label: level.includes('银') ? level : '银奖',
        color: 'bg-gray-100',
        textColor: 'text-gray-800',
        icon: <Medal className="w-4 h-4 text-gray-600" />
      }
    } else if (lowerLevel.includes('铜') || lowerLevel.includes('bronze') || lowerLevel === '3') {
      return {
        value: level,
        label: level.includes('铜') ? level : '铜奖',
        color: 'bg-orange-100',
        textColor: 'text-orange-800',
        icon: <Award className="w-4 h-4 text-orange-600" />
      }
    } else if (lowerLevel.includes('特别') || lowerLevel.includes('special')) {
      return {
        value: level,
        label: level.includes('特别') ? level : '特别奖',
        color: 'bg-purple-100',
        textColor: 'text-purple-800',
        icon: <Star className="w-4 h-4 text-purple-600" />
      }
    } else {
      return {
        value: level,
        label: level || '其他奖项',
        color: 'bg-blue-100',
        textColor: 'text-blue-800',
        icon: <Users className="w-4 h-4 text-blue-600" />
      }
    }
  }

  // 从实际的奖项数据构建筛选选项
  const awardTypes = [
    { 
      value: 'all', 
      label: '全部奖项', 
      color: 'bg-gray-100', 
      textColor: 'text-gray-700', 
      icon: <Filter className="w-4 h-4" /> 
    },
    ...competitionAwards.map(award => createAwardTypeFromLevel(award.level)),
    { 
      value: 'none', 
      label: '参与作品', 
      color: 'bg-blue-100', 
      textColor: 'text-blue-800', 
      icon: <Users className="w-4 h-4 text-blue-600" /> 
    }
  ]

  // 去重
  const uniqueAwardTypes = awardTypes.filter((type, index, self) => 
    index === self.findIndex(t => t.value === type.value)
  )

  // 根据筛选条件过滤视频
  const filteredVideos = competitionVideos.filter(video => {
    // 年份筛选
    if (selectedYear !== 'all' && video.competition_year !== selectedYear) {
      return false
    }

    // 奖项筛选
    if (selectedAward !== 'all') {
      const videoAwardRecord = awardRecords.find(record => record.video === video.id)
      if (selectedAward === 'none') {
        return !videoAwardRecord // 没有获奖的视频
      } else {
        // 查找对应的奖项
        const award = competitionAwards.find(a => a.id === videoAwardRecord?.award)
        return award && award.level === selectedAward
      }
    }

    return true
  })

  const handleVideoClick = (videoId: string) => {
    navigate(`/video/${videoId}`)
  }

  const getAwardInfo = (videoId: string) => {
    const awardRecord = awardRecords.find(record => record.video === videoId)
    if (!awardRecord) return null

    const award = competitionAwards.find(a => a.id === awardRecord.award)
    if (!award) return null

    const awardType = createAwardTypeFromLevel(award.level)
    return { award, awardRecord, type: awardType }
  }

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
          
          <h1 className="text-5xl font-bold mb-4">{competition.name}</h1>
          <div className="flex items-center justify-center space-x-3 text-yellow-100 mb-6">
            <Calendar className="w-6 h-6" />
            <span className="text-2xl font-semibold">{competition.year}年</span>
          </div>
          
          <p className="text-xl text-yellow-100 max-w-3xl mx-auto leading-relaxed mb-8">
            {competition.description}
          </p>

          {/* 比赛统计 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white bg-opacity-15 rounded-xl p-6 backdrop-blur-sm">
              <div className="text-4xl font-bold mb-2">{competitionAwards.length}</div>
              <div className="text-yellow-100 text-lg">设置奖项</div>
            </div>
            <div className="bg-white bg-opacity-15 rounded-xl p-6 backdrop-blur-sm">
              <div className="text-4xl font-bold mb-2">{competitionVideos.length}</div>
              <div className="text-yellow-100 text-lg">参赛作品</div>
            </div>
            <div className="bg-white bg-opacity-15 rounded-xl p-6 backdrop-blur-sm">
              <div className="text-4xl font-bold mb-2">{availableYears.length}</div>
              <div className="text-yellow-100 text-lg">参与年份</div>
            </div>
          </div>
        </div>
      </div>

      {/* 筛选模块 */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        {/* 筛选头部 */}
        <div 
          className="p-6 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200 cursor-pointer"
          onClick={() => setShowFilters(!showFilters)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                <Filter className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">奖项与年份筛选</h2>
                <p className="text-gray-600">筛选您感兴趣的作品类型和年份</p>
              </div>
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {/* 筛选内容 */}
        <div className={`transition-all duration-300 overflow-hidden ${showFilters ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="p-6 space-y-6">
            {/* 奖项筛选 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Trophy className="w-5 h-5 text-yellow-500 mr-2" />
                奖项类型
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {uniqueAwardTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setSelectedAward(type.value)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedAward === type.value
                        ? 'border-primary-500 bg-primary-50 shadow-md scale-105'
                        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className={`w-12 h-12 ${type.color} rounded-lg flex items-center justify-center`}>
                        {type.icon}
                      </div>
                      <span className={`text-sm font-medium ${selectedAward === type.value ? 'text-primary-700' : type.textColor}`}>
                        {type.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* 年份筛选 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 text-blue-500 mr-2" />
                参赛年份
              </h3>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setSelectedYear('all')}
                  className={`px-6 py-3 rounded-xl border-2 transition-all duration-200 ${
                    selectedYear === 'all'
                      ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                      : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  全部年份
                </button>
                {availableYears.map((year) => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year as number)}
                    className={`px-6 py-3 rounded-xl border-2 transition-all duration-200 ${
                      selectedYear === year
                        ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm'
                    }`}
                  >
                    {year}年
                  </button>
                ))}
              </div>
            </div>

            {/* 筛选结果统计 */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">当前筛选结果:</span>
                <span className="text-xl font-bold text-primary-600">{filteredVideos.length} 个作品</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 视频展示区域 */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Play className="w-6 h-6 text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-900">
              舞台剧作品 ({filteredVideos.length})
            </h2>
          </div>
          {selectedAward !== 'all' || selectedYear !== 'all' ? (
            <button
              onClick={() => {
                setSelectedAward('all')
                setSelectedYear('all')
              }}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              清除筛选
            </button>
          ) : null}
        </div>

        {filteredVideos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVideos.map((video) => {
              const awardInfo = getAwardInfo(video.id)
              return (
                <div key={video.id} className="relative">
                  <VideoCard
                    video={video}
                    onClick={() => handleVideoClick(video.id)}
                  />
                  {/* 奖项标识 */}
                  {awardInfo && (
                    <div className={`absolute top-2 right-2 ${awardInfo.type?.color} rounded-lg px-2 py-1 flex items-center space-x-1 shadow-sm backdrop-blur-sm`}>
                      {awardInfo.type?.icon}
                      <span className={`text-xs font-medium ${awardInfo.type?.textColor}`}>
                        {awardInfo.type?.label}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无匹配作品</h3>
            <p className="text-gray-600">请尝试调整筛选条件</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default CompetitionDetailPage 