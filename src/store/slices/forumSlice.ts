import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import { forumService } from '../../services/forumService'
import { ForumCategory, Post, PostDetail, PostFilters } from '../../types/forum'
import { PaginatedResponse } from '../../types'

interface ForumState {
  categories: ForumCategory[]
  posts: Post[]
  totalPosts: number
  currentPost: PostDetail | null
  loading: boolean
  error: string | null
  filters: PostFilters
}

const initialState: ForumState = {
  categories: [],
  posts: [],
  totalPosts: 0,
  currentPost: null,
  loading: false,
  error: null,
  filters: {}
}

export const fetchCategories = createAsyncThunk(
  'forum/fetchCategories',
  async () => {
    return await forumService.getCategories()
  }
)

export const fetchPosts = createAsyncThunk(
  'forum/fetchPosts',
  async (filters: PostFilters) => {
    return await forumService.getPosts(filters)
  }
)

export const fetchPostDetail = createAsyncThunk(
  'forum/fetchPostDetail',
  async (id: number) => {
    return await forumService.getPost(id)
  }
)

const forumSlice = createSlice({
  name: 'forum',
  initialState,
  reducers: {
    setFilters(state, action: PayloadAction<PostFilters>) {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearCurrentPost(state) {
      state.currentPost = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Categories
      .addCase(fetchCategories.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false
        state.categories = action.payload
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch categories'
      })
      // Posts
      .addCase(fetchPosts.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchPosts.fulfilled, (state, action: PayloadAction<PaginatedResponse<Post>>) => {
        state.loading = false
        state.posts = action.payload.results
        state.totalPosts = action.payload.count
      })
      .addCase(fetchPosts.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch posts'
      })
      // Post Detail
      .addCase(fetchPostDetail.pending, (state) => {
        state.loading = true
      })
      .addCase(fetchPostDetail.fulfilled, (state, action) => {
        state.loading = false
        state.currentPost = action.payload
      })
      .addCase(fetchPostDetail.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch post detail'
      })
  }
})

export const { setFilters, clearCurrentPost } = forumSlice.actions
export default forumSlice.reducer
