import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { Video, VideoFilters, PaginatedResponse } from '../../types'
import { videoService } from '../../services/videoService'

interface VideosState {
  videos: Video[]
  currentVideo: Video | null
  loading: boolean
  filterLoading: boolean // 新增：筛选加载状态
  error: string | null
  filters: VideoFilters
  searchQuery: string
  pagination: {
    count: number
    next?: string
    previous?: string
  }
  currentPage: number
}

const initialState: VideosState = {
  videos: [],
  currentVideo: null,
  loading: false,
  filterLoading: false, // 新增：筛选加载状态
  error: null,
  filters: {
    tags: [],
  },
  searchQuery: '',
  pagination: {
    count: 0,
  },
  currentPage: 1,
}

// 异步thunk - 获取视频列表
export const fetchVideos = createAsyncThunk(
  'videos/fetchVideos',
  async (params?: { 
    page?: number
    filters?: VideoFilters
    searchQuery?: string
  }) => {
    const response = await videoService.getVideos({
      page: params?.page || 1,
      page_size: 12,
      search: params?.searchQuery,
      groups: params?.filters?.groups,
      competitions: params?.filters?.competitions,
      competition_year: params?.filters?.year,
      tags: params?.filters?.tags,
    })
    return response
  }
)

// 获取比赛视频
export const fetchCompetitionVideos = createAsyncThunk(
  'videos/fetchCompetitionVideos',
  async ({ competitionId, year }: { competitionId: string; year?: number }) => {
    const response = await videoService.getCompetitionVideos(competitionId, year)
    return response
  }
)



// 获取最新视频
export const fetchLatestVideos = createAsyncThunk(
  'videos/fetchLatestVideos',
  async (limit: number = 12) => {
    const response = await videoService.getLatestVideos(limit)
    return response
  }
)

// 获取热门视频
export const fetchPopularVideos = createAsyncThunk(
  'videos/fetchPopularVideos',
  async (limit: number = 12) => {
    const response = await videoService.getPopularVideos(limit)
    return response
  }
)

// 获取相关视频
export const fetchRelatedVideos = createAsyncThunk(
  'videos/fetchRelatedVideos',
  async ({ videoId, limit = 6 }: { videoId: string; limit?: number }) => {
    const response = await videoService.getRelatedVideos(videoId, limit)
    return response
  }
)

// 搜索视频
export const searchVideos = createAsyncThunk(
  'videos/searchVideos',
  async ({ query, filters }: { query: string; filters?: VideoFilters }) => {
    const response = await videoService.searchVideos(query, filters)
    return response
  }
)

// 获取视频详情
export const fetchVideoDetail = createAsyncThunk(
  'videos/fetchVideoDetail',
  async (id: string) => {
    const video = await videoService.getVideoById(id)
    return video
  }
)

const videosSlice = createSlice({
  name: 'videos',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<VideoFilters>>) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearFilters: (state) => {
      state.filters = {
        tags: [],
      }
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
    },
    clearSearch: (state) => {
      state.searchQuery = ''
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload
    },
    setFilterLoading: (state, action: PayloadAction<boolean>) => {
      state.filterLoading = action.payload
    },
  },
  extraReducers: (builder) => {
    builder
      // 处理 fetchVideos
      .addCase(fetchVideos.pending, (state, action) => {
        // 判断是否为筛选操作（第一页且不是初始加载）
        const isFiltering = action.meta.arg?.page === 1 && state.videos.length > 0
        if (isFiltering) {
          state.filterLoading = true
        } else {
          state.loading = true
        }
        state.error = null
      })
      .addCase(fetchVideos.fulfilled, (state, action) => {
        state.loading = false
        state.filterLoading = false
        state.videos = action.payload.results
        state.pagination = {
          count: action.payload.count,
          next: action.payload.next,
          previous: action.payload.previous,
        }
      })
      .addCase(fetchVideos.rejected, (state, action) => {
        state.loading = false
        state.filterLoading = false
        state.error = action.error.message || '获取视频失败'
      })
      // 处理 searchVideos
      .addCase(searchVideos.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(searchVideos.fulfilled, (state, action) => {
        state.loading = false
        state.videos = action.payload.results
        state.pagination = {
          count: action.payload.count,
          next: action.payload.next,
          previous: action.payload.previous,
        }
      })
      .addCase(searchVideos.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || '搜索视频失败'
      })
      // 处理其他异步操作（最新、热门等）
      .addCase(fetchLatestVideos.fulfilled, (state, action) => {
        state.videos = action.payload.results
        state.pagination = {
          count: action.payload.count,
          next: action.payload.next,
          previous: action.payload.previous,
        }
      })
      .addCase(fetchPopularVideos.fulfilled, (state, action) => {
        state.videos = action.payload.results
        state.pagination = {
          count: action.payload.count,
          next: action.payload.next,
          previous: action.payload.previous,
        }
      })
      // 处理获取视频详情
      .addCase(fetchVideoDetail.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchVideoDetail.fulfilled, (state, action) => {
        state.loading = false
        state.currentVideo = action.payload
      })
      .addCase(fetchVideoDetail.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || '获取视频详情失败'
      })
  },
})

export const { 
  setFilters, 
  clearFilters, 
  setSearchQuery, 
  clearSearch,
  setCurrentPage,
  setFilterLoading
} = videosSlice.actions

export default videosSlice.reducer