import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { Competition, PaginatedResponse } from '../../types'
import { competitionService } from '../../services/competitionService'

interface CompetitionsState {
  competitions: Competition[]
  loading: boolean
  error: string | null
  pagination: {
    count: number
    next?: string
    previous?: string
  }
  currentPage: number
}

const initialState: CompetitionsState = {
  competitions: [],
  loading: false,
  error: null,
  pagination: {
    count: 0,
  },
  currentPage: 1,
}

// 异步thunk - 获取比赛列表
export const fetchCompetitions = createAsyncThunk(
  'competitions/fetchCompetitions',
  async (params?: { 
    page?: number
    search?: string
    year?: number
  }) => {
    const response = await competitionService.getCompetitions({
      page: params?.page || 1,
      page_size: 12,
      search: params?.search,
      year: params?.year,
    })
    return response
  }
)

// 按年份获取比赛
export const fetchCompetitionsByYear = createAsyncThunk(
  'competitions/fetchCompetitionsByYear',
  async (year: number) => {
    const response = await competitionService.getCompetitionsByYear(year)
    return response
  }
)

// 获取最近的比赛
export const fetchRecentCompetitions = createAsyncThunk(
  'competitions/fetchRecentCompetitions',
  async (limit: number = 12) => {
    const response = await competitionService.getRecentCompetitions(limit)
    return response
  }
)

// 搜索比赛
export const searchCompetitions = createAsyncThunk(
  'competitions/searchCompetitions',
  async (query: string) => {
    const response = await competitionService.searchCompetitions(query)
    return response
  }
)

const competitionsSlice = createSlice({
  name: 'competitions',
  initialState,
  reducers: {
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // 处理 fetchCompetitions
      .addCase(fetchCompetitions.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCompetitions.fulfilled, (state, action) => {
        state.loading = false
        state.competitions = action.payload.results
        state.pagination = {
          count: action.payload.count,
          next: action.payload.next,
          previous: action.payload.previous,
        }
      })
      .addCase(fetchCompetitions.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || '获取比赛失败'
      })
      // 处理其他异步操作
      .addCase(fetchCompetitionsByYear.fulfilled, (state, action) => {
        state.competitions = action.payload.results
        state.pagination = {
          count: action.payload.count,
          next: action.payload.next,
          previous: action.payload.previous,
        }
      })
      .addCase(fetchRecentCompetitions.fulfilled, (state, action) => {
        state.competitions = action.payload.results
        state.pagination = {
          count: action.payload.count,
          next: action.payload.next,
          previous: action.payload.previous,
        }
      })
      .addCase(searchCompetitions.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(searchCompetitions.fulfilled, (state, action) => {
        state.loading = false
        state.competitions = action.payload.results
        state.pagination = {
          count: action.payload.count,
          next: action.payload.next,
          previous: action.payload.previous,
        }
      })
      .addCase(searchCompetitions.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || '搜索比赛失败'
      })
  },
})

export const { setCurrentPage } = competitionsSlice.actions
export default competitionsSlice.reducer 