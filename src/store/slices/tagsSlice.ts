import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { Tag } from '../../types'

interface TagsState {
  tags: Tag[]
  loading: boolean
  error: string | null
}

const initialState: TagsState = {
  tags: [],
  loading: false,
  error: null,
}

export const fetchTags = createAsyncThunk(
  'tags/fetchTags',
  async () => {
    // TODO: 替换为实际API调用
    const mockData: Tag[] = [
      {
        id: 'tag-1',
        name: '原神',
        category: '游戏IP',
        description: '米哈游开发的开放世界冒险游戏',
        color: '#3b82f6',
        usage_count: 25,
        is_active: true,
        is_featured: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      },
      {
        id: 'tag-2',
        name: '王者荣耀',
        category: '游戏IP',
        description: '腾讯开发的MOBA手游',
        color: '#ef4444',
        usage_count: 18,
        is_active: true,
        is_featured: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      },
      {
        id: 'tag-3',
        name: '崩坏三',
        category: '游戏IP',
        description: '米哈游开发的动作角色扮演游戏',
        color: '#8b5cf6',
        usage_count: 15,
        is_active: true,
        is_featured: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      },
      {
        id: 'tag-4',
        name: 'FGO',
        category: '游戏IP',
        description: 'Fate/Grand Order',
        color: '#f59e0b',
        usage_count: 12,
        is_active: true,
        is_featured: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      },
      {
        id: 'tag-5',
        name: '古风',
        category: '风格',
        description: '中国古典风格',
        color: '#10b981',
        usage_count: 20,
        is_active: true,
        is_featured: false,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      },
      {
        id: 'tag-6',
        name: '现代',
        category: '风格',
        description: '现代都市风格',
        color: '#f97316',
        usage_count: 16,
        is_active: true,
        is_featured: false,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      },
      {
        id: 'tag-7',
        name: '幻想',
        category: '风格',
        description: '奇幻魔法风格',
        color: '#ec4899',
        usage_count: 14,
        is_active: true,
        is_featured: false,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      },
      {
        id: 'tag-4',
        name: '闺蜜恶之人',
        category: '动漫IP',
        description: 'Fate/Grand Order',
        color: '#f59e0b',
        usage_count: 12,
        is_active: true,
        is_featured: true,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      },
    ]
    
    return mockData
  }
)

const tagsSlice = createSlice({
  name: 'tags',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTags.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTags.fulfilled, (state, action) => {
        state.loading = false
        state.tags = action.payload
      })
      .addCase(fetchTags.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || '获取标签失败'
      })
  },
})

export default tagsSlice.reducer 