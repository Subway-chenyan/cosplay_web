import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import {
  ArrowLeft,
  Award as AwardIcon,
  Calendar,
  Filter,
  Loader,
  Medal,
  Play,
  RotateCcw,
  Star,
  Trophy,
  Users,
} from 'lucide-react'

import VideoCard from '../components/VideoCard'
import NoVideoAwardCard from '../components/NoVideoAwardCard'
import CompetitionSchedule from '../components/schedule/CompetitionSchedule'
import {
  getAwardSortWeight,
  getCompetitionCustomConfig,
} from '../config/competitionCustomConfig'
import { groupCompetitionEntries } from '../features/serverFilters/competitionEntries'
import {
  parseCompetitionFilterParams,
  serializeCompetitionFilterParams,
} from '../features/serverFilters/query'
import { competitionService } from '../services/competitionService'
import { eventService } from '../services/eventService'
import type { AppDispatch, RootState } from '../store/store'
import {
  fetchCompetitionEntries,
  loadMoreCompetitionEntries,
} from '../store/slices/competitionEntriesSlice'
import type {
  Competition,
  CompetitionFilterOptions,
  CompetitionFilterState,
  Event as EventType,
} from '../types'


const emptyFilterOptions: CompetitionFilterOptions = {
  years: [],
  awards: [],
  total_count: 0,
}

function CompetitionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const [searchParams, setSearchParams] = useSearchParams()
  const searchParamsKey = searchParams.toString()
  const filters = useMemo(
    () => parseCompetitionFilterParams(new URLSearchParams(searchParamsKey)),
    [searchParamsKey],
  )
  const {
    entries,
    count,
    next,
    loading,
    loadingMore,
    error,
    loadMoreError,
  } = useSelector((state: RootState) => state.competitionEntries)
  const [competition, setCompetition] = useState<Competition | null>(null)
  const [competitionLoading, setCompetitionLoading] = useState(true)
  const [filterOptions, setFilterOptions] = useState(emptyFilterOptions)
  const [filterOptionsError, setFilterOptionsError] = useState<string | null>(null)
  const [scheduleEvents, setScheduleEvents] = useState<EventType[]>([])

  const customConfig = getCompetitionCustomConfig(id || '')

  useEffect(() => {
    if (!id) return
    let active = true
    setCompetitionLoading(true)
    competitionService.getCompetitionById(id)
      .then((result) => {
        if (active) setCompetition(result)
      })
      .catch(() => {
        if (active) setCompetition(null)
      })
      .finally(() => {
        if (active) setCompetitionLoading(false)
      })
    return () => { active = false }
  }, [id])

  useEffect(() => {
    if (!id) return
    const request = dispatch(fetchCompetitionEntries({ competitionId: id, filters }))
    return () => request.abort()
  }, [dispatch, filters, id])

  useEffect(() => {
    if (!id) return
    const controller = new AbortController()
    setFilterOptionsError(null)
    competitionService.getFilterOptions(id, controller.signal)
      .then(setFilterOptions)
      .catch((optionsError) => {
        if (!controller.signal.aborted) {
          setFilterOptionsError(
            optionsError instanceof Error ? optionsError.message : '筛选选项加载失败',
          )
        }
      })
    return () => controller.abort()
  }, [id])

  useEffect(() => {
    if (!id) return
    let active = true
    eventService.getCompetitionSchedule(id)
      .then((events) => {
        if (active) setScheduleEvents(events)
      })
      .catch((scheduleError) => console.error('获取比赛赛程失败', scheduleError))
    return () => { active = false }
  }, [id])

  const updateFilters = useCallback((nextFilters: CompetitionFilterState) => {
    setSearchParams(serializeCompetitionFilterParams(nextFilters))
  }, [setSearchParams])

  const groupedEntries = useMemo(() => {
    const grouped = groupCompetitionEntries(entries)
    const priorityIds = customConfig.awardOrder?.priorityAwards || []
    grouped.awardGroups.sort((left, right) => {
      if (customConfig.awardOrder?.sortRule === 'alphabetical') {
        return left.award.name.localeCompare(right.award.name)
      }
      if (customConfig.awardOrder?.sortRule === 'custom') {
        const leftIndex = priorityIds.indexOf(left.award.id)
        const rightIndex = priorityIds.indexOf(right.award.id)
        if (leftIndex !== -1 || rightIndex !== -1) {
          if (leftIndex === -1) return 1
          if (rightIndex === -1) return -1
          if (leftIndex !== rightIndex) return leftIndex - rightIndex
        }
      }
      const weightDifference = getAwardSortWeight(right.award.name)
        - getAwardSortWeight(left.award.name)
      return weightDifference || left.award.name.localeCompare(right.award.name)
    })
    return grouped
  }, [customConfig.awardOrder, entries])

  const getAwardInfo = (name: string) => {
    const lowerName = name.toLowerCase()
    if (lowerName.includes('金') || lowerName.includes('gold') || lowerName.includes('一等奖')) {
      return {
        label: name,
        color: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        borderColor: 'border-yellow-200',
        icon: <Trophy className="h-5 w-5 text-yellow-600" />,
      }
    }
    if (lowerName.includes('银') || lowerName.includes('silver') || lowerName.includes('二等奖')) {
      return {
        label: name,
        color: 'bg-gray-100',
        textColor: 'text-gray-800',
        borderColor: 'border-gray-200',
        icon: <Medal className="h-5 w-5 text-gray-600" />,
      }
    }
    if (lowerName.includes('铜') || lowerName.includes('bronze') || lowerName.includes('三等奖')) {
      return {
        label: name,
        color: 'bg-orange-100',
        textColor: 'text-orange-800',
        borderColor: 'border-orange-200',
        icon: <AwardIcon className="h-5 w-5 text-orange-600" />,
      }
    }
    return {
      label: name,
      color: 'bg-blue-100',
      textColor: 'text-blue-800',
      borderColor: 'border-blue-200',
      icon: <Star className="h-5 w-5 text-p5-red" />,
    }
  }

  if (competitionLoading) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <Loader className="h-12 w-12 animate-spin text-p5-red" />
      </div>
    )
  }

  if (!competition || !id) {
    return (
      <div className="mx-auto max-w-md bg-gray-50 p-8 text-center">
        <Trophy className="mx-auto mb-4 h-16 w-16 text-gray-400" />
        <h2 className="mb-4 text-lg font-bold text-gray-900">比赛未找到</h2>
        <Link to="/competitions" className="btn-primary">返回比赛列表</Link>
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
            <span className="font-black italic">返回比赛列表</span>
          </span>
        </Link>
      </div>

      {/* 比赛头部信息 */}
      <div className="relative group">
        <div className="absolute inset-0 bg-black transform translate-x-2 translate-y-2 -skew-x-1 z-0" />
        <div
          className="relative z-10 bg-white border-4 border-black p-8 md:p-12 transform -skew-x-1 overflow-hidden"
          style={customConfig.bannerBackground?.type === 'image' ? {
            backgroundImage: `url(${customConfig.bannerBackground.value})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          } : {}}
        >
          {customConfig.bannerBackground?.type === 'image' && (
            <div className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-[2px]" />
          )}
          <div className="absolute top-0 right-0 w-64 h-64 p5-halftone opacity-10 -rotate-45 translate-x-32 -translate-y-32" />
          <div className="relative z-20 text-center transform skew-x-1">
            <div className="w-20 h-20 bg-p5-red transform rotate-12 border-4 border-black shadow-[4px_4px_0_0_black] flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-white transform -rotate-12" />
            </div>
            <h1
              className="text-3xl md:text-6xl font-black text-white italic leading-none mb-4"
              style={{ textShadow: '4px 4px 0px #000000' }}
            >
              {competition.name}
            </h1>
            <p className="text-lg md:text-xl text-white font-bold bg-black inline-block px-6 py-1 transform -skew-x-12 shadow-[4px_4px_0_0_#d90614]">
              <span className="transform skew-x-12 inline-block">
                {competition.description || '赛事信息更新中'}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* 赛程时间线 */}
      {scheduleEvents.length > 0 && (
        <div className="space-y-8">
          <div className="flex items-center space-x-4 transform skew-x-1">
            <div className="bg-p5-red p-3 transform rotate-12 border-2 border-black">
              <Calendar className="w-8 h-8 text-white transform -rotate-12" />
            </div>
            <h2
              className="text-xl md:text-3xl font-black text-white italic border-b-8 border-p5-red"
              style={{ textShadow: '2px 2px 0px #000000' }}
            >
              赛程时间线
            </h2>
          </div>
          <CompetitionSchedule
            competitionName={competition.name}
            events={scheduleEvents}
            isAdmin={false}
            onLinkVideo={() => undefined}
            onUnlinkVideo={() => undefined}
          />
        </div>
      )}

      {/* 筛选器 */}
      <div className="relative group">
        <div className="absolute inset-0 bg-black transform translate-x-2 translate-y-2 -skew-x-1 z-0" />
        <div className="relative z-10 bg-white border-4 border-black p-8 transform -skew-x-1">
          <div className="flex items-center justify-between mb-8 transform skew-x-1">
            <div className="flex items-center space-x-4">
              <div className="bg-black p-2 transform -rotate-6 border-2 border-p5-red">
                <Filter className="w-6 h-6 text-white transform rotate-6" />
              </div>
              <h2 className="text-2xl font-black text-black italic border-b-4 border-p5-red">
                筛选记录
              </h2>
            </div>
            {(filters.year || filters.awardId) && (
              <button
                type="button"
                onClick={() => updateFilters({})}
                className="bg-black text-white px-4 py-1 text-xs font-black italic transform -skew-x-12 hover:bg-p5-red transition-all"
              >
                <span className="transform skew-x-12 inline-block flex items-center">
                  <RotateCcw className="w-4 h-4 mr-1" /> 清除筛选
                </span>
              </button>
            )}
          </div>

          {filterOptionsError && <p className="mb-4 font-bold text-p5-red transform skew-x-1">{filterOptionsError}</p>}

          <div className="grid gap-8 lg:grid-cols-2 transform skew-x-1">
            <div>
              <h3 className="text-sm font-black text-black mb-4 border-l-4 border-p5-red pl-2">目标年份</h3>
              <div className="flex flex-wrap gap-3">
                {filterOptions.years.map((year) => (
                  <button
                    key={year.value}
                    type="button"
                    onClick={() => updateFilters({
                      ...filters,
                      year: filters.year === year.value ? undefined : year.value,
                    })}
                    className={`px-6 py-2 transform rotate-1 font-black italic border-2 transition-all ${
                      filters.year === year.value
                        ? 'bg-p5-red border-black text-white shadow-[4px_4px_0_0_black]'
                        : 'bg-white border-black text-black hover:bg-black hover:text-white'
                    }`}
                  >
                    {year.value}年（{year.count}）
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-black text-black mb-4 border-l-4 border-p5-red pl-2">奖项筛选</h3>
              <div className="flex flex-wrap gap-3">
                {filterOptions.awards.map((award) => {
                  const awardInfo = getAwardInfo(award.name)
                  const isSelected = filters.awardId === award.id
                  return (
                    <button
                      key={award.id}
                      type="button"
                      onClick={() => updateFilters({
                        ...filters,
                        awardId: isSelected ? undefined : award.id,
                      })}
                      className={`p-3 transform transition-all border-4 ${
                        isSelected
                          ? 'bg-black border-p5-red text-white shadow-[8px_8px_0_0_#d90614]'
                          : 'bg-white border-black text-black hover:border-p5-red'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className={isSelected ? 'text-white' : 'text-p5-red'}>
                          {awardInfo.icon}
                        </div>
                        <span className="font-black italic text-sm">{award.name}（{award.count}）</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
          <p className="mt-6 border-t-2 border-dashed border-black pt-4 text-sm font-black text-black transform skew-x-1">
            服务端找到 {count} 条记录；年份与奖项可同时使用。
          </p>
        </div>
      </div>

      {/* 当前筛选状态显示 */}
      {(filters.year || filters.awardId) && (
        <div className="relative transform skew-x-1 py-4 px-8">
          <div className="flex items-center bg-black text-white p-4 border-l-8 border-p5-red shadow-[8px_8px_0_0_black] border-2 border-white">
            <Filter className="w-8 h-8 text-p5-red mr-6 animate-pulse" />
            <span className="text-xl font-black italic tracking-tighter p5-text-shadow-red">
              当前筛选：
              {filters.year && (
                <span className="text-white ml-3 bg-p5-red px-3 py-0.5 transform -skew-x-12 inline-block">
                  <span className="transform skew-x-12 inline-block font-black">{filters.year}年</span>
                </span>
              )}
              {filters.awardId && (
                <span className="text-white ml-3 bg-p5-red px-3 py-0.5 transform -skew-x-12 inline-block">
                  <span className="transform skew-x-12 inline-block font-black">
                    {filterOptions.awards.find((a) => a.id === filters.awardId)?.name}
                  </span>
                </span>
              )}
            </span>
          </div>
        </div>
      )}

      {error && (
        <section className="border-2 border-p5-red bg-black p-8 text-center text-white">
          <p className="font-bold text-p5-red">加载失败：{error}</p>
          <button
            type="button"
            onClick={() => dispatch(fetchCompetitionEntries({ competitionId: id, filters }))}
            className="mt-4 bg-p5-red px-5 py-2 font-black"
          >
            重试
          </button>
        </section>
      )}

      {loading && entries.length === 0 && (
        <div className="flex min-h-[240px] items-center justify-center bg-white/90">
          <Loader className="h-12 w-12 animate-spin text-p5-red" />
        </div>
      )}

      {!loading && !error && entries.length === 0 && (
        <section className="bg-white p-12 text-center">
          <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-black text-black">当前条件下暂无记录</h2>
        </section>
      )}

      {/* 获奖作品展示 */}
      {groupedEntries.awardGroups.length > 0 && (
        <div className="space-y-12">
          <div className="flex items-center space-x-4 transform skew-x-1">
            <div className="bg-p5-red p-3 transform rotate-12 border-2 border-black">
              <Trophy className="w-8 h-8 text-white transform -rotate-12" />
            </div>
            <h2
              className="text-xl md:text-3xl font-black text-white italic border-b-8 border-p5-red"
              style={{ textShadow: '2px 2px 0px #000000' }}
            >
              获奖作品
            </h2>
          </div>

          {groupedEntries.awardGroups.map((group) => {
            const awardInfo = getAwardInfo(group.award.name)
            return (
              <div key={group.award.id} className="relative group overflow-visible">
                <div className="absolute inset-0 bg-black transform translate-x-1 translate-y-1 -skew-x-1 z-0" />
                <div className="relative z-10 bg-white border-4 border-black transform -skew-x-1 overflow-hidden">
                  {/* 奖项标题 */}
                  <div className="p-6 border-b-4 border-black relative">
                    <div className="absolute inset-0 opacity-20 p5-halftone" />
                    <div className="flex items-center justify-between transform skew-x-1 relative z-10 gap-2">
                      <div className="flex items-center space-x-4 min-w-0">
                        <div className="text-p5-red transform rotate-12 scale-150 shrink-0">
                          {awardInfo.icon}
                        </div>
                        <h3
                          className="text-xl md:text-3xl font-black text-black italic tracking-tighter whitespace-nowrap"
                          style={{ textShadow: '2px 2px 0px #d90614' }}
                        >
                          {awardInfo.label}
                        </h3>
                      </div>
                      <div className="bg-black text-white px-3 md:px-6 py-1 font-black italic transform -skew-x-12 shadow-[4px_4px_0_0_#d90614] border border-white shrink-0">
                        <span className="transform skew-x-12 inline-block text-xs md:text-sm">
                          已发现 {group.entries.length} 条情报
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 作品网格 */}
                  <div className="p-8 transform skew-x-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                      {group.entries.map((entry) => (
                        entry.video ? (
                          <div key={entry.entry_id} className="relative group/video">
                            <div className="absolute inset-0 bg-p5-red transform translate-x-1 translate-y-1 z-0 opacity-0 group-hover/video:opacity-20 transition-opacity" />
                            <div className="relative z-10">
                              <VideoCard
                                video={entry.video}
                                dramaName={entry.award_record?.drama_name}
                                onClick={() => navigate(`/video/${entry.video!.id}`)}
                              />
                            </div>
                            {entry.video.year && (
                              <div className="absolute top-2 left-2 bg-black text-white px-2 py-0.5 font-black text-xs z-20">
                                {entry.video.year}
                              </div>
                            )}
                          </div>
                        ) : entry.award_record ? (
                          <div key={entry.entry_id} className="transform hover:scale-105 transition-transform">
                            <NoVideoAwardCard
                              awardRecord={entry.award_record}
                              awardInfo={awardInfo}
                            />
                          </div>
                        ) : null
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 参与作品展示 */}
      {groupedEntries.participants.length > 0 && (
        <div className="relative group mt-16">
          <div className="absolute inset-0 bg-black opacity-10 transform translate-x-2 translate-y-2 -skew-x-1 z-0" />
          <div className="relative z-10 bg-white border-4 border-black p-8 shadow-[8px_8px_0_0_black]">
            <div className="flex items-center justify-between mb-8 border-b-8 border-black pb-4">
              <div className="flex items-center space-x-4">
                <div className="bg-black p-2 transform -rotate-12 border-2 border-white">
                  <Users className="w-8 h-8 text-white transform rotate-12" />
                </div>
                <div>
                  <h2 className="text-3xl font-black text-black tracking-tighter">参与作品</h2>
                  <p className="text-xs font-black text-gray-500">参赛作品</p>
                </div>
              </div>
              <div className="bg-black text-white px-6 py-1 font-black italic transform -skew-x-12">
                <span className="transform skew-x-12 inline-block">
                  {groupedEntries.participants.length} 条记录
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {groupedEntries.participants.map((entry) => entry.video && (
                <div key={entry.entry_id} className="relative">
                  <VideoCard
                    video={entry.video}
                    onClick={() => navigate(`/video/${entry.video!.id}`)}
                  />
                  {entry.video.year && (
                    <div className="absolute top-2 left-2 bg-black text-white px-2 py-0.5 font-black text-xs z-20">
                      {entry.video.year}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {(next || loadMoreError) && (
        <div className="py-6 text-center">
          {loadMoreError && <p className="mb-3 font-bold text-p5-red">{loadMoreError}</p>}
          <button
            type="button"
            disabled={loadingMore}
            onClick={() => dispatch(loadMoreCompetitionEntries())}
            className="inline-flex min-w-40 items-center justify-center gap-2 bg-p5-red px-8 py-3 font-black text-white disabled:opacity-50"
          >
            {loadingMore && <Loader className="h-4 w-4 animate-spin" />}
            {loadMoreError ? '重试加载' : '加载更多'}
          </button>
        </div>
      )}
    </div>
  )
}

export default CompetitionDetailPage
