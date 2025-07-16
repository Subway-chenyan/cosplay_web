import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { Group, PaginatedResponse } from '../../types'
import { groupService } from '../../services/groupService'

interface GroupsState {
  groups: Group[]
  loading: boolean
  error: string | null
  pagination: {
    count: number
    next?: string
    previous?: string
  }
  currentPage: number
}

const initialState: GroupsState = {
  groups: [],
  loading: false,
  error: null,
  pagination: {
    count: 0,
  },
  currentPage: 1,
}

// 异步thunk - 获取社团列表
export const fetchGroups = createAsyncThunk(
  'groups/fetchGroups',
  async (params?: { 
    page?: number
    search?: string
    is_active?: boolean
    is_verified?: boolean
  }) => {
    const response = await groupService.getGroups({
      page: params?.page || 1,
      page_size: 12,
      search: params?.search,
      is_active: params?.is_active,
      is_verified: params?.is_verified,
    })
    return response
  }
)

// 获取活跃社团
export const fetchActiveGroups = createAsyncThunk(
  'groups/fetchActiveGroups',
  async () => {
    const response = await groupService.getActiveGroups()
    return response
  }
)

// 获取认证社团
export const fetchVerifiedGroups = createAsyncThunk(
  'groups/fetchVerifiedGroups',
  async () => {
    const response = await groupService.getVerifiedGroups()
    return response
  }
)

// 获取热门社团
export const fetchPopularGroups = createAsyncThunk(
  'groups/fetchPopularGroups',
  async (limit: number = 12) => {
    const response = await groupService.getPopularGroups(limit)
    return response
  }
)

// 搜索社团
export const searchGroups = createAsyncThunk(
  'groups/searchGroups',
  async (query: string) => {
    const response = await groupService.searchGroups(query)
    return response
  }
)

const groupsSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // 处理 fetchGroups
      .addCase(fetchGroups.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchGroups.fulfilled, (state, action) => {
        state.loading = false
        state.groups = action.payload.results
        state.pagination = {
          count: action.payload.count,
          next: action.payload.next,
          previous: action.payload.previous,
        }
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || '获取社团失败'
      })
      // 处理其他异步操作
      .addCase(fetchActiveGroups.fulfilled, (state, action) => {
        state.groups = action.payload.results
        state.pagination = {
          count: action.payload.count,
          next: action.payload.next,
          previous: action.payload.previous,
        }
      })
      .addCase(fetchVerifiedGroups.fulfilled, (state, action) => {
        state.groups = action.payload.results
        state.pagination = {
          count: action.payload.count,
          next: action.payload.next,
          previous: action.payload.previous,
        }
      })
      .addCase(fetchPopularGroups.fulfilled, (state, action) => {
        state.groups = action.payload.results
        state.pagination = {
          count: action.payload.count,
          next: action.payload.next,
          previous: action.payload.previous,
        }
      })
      .addCase(searchGroups.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(searchGroups.fulfilled, (state, action) => {
        state.loading = false
        state.groups = action.payload.results
        state.pagination = {
          count: action.payload.count,
          next: action.payload.next,
          previous: action.payload.previous,
        }
      })
      .addCase(searchGroups.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || '搜索社团失败'
      })
  },
})

export const { setCurrentPage } = groupsSlice.actions
export default groupsSlice.reducer 