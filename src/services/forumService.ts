import { api } from './api'
import {
  Comment,
  ForumCategory,
  ForumReportPayload,
  ForumTag,
  ModerationPayload,
  Post,
  PostDetail,
  PostFilters,
} from '../types/forum'
import { PaginatedResponse } from '../types'

class ForumService {
  async getCategories(): Promise<ForumCategory[]> {
    return api.get<ForumCategory[]>('/forum/categories/')
  }

  async createCategory(data: Partial<ForumCategory>): Promise<ForumCategory> {
    return api.post<ForumCategory>('/forum/categories/', data)
  }

  async updateCategory(id: number, data: Partial<ForumCategory>): Promise<ForumCategory> {
    return api.patch<ForumCategory>(`/forum/categories/${id}/`, data)
  }

  async deleteCategory(id: number): Promise<void> {
    return api.delete(`/forum/categories/${id}/`)
  }

  async getTags(): Promise<ForumTag[]> {
    return api.get<ForumTag[]>('/forum/tags/')
  }

  async getPosts(filters: PostFilters = {}): Promise<PaginatedResponse<Post>> {
    const queryString = api.buildQueryParams(filters)
    return api.get<PaginatedResponse<Post>>(`/forum/posts/${queryString}`)
  }

  async getPost(id: number): Promise<PostDetail> {
    return api.get<PostDetail>(`/forum/posts/${id}/`)
  }

  async createPost(data: Partial<PostDetail>): Promise<PostDetail> {
    return api.post<PostDetail>('/forum/posts/', data)
  }

  async updatePost(id: number, data: Partial<PostDetail>): Promise<PostDetail> {
    return api.patch<PostDetail>(`/forum/posts/${id}/`, data)
  }

  async deletePost(id: number): Promise<void> {
    return api.delete(`/forum/posts/${id}/`)
  }

  async moderatePost(id: number, data: ModerationPayload): Promise<PostDetail> {
    return api.post<PostDetail>(`/forum/posts/${id}/moderate/`, data)
  }

  async reactToPost(id: number, reaction = 'like'): Promise<{ active: boolean; like_count: number }> {
    return api.post<{ active: boolean; like_count: number }>(`/forum/posts/${id}/react/`, { reaction })
  }

  async createComment(data: Partial<Comment>): Promise<Comment> {
    return api.post<Comment>('/forum/comments/', data)
  }

  async getComments(filters: Record<string, string | number | boolean> = {}): Promise<PaginatedResponse<Comment>> {
    const queryString = api.buildQueryParams(filters)
    return api.get<PaginatedResponse<Comment>>(`/forum/comments/${queryString}`)
  }

  async updateComment(id: number, data: Partial<Comment>): Promise<Comment> {
    return api.patch<Comment>(`/forum/comments/${id}/`, data)
  }

  async deleteComment(id: number): Promise<void> {
    return api.delete(`/forum/comments/${id}/`)
  }

  async reactToComment(id: number, reaction = 'like'): Promise<{ active: boolean; like_count: number }> {
    return api.post<{ active: boolean; like_count: number }>(`/forum/comments/${id}/react/`, { reaction })
  }

  async hideComment(id: number, reason = ''): Promise<Comment> {
    return api.post<Comment>(`/forum/comments/${id}/hide/`, { reason })
  }

  async report(data: ForumReportPayload): Promise<void> {
    return api.post('/forum/reports/', data)
  }

  async uploadAttachment(file: File): Promise<{ file: string; file_url: string }> {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<{ file: string; file_url: string }>('/forum/attachments/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}

export const forumService = new ForumService()
