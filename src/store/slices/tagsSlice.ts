import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { Tag, PaginatedResponse } from '../../types'
import { tagService } from '../../services/tagService'

interface TagsState {
  tags: Tag[]
  loading: boolean
  error: string | null
  pagination: {
    count: number
    next?: string
    previous?: string
  }
  categories: string[]
}

const initialState: TagsState = {
  tags: [],
  loading: false,
  error: null,
  pagination: {
    count: 0,
  },
  categories: [],
}

// 异步thunk - 获取标签列表
export const fetchTags = createAsyncThunk(
  'tags/fetchTags',
  async (params?: {
    category?: string
    is_active?: boolean
    ordering?: string
    page?: number
    page_size?: number
  }) => {
    const queryParams: any = {
      page: params?.page || 1,
      page_size: params?.page_size || 100,
      category: params?.category,
      is_active: params?.is_active,
      ordering: params?.ordering,
    }
    const response = await tagService.getTags(queryParams)
    return response
  }
)

// 按分类获取标签
export const fetchTagsByCategory = createAsyncThunk(
  'tags/fetchTagsByCategory',
  async (category: string) => {
    const response = await tagService.getTagsByCategory(category)
    return response
  }
)

// 获取热门标签
export const fetchPopularTags = createAsyncThunk(
  'tags/fetchPopularTags',
  async (limit: number = 20) => {
    const response = await tagService.getPopularTags(limit)
    return response
  }
)

// 获取标签分类
export const fetchCategories = createAsyncThunk(
  'tags/fetchCategories',
  async () => {
    const categories = await tagService.getCategories()
    return categories
  }
)

// 批量获取标签
export const fetchTagsByIds = createAsyncThunk(
  'tags/fetchTagsByIds',
  async (ids: string[]) => {
    const tags = await tagService.getTagsByIds(ids)
    return tags
  }
)

const tagsSlice = createSlice({
  name: 'tags',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // 处理 fetchTags
      .addCase(fetchTags.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTags.fulfilled, (state, action) => {
        state.loading = false
        state.tags = action.payload.results
        state.pagination = {
          count: action.payload.count,
          next: action.payload.next,
          previous: action.payload.previous,
        }
      })
      .addCase(fetchTags.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || '获取标签失败'
      })
      // 处理其他异步操作
      .addCase(fetchTagsByCategory.fulfilled, (state, action) => {
        state.tags = action.payload.results
        state.pagination = {
          count: action.payload.count,
          next: action.payload.next,
          previous: action.payload.previous,
        }
      })
      .addCase(fetchPopularTags.fulfilled, (state, action) => {
        state.tags = action.payload.results
        state.pagination = {
          count: action.payload.count,
          next: action.payload.next,
          previous: action.payload.previous,
        }
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.categories = action.payload
      })
      .addCase(fetchTagsByIds.fulfilled, (state, action) => {
        // 合并标签，避免重复
        const existingIds = new Set(state.tags.map(tag => tag.id))
        const newTags = action.payload.filter(tag => !existingIds.has(tag.id))
        state.tags = [...state.tags, ...newTags]
      })
  },
})

export default tagsSlice.reducer 