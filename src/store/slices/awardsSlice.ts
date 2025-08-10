import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { Award, AwardRecord } from '../../types'
import { awardService } from '../../services/awardService'

interface AwardsState {
  awards: Award[]
  awardRecords: AwardRecord[]
  competitionAwards: Award[]
  loading: boolean
  recordsLoading: boolean
  error: string | null
}

const initialState: AwardsState = {
  awards: [],
  awardRecords: [],
  competitionAwards: [],
  loading: false,
  recordsLoading: false,
  error: null,
}

// 获取所有奖项
export const fetchAwards = createAsyncThunk(
  'awards/fetchAwards',
  async (params?: { page?: number; competition?: string }) => {
    const response = await awardService.getAwards(params)
    return response.results
  }
)

// 获取比赛的所有奖项
export const fetchCompetitionAwards = createAsyncThunk(
  'awards/fetchCompetitionAwards',
  async (competitionId: string) => {
    return await awardService.getCompetitionAwards(competitionId)
  }
)

// 获取获奖记录
export const fetchAwardRecords = createAsyncThunk(
  'awards/fetchAwardRecords',
  async (params?: { video?: string; group?: string; year?: number }) => {
    const response = await awardService.getAwardRecords(params)
    return response.results
  }
)

// 获取比赛的获奖记录
export const fetchCompetitionAwardRecords = createAsyncThunk(
  'awards/fetchCompetitionAwardRecords',
  async ({ competitionId, year }: { competitionId: string; year?: number }) => {
    if (year) {
      return await awardService.getAwardYearVideos(competitionId, year)
    } else {
      return await awardService.getCompetitionAwardRecords(competitionId)
    }
  }
)

// 获取视频的获奖记录
export const fetchVideoAwardRecords = createAsyncThunk(
  'awards/fetchVideoAwardRecords',
  async (videoId: string) => {
    return await awardService.getVideoAwardRecords(videoId)
  }
)

const awardsSlice = createSlice({
  name: 'awards',
  initialState,
  reducers: {
    clearAwards: (state) => {
      state.awards = []
    },
    clearCompetitionAwards: (state) => {
      state.competitionAwards = []
    },
    clearAwardRecords: (state) => {
      state.awardRecords = []
    },
  },
  extraReducers: (builder) => {
    builder
      // 获取所有奖项
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
      
      // 获取比赛奖项
      .addCase(fetchCompetitionAwards.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchCompetitionAwards.fulfilled, (state, action) => {
        state.loading = false
        state.competitionAwards = action.payload
      })
      .addCase(fetchCompetitionAwards.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || '获取比赛奖项失败'
      })
      
      // 获取获奖记录
      .addCase(fetchAwardRecords.pending, (state) => {
        state.recordsLoading = true
        state.error = null
      })
      .addCase(fetchAwardRecords.fulfilled, (state, action) => {
        state.recordsLoading = false
        state.awardRecords = action.payload
      })
      .addCase(fetchAwardRecords.rejected, (state, action) => {
        state.recordsLoading = false
        state.error = action.error.message || '获取获奖记录失败'
      })
      
      // 获取比赛获奖记录
      .addCase(fetchCompetitionAwardRecords.pending, (state) => {
        state.recordsLoading = true
        state.error = null
      })
      .addCase(fetchCompetitionAwardRecords.fulfilled, (state, action) => {
        state.recordsLoading = false
        state.awardRecords = action.payload
      })
      .addCase(fetchCompetitionAwardRecords.rejected, (state, action) => {
        state.recordsLoading = false
        state.error = action.error.message || '获取比赛获奖记录失败'
      })
      
      // 获取视频获奖记录
      .addCase(fetchVideoAwardRecords.pending, (state) => {
        state.recordsLoading = true
      })
      .addCase(fetchVideoAwardRecords.fulfilled, (state, action) => {
        state.recordsLoading = false
        state.awardRecords = action.payload
      })
      .addCase(fetchVideoAwardRecords.rejected, (state, action) => {
        state.recordsLoading = false
        state.error = action.error.message || '获取视频获奖记录失败'
      })
  },
})

export const { clearAwards, clearCompetitionAwards, clearAwardRecords } = awardsSlice.actions
export default awardsSlice.reducer