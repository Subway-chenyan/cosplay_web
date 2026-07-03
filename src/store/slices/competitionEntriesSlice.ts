import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { competitionService } from '../../services/competitionService'
import type {
  CompetitionEntry,
  CompetitionFilterState,
  ServerPaginatedResponse,
} from '../../types'


export interface CompetitionEntriesState {
  competitionId: string | null
  entries: CompetitionEntry[]
  count: number
  next: string | null
  loading: boolean
  loadingMore: boolean
  error: string | null
  loadMoreError: string | null
  currentRequestId?: string
  currentLoadMoreRequestId?: string
}

const initialState: CompetitionEntriesState = {
  competitionId: null,
  entries: [],
  count: 0,
  next: null,
  loading: false,
  loadingMore: false,
  error: null,
  loadMoreError: null,
}

interface FetchCompetitionEntriesArgs {
  competitionId: string
  filters: CompetitionFilterState
}

export const fetchCompetitionEntries = createAsyncThunk<
  ServerPaginatedResponse<CompetitionEntry>,
  FetchCompetitionEntriesArgs
>('competitionEntries/fetch', async ({ competitionId, filters }, thunkApi) => (
  competitionService.getEntries(competitionId, filters, 1, 200, thunkApi.signal)
))

export const loadMoreCompetitionEntries = createAsyncThunk<
  ServerPaginatedResponse<CompetitionEntry>,
  void,
  { state: { competitionEntries: CompetitionEntriesState } }
>('competitionEntries/loadMore', async (_, thunkApi) => {
  const next = thunkApi.getState().competitionEntries.next
  if (!next) throw new Error('没有更多结果')
  return competitionService.getEntriesByUrl(next, thunkApi.signal)
})

const competitionEntriesSlice = createSlice({
  name: 'competitionEntries',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompetitionEntries.pending, (state, action) => {
        state.competitionId = action.meta.arg.competitionId
        state.entries = []
        state.count = 0
        state.next = null
        state.loading = true
        state.loadingMore = false
        state.error = null
        state.loadMoreError = null
        state.currentRequestId = action.meta.requestId
      })
      .addCase(fetchCompetitionEntries.fulfilled, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return
        state.loading = false
        state.currentRequestId = undefined
        state.entries = action.payload.results
        state.count = action.payload.count
        state.next = action.payload.next
      })
      .addCase(fetchCompetitionEntries.rejected, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return
        state.loading = false
        state.currentRequestId = undefined
        state.error = action.meta.aborted
          ? null
          : action.error.message || '获取比赛记录失败'
      })
      .addCase(loadMoreCompetitionEntries.pending, (state, action) => {
        state.loadingMore = true
        state.loadMoreError = null
        state.currentLoadMoreRequestId = action.meta.requestId
      })
      .addCase(loadMoreCompetitionEntries.fulfilled, (state, action) => {
        if (state.currentLoadMoreRequestId !== action.meta.requestId) return
        state.loadingMore = false
        state.currentLoadMoreRequestId = undefined
        const knownIds = new Set(state.entries.map((item) => item.entry_id))
        state.entries.push(...action.payload.results.filter((item) => {
          if (knownIds.has(item.entry_id)) return false
          knownIds.add(item.entry_id)
          return true
        }))
        state.count = action.payload.count
        state.next = action.payload.next
      })
      .addCase(loadMoreCompetitionEntries.rejected, (state, action) => {
        if (state.currentLoadMoreRequestId !== action.meta.requestId) return
        state.loadingMore = false
        state.currentLoadMoreRequestId = undefined
        state.loadMoreError = action.meta.aborted
          ? null
          : action.error.message || '加载更多失败'
      })
  },
})

export default competitionEntriesSlice.reducer
