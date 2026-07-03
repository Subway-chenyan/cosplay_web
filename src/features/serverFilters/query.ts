import type { CompetitionFilterState, HomeFilterState } from '../../types'


const parseYear = (value: string | null): number | undefined => {
  if (!value || !/^\d+$/.test(value)) return undefined
  const year = Number(value)
  return year >= 1800 && year <= 2200 ? year : undefined
}

const parsePage = (value: string | null): number => {
  if (!value || !/^\d+$/.test(value)) return 1
  const page = Number(value)
  return page > 0 ? page : 1
}

const normalizeIds = (value: string | null): string[] => {
  if (!value) return []
  return [...new Set(
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean),
  )].sort()
}

export const parseHomeFilterParams = (params: URLSearchParams): HomeFilterState => ({
  query: params.get('q')?.trim() || '',
  year: parseYear(params.get('year')),
  competitionIds: normalizeIds(params.get('competitions')),
  groupIds: normalizeIds(params.get('groups')),
  page: parsePage(params.get('page')),
})

export const serializeHomeFilterParams = (state: HomeFilterState): URLSearchParams => {
  const params = new URLSearchParams()
  const query = state.query.trim()
  const competitionIds = normalizeIds(state.competitionIds.join(','))
  const groupIds = normalizeIds(state.groupIds.join(','))

  if (query) params.set('q', query)
  if (state.year) params.set('year', String(state.year))
  if (competitionIds.length) params.set('competitions', competitionIds.join(','))
  if (groupIds.length) params.set('groups', groupIds.join(','))
  if (state.page > 1) params.set('page', String(state.page))
  return params
}

export const parseCompetitionFilterParams = (
  params: URLSearchParams,
): CompetitionFilterState => {
  const year = parseYear(params.get('year'))
  const awardId = params.get('award')?.trim() || undefined
  return {
    ...(year ? { year } : {}),
    ...(awardId ? { awardId } : {}),
  }
}

export const serializeCompetitionFilterParams = (
  state: CompetitionFilterState,
): URLSearchParams => {
  const params = new URLSearchParams()
  if (state.year) params.set('year', String(state.year))
  if (state.awardId?.trim()) params.set('award', state.awardId.trim())
  return params
}
