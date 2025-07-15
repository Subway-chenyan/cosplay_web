import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { Award } from '../../types'

interface AwardsState {
  awards: Award[]
  loading: boolean
  error: string | null
}

const initialState: AwardsState = {
  awards: [],
  loading: false,
  error: null,
}

export const fetchAwards = createAsyncThunk(
  'awards/fetchAwards',
  async () => {
    // TODO: 替换为实际API调用
    const mockData: Award[] = [
      {
        id: 'award-1',
        name: '最佳舞台表现奖',
        description: '在舞台表演中展现出色的演技和表现力',
        competition: '2024春季cosplay大赛',
        year: 2024,
        level: 'gold',
        group_id: 'group-1',
        video_id: 'video-1',
        created_at: '2024-03-15T00:00:00Z',
        updated_at: '2024-03-15T00:00:00Z',
      },
      {
        id: 'award-2',
        name: '最佳服装道具奖',
        description: '服装和道具制作精美，高度还原角色形象',
        competition: '2024春季cosplay大赛',
        year: 2024,
        level: 'silver',
        group_id: 'group-2',
        video_id: 'video-4',
        created_at: '2024-03-15T00:00:00Z',
        updated_at: '2024-03-15T00:00:00Z',
      },
      {
        id: 'award-3',
        name: '最佳编剧奖',
        description: '剧本创意新颖，故事情节引人入胜',
        competition: '夏日祭典',
        year: 2024,
        level: 'bronze',
        group_id: 'group-1',
        video_id: 'video-7',
        created_at: '2024-07-20T00:00:00Z',
        updated_at: '2024-07-20T00:00:00Z',
      },
      {
        id: 'award-4',
        name: '人气选择奖',
        description: '获得观众最多投票的作品',
        competition: '夏日祭典',
        year: 2024,
        level: 'special',
        group_id: 'group-3',
        video_id: 'video-9',
        created_at: '2024-07-20T00:00:00Z',
        updated_at: '2024-07-20T00:00:00Z',
      },
    ]
    
    return mockData
  }
)

const awardsSlice = createSlice({
  name: 'awards',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAwards.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAwards.fulfilled, (state, action) => {
        state.loading = false
        state.awards = action.payload
      })
      .addCase(fetchAwards.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || '获取奖项失败'
      })
  },
})

export default awardsSlice.reducer 