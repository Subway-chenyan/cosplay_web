import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'

import { videoService } from '../../services/videoService'
import type { HomeFilterState, ServerPaginatedResponse, Video } from '../../types'


interface HomeVideosState {
  videos: Video[]
  count: number
  next: string | null
  previous: string | null
  loading: boolean
  error: string | null
  currentRequestId?: string
}

const initialState: HomeVideosState = {
  videos: [],
  count: 0,
  next: null,
  previous: null,
  loading: false,
  error: null,
}

export const fetchHomeVideos = createAsyncThunk<
  ServerPaginatedResponse<Video>,
  HomeFilterState
>('homeVideos/fetch', async (filters, thunkApi) => {
  const response = await videoService.getVideos({
    page: filters.page,
    page_size: 12,
    search: filters.query || undefined,
    year: filters.year,
    competitions: filters.competitionIds,
    groups: filters.groupIds,
  }, thunkApi.signal)
  return {
    ...response,
    next: response.next ?? null,
    previous: response.previous ?? null,
  }
})

const homeVideosSlice = createSlice({
  name: 'homeVideos',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHomeVideos.pending, (state, action) => {
        state.loading = true
        state.error = null
        state.currentRequestId = action.meta.requestId
      })
      .addCase(fetchHomeVideos.fulfilled, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return
        state.loading = false
        state.currentRequestId = undefined
        state.videos = action.payload.results
        state.count = action.payload.count
        state.next = action.payload.next
        state.previous = action.payload.previous
      })
      .addCase(fetchHomeVideos.rejected, (state, action) => {
        if (state.currentRequestId !== action.meta.requestId) return
        state.loading = false
        state.currentRequestId = undefined
        state.error = action.meta.aborted
          ? null
          : action.error.message || '获取视频失败'
      })
  },
})

export default homeVideosSlice.reducer
