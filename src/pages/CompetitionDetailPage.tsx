import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store/store'
import { fetchCompetitions } from '../store/slices/competitionsSlice'
import { fetchCompetitionVideos } from '../store/slices/videosSlice'
import { fetchCompetitionAwards, fetchCompetitionAwardRecords } from '../store/slices/awardsSlice'
import { fetchGroups } from '../store/slices/groupsSlice'
import VideoCard from '../components/VideoCard'
import NoVideoAwardCard from '../components/NoVideoAwardCard'
import {
  getCompetitionCustomConfig,
  getAwardSortWeight
} from '../config/competitionCustomConfig'
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

  // 获取当前比赛的自定义配置
  const customConfig = getCompetitionCustomConfig(id || '')

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
      // 使用更大的pageSize确保获取更多数据，避免筛选时数据不全
      dispatch(fetchCompetitionVideos({ competitionId: id, year: selectedYear || undefined, page: 1, pageSize: 500 }) as any)
      dispatch(fetchCompetitionAwards(id) as any)
      dispatch(fetchCompetitionAwardRecords({ competitionId: id }) as any)
    }
  }, [dispatch, id, selectedYear])

  const competition = competitions.find(c => c.id === id)

  // 获取该比赛的所有视频（fetchCompetitionVideos 已按 competitionId 拉取）
  const competitionVideos = videos

  // 获取所有年份（包括视频年份和获奖记录年份）
  const videoYears = competitionVideos
    .map(video => video.year)
    .filter(year => year !== null && year !== undefined)

  const awardRecordYears = awardRecords
    .map(record => record.competition_year_detail?.year)
    .filter(year => year !== null && year !== undefined)

  const availableYears = [...new Set([...videoYears, ...awardRecordYears])]
    .sort((a, b) => b - a) // 按年份倒序排列

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

  // 奖项排序函数
  const sortAwards = (awards: any[]) => {
    const awardConfig = customConfig.awardOrder

    if (!awardConfig || awardConfig.sortRule === 'default') {
      // 使用默认权重排序
      return [...awards].sort((a, b) => {
        const weightA = getAwardSortWeight(a.name)
        const weightB = getAwardSortWeight(b.name)
        if (weightA !== weightB) {
          return weightB - weightA // 权重高的在前
        }
        return a.name.localeCompare(b.name) // 权重相同时按名称排序
      })
    }

    if (awardConfig.sortRule === 'alphabetical') {
      // 按字母顺序排序
      return [...awards].sort((a, b) => a.name.localeCompare(b.name))
    }

    if (awardConfig.sortRule === 'custom' && awardConfig.priorityAwards) {
      // 自定义排序
      const priorityIds = awardConfig.priorityAwards
      const priorityAwards: any[] = []
      const otherAwards: any[] = []

      awards.forEach(award => {
        const priorityIndex = priorityIds.indexOf(award.id)
        if (priorityIndex !== -1) {
          priorityAwards[priorityIndex] = award
        } else {
          otherAwards.push(award)
        }
      })

      // 过滤掉undefined元素并合并
      const sortedPriorityAwards = priorityAwards.filter(Boolean)
      const sortedOtherAwards = otherAwards.sort((a, b) => {
        const weightA = getAwardSortWeight(a.name)
        const weightB = getAwardSortWeight(b.name)
        if (weightA !== weightB) {
          return weightB - weightA
        }
        return a.name.localeCompare(b.name)
      })

      return [...sortedPriorityAwards, ...sortedOtherAwards]
    }

    return awards
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
      let recordsForAward = awardRecords.filter(record =>
        record.award === award.id && !record.video
      )

      // 应用筛选条件
      if (viewMode === 'year' && selectedYear) {
        recordsForAward = recordsForAward.filter(record =>
          record.competition_year_detail?.year === selectedYear
        )
      } else if (viewMode === 'award' && selectedAward) {
        recordsForAward = recordsForAward.filter(record => record.award === selectedAward)
      }

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
          className="group flex items-center bg-black text-white px-4 py-2 transform -skew-x-12 hover:bg-p5-red transition-all shadow-[4px_4px_0_0_rgba(0,0,0,0.2)]"
        >
          <span className="flex items-center transform skew-x-12">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-black uppercase italic">Back to Database / 返回比赛列表</span>
          </span>
        </Link>
      </div>

      {/* 比赛头部信息 */}
      <div className="relative group">
        <div className="absolute inset-0 bg-black transform translate-x-2 translate-y-2 -skew-x-1 z-0"></div>
        <div
          className="relative z-10 bg-white border-4 border-black p-8 md:p-12 transform -skew-x-1 overflow-hidden"
          style={customConfig.bannerBackground?.type === 'image' ? {
            backgroundImage: `url(${customConfig.bannerBackground.value})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          } : {}}
        >
          {/* Overlay for readability if it's an image */}
          {customConfig.bannerBackground?.type === 'image' && (
            <div className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-[2px]"></div>
          )}

          <div className="absolute top-0 right-0 w-64 h-64 p5-halftone opacity-10 -rotate-45 translate-x-32 -translate-y-32"></div>

          <div className="relative z-20 text-center transform skew-x-1">
            <div className="w-20 h-20 bg-p5-red transform rotate-12 border-4 border-black shadow-[4px_4px_0_0_black] flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-white transform -rotate-12" />
            </div>

            <h1 className="text-4xl md:text-6xl font-black text-white uppercase italic leading-none mb-4" style={{ textShadow: '4px 4px 0px #000000' }}>
              {competition.name}
            </h1>

            <p className="text-lg md:text-xl text-white font-bold bg-black inline-block px-6 py-1 transform -skew-x-12 shadow-[4px_4px_0_0_#d90614]">
              <span className="transform skew-x-12 inline-block italic">
                {competition.description || 'FIELD INVESTIGATION UNDERWAY'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* 筛选器 */}
      <div className="relative group">
        <div className="absolute inset-0 bg-black transform translate-x-2 translate-y-2 -skew-x-1 z-0"></div>
        <div className="relative z-10 bg-white border-4 border-black p-8 transform -skew-x-1">
          <div className="flex items-center justify-between mb-8 transform skew-x-1">
            <div className="flex items-center space-x-4">
              <div className="bg-black p-2 transform -rotate-6 border-2 border-p5-red">
                <Filter className="w-6 h-6 text-white transform rotate-6" />
              </div>
              <h2 className="text-2xl font-black text-black uppercase italic border-b-4 border-p5-red">
                FILTER INTEL / 筛选记录
              </h2>
            </div>
            {(selectedYear || selectedAward) && (
              <button
                onClick={resetFilters}
                className="bg-black text-white px-4 py-1 text-xs font-black uppercase italic transform -skew-x-12 hover:bg-p5-red transition-all"
              >
                <span className="transform skew-x-12 inline-block flex items-center">
                  <X className="w-4 h-4 mr-1" /> CLEAR FILTER
                </span>
              </button>
            )}
          </div>

          <div className="flex space-x-4 mb-8 transform skew-x-1">
            <button
              onClick={() => {
                setViewMode('year')
                setSelectedAward(null)
              }}
              className={`px-6 py-2 transform -skew-x-12 font-black uppercase italic transition-all ${viewMode === 'year'
                ? 'bg-p5-red text-white shadow-[4px_4px_0_0_black]'
                : 'bg-gray-100 text-black border-2 border-black hover:bg-black hover:text-white'
                }`}
            >
              <span className="transform skew-x-12 inline-block">SORT BY YEAR</span>
            </button>
            <button
              onClick={() => {
                setViewMode('award')
                setSelectedYear(null)
              }}
              className={`px-6 py-2 transform -skew-x-12 font-black uppercase italic transition-all ${viewMode === 'award'
                ? 'bg-p5-red text-white shadow-[4px_4px_0_0_black]'
                : 'bg-gray-100 text-black border-2 border-black hover:bg-black hover:text-white'
                }`}
            >
              <span className="transform skew-x-12 inline-block">SORT BY AWARD</span>
            </button>
          </div>

          {/* 年份筛选 */}
          {viewMode === 'year' && (
            <div className="transform skew-x-1">
              <h3 className="text-sm font-black text-black uppercase italic mb-4 border-l-4 border-p5-red pl-2">TARGET CALENDAR / 目标年份</h3>
              <div className="flex flex-wrap gap-3">
                {availableYears.map(year => (
                  <button
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className={`px-6 py-2 transform rotate-1 font-black italic border-2 transition-all ${selectedYear === year
                      ? 'bg-p5-red border-black text-white shadow-[4px_4px_0_0_black]'
                      : 'bg-white border-black text-black hover:bg-black hover:text-white'
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
            <div className="transform skew-x-1">
              <h3 className="text-sm font-black text-black uppercase italic mb-4 border-l-4 border-p5-red pl-2">REWARD LIST / 奖项筛选</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortAwards(competitionAwards).map(award => {
                  const awardInfo = createAwardInfo(award.name)
                  const isSelected = selectedAward === award.id
                  return (
                    <button
                      key={award.id}
                      onClick={() => setSelectedAward(award.id)}
                      className={`p-4 transform transition-all border-4 ${isSelected
                        ? `bg-black border-p5-red text-white shadow-[8px_8px_0_0_#d90614]`
                        : 'bg-white border-black text-black hover:border-p5-red'
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`${isSelected ? 'text-white' : 'text-p5-red'}`}>
                            {awardInfo.icon}
                          </div>
                          <span className="font-black uppercase italic">{award.name}</span>
                        </div>
                        {isSelected && <ChevronRight className="w-5 h-5 text-p5-red" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 当前筛选状态显示 */}
      {(selectedYear || selectedAward) && (
        <div className="relative transform skew-x-1 py-4 px-8">
          <div className="flex items-center bg-black text-white p-4 border-l-8 border-p5-red shadow-[8px_8px_0_0_black] border-2 border-white">
            <Filter className="w-8 h-8 text-p5-red mr-6 animate-pulse" />
            <span className="text-xl font-black uppercase italic tracking-tighter p5-text-shadow-red">
              正在提取情报 / INVESTIGATING :
              {selectedYear && <span className="text-white ml-3 bg-p5-red px-3 py-0.5 transform -skew-x-12 inline-block">
                <span className="transform skew-x-12 inline-block font-black">{selectedYear} YEARS</span>
              </span>}
              {selectedAward && <span className="text-white ml-3 bg-p5-red px-3 py-0.5 transform -skew-x-12 inline-block">
                <span className="transform skew-x-12 inline-block font-black">{competitionAwards.find(a => a.id === selectedAward)?.name} RECORDS</span>
              </span>}
            </span>
          </div>
        </div>
      )}

      {/* 获奖作品展示 - 合并有视频和无视频的记录 */}
      {(Object.keys(awardedVideos).length > 0 || Object.keys(awardRecordsWithoutVideo).length > 0 || (viewMode === 'year' && selectedYear)) && (
        <div className="space-y-12">
          <div className="flex items-center space-x-4 transform skew-x-1">
            <div className="bg-p5-red p-3 transform rotate-12 border-2 border-black">
              <Trophy className="w-8 h-8 text-white transform -rotate-12" />
            </div>
            <h2 className="text-3xl font-black text-black uppercase italic border-b-8 border-p5-red">
              TARGET INTEL SECURED / 获奖作品
            </h2>
          </div>

          {/* 遍历奖项，根据筛选模式显示 */}
          {sortAwards(competitionAwards)
            .filter(award => {
              // 如果是按奖项筛选，只显示选中的奖项
              if (viewMode === 'award' && selectedAward) {
                return award.id === selectedAward
              }
              // 其他情况显示所有有内容的奖项
              return true
            })
            .map((award) => {
              const awardInfo = createAwardInfo(award.name)
              const videosForAward = awardedVideos[award.id]?.videos || []
              const recordsForAward = awardRecordsWithoutVideo[award.id]?.records || []

              // 如果该奖项既没有视频也没有记录，则跳过
              if (videosForAward.length === 0 && recordsForAward.length === 0) {
                return null
              }

              const totalCount = videosForAward.length + recordsForAward.length

              return (
                <div key={award.id} className="relative group overflow-visible">
                  <div className="absolute inset-0 bg-black transform translate-x-1 translate-y-1 -skew-x-1 z-0"></div>
                  <div className="relative z-10 bg-white border-4 border-black transform -skew-x-1 overflow-hidden">
                    {/* 奖项标题 */}
                    <div className={`p-6 border-b-4 border-black relative`}>
                      <div className="absolute inset-0 opacity-20 p5-halftone"></div>
                      <div className="flex items-center justify-between transform skew-x-1 relative z-10">
                        <div className="flex items-center space-x-4">
                          <div className="text-p5-red transform rotate-12 scale-150">
                            {awardInfo.icon}
                          </div>
                          <h3 className="text-3xl font-black text-black uppercase italic tracking-tighter" style={{ textShadow: '2px 2px 0px #d90614' }}>
                            {awardInfo.label}
                          </h3>
                        </div>
                        <div className="bg-black text-white px-6 py-1 font-black uppercase italic transform -skew-x-12 shadow-[4px_4px_0_0_#d90614] border border-white">
                          <span className="transform skew-x-12 inline-block">
                            已发现 {totalCount} 条情报 / RECORDS FOUND
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 作品网格 - 合并显示有视频和无视频的记录 */}
                    <div className="p-8 transform skew-x-1">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {/* 有视频的记录 */}
                        {videosForAward.map((video) => {
                          const awardRecord = awardRecords.find(record =>
                            record.video === video.id && record.award === award.id
                          )

                          return (
                            <div key={video.id} className="relative group/video">
                              <div className="absolute inset-0 bg-p5-red transform translate-x-1 translate-y-1 z-0 opacity-0 group-hover/video:opacity-20 transition-opacity"></div>
                              <div className="relative z-10">
                                <VideoCard
                                  video={video}
                                  onClick={() => handleVideoClick(video.id)}
                                  dramaName={awardRecord?.drama_name}
                                />
                              </div>
                              {/* 奖项标识 */}
                              <div className={`absolute -top-2 -right-2 z-20 bg-p5-red text-white p-1.5 transform rotate-6 border-2 border-black`}>
                                {awardInfo.icon}
                              </div>
                              {/* 年份标识 */}
                              {video.year && (
                                <div className="absolute top-2 left-2 bg-black text-white px-2 py-0.5 font-black text-xs z-20">
                                  {video.year}
                                </div>
                              )}
                            </div>
                          )
                        })}

                        {/* 无视频的记录 */}
                        {recordsForAward.map((record) => {
                          const awardInfo = createAwardInfo(award.name)

                          return (
                            <div key={record.id} className="transform hover:scale-105 transition-transform">
                              <NoVideoAwardCard
                                awardRecord={record}
                                awardInfo={awardInfo}
                              />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>
      )}

      {/* 参与作品展示 */}
      {unawardedVideos.length > 0 && viewMode === 'year' && selectedYear && (
        <div className="relative group mt-16">
          <div className="absolute inset-0 bg-black opacity-10 transform translate-x-2 translate-y-2 -skew-x-1 z-0"></div>
          <div className="relative z-10 bg-white border-4 border-black p-8 shadow-[8px_8px_0_0_black]">
            {/* 标题 */}
            <div className="flex items-center justify-between mb-8 border-b-8 border-black pb-4">
              <div className="flex items-center space-x-4">
                <div className="bg-black p-2 transform -rotate-12 border-2 border-white">
                  <Users className="w-8 h-8 text-white transform rotate-12" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-black uppercase italic tracking-tighter">OTHERS / 参与作品</h2>
                  <p className="text-xs font-black text-gray-500 uppercase italic">ADDITIONAL RECORDS FROM {selectedYear} CALENDAR</p>
                </div>
              </div>
              <div className="bg-black text-white px-6 py-1 font-black uppercase italic transform -skew-x-12">
                <span className="transform skew-x-12 inline-block">
                  {unawardedVideos.length} ENTRIES
                </span>
              </div>
            </div>

            {/* 视频网格 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {unawardedVideos.map((video) => (
                <div key={video.id} className="relative">
                  <VideoCard
                    video={video}
                    onClick={() => handleVideoClick(video.id)}
                  />
                  {/* 年份标识 */}
                  {video.year && (
                    <div className="absolute top-2 left-2 bg-black text-white px-2 py-0.5 font-black text-xs z-20">
                      {video.year}
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
        <div className="relative group mt-16">
          <div className="absolute inset-0 bg-black opacity-10 transform translate-x-3 translate-y-3 -skew-x-1 z-0"></div>
          <div className="relative z-10 bg-white border-4 border-black p-10 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 p5-halftone opacity-5 -rotate-12 translate-x-32 -translate-y-32"></div>

            <div className="flex items-center space-x-4 mb-10 border-b-8 border-p5-red pb-4">
              <div className="bg-p5-red p-3 transform rotate-12 border-2 border-black">
                <Calendar className="w-8 h-8 text-white transform -rotate-12" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-black uppercase italic tracking-tighter">CALENDAR ARCHIVE / 年份概览</h2>
                <p className="text-xs font-black text-gray-400 mt-1">CHOOSE A TARGET YEAR TO INVESTIGATE</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {availableYears.map(year => {
                const yearVideos = competitionVideos.filter(v => v.year === year)
                const yearAwardedVideos = yearVideos.filter(video => {
                  return awardRecords.some(record => record.video === video.id)
                })

                return (
                  <div
                    key={year}
                    onClick={() => setSelectedYear(year)}
                    className="relative group/year-card cursor-pointer transform transition-all duration-300 hover:-translate-y-2 hover:scale-105"
                  >
                    <div className="absolute inset-0 bg-black group-hover/year-card:bg-p5-red transition-colors transform translate-x-1 translate-y-1 -skew-x-2 z-0 shadow-lg"></div>
                    <div className="relative z-10 bg-white border-2 border-black p-8 text-center flex flex-col items-center justify-center h-full transform -skew-x-2">
                      <div className="transform skew-x-2">
                        <div className="text-6xl font-black text-black italic mb-4 leading-none" style={{ textShadow: '4px 4px 0px #d90614' }}>
                          {year}
                        </div>
                        <div className="text-sm font-black text-gray-500 uppercase italic tracking-widest space-y-1">
                          <div className="flex items-center justify-center space-x-2">
                            <Play className="w-4 h-4 text-p5-red" />
                            <span>{yearVideos.length} RECORDS</span>
                          </div>
                          <div className="flex items-center justify-center space-x-2">
                            <Trophy className="w-4 h-4 text-yellow-600" />
                            <span>{yearAwardedVideos.length} AWARDS</span>
                          </div>
                        </div>
                        <div className="mt-6 flex justify-center">
                          <div className="w-10 h-10 bg-black rounded-full flex items-center justify-center group-hover/year-card:bg-p5-red transition-colors">
                            <ChevronRight className="w-6 h-6 text-white" />
                          </div>
                        </div>
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