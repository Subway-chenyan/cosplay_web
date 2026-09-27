import { ChevronRight, Filter, RotateCcw, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

import type { CountFilterOption, HomeFilterState } from '../types'
import AsyncMultiSelect, { type AsyncSelectOption } from './AsyncMultiSelect'
import IpFilterModal from './IpFilterModal'


const EMPTY_IPS: AsyncSelectOption[] = []

interface HomeServerFiltersProps {
  value: HomeFilterState
  ips?: AsyncSelectOption[]
  years: CountFilterOption[]
  competitionOptions: AsyncSelectOption[]
  groupOptions: AsyncSelectOption[]
  loadCompetitions: (
    query: string,
    signal: AbortSignal,
  ) => Promise<AsyncSelectOption[]>
  loadGroups: (
    query: string,
    signal: AbortSignal,
  ) => Promise<AsyncSelectOption[]>
  onApply: (filters: HomeFilterState) => void
  onClear: () => void
}

function HomeServerFilters({
  value,
  years,
  ips = EMPTY_IPS,
  competitionOptions,
  groupOptions,
  loadCompetitions,
  loadGroups,
  onApply,
  onClear,
}: HomeServerFiltersProps) {
  const [draftIps, setDraftIps] = useState<AsyncSelectOption[]>([])
  const [draftYear, setDraftYear] = useState<number | undefined>(value.year)
  const [draftCompetitions, setDraftCompetitions] = useState(competitionOptions)
  const [draftGroups, setDraftGroups] = useState(groupOptions)
  const [ipModalOpen, setIpModalOpen] = useState(false)

  useEffect(() => {
    setDraftYear(value.year)
    setDraftCompetitions(competitionOptions)
    setDraftGroups(groupOptions)
  }, [competitionOptions, groupOptions, value])

  useEffect(() => {
    setDraftIps(ips.filter((ip) => value.ipTagIds?.includes(ip.id)))
  }, [ips, value.ipTagIds])

  const closeIpModal = useCallback(() => setIpModalOpen(false), [])

  const applyFilters = () => {
    onApply({
      ...value,
      year: draftYear,
      ipTagIds: draftIps.map((ip) => ip.id),
      competitionIds: draftCompetitions.map((item) => item.id),
      groupIds: draftGroups.map((item) => item.id),
      page: 1,
    })
  }

  return (
    <section className="mt-4 border border-white/16 bg-[#070707]/95 p-5 md:p-7 p5-comic-box">
      <div className="mb-5 flex items-center gap-3">
        <Filter className="h-6 w-6 text-p5-red" />
        <div>
          <h2 className="text-xl font-black text-white">筛选视频</h2>
          <p className="text-xs font-semibold text-white/50">不同条件同时满足，多选项任一匹配</p>
        </div>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="home-filter-year" className="block text-sm font-black text-white">
            年份
          </label>
          <select
            id="home-filter-year"
            aria-label="年份"
            value={draftYear ?? ''}
            onChange={(event) => setDraftYear(
              event.target.value ? Number(event.target.value) : undefined,
            )}
            className="h-10 w-full bg-white px-3 text-sm font-bold text-black outline-none focus:ring-2 focus:ring-p5-red"
          >
            <option value="">全部年份</option>
            {years.map((year) => (
              <option key={year.value} value={year.value}>
                {year.value} 年（{year.count}）
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <span className="block text-sm font-black text-white">IP 作品（可多选）</span>
          <button
            type="button"
            aria-haspopup="dialog"
            onClick={() => setIpModalOpen(true)}
            className="flex min-h-10 w-full cursor-pointer items-center justify-between bg-white px-3 text-left text-sm font-bold text-black outline-none transition-shadow hover:ring-2 hover:ring-p5-red focus:ring-2 focus:ring-p5-red"
          >
            <span className={draftIps.length ? 'text-black' : 'text-black/45'}>
              {draftIps.length ? `已选择 ${draftIps.length} 个 IP` : '选择 IP 作品'}
            </span>
            <ChevronRight className="h-4 w-4" />
          </button>
          {draftIps.length > 0 && (
            <div className="flex max-h-20 flex-wrap gap-2 overflow-y-auto pt-1">
              {draftIps.map((ip) => (
                <span key={ip.id} className="inline-flex items-center gap-1 border border-p5-red bg-black px-2 py-1 text-xs font-bold text-white">
                  {ip.name}
                  <button type="button" aria-label={`移除${ip.name}`} onClick={() => setDraftIps(draftIps.filter((item) => item.id !== ip.id))} className="cursor-pointer text-white/70 hover:text-p5-red focus:outline-none focus:ring-1 focus:ring-p5-red">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        <AsyncMultiSelect
          label="比赛"
          value={draftCompetitions}
          loadOptions={loadCompetitions}
          onChange={setDraftCompetitions}
        />
        <AsyncMultiSelect
          label="社团"
          value={draftGroups}
          loadOptions={loadGroups}
          onChange={setDraftGroups}
        />
      </div>
      <IpFilterModal
        open={ipModalOpen}
        options={ips}
        value={draftIps}
        onChange={setDraftIps}
        onClose={closeIpModal}
      />
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <button
          type="button"
          aria-label="清空筛选"
          onClick={onClear}
          className="inline-flex h-11 items-center gap-2 border border-white/40 px-5 text-sm font-black text-white hover:border-p5-red"
        >
          <RotateCcw className="h-4 w-4" />
          清空筛选
        </button>
        <button
          type="button"
          aria-label="应用筛选"
          onClick={applyFilters}
          className="h-11 bg-p5-red px-7 text-sm font-black text-white hover:bg-red-700"
        >
          应用筛选
        </button>
      </div>
    </section>
  )
}

export default HomeServerFilters
