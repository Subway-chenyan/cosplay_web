import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { Group } from '../../types'

interface GroupsState {
  groups: Group[]
  filteredGroups: Group[]
  loading: boolean
  error: string | null
  searchQuery: string
}

const initialState: GroupsState = {
  groups: [],
  filteredGroups: [],
  loading: false,
  error: null,
  searchQuery: '',
}

export const fetchGroups = createAsyncThunk(
  'groups/fetchGroups',
  async () => {
    // TODO: 替换为实际API调用
    const mockData: Group[] = [
      {
        id: 'group-1',
        name: '星辰社团',
        description: '专注于游戏角色扮演的专业社团',
        logo: 'https://picsum.photos/100/100?random=1',
        location: '北京',
        member_count: 25,
        video_count: 15,
        is_active: true,
        is_verified: true,
        created_at: '2023-01-15T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      },
      {
        id: 'group-2',
        name: '梦幻cosplay',
        description: '致力于原创剧本演出的cosplay团体',
        logo: 'https://picsum.photos/100/100?random=2',
        location: '上海',
        member_count: 32,
        video_count: 23,
        is_active: true,
        is_verified: true,
        created_at: '2023-03-20T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      },
      {
        id: 'group-3',
        name: '二次元工作室',
        description: '动漫文化传播与角色扮演',
        logo: 'https://picsum.photos/100/100?random=3',
        location: '广州',
        member_count: 18,
        video_count: 12,
        is_active: true,
        is_verified: false,
        created_at: '2023-06-10T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      },
    ]
    
    return mockData
  }
)

// 搜索逻辑
const applySearch = (groups: Group[], searchQuery: string): Group[] => {
  if (!searchQuery.trim()) {
    return groups
  }

  const query = searchQuery.toLowerCase()
  return groups.filter(group =>
    group.name.toLowerCase().includes(query) ||
    group.description.toLowerCase().includes(query) ||
    (group.location && group.location.toLowerCase().includes(query))
  )
}

const groupsSlice = createSlice({
  name: 'groups',
  initialState,
  reducers: {
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload
      state.filteredGroups = applySearch(state.groups, state.searchQuery)
    },
    clearSearch: (state) => {
      state.searchQuery = ''
      state.filteredGroups = applySearch(state.groups, state.searchQuery)
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGroups.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchGroups.fulfilled, (state, action) => {
        state.loading = false
        state.groups = action.payload
        state.filteredGroups = applySearch(action.payload, state.searchQuery)
      })
      .addCase(fetchGroups.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || '获取社团失败'
      })
  },
})

export const { setSearchQuery, clearSearch } = groupsSlice.actions
export default groupsSlice.reducer 