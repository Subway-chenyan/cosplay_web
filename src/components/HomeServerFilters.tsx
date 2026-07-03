import { Filter, RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'

import type { CountFilterOption, HomeFilterState } from '../types'
import AsyncMultiSelect, { type AsyncSelectOption } from './AsyncMultiSelect'


interface HomeServerFiltersProps {
  value: HomeFilterState
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
  competitionOptions,
  groupOptions,
  loadCompetitions,
  loadGroups,
  onApply,
  onClear,
}: HomeServerFiltersProps) {
  const [draftYear, setDraftYear] = useState<number | undefined>(value.year)
  const [draftCompetitions, setDraftCompetitions] = useState(competitionOptions)
  const [draftGroups, setDraftGroups] = useState(groupOptions)

  useEffect(() => {
    setDraftYear(value.year)
    setDraftCompetitions(competitionOptions)
    setDraftGroups(groupOptions)
  }, [competitionOptions, groupOptions, value])

  const applyFilters = () => {
    onApply({
      ...value,
      year: draftYear,
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
      <div className="grid gap-5 lg:grid-cols-3">
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
