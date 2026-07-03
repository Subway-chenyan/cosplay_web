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
      <Link
        to="/competitions"
        className="inline-flex -skew-x-12 items-center bg-black px-4 py-2 font-black italic text-white shadow-[4px_4px_0_0_rgba(0,0,0,0.2)] hover:bg-p5-red"
      >
        <span className="flex skew-x-12 items-center">
          <ArrowLeft className="mr-2 h-5 w-5" />返回比赛列表
        </span>
      </Link>

      <section className="relative">
        <div className="absolute inset-0 translate-x-2 translate-y-2 -skew-x-1 bg-black" />
        <div
          className="relative overflow-hidden border-4 border-black bg-white p-8 text-center md:p-12"
          style={customConfig.bannerBackground?.type === 'image' ? {
            backgroundImage: `linear-gradient(rgba(0,0,0,.45), rgba(0,0,0,.45)), url(${customConfig.bannerBackground.value})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
          } : { backgroundColor: '#d90614' }}
        >
          <Trophy className="mx-auto mb-5 h-16 w-16 text-white" />
          <h1 className="text-3xl font-black italic text-white md:text-6xl" style={{ textShadow: '4px 4px #000' }}>
            {competition.name}
          </h1>
          <p className="mx-auto mt-4 inline-block -skew-x-12 bg-black px-6 py-2 font-bold text-white">
            <span className="inline-block skew-x-12">{competition.description || '赛事信息更新中'}</span>
          </p>
        </div>
      </section>

      {scheduleEvents.length > 0 && (
        <section className="space-y-6">
          <h2 className="flex items-center gap-3 border-b-8 border-p5-red text-3xl font-black italic text-white">
            <Calendar className="h-8 w-8" />赛程时间线
          </h2>
          <CompetitionSchedule
            competitionName={competition.name}
            events={scheduleEvents}
            isAdmin={false}
            onLinkVideo={() => undefined}
            onUnlinkVideo={() => undefined}
          />
        </section>
      )}

      <section className="border-4 border-black bg-white p-6 shadow-[8px_8px_0_0_black] md:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h2 className="flex items-center gap-3 text-2xl font-black italic text-black">
            <Filter className="h-6 w-6 text-p5-red" />筛选记录
          </h2>
          {(filters.year || filters.awardId) && (
            <button
              type="button"
              onClick={() => updateFilters({})}
              className="inline-flex items-center gap-2 bg-black px-4 py-2 text-sm font-black text-white hover:bg-p5-red"
            >
              <RotateCcw className="h-4 w-4" />清除筛选
            </button>
          )}
        </div>
        {filterOptionsError && <p className="mb-4 font-bold text-p5-red">{filterOptionsError}</p>}
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h3 className="mb-3 border-l-4 border-p5-red pl-2 font-black text-black">年份</h3>
            <div className="flex flex-wrap gap-2">
              {filterOptions.years.map((year) => (
                <button
                  key={year.value}
                  type="button"
                  onClick={() => updateFilters({
                    ...filters,
                    year: filters.year === year.value ? undefined : year.value,
                  })}
                  className={`border-2 border-black px-4 py-2 font-black ${filters.year === year.value ? 'bg-p5-red text-white' : 'bg-white text-black hover:bg-black hover:text-white'}`}
                >
                  {year.value} 年（{year.count}）
                </button>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-3 border-l-4 border-p5-red pl-2 font-black text-black">奖项</h3>
            <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
              {filterOptions.awards.map((award) => (
                <button
                  key={award.id}
                  type="button"
                  onClick={() => updateFilters({
                    ...filters,
                    awardId: filters.awardId === award.id ? undefined : award.id,
                  })}
                  className={`border-2 border-black px-4 py-2 text-sm font-black ${filters.awardId === award.id ? 'bg-p5-red text-white' : 'bg-white text-black hover:bg-black hover:text-white'}`}
                >
                  {award.name}（{award.count}）
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="mt-6 border-t-2 border-dashed border-black pt-4 text-sm font-black text-black">
          服务端找到 {count} 条记录；年份与奖项可同时使用。
        </p>
      </section>

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
          <Play className="mx-auto mb-4 h-16 w-16 text-gray-400" />
          <h2 className="text-xl font-black text-black">当前条件下暂无记录</h2>
        </section>
      )}

      {groupedEntries.awardGroups.map((group) => {
        const awardInfo = getAwardInfo(group.award.name)
        return (
          <section key={group.award.id} className="border-4 border-black bg-white shadow-[8px_8px_0_0_#d90614]">
            <div className="flex items-center justify-between gap-4 border-b-4 border-black bg-gray-100 p-5">
              <h2 className="flex items-center gap-3 text-2xl font-black italic text-black">
                {awardInfo.icon}{group.award.name}
              </h2>
              <span className="bg-black px-4 py-1 text-sm font-black text-white">
                {group.entries.length} 条已加载
              </span>
            </div>
            <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {group.entries.map((entry) => (
                entry.video ? (
                  <VideoCard
                    key={entry.entry_id}
                    video={entry.video}
                    dramaName={entry.award_record?.drama_name}
                    onClick={() => navigate(`/video/${entry.video!.id}`)}
                  />
                ) : entry.award_record ? (
                  <NoVideoAwardCard
                    key={entry.entry_id}
                    awardRecord={entry.award_record}
                    awardInfo={awardInfo}
                  />
                ) : null
              ))}
            </div>
          </section>
        )
      })}

      {groupedEntries.participants.length > 0 && (
        <section className="border-4 border-black bg-white p-6 shadow-[8px_8px_0_0_black]">
          <div className="mb-6 flex items-center justify-between border-b-4 border-black pb-4">
            <h2 className="flex items-center gap-3 text-2xl font-black text-black">
              <Users className="h-7 w-7 text-p5-red" />参与作品
            </h2>
            <span className="bg-black px-4 py-1 text-sm font-black text-white">
              {groupedEntries.participants.length} 条已加载
            </span>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {groupedEntries.participants.map((entry) => entry.video && (
              <VideoCard
                key={entry.entry_id}
                video={entry.video}
                onClick={() => navigate(`/video/${entry.video!.id}`)}
              />
            ))}
          </div>
        </section>
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
