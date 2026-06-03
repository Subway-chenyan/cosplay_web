import { useEffect, useCallback, useState, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { RootState, AppDispatch } from '../store/store'
import { fetchVideos, setSearchQuery, clearSearch, setCurrentPage } from '../store/slices/videosSlice'
import VideoCard from '../components/VideoCard'
import SearchBar from '../components/SearchBar'
import Pagination from '../components/Pagination'
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  Loader,
  Play,
  Search,
  Sparkles,
  Star,
  Tv,
} from 'lucide-react'
import AgentSearchResultPanel from '../components/AgentSearchResultPanel'
import { videoService } from '../services/videoService'
import { agentService } from '../services/agentService'
import { eventService } from '../services/eventService'
import type { AgentSearchResponse } from '../services/agentService'
import type { Event } from '../types'

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
  const [agentResults, setAgentResults] = useState<AgentSearchResponse | null>(() => {
    try {
      const cached = sessionStorage.getItem('agent_search_results')
      return cached ? JSON.parse(cached) : null
    } catch {
      return null
    }
  })
  const [isAgentLoading, setIsAgentLoading] = useState(false)
  const [agentError, setAgentError] = useState<string | null>(null)
  const [searchMode, setSearchMode] = useState<'regular' | 'smart'>('regular')
  const [recentEvents, setRecentEvents] = useState<Event[]>([])
  const [eventsLoading, setEventsLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    try {
      const s = await videoService.getVideoStats()
      setStats(s)
    } catch {
      // 首页统计不是关键路径，失败时回退分页数量。
    }
  }, [])

  const fetchRecentEvents = useCallback(async () => {
    setEventsLoading(true)
    try {
      const event = await eventService.getNearestEvent()
      setRecentEvents(event ? [event] : [])
    } catch (e) {
      console.error('获取近期赛事失败', e)
      setRecentEvents([])
    } finally {
      setEventsLoading(false)
    }
  }, [])

  const formatDateParts = (dateString?: string) => {
    if (!dateString) {
      return { date: '5月18日', weekday: '周日', time: '09:30' }
    }

    const date = new Date(dateString)
    const weekday = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()]
    return {
      date: `${date.getMonth() + 1}月${date.getDate()}日`,
      weekday,
      time: `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`,
    }
  }

  const getEventStatus = (startDate?: string, endDate?: string) => {
    if (!startDate || !endDate) return '进行中'

    const now = new Date()
    const start = new Date(startDate)
    const end = new Date(endDate)

    if (now < start) return '即将开始'
    if (now >= start && now <= end) return '进行中'
    return '已结束'
  }

  useEffect(() => {
    fetchStats()
    fetchRecentEvents()
    const statsInterval = setInterval(fetchStats, 60000)
    const eventsInterval = setInterval(fetchRecentEvents, 60000)
    return () => {
      clearInterval(statsInterval)
      clearInterval(eventsInterval)
    }
  }, [fetchStats, fetchRecentEvents])

  const debounce = useCallback((func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout
    return (...args: any[]) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func(...args), delay)
    }
  }, [])

  const saveScrollPosition = useCallback(() => {
    scrollPositionRef.current = window.scrollY
  }, [])

  const restoreScrollPosition = useCallback(() => {
    if (scrollPositionRef.current > 0) {
      window.scrollTo(0, scrollPositionRef.current)
    }
  }, [])

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
        setTimeout(restoreScrollPosition, 100)
      }
    }
  }, [dispatch, saveScrollPosition, restoreScrollPosition])

  const debouncedFetchVideos = useCallback(
    debounce(fetchVideosData, 300),
    [fetchVideosData, debounce]
  )

  useEffect(() => {
    const hasFiltersChanged = JSON.stringify(filters) !== JSON.stringify(filtersRef.current)
    const hasSearchChanged = searchQuery !== searchQueryRef.current

    if (hasFiltersChanged || hasSearchChanged) {
      filtersRef.current = filters
      searchQueryRef.current = searchQuery
      debouncedFetchVideos({
        page: 1,
        searchQuery,
        filters
      })
    }
  }, [filters, searchQuery, debouncedFetchVideos])

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
  }, [currentPage, fetchVideosData, filters, searchQuery])

  useEffect(() => {
    if (videos.length === 0) {
      fetchVideosData({
        page: currentPage,
        searchQuery,
        filters
      })
    }
  }, [])

  useEffect(() => {
    if (agentResults) {
      sessionStorage.setItem('agent_search_results', JSON.stringify(agentResults))
    } else {
      sessionStorage.removeItem('agent_search_results')
    }
  }, [agentResults])

  const handleVideoClick = (videoId: string) => {
    navigate(`/video/${videoId}`)
  }

  const handleViewAllSchedule = () => {
    navigate('/competitions#schedule')
  }

  const handleClearSearch = () => {
    setInputValue('')
    dispatch(clearSearch() as any)
    setAgentResults(null)
    setAgentError(null)
    sessionStorage.removeItem('agent_search_results')
  }

  const handleSearch = async () => {
    const trimmed = inputValue.trim()

    if (trimmed.length > 0) {
      if (searchMode === 'regular') {
        dispatch(setSearchQuery(inputValue) as any)
        dispatch(setCurrentPage(1) as any)
        setAgentResults(null)
        sessionStorage.removeItem('agent_search_results')
        return
      }

      if (isAgentLoading) return
      setIsAgentLoading(true)
      setAgentError(null)
      try {
        const results = await agentService.search(inputValue)
        setAgentResults(results)
      } catch (searchError) {
        console.error('智能搜索失败:', searchError)
        setAgentError(searchError instanceof Error ? searchError.message : String(searchError))
        dispatch(setSearchQuery(inputValue) as any)
        dispatch(setCurrentPage(1) as any)
        setAgentResults(null)
      } finally {
        setIsAgentLoading(false)
      }
    } else {
      dispatch(setSearchQuery(inputValue) as any)
      dispatch(setCurrentPage(1) as any)
      setAgentResults(null)
      sessionStorage.removeItem('agent_search_results')
    }
  }

  const currentEvent = recentEvents[0]
  const eventDate = formatDateParts(currentEvent?.start_date)
  const eventStatus = getEventStatus(currentEvent?.start_date, currentEvent?.end_date)
  const eventTitle = currentEvent?.title || '2025 华南地区 Cosplay 舞台剧大赛 · 总决赛'
  const eventRegion = currentEvent?.region || '广州 · 保利世贸博览馆'
  const totalVideos = stats?.total_videos ?? pagination.count
  const weeklyVideos = stats?.weekly_new_videos ?? 0

  return (
    <div className="relative overflow-hidden bg-black">
      <section className="relative min-h-[540px] overflow-hidden lg:min-h-[590px]">
        <picture>
          <source media="(max-width: 767px)" srcSet="/assets/new_ui/mb-banner.png" />
          <img
            src="/assets/new_ui/pc-banner.png"
            alt="Cos 舞台剧视频库"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </picture>
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black to-transparent" />
        <div className="relative z-10 mx-auto flex min-h-[540px] max-w-[1500px] flex-col items-center justify-center px-6 pb-14 pt-8 md:items-start md:px-12 lg:min-h-[590px]">
          <img
            src="/assets/new_ui/banner-cutout.png"
            alt="Cos 舞台剧视频库"
            className="w-[min(720px,92vw)] object-contain drop-shadow-[0_16px_24px_rgba(0,0,0,0.65)] md:ml-[8%] md:w-[720px] lg:w-[820px]"
          />
        </div>
      </section>

      <div className="mx-auto -mt-5 max-w-[1500px] px-5 md:px-12">
        <section className="relative z-20 border border-white/18 bg-[#070707]/95 px-5 py-5 shadow-[inset_7px_0_0_#d90614] md:px-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div className="hidden h-16 w-16 items-center justify-center border-2 border-p5-red text-p5-red sm:flex">
                <CalendarDays className="h-10 w-10" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-white/75">
                  <span className="text-xl font-black text-white">当前赛程</span>
                  <span>{eventDate.date}</span>
                  <span>{eventDate.weekday}</span>
                  <span className="bg-p5-red px-2 py-0.5 text-sm font-bold text-white">
                    {eventsLoading ? '赛程同步中' : eventStatus}
                  </span>
                </div>
                <h2 className="mt-2 line-clamp-2 text-[22px] font-black leading-tight text-white md:text-[26px]">
                  {eventTitle}
                </h2>
                <p className="mt-2 text-sm text-white/65 md:text-base">
                  地点：{eventRegion}
                  <span className="mx-4 text-white/30">|</span>
                  {eventDate.time} 开始
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleViewAllSchedule}
              className="inline-flex h-12 items-center justify-center gap-3 border border-white/40 px-8 text-sm font-bold text-white transition hover:border-p5-red hover:bg-p5-red"
            >
              查看全部赛程
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </section>

        <section className="mt-4 border border-white/16 bg-[#070707]/95 p-5 md:p-7">
          <div className="grid gap-5 lg:grid-cols-[170px_1fr] lg:items-center">
            <div className="flex items-center gap-4">
              <Search className="h-12 w-12 text-white" />
              <div>
                <div className="text-[26px] font-black leading-none">搜索</div>
                <div className="mt-1 text-xs uppercase tracking-wide text-white/55">Search</div>
              </div>
            </div>
            <div>
              <div className="mb-3 flex">
                <button
                  type="button"
                  onClick={() => setSearchMode('regular')}
                  className={`h-11 px-7 text-sm font-bold ${searchMode === 'regular' ? 'bg-p5-red text-white' : 'bg-black text-white/65 ring-1 ring-white/12'}`}
                >
                  普通搜索
                </button>
                <button
                  type="button"
                  onClick={() => setSearchMode('smart')}
                  className={`inline-flex h-11 items-center gap-2 px-7 text-sm font-bold ${searchMode === 'smart' ? 'bg-p5-red text-white' : 'bg-black text-white/65 ring-1 ring-white/12'}`}
                >
                  <Sparkles className="h-4 w-4" />
                  智能检索
                </button>
              </div>
              <SearchBar
                value={inputValue}
                onChange={setInputValue}
                onClear={handleClearSearch}
                onSearch={handleSearch}
                placeholder="可搜索：社团名称、奖项名称、组合条件"
              />
            </div>
          </div>
        </section>

        <section className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="border border-white/16 bg-[#070707] p-5">
            <div className="flex items-center gap-6">
              <div className="flex h-20 w-20 items-center justify-center bg-p5-red">
                <Play className="h-11 w-11 fill-current text-white" />
              </div>
              <div>
                <div className="text-base font-bold text-white/80">总视频数</div>
                <div className="mt-1 flex items-end gap-3">
                  <span className="text-5xl font-black leading-none">{totalVideos}</span>
                  <span className="pb-1 text-sm font-bold text-white/75">部</span>
                </div>
              </div>
            </div>
          </div>
          <div className="relative overflow-hidden border border-white/16 bg-[#070707] p-5">
            <div className="absolute bottom-4 right-5 h-20 w-44 opacity-90">
              <svg viewBox="0 0 180 80" className="h-full w-full" aria-hidden="true">
                <polyline fill="none" stroke="#d90614" strokeWidth="3" points="4,60 32,52 54,34 78,49 101,36 127,46 151,25 176,12" />
                {[4, 32, 54, 78, 101, 127, 151, 176].map((x, index) => (
                  <circle key={x} cx={x} cy={[60, 52, 34, 49, 36, 46, 25, 12][index]} r="4" fill="#ff2635" stroke="#fff" strokeWidth="1" />
                ))}
              </svg>
            </div>
            <div className="relative flex items-center gap-6">
              <div className="flex h-20 w-20 items-center justify-center bg-p5-red">
                <Clock3 className="h-11 w-11 text-white" />
              </div>
              <div>
                <div className="text-base font-bold text-white/80">近七日新增</div>
                <div className="mt-1 flex items-end gap-3">
                  <span className="text-5xl font-black leading-none">{weeklyVideos}</span>
                  <span className="pb-1 text-sm font-bold text-white/75">部</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {searchMode === 'smart' && isAgentLoading && (
          <div className="mt-5 border border-p5-red bg-black p-6">
            <div className="flex items-center justify-center gap-3">
              <Sparkles className="h-6 w-6 animate-pulse text-p5-red" />
              <p className="text-lg font-bold text-white">智能检索分析中...</p>
            </div>
          </div>
        )}

        {searchMode === 'smart' && agentError && !isAgentLoading && (
          <div className="mt-5 border border-p5-red bg-black p-6 text-center font-bold text-p5-red">
            智能检索失败：{agentError}
          </div>
        )}

        {searchMode === 'smart' && agentResults && !isAgentLoading && (
          <div className="mt-6">
            <AgentSearchResultPanel result={agentResults} />
          </div>
        )}

        {(searchMode === 'regular' || (!agentResults && searchMode === 'smart')) && !isAgentLoading && (
          <section id="video-records" className="mt-6">
            <div className="mb-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <Star className="h-9 w-9 text-white" />
                <h2 className="text-[28px] font-black leading-none md:text-[34px]">视频记录</h2>
                <span className="pt-2 text-base font-bold text-p5-red">（共 {pagination.count} 条）</span>
              </div>
              <div className="flex items-center gap-3">
                {loading && !isFilterLoading && (
                  <div className="hidden items-center gap-2 text-sm text-white/65 sm:flex">
                    <Loader className="h-4 w-4 animate-spin text-p5-red" />
                    同步中...
                  </div>
                )}
              </div>
            </div>

            {error ? (
              <div className="border border-p5-red bg-[#070707] px-6 py-16 text-center">
                <Tv className="mx-auto mb-5 h-16 w-16 text-white/35" />
                <h3 className="text-2xl font-black text-p5-red">视频加载失败</h3>
                <p className="mt-2 text-white/55">{error}</p>
                <button
                  type="button"
                  onClick={() => dispatch(fetchVideos() as any)}
                  className="mt-6 bg-p5-red px-6 py-3 font-bold text-white"
                >
                  重新加载
                </button>
              </div>
            ) : loading && videos.length === 0 ? (
              <div className="border border-white/16 bg-[#070707] px-6 py-16 text-center">
                <Loader className="mx-auto mb-5 h-12 w-12 animate-spin text-p5-red" />
                <h3 className="text-2xl font-black">正在加载视频...</h3>
              </div>
            ) : videos.length === 0 ? (
              <div className="border border-white/16 bg-[#070707] px-6 py-16 text-center">
                <Tv className="mx-auto mb-5 h-16 w-16 text-white/35" />
                <h3 className="text-2xl font-black">未找到匹配内容</h3>
                <p className="mt-2 text-white/55">当前搜索条件下没有结果</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {videos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onClick={() => handleVideoClick(video.id)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {(searchMode === 'regular' || (!agentResults && searchMode === 'smart')) && !isAgentLoading && (
          <Pagination
            currentPage={currentPage}
            totalCount={pagination.count}
            pageSize={12}
            onPageChange={(page) => {
              dispatch(setCurrentPage(page))
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
        )}
      </div>
    </div>
  )
}

export default HomePage
