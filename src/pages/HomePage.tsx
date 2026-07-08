import { useEffect, useCallback, useMemo, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { RootState, AppDispatch } from '../store/store'
import { fetchHomeVideos } from '../store/slices/homeVideosSlice'
import VideoCard from '../components/VideoCard'
import SearchBar from '../components/SearchBar'
import Pagination from '../components/Pagination'
import HomeServerFilters from '../components/HomeServerFilters'
import type { AsyncSelectOption } from '../components/AsyncMultiSelect'
import {
  CalendarDays,
  ChevronRight,
  Clock3,
  ListChecks,
  Loader,
  Play,
  Search,
  Sparkles,
  Star,
  Tv,
} from 'lucide-react'
import AgentSearchResultPanel from '../components/AgentSearchResultPanel'
import { videoService } from '../services/videoService'
import { competitionService } from '../services/competitionService'
import { groupService } from '../services/groupService'
import { agentService } from '../services/agentService'
import { eventService } from '../services/eventService'
import {
  parseHomeFilterParams,
  serializeHomeFilterParams,
} from '../features/serverFilters/query'
import type { AgentSearchResponse } from '../services/agentService'
import type { CountFilterOption, Event, HomeFilterState } from '../types'

function HomePage() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const searchParamsKey = searchParams.toString()
  const appliedFilters = useMemo(
    () => parseHomeFilterParams(new URLSearchParams(searchParamsKey)),
    [searchParamsKey],
  )
  const { videos, loading, error, count } = useSelector(
    (state: RootState) => state.homeVideos,
  )
  const [inputValue, setInputValue] = useState(appliedFilters.query)
  const [yearOptions, setYearOptions] = useState<CountFilterOption[]>([])
  const [selectedCompetitions, setSelectedCompetitions] = useState<AsyncSelectOption[]>([])
  const [selectedGroups, setSelectedGroups] = useState<AsyncSelectOption[]>([])

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

  useEffect(() => {
    setInputValue(appliedFilters.query)
  }, [appliedFilters.query])

  useEffect(() => {
    const request = dispatch(fetchHomeVideos(appliedFilters))
    return () => request.abort()
  }, [appliedFilters, dispatch])

  useEffect(() => {
    const controller = new AbortController()
    videoService.getFilterOptions(controller.signal)
      .then((options) => setYearOptions(options.years))
      .catch((optionsError) => {
        if (!controller.signal.aborted) console.error('获取年份筛选项失败', optionsError)
      })
    return () => controller.abort()
  }, [])

  useEffect(() => {
    let active = true
    Promise.all(appliedFilters.competitionIds.map(async (id) => {
      const competition = await competitionService.getCompetitionById(id)
      return { id: competition.id, name: competition.name }
    })).then((options) => {
      if (active) setSelectedCompetitions(options)
    }).catch((selectionError) => {
      if (active) console.error('恢复已选比赛失败', selectionError)
    })
    return () => { active = false }
  }, [appliedFilters.competitionIds])

  useEffect(() => {
    let active = true
    Promise.all(appliedFilters.groupIds.map(async (id) => {
      const group = await groupService.getGroupById(id)
      return { id: group.id, name: group.name }
    })).then((options) => {
      if (active) setSelectedGroups(options)
    }).catch((selectionError) => {
      if (active) console.error('恢复已选社团失败', selectionError)
    })
    return () => { active = false }
  }, [appliedFilters.groupIds])

  const loadCompetitions = useCallback(async (query: string, signal: AbortSignal) => {
    const response = await competitionService.searchCompetitions(query, signal)
    return response.results.map((competition) => ({
      id: competition.id,
      name: competition.name,
    }))
  }, [])

  const loadGroups = useCallback(async (query: string, signal: AbortSignal) => {
    const response = await groupService.searchGroups(query, signal)
    return response.results.map((group) => ({ id: group.id, name: group.name }))
  }, [])

  const applyFilters = useCallback((filters: HomeFilterState) => {
    setSearchParams(serializeHomeFilterParams(filters))
  }, [setSearchParams])

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

  const handleViewChinaJoyFinalists = () => {
    navigate('/competitions/chinajoy-2026-finalists')
  }

  const handleClearSearch = () => {
    setInputValue('')
    applyFilters({ ...appliedFilters, query: '', page: 1 })
    setAgentResults(null)
    setAgentError(null)
    sessionStorage.removeItem('agent_search_results')
  }

  const handleSearch = async () => {
    const trimmed = inputValue.trim()

    if (trimmed.length > 0) {
      if (searchMode === 'regular') {
        applyFilters({ ...appliedFilters, query: trimmed, page: 1 })
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
        applyFilters({ ...appliedFilters, query: trimmed, page: 1 })
        setAgentResults(null)
      } finally {
        setIsAgentLoading(false)
      }
    } else {
      applyFilters({ ...appliedFilters, query: '', page: 1 })
      setAgentResults(null)
      sessionStorage.removeItem('agent_search_results')
    }
  }

  const currentEvent = recentEvents[0]
  const eventDate = formatDateParts(currentEvent?.start_date)
  const eventStatus = getEventStatus(currentEvent?.start_date, currentEvent?.end_date)
  const eventTitle = currentEvent?.title || '2025 华南地区 Cosplay 舞台剧大赛 · 总决赛'
  const eventRegion = currentEvent?.region || '广州 · 保利世贸博览馆'
  const shouldShowChinaJoyFinalists =
    (currentEvent?.start_date?.startsWith('2026') ?? false) &&
    /CJ|ChinaJoy|总决赛|總決賽/i.test(`${eventTitle} ${eventRegion} ${currentEvent?.competition_name || ''}`)
  const totalVideos = stats?.total_videos ?? count
  const weeklyVideos = stats?.weekly_new_videos ?? 0

  return (
    <div className="relative overflow-hidden bg-black">
      <div className="absolute inset-0">
        <img
          src="/assets/new_ui/back.png"
          alt="Background"
          className="w-full h-full object-cover"
        />
      </div>
      <section className="relative min-h-[400px] overflow-hidden lg:min-h-[450px]">
        <div className="relative z-10 mx-auto flex min-h-[400px] max-w-[1500px] flex-col items-center justify-center px-6 pb-14 pt-8 md:items-start md:px-12 lg:min-h-[450px]">
          <img
            src="/assets/new_ui/banner-cutout.png"
            alt="Cos 舞台剧视频库"
            className="w-[min(720px,92vw)] object-contain drop-shadow-[0_16px_24px_rgba(0,0,0,0.65)] md:ml-[8%] md:w-[720px] lg:w-[820px]"
          />
        </div>
      </section>

      <div className="mx-auto -mt-5 max-w-[1500px] px-5 md:px-12">
        <div className="p5-halftone absolute inset-0 opacity-10 pointer-events-none"></div>
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
            <div className="flex flex-col gap-3 sm:flex-row">
              {shouldShowChinaJoyFinalists && (
                <button
                  type="button"
                  onClick={handleViewChinaJoyFinalists}
                  className="inline-flex h-12 items-center justify-center gap-3 border border-p5-red bg-p5-red px-7 text-sm font-bold text-white transition hover:bg-white hover:text-black"
                >
                  <ListChecks className="h-5 w-5" />
                  晋级名单
                </button>
              )}
              <button
                type="button"
                onClick={handleViewAllSchedule}
                className="inline-flex h-12 items-center justify-center gap-3 border border-white/40 px-8 text-sm font-bold text-white transition hover:border-p5-red hover:bg-p5-red"
              >
                查看全部赛程
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </section>

        <section className="mt-4 border border-white/16 bg-[#070707]/95 p-5 md:p-7 p5-comic-box">
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

        {searchMode === 'regular' && (
          <HomeServerFilters
            value={appliedFilters}
            years={yearOptions}
            competitionOptions={selectedCompetitions}
            groupOptions={selectedGroups}
            loadCompetitions={loadCompetitions}
            loadGroups={loadGroups}
            onApply={applyFilters}
            onClear={() => applyFilters({
              query: appliedFilters.query,
              competitionIds: [],
              groupIds: [],
              page: 1,
            })}
          />
        )}

        <section className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="border border-white/16 bg-[#070707] p-5 p5-comic-box">
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
          <div className="relative overflow-hidden border border-white/16 bg-[#070707] p-5 p5-comic-box">
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
                <span className="pt-2 text-base font-bold text-p5-red">（共 {count} 条）</span>
              </div>
              <div className="flex items-center gap-3">
                {loading && (
                  <div className="hidden items-center gap-2 text-sm text-white/65 sm:flex">
                    <Loader className="h-4 w-4 animate-spin text-p5-red" />
                    同步中...
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="border border-p5-red bg-[#070707] px-6 py-16 text-center">
                <Tv className="mx-auto mb-5 h-16 w-16 text-white/35" />
                <h3 className="text-2xl font-black text-p5-red">视频加载失败</h3>
                <p className="mt-2 text-white/55">{error}</p>
                <button
                  type="button"
                  onClick={() => dispatch(fetchHomeVideos(appliedFilters))}
                  className="mt-6 bg-p5-red px-6 py-3 font-bold text-white"
                >
                  重新加载
                </button>
              </div>
            )}

            {loading && videos.length === 0 ? (
              <div className="border border-white/16 bg-[#070707] px-6 py-16 text-center">
                <Loader className="mx-auto mb-5 h-12 w-12 animate-spin text-p5-red" />
                <h3 className="text-2xl font-black">正在加载视频...</h3>
              </div>
            ) : videos.length === 0 && !error ? (
              <div className="border border-white/16 bg-[#070707] px-6 py-16 text-center">
                <Tv className="mx-auto mb-5 h-16 w-16 text-white/35" />
                <h3 className="text-2xl font-black">未找到匹配内容</h3>
                <p className="mt-2 text-white/55">当前搜索条件下没有结果</p>
              </div>
            ) : (
              <div className={`grid grid-cols-1 gap-5 transition-opacity sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${loading ? 'opacity-50' : 'opacity-100'}`}>
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
            currentPage={appliedFilters.page}
            totalCount={count}
            pageSize={12}
            onPageChange={(page) => {
              applyFilters({ ...appliedFilters, page })
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
        )}
      </div>
    </div>
  )
}

export default HomePage
