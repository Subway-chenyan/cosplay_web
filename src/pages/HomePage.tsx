import { useEffect, useCallback, useState, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { RootState, AppDispatch } from '../store/store'
import { fetchVideos, setSearchQuery, clearSearch, setCurrentPage } from '../store/slices/videosSlice'
import VideoCard from '../components/VideoCard'
import ClubCard from '../components/ClubCard'
// import VideoFilters from '../components/VideoFilters'
import SearchBar from '../components/SearchBar'
import Pagination from '../components/Pagination'
import { Loader, Tv, Sparkles, List, Info, Play } from 'lucide-react'
import { videoService } from '../services/videoService'
import { agentService } from '../services/agentService'
import type { Video, Group } from '../types'

function HomePage() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { videos, loading, error, pagination, searchQuery, filters, currentPage } = useSelector((state: RootState) => state.videos)
  const [inputValue, setInputValue] = useState(searchQuery)
  const [isFilterLoading, setIsFilterLoading] = useState(false)
  const scrollPositionRef = useRef<number>(0)
  const filtersRef = useRef(filters)
  const searchQueryRef = useRef(searchQuery)

  const [stats, setStats] = useState<{ total_videos: number; weekly_new_videos: number } | null>(null)
  const [isAgentMode, setIsAgentMode] = useState(false)
  const [agentResults, setAgentResults] = useState<{
    text: string
    video_id_list: string[]
    group_id_list: string[]
    videos: Video[]
    groups: Group[]
  } | null>(null)
  const [isAgentLoading, setIsAgentLoading] = useState(false)
  const [showAgentDebug, setShowAgentDebug] = useState(false)

  const fetchStats = useCallback(async () => {
    try {
      const s = await videoService.getVideoStats()
      setStats(s)
    } catch (e) {
      // ignore
    }
  }, [])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 60000)
    return () => clearInterval(interval)
  }, [fetchStats])

  // 防抖函数
  const debounce = useCallback((func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout
    return (...args: any[]) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func(...args), delay)
    }
  }, [])

  // 保存滚动位置
  const saveScrollPosition = useCallback(() => {
    scrollPositionRef.current = window.scrollY
  }, [])

  // 恢复滚动位置
  const restoreScrollPosition = useCallback(() => {
    if (scrollPositionRef.current > 0) {
      window.scrollTo(0, scrollPositionRef.current)
    }
  }, [])

  // 获取视频数据
  const fetchVideosData = useCallback(async (params?: {
    page?: number
    filters?: any
    searchQuery?: string
  }) => {
    const isFilterChange = JSON.stringify(params?.filters) !== JSON.stringify(filtersRef.current) ||
      params?.searchQuery !== searchQueryRef.current

    if (isFilterChange) {
      setIsFilterLoading(true)
      saveScrollPosition()
    }

    try {
      await dispatch(fetchVideos(params) as any)
    } finally {
      if (isFilterChange) {
        setIsFilterLoading(false)
        // 延迟恢复滚动位置，确保DOM已更新
        setTimeout(restoreScrollPosition, 100)
      }
    }
  }, [dispatch, saveScrollPosition, restoreScrollPosition])

  // 防抖的筛选处理
  const debouncedFetchVideos = useCallback(
    debounce(fetchVideosData, 300),
    [fetchVideosData, debounce]
  )

  // 监听筛选和搜索变化
  useEffect(() => {
    const hasFiltersChanged = JSON.stringify(filters) !== JSON.stringify(filtersRef.current)
    const hasSearchChanged = searchQuery !== searchQueryRef.current

    if (hasFiltersChanged || hasSearchChanged) {
      filtersRef.current = filters
      searchQueryRef.current = searchQuery
      debouncedFetchVideos({
        page: 1, // 筛选时重置到第一页
        searchQuery,
        filters
      })
    }
  }, [filters, searchQuery, debouncedFetchVideos])

  // 监听页码变化（非筛选导致的）
  useEffect(() => {
    const hasFiltersChanged = JSON.stringify(filters) !== JSON.stringify(filtersRef.current)
    const hasSearchChanged = searchQuery !== searchQueryRef.current

    if (!hasFiltersChanged && !hasSearchChanged) {
      fetchVideosData({
        page: currentPage,
        searchQuery,
        filters
      })
    }
  }, [currentPage, fetchVideosData])

  // 组件挂载时的初始加载
  useEffect(() => {
    if (videos.length === 0) {
      fetchVideosData({
        page: currentPage,
        searchQuery,
        filters
      })
    }
  }, []) // 只在组件挂载时执行一次

  const handleVideoClick = (videoId: string) => {
    navigate(`/video/${videoId}`)
  }

  const handleClubClick = (clubId: string | number) => {
    navigate(`/group/${clubId}`)
  }

  const handleInputChange = (value: string) => {
    setInputValue(value)
  }

  const handleClearSearch = () => {
    setInputValue('')
    dispatch(clearSearch() as any)
    setAgentResults(null)
  }

  const handleSearch = async () => {
    if (isAgentMode) {
      // Agent搜索模式
      setIsAgentLoading(true)
      try {
        const results = await agentService.search(inputValue)
        setAgentResults({
          text: results.text || '',
          video_id_list: results.video_id_list || [],
          group_id_list: results.group_id_list || [],
          videos: results.videos || [],
          groups: results.groups || []
        })
      } catch (error) {
        console.error('Agent搜索失败:', error)
        // 如果Agent搜索失败，回退到普通搜索
        dispatch(setSearchQuery(inputValue) as any)
        dispatch(setCurrentPage(1) as any)
      } finally {
        setIsAgentLoading(false)
      }
    } else {
      // 普通搜索模式
      dispatch(setSearchQuery(inputValue) as any)
      dispatch(setCurrentPage(1) as any)
      setAgentResults(null)
    }
  }

  // 首次加载状态
  if (loading && videos.length === 0 && !isAgentMode) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-600" />
          <p className="text-gray-600">正在加载视频...</p>
        </div>
      </div>
    )
  }

  // Agent搜索加载状态
  if (isAgentLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Sparkles className="w-8 h-8 animate-pulse mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">AI正在智能搜索中...</p>
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
            onClick={() => dispatch(fetchVideos() as any)}
            className="mt-4 btn-primary"
          >
            重新加载
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="relative bg-black p-8 overflow-hidden border-b-8 border-p5-red shadow-[8px_8px_0_0_black]">
        <div className="absolute inset-0 bg-gradient-to-r from-p5-red/80 to-black transform skew-x-12 scale-150 origin-bottom-left -z-0"></div>
        <div className="relative z-10 text-center">
          <h1 className="text-6xl font-black mb-4 text-white uppercase italic tracking-tighter" style={{ textShadow: '6px 6px 0px #d90614' }}>
            COSPLAY / 舞台剧库
          </h1>
          <p className="text-lg text-white font-black bg-black inline-block px-6 py-1 transform skew-x-12 border-2 border-p5-red">
            <span className="transform -skew-x-12 inline-block italic">各大赛事数据汇总 · THE PHANTOM THIEVES</span>
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <div className="absolute inset-0 bg-black transform translate-x-2 translate-y-2 -skew-x-2 z-0"></div>
        <div className="relative z-10 bg-white border-4 border-black p-6 transform -skew-x-2">
          <div className="flex items-center justify-between mb-6 transform skew-x-2">
            <h2 className="text-2xl font-black text-black uppercase italic border-b-4 border-p5-red">
              {isAgentMode ? 'AI INVESTIGATION / 智能搜索' : 'DATABASE SEARCH / 搜索视频'}
            </h2>
            <button
              onClick={() => setIsAgentMode(!isAgentMode)}
              className={`flex items-center space-x-2 px-6 py-2 transform -skew-x-12 transition-all font-black uppercase italic ${isAgentMode
                ? 'bg-purple-600 text-white shadow-[4px_4px_0_0_black]'
                : 'bg-black text-white hover:bg-p5-red'
                }`}
            >
              <span className="transform skew-x-12 flex items-center">
                {isAgentMode ? <Sparkles className="w-4 h-4 mr-2" /> : <List className="w-4 h-4 mr-2" />}
                {isAgentMode ? 'Agent Mode' : 'Standard'}
              </span>
            </button>
          </div>
          <div className="transform skew-x-2">
            <SearchBar
              value={inputValue}
              onChange={handleInputChange}
              onClear={handleClearSearch}
              onSearch={handleSearch}
              placeholder={
                isAgentMode
                  ? 'Tell us what you are looking for... (e.g. 2025 ChinaJoy Gold Winners)'
                  : 'Title, Group, Competition, Tag...'
              }
              className="max-w-2xl"
            />
          </div>
          {isAgentMode && (
            <p className="text-xs text-gray-500 mt-4 font-bold uppercase tracking-widest bg-gray-100 p-2 transform skew-x-2">
              💡 Agent mode supports natural language search for both videos and clubs.
            </p>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {!isAgentMode && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-p5-red transform translate-x-1 translate-y-1 -skew-x-12 z-0"></div>
            <div className="relative z-10 bg-black p-4 flex items-center justify-between transform -skew-x-12 border-2 border-white">
              <div className="transform skew-x-12">
                <div className="text-xs font-black text-p5-red uppercase italic">Total Records / 总视频数</div>
                <div className="text-3xl font-black text-white italic">{stats?.total_videos ?? pagination.count}</div>
              </div>
              <div className="w-12 h-12 bg-p5-red transform rotate-12 flex items-center justify-center border-2 border-white shadow-[2px_2px_0_0_black]">
                <Play className="text-white w-6 h-6 transform -rotate-12" />
              </div>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-white transform translate-x-1 translate-y-1 -skew-x-12 z-0"></div>
            <div className="relative z-10 bg-black p-4 flex items-center justify-between transform -skew-x-12 border-2 border-p5-red">
              <div className="transform skew-x-12">
                <div className="text-xs font-black text-gray-400 uppercase italic">近七日情报 / NEW ADDITIONS</div>
                <div className="text-3xl font-black text-p5-red italic">{stats?.weekly_new_videos ?? 0}</div>
              </div>
              <div className="w-12 h-12 bg-white transform -rotate-6 flex items-center justify-center border-2 border-black">
                <Sparkles className="text-p5-red w-6 h-6 transform rotate-6" />
              </div>
            </div>
          </div>
        </div>
      )}{/* Filters */}
      {/* <VideoFilters /> */}

      {/* 筛选加载指示器 */}
      {/* {isFilterLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-center space-x-2">
            <Loader className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text蓝-600 text-sm">正在筛选...</span>
          </div>
        </div>
      )} */}

      {/* Agent Search Results */}
      {isAgentMode && agentResults && (
        <div className="space-y-8">
          {/* Agent搜索结果头部 - 显示LLM文本总结 */}
          <div className="bg-black border-4 border-p5-red p-8 transform -skew-x-2 relative overflow-hidden shadow-[8px_8px_0_0_black]">
            <div className="absolute top-0 right-0 w-32 h-32 p5-halftone opacity-20 rotate-12 translate-x-12 -translate-y-12"></div>
            <div className="flex items-center space-x-3 mb-6 transform skew-x-2">
              <Sparkles className="w-8 h-8 text-p5-red" />
              <span className="text-2xl font-black text-white italic uppercase tracking-tighter p5-text-shadow-red">搜查报告 / INVESTIGATION REPORT</span>
            </div>
            <div className="text-white transform skew-x-2 relative z-10">
              <p className="text-lg font-bold leading-relaxed italic border-l-4 border-p5-red pl-6">{agentResults.text}</p>
            </div>

            {(agentResults.video_id_list.length > 0 || agentResults.group_id_list.length > 0) && (
              <div className="mt-8 pt-6 border-t-2 border-p5-red border-dashed transform skew-x-2">
                <p className="text-p5-red font-black italic uppercase text-sm">
                  已截获 {agentResults.video_id_list.length} 条记录 & {agentResults.group_id_list.length} 个组织情报 / ASSETS CAPTURED
                </p>
                {/* 调试状态标签 */}
                <div className="mt-4 flex flex-wrap gap-3">
                  <span className="inline-flex items-center px-3 py-1 bg-white text-black font-black text-xs uppercase italic transform -skew-x-12 border border-black shadow-[2px_2px_0_0_rgba(217,6,20,0.5)]">
                    影像标记: {agentResults.video_id_list.length}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 bg-white text-black font-black text-xs uppercase italic transform -skew-x-12 border border-black shadow-[2px_2px_0_0_rgba(217,6,20,0.5)]">
                    解析视频: {agentResults.videos.length}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 bg-white text-black font-black text-xs uppercase italic transform -skew-x-12 border border-black shadow-[2px_2px_0_0_rgba(217,6,20,0.5)]">
                    组织标记: {agentResults.group_id_list.length}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 bg-white text-black font-black text-xs uppercase italic transform -skew-x-12 border border-black shadow-[2px_2px_0_0_rgba(217,6,20,0.5)]">
                    解析组织: {agentResults.groups.length}
                  </span>
                </div>

                {/* 调试信息面板 */}
                {showAgentDebug && (
                  <div className="mt-6 p-6 bg-white border-4 border-black transform -skew-x-1 shadow-[4px_4px_0_0_#d90614]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 transform skew-x-1">
                      <div>
                        <h4 className="text-sm font-black text-p5-red uppercase italic border-b-2 border-black inline-block mb-3">影像特征 / VIDEO ID</h4>
                        <div className="text-xs font-bold text-black break-all leading-tight">
                          {agentResults.video_id_list.slice(0, 5).join(', ')}
                          {agentResults.video_id_list.length > 5 && ' ...'}
                        </div>
                        <h4 className="mt-6 text-sm font-black text-p5-red uppercase italic border-b-2 border-black inline-block mb-3">核心数据 / DECODED VIDEO</h4>
                        <ul className="space-y-1">
                          {agentResults.videos.slice(0, 5).map((v) => (
                            <li key={v.id} className="text-xs font-bold text-black italic">
                              - {v.title}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-p5-red uppercase italic border-b-2 border-black inline-block mb-3">组织特征 / ALLIANCE ID</h4>
                        <div className="text-xs font-bold text-black break-all leading-tight">
                          {agentResults.group_id_list.slice(0, 5).join(', ')}
                          {agentResults.group_id_list.length > 5 && ' ...'}
                        </div>
                        <h4 className="mt-6 text-sm font-black text-p5-red uppercase italic border-b-2 border-black inline-block mb-3">核心成员 / DECODED ALLIANCE</h4>
                        <ul className="space-y-1">
                          {agentResults.groups.slice(0, 5).map((g) => (
                            <li key={g.id} className="text-xs font-bold text-black italic">
                              - {g.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* 调试开关按钮 */}
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAgentDebug((v) => !v)}
                    className="flex items-center space-x-2 px-4 py-2 bg-p5-red text-white font-black uppercase italic transform -skew-x-12 border-2 border-white hover:bg-white hover:text-black transition-all"
                  >
                    <Info className="w-5 h-5 transform skew-x-12" />
                    <span className="transform skew-x-12">{showAgentDebug ? '隐藏核心数据 / HIDE DEBUG' : '解析核心数据 / DECODE INTEL'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 视频结果 - 基于video_id_list判断 */}
          {agentResults.video_id_list.length > 0 && (
            <div>
              <h2 className="text-3xl font-black text-black uppercase italic mb-8 border-b-4 border-p5-red inline-block">
                关联影像 / RELATED VIDEOS
                <span className="ml-4 text-sm font-black text-gray-400">
                  ({agentResults.video_id_list.length} 条记录)
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {agentResults.videos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onClick={() => handleVideoClick(video.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 社团结果 - 基于group_id_list判断 */}
          {agentResults.group_id_list.length > 0 && (
            <div>
              <h2 className="text-3xl font-black text-black uppercase italic mb-8 border-b-4 border-p5-red inline-block">
                关联组织 / RELATED ALLIANCE
                <span className="ml-4 text-sm font-black text-gray-400">
                  ({agentResults.group_id_list.length} 个)
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agentResults.groups.map((group) => (
                  <ClubCard
                    key={group.id}
                    club={group}
                    onClick={() => handleClubClick(group.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 无结果 - 基于ID列表判断 */}
          {agentResults.video_id_list.length === 0 && agentResults.group_id_list.length === 0 && (
            <div className="relative p-20 text-center group/no-results overflow-hidden">
              <div className="absolute inset-0 bg-black transform -skew-y-1 z-0 border-y-8 border-p5-red shadow-2xl"></div>
              <div className="p5-halftone absolute inset-0 opacity-10 pointer-events-none"></div>

              <div className="relative z-10 flex flex-col items-center">
                <div className="bg-white p-6 transform rotate-12 border-4 border-black shadow-[8px_8px_0_0_#d90614] mb-8">
                  <Sparkles className="w-20 h-20 text-black transform -rotate-12" />
                </div>
                <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4" style={{ textShadow: '4px 4px 0px #d90614' }}>
                  未截获记录 / NO RECORDS FOUND
                </h3>
                <p className="bg-p5-red text-white px-8 py-2 font-black uppercase italic transform -skew-x-12 border-2 border-white">
                  尝试调整搜寻关键词 / TRY ANOTHER KEYWORD
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Regular Video Grid - 只在非Agent模式下显示 */}
      {!isAgentMode && (
        <div className="mt-12">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-p5-red transform translate-x-1 translate-y-1 -skew-x-12 z-0 shadow-lg"></div>
              <div className="relative z-10 bg-black px-6 py-2 transform -skew-x-12 border-2 border-white flex items-baseline space-x-3">
                <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">
                  行动记录 / FIELD LOGS
                </h2>
                <span className="text-p5-red font-black italic text-sm">
                  ({pagination.count} 件情报捕获 / RECORDS SECURED)
                </span>
              </div>
            </div>

            {loading && !isFilterLoading && (
              <div className="flex items-center space-x-2 bg-black text-white px-4 py-1 transform -skew-x-12 border border-p5-red shadow-[2px_2px_0_0_black]">
                <Loader className="w-4 h-4 animate-spin text-p5-red" />
                <span className="text-xs font-black uppercase italic tracking-widest">同步中... / SYNCHRONIZING...</span>
              </div>
            )}
          </div>

          {videos.length === 0 ? (
            <div className="relative p-16 text-center group/no-results overflow-hidden">
              <div className="absolute inset-0 bg-black transform -skew-y-2 z-0 border-y-8 border-p5-red shadow-2xl"></div>
              <div className="p5-halftone absolute inset-0 opacity-10 pointer-events-none"></div>

              <div className="relative z-10 flex flex-col items-center">
                <div className="bg-white p-6 transform rotate-12 border-4 border-black shadow-[8px_8px_0_0_#d90614] mb-8">
                  <Tv className="w-20 h-20 text-black transform -rotate-12" />
                </div>
                <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4" style={{ textShadow: '4px 4px 0px #d90614' }}>
                  目标丢失 / TARGET ESCAPED
                </h3>
                <p className="bg-p5-red text-white px-6 py-1 font-black uppercase italic transform -skew-x-12 border-2 border-white">
                  无匹配搜索条件的情报 / NO DATA MATCHES
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onClick={() => handleVideoClick(video.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {!isAgentMode && (
        <Pagination
          currentPage={currentPage}
          totalCount={pagination.count}
          pageSize={12}
          onPageChange={(page) => {
            dispatch(setCurrentPage(page))
            // Scroll to top
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      )}
    </div>
  )
}

export default HomePage