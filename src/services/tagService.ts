import { api } from './api'
import { Tag, PaginatedResponse } from '../types'

interface TagQueryParams {
  page?: number
  page_size?: number
  search?: string
  category?: string
  is_active?: boolean
  is_featured?: boolean
  ordering?: string
}

class TagService {
  // 获取标签列表
  async getTags(params?: TagQueryParams): Promise<PaginatedResponse<Tag>> {
    const queryParams = {
      page: params?.page || 1,
      page_size: params?.page_size || 50,
      ...params,
    }
    
    const queryString = api.buildQueryParams(queryParams)
    return api.get<PaginatedResponse<Tag>>(`/tags/${queryString}`)
  }

  // 获取标签详情
  async getTagById(id: string): Promise<Tag> {
    return api.get<Tag>(`/tags/${id}/`)
  }

  // 创建标签
  async createTag(data: Partial<Tag>): Promise<Tag> {
    return api.post<Tag>('/tags/', data)
  }

  // 更新标签
  async updateTag(id: string, data: Partial<Tag>): Promise<Tag> {
    return api.patch<Tag>(`/tags/${id}/`, data)
  }

  // 删除标签
  async deleteTag(id: string): Promise<void> {
    return api.delete(`/tags/${id}/`)
  }

  // 搜索标签
  async searchTags(query: string): Promise<PaginatedResponse<Tag>> {
    return this.getTags({ search: query })
  }

  // 获取某个分类的标签
  async getTagsByCategory(category: string): Promise<PaginatedResponse<Tag>> {
    return this.getTags({ category })
  }

  // 获取精选标签
  async getFeaturedTags(): Promise<PaginatedResponse<Tag>> {
    return this.getTags({ is_featured: true })
  }

  // 获取热门标签（按使用次数排序）
  async getPopularTags(limit: number = 20): Promise<PaginatedResponse<Tag>> {
    return this.getTags({ 
      ordering: '-usage_count', 
      page_size: limit 
    })
  }

  // 获取标签的视频
  async getTagVideos(tagId: string, page: number = 1, pageSize: number = 12) {
    const queryParams = api.buildQueryParams({
      tags: [tagId],
      page,
      page_size: pageSize,
    })
    return api.get(`/videos/${queryParams}`)
  }

  // 获取标签分类列表
  async getCategories(): Promise<string[]> {
    const response = await api.get<{ categories: string[] }>('/tags/categories/')
    return response.categories
  }

  // 批量获取标签
  async getTagsByIds(ids: string[]): Promise<Tag[]> {
    const queryParams = api.buildQueryParams({
      ids: ids,
      page_size: ids.length,
    })
    const response = await api.get<PaginatedResponse<Tag>>(`/tags/${queryParams}`)
    return response.results
  }
}

export const tagService = new TagService() 