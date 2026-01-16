import { api } from './api'
import { ForumCategory, Post, PostDetail, Comment, PostFilters } from '../types/forum'
import { PaginatedResponse } from '../types'

class ForumService {
  async getCategories(): Promise<ForumCategory[]> {
    return api.get<ForumCategory[]>('/forum/categories/')
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

  async createComment(data: Partial<Comment>): Promise<Comment> {
    return api.post<Comment>('/forum/comments/', data)
  }

  async deleteComment(id: number): Promise<void> {
    return api.delete(`/forum/comments/${id}/`)
  }
}

export const forumService = new ForumService()
