import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { Video, VideoFilters, PaginatedResponse } from '../../types'

interface VideosState {
  videos: Video[]
  filteredVideos: Video[]
  loading: boolean
  error: string | null
  filters: VideoFilters
  searchQuery: string
  pagination: {
    count: number
    next?: string
    previous?: string
  }
}

const initialState: VideosState = {
  videos: [],
  filteredVideos: [],
  loading: false,
  error: null,
  filters: {
    groups: [],
    competitions: [],
    tags: [],
  },
  searchQuery: '',
  pagination: {
    count: 0,
  },
}

// 异步thunk - 获取视频列表
export const fetchVideos = createAsyncThunk(
  'videos/fetchVideos',
  async (params?: { page?: number; filters?: VideoFilters }) => {
    // TODO: 替换为实际API调用
    const mockData: PaginatedResponse<Video> = {
      count: 50,
      next: undefined,
      previous: undefined,
      results: Array.from({ length: 12 }, (_, i) => ({
        id: `video-${i + 1}`,
        bv_number: `BV1${String(i + 1).padStart(3, '0')}`,
        title: `精彩舞台剧表演 ${i + 1}`,
        description: `这是一个精彩的cosplay舞台剧表演，展现了${i % 2 === 0 ? '原神' : '王者荣耀'}角色的魅力`,
        url: `https://www.bilibili.com/video/BV1${String(i + 1).padStart(3, '0')}`,
        thumbnail: `https://picsum.photos/400/225?random=${i + 1}`,
        duration: `${Math.floor(Math.random() * 10) + 3}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
        resolution: '1080p',
        view_count: Math.floor(Math.random() * 10000) + 1000,
        like_count: Math.floor(Math.random() * 1000) + 100,
        share_count: Math.floor(Math.random() * 100) + 10,
        performance_date: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString().split('T')[0],
        status: 'published' as const,
        is_featured: Math.random() > 0.7,
        is_original: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        groups: [{
          id: `group-${i % 3 + 1}`,
          name: ['星辰社团', '梦幻cosplay', '二次元工作室'][i % 3],
          description: '',
          is_active: true,
          is_verified: true,
          member_count: 0,
          video_count: 0,
          created_at: '',
          updated_at: '',
        }],
        competitions: [{
          id: `comp-${i % 2 + 1}`,
          name: ['2024春季cosplay大赛', '夏日祭典'][i % 2],
          year: 2024,
          description: '',
          created_at: '',
          updated_at: '',
        }],
        tags: [
          {
            id: `tag-${i % 4 + 1}`,
            name: ['原神', '王者荣耀', '崩坏三', 'FGO'][i % 4],
            category: '游戏IP' as const,
            description: '',
            color: ['#3b82f6', '#ef4444', '#8b5cf6', '#f59e0b'][i % 4],
            usage_count: 0,
            is_active: true,
            is_featured: true,
            created_at: '',
            updated_at: '',
          },
          {
            id: `tag-${i % 3 + 5}`,
            name: ['古风', '现代', '幻想'][i % 3],
            category: '风格' as const,
            description: '',
            color: ['#10b981', '#f97316', '#ec4899'][i % 3],
            usage_count: 0,
            is_active: true,
            is_featured: false,
            created_at: '',
            updated_at: '',
          },
        ],
      }))
    }
    
    return mockData
  }
)

// 筛选和搜索逻辑
const applyFiltersAndSearch = (videos: Video[], filters: VideoFilters, searchQuery: string): Video[] => {
  let filtered = [...videos]

  // 搜索过滤
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase()
    filtered = filtered.filter(video =>
      video.title.toLowerCase().includes(query) ||
      video.description.toLowerCase().includes(query) ||
      video.bv_number.toLowerCase().includes(query) ||
      video.groups.some(group => group.name.toLowerCase().includes(query)) ||
      video.competitions.some(comp => comp.name.toLowerCase().includes(query)) ||
      video.tags.some(tag => tag.name.toLowerCase().includes(query))
    )
  }

  // 社团筛选
  if (filters.groups.length > 0) {
    filtered = filtered.filter(video =>
      video.groups.some(group => filters.groups.includes(group.id))
    )
  }

  // 比赛筛选
  if (filters.competitions.length > 0) {
    filtered = filtered.filter(video =>
      video.competitions.some(comp => filters.competitions.includes(comp.id))
    )
  }

  // 标签筛选
  if (filters.tags.length > 0) {
    filtered = filtered.filter(video =>
      video.tags.some(tag => filters.tags.includes(tag.id))
    )
  }

  return filtered
}

const videosSlice = createSlice({
  name: 'videos',
  initialState,
  reducers: {
    setFilters: (state, action: PayloadAction<Partial<VideoFilters>>) => {
      state.filters = { ...state.filters, ...action.payload }
      state.filteredVideos = applyFiltersAndSearch(state.videos, state.filters, state.searchQuery)
      state.pagination.count = state.filteredVideos.length
    },
    clearFilters: (state) => {
      state.filters = {
        groups: [],
        competitions: [],
        tags: [],
      }
      state.filteredVideos = applyFiltersAndSearch(state.videos, state.filters, state.searchQuery)
      state.pagination.count = state.filteredVideos.length
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
      state.filteredVideos = applyFiltersAndSearch(state.videos, state.filters, state.searchQuery)
      state.pagination.count = state.filteredVideos.length
    },
    clearSearch: (state) => {
      state.searchQuery = ''
      state.filteredVideos = applyFiltersAndSearch(state.videos, state.filters, state.searchQuery)
      state.pagination.count = state.filteredVideos.length
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVideos.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchVideos.fulfilled, (state, action) => {
        state.loading = false
        state.videos = action.payload.results
        state.filteredVideos = applyFiltersAndSearch(action.payload.results, state.filters, state.searchQuery)
        state.pagination = {
          count: state.filteredVideos.length,
          next: action.payload.next,
          previous: action.payload.previous,
        }
      })
      .addCase(fetchVideos.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || '获取视频失败'
      })
  },
})

export const { setFilters, clearFilters, setSearchQuery, clearSearch } = videosSlice.actions
export default videosSlice.reducer 