import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { Competition } from '../../types'

interface CompetitionsState {
  competitions: Competition[]
  loading: boolean
  error: string | null
}

const initialState: CompetitionsState = {
  competitions: [],
  loading: false,
  error: null,
}

export const fetchCompetitions = createAsyncThunk(
  'competitions/fetchCompetitions',
  async () => {
    // TODO: 替换为实际API调用
    const mockData: Competition[] = [
      {
        id: 'comp-1',
        name: '2024春季cosplay大赛',
        year: 2024,
        description: '年度最盛大的cosplay比赛',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-15T00:00:00Z',
      },
      {
        id: 'comp-2',
        name: '夏日祭典',
        year: 2024,
        description: '夏季动漫主题活动',
        created_at: '2024-03-01T00:00:00Z',
        updated_at: '2024-03-15T00:00:00Z',
      },
      {
        id: 'comp-3',
        name: '2023年度总决赛',
        year: 2023,
        description: '2023年的压轴大赛',
        created_at: '2023-10-01T00:00:00Z',
        updated_at: '2023-12-15T00:00:00Z',
      },
    ]
    
    return mockData
  }
)

const competitionsSlice = createSlice({
  name: 'competitions',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompetitions.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCompetitions.fulfilled, (state, action) => {
        state.loading = false
        state.competitions = action.payload
      })
      .addCase(fetchCompetitions.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || '获取比赛失败'
      })
  },
})

export default competitionsSlice.reducer 