import { useEffect, useCallback, useState, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { RootState, AppDispatch } from '../store/store'
import { fetchVideos, setSearchQuery, clearSearch, setCurrentPage } from '../store/slices/videosSlice'
import VideoCard from '../components/VideoCard'
// import ClubCard from '../components/ClubCard'
// import VideoFilters from '../components/VideoFilters'
import SearchBar from '../components/SearchBar'
import Pagination from '../components/Pagination'
import { Loader, Tv, Sparkles, Play } from 'lucide-react'
import { videoService } from '../services/videoService'
import { agentService } from '../services/agentService'
import type { Group } from '../types'

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
  const [, setAgentResults] = useState<{
    text: string
    video_id_list: string[]
    group_id_list: string[]
    videos: unknown[]
    groups: Group[]
  } | null>(null)
  const [isAgentLoading, setIsAgentLoading] = useState(false)
  
  // 赛程折叠状态
  const [isScheduleExpanded, setIsScheduleExpanded] = useState(false)

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

  const handleInputChange = (value: string) => {
    setInputValue(value)
  }

  const handleClearSearch = () => {
    setInputValue('')
    dispatch(clearSearch() as any)
    setAgentResults(null)
  }

  const handleSearch = async () => {
    if (false) {
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
  if (loading && videos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-600" />
          <p className="text-gray-600">正在加载视频...</p>
        </div>
      </div>
    )
  }

  // Agent搜索加载状态（已隐藏）
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
        <div className="absolute inset-0 bg-gradient-to-r from-p5-red/80 to-black -z-0"></div>
        <div className="relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-black mb-4 text-white tracking-tight" style={{ textShadow: '6px 6px 0px #d90614' }}>
            Cosplay 舞台剧库
          </h1>
          <p className="text-lg text-white font-black bg-black inline-block px-6 py-1 border-2 border-p5-red">
            各大赛事数据汇总
          </p>
        </div>
      </div>

      {/* 当前赛程折叠模块 */}
      <div className="relative group">
        <div className="absolute inset-0 bg-p5-red transform translate-x-2 translate-y-2 -skew-x-2 z-0"></div>
        <div className="relative z-10 bg-black border-4 border-p5-red p-6 transform -skew-x-2">
          <div className="flex items-center justify-between mb-4 transform skew-x-2 cursor-pointer" onClick={() => setIsScheduleExpanded(!isScheduleExpanded)}>
            <h2 className="text-2xl font-black text-white uppercase italic border-b-4 border-white">
              CURRENT SCHEDULE / 当前赛程
            </h2>
            <div className="transform skew-x-12">
              <span className="text-white font-black uppercase italic text-sm mr-2">
                {isScheduleExpanded ? 'COLLAPSE' : 'EXPAND'}
              </span>
              <div className={`w-8 h-8 border-2 border-white transform transition-transform ${isScheduleExpanded ? 'rotate-45' : ''}`}>
                <div className="w-full h-0.5 bg-white mt-3"></div>
                {isScheduleExpanded && <div className="w-0.5 h-full bg-white ml-3"></div>}
              </div>
            </div>
          </div>
          
          {isScheduleExpanded && (
            <div className="mt-4 pt-4 border-t-2 border-white border-dashed transform skew-x-2">
              <div id="current" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div id="guangzhou" className="bg-white p-4 transform -skew-x-12 border-2 border-black">
                  <h3 className="font-black text-black italic mb-2">2026CJ广州预选赛</h3>
                  <p className="text-xs font-bold text-gray-600 italic">4月2日 15:06</p>
                  <p className="text-xs font-bold text-p5-red italic mt-1">已结束</p>
                </div>
                <div id="shanghai" className="bg-white p-4 transform -skew-x-12 border-2 border-black">
                  <h3 className="font-black text-black italic mb-2">2026CJ上海预选赛</h3>
                  <p className="text-xs font-bold text-gray-600 italic">4月15日 14:00</p>
                  <p className="text-xs font-bold text-p5-red italic mt-1">进行中</p>
                </div>
                <div id="beijing" className="bg-white p-4 transform -skew-x-12 border-2 border-black">
                  <h3 className="font-black text-black italic mb-2">2026CJ北京预选赛</h3>
                  <p className="text-xs font-bold text-gray-600 italic">4月22日 14:00</p>
                  <p className="text-xs font-bold text-p5-red italic mt-1">进行中</p>
                </div>
              </div>
              <div className="mt-6 text-center">
                <a 
                  href="https://www.cosdrama.cn/competitions#current" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-p5-red text-white font-black uppercase italic transform -skew-x-12 border-2 border-white hover:bg-white hover:text-p5-red transition-all shadow-[4px_4px_0_0_black]"
                >
                  <span className="transform skew-x-12">查看全部赛程 / VIEW ALL SCHEDULES</span>
                  <svg className="w-4 h-4 ml-2 transform skew-x-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <div className="absolute inset-0 bg-black translate-x-2 translate-y-2 z-0"></div>
        <div className="relative z-10 bg-white border-4 border-black p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-black text-black border-b-4 border-p5-red">
              搜索视频
            </h2>
          </div>
          <SearchBar
            value={inputValue}
            onChange={handleInputChange}
            onClear={handleClearSearch}
            onSearch={handleSearch}
            placeholder="请输入标题、社团、比赛或标签"
            className="max-w-2xl"
          />
        </div>
      </div>

      {/* Stats Cards */}
      {(
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="relative group">
            <div className="absolute inset-0 bg-p5-red translate-x-1 translate-y-1 z-0"></div>
            <div className="relative z-10 bg-black p-4 flex items-center justify-between border-2 border-white">
              <div>
                <div className="text-xs font-black text-p5-red">总视频数</div>
                <div className="text-3xl font-black text-white">{stats?.total_videos ?? pagination.count}</div>
              </div>
              <div className="w-12 h-12 bg-p5-red flex items-center justify-center border-2 border-white shadow-[2px_2px_0_0_black]">
                <Play className="text-white w-6 h-6" />
              </div>
            </div>
          </div>
          <div className="relative group">
            <div className="absolute inset-0 bg-white translate-x-1 translate-y-1 z-0"></div>
            <div className="relative z-10 bg-black p-4 flex items-center justify-between border-2 border-p5-red">
              <div>
                <div className="text-xs font-black text-gray-400">近七日新增</div>
                <div className="text-3xl font-black text-p5-red">{stats?.weekly_new_videos ?? 0}</div>
              </div>
              <div className="w-12 h-12 bg-white flex items-center justify-center border-2 border-black">
                <Sparkles className="text-p5-red w-6 h-6" />
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

      {/* Agent Search Results 已停用 */}

      {/* Regular Video Grid - 只在非Agent模式下显示 */}
      {(
        <div className="mt-12">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
            <div className="relative group">
              <div className="absolute inset-0 bg-p5-red translate-x-1 translate-y-1 z-0 shadow-lg"></div>
              <div className="relative z-10 bg-black px-6 py-2 border-2 border-white flex items-baseline space-x-3">
                <h2 className="text-xl md:text-3xl font-black text-white tracking-tight">
                  视频记录
                </h2>
                <span className="text-p5-red font-black text-sm">
                  （共 {pagination.count} 条）
                </span>
              </div>
            </div>

            {loading && !isFilterLoading && (
              <div className="flex items-center space-x-2 bg-black text-white px-4 py-1 border border-p5-red shadow-[2px_2px_0_0_black]">
                <Loader className="w-4 h-4 animate-spin text-p5-red" />
                <span className="text-xs font-black">同步中...</span>
              </div>
            )}
          </div>

          {videos.length === 0 ? (
            <div className="relative p-16 text-center group/no-results overflow-hidden">
              <div className="absolute inset-0 bg-black z-0 border-y-8 border-p5-red shadow-2xl"></div>
              <div className="p5-halftone absolute inset-0 opacity-10 pointer-events-none"></div>

              <div className="relative z-10 flex flex-col items-center">
                <div className="bg-white p-6 border-4 border-black shadow-[8px_8px_0_0_#d90614] mb-8">
                  <Tv className="w-20 h-20 text-black" />
                </div>
                <h3 className="text-4xl font-black text-white tracking-tight mb-4" style={{ textShadow: '4px 4px 0px #d90614' }}>
                  未找到匹配内容
                </h3>
                <p className="bg-p5-red text-white px-6 py-1 font-black border-2 border-white">
                  当前搜索条件下没有结果
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
      {(
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
