import { api } from './api'
import { Video, PaginatedResponse, VideoFilters } from '../types'

interface VideoQueryParams {
  page?: number
  page_size?: number
  search?: string
  groups?: string[]
  competitions?: string[]
  year?: number
  tags?: string[]
  styleTag?: string
  ipTag?: string
  ordering?: string
}

class VideoService {
  // 获取视频列表
  async getVideos(params?: VideoQueryParams): Promise<PaginatedResponse<Video>> {
    const queryParams = {
      page: params?.page || 1,
      page_size: params?.page_size || 12,
      ...params,
    }
    
    // 处理数组参数
    if (params?.groups && params.groups.length > 0) {
      queryParams.groups = params.groups
    }
    if (params?.competitions && params.competitions.length > 0) {
      queryParams.competitions = params.competitions
    }
    if (params?.tags && params.tags.length > 0) {
      queryParams.tags = params.tags
    }
    if (params?.styleTag) {
      queryParams.styleTag = params.styleTag
    }
    if (params?.ipTag) {
      queryParams.ipTag = params.ipTag
    }
    
    const queryString = api.buildQueryParams(queryParams)
    return api.get<PaginatedResponse<Video>>(`/videos/${queryString}`)
  }

  // 获取视频详情
  async getVideoById(id: string): Promise<Video> {
    return api.get<Video>(`/videos/${id}/`)
  }

  // 创建视频
  async createVideo(data: Partial<Video>): Promise<Video> {
    return api.post<Video>('/videos/', data)
  }

  // 更新视频
  async updateVideo(id: string, data: Partial<Video>): Promise<Video> {
    return api.patch<Video>(`/videos/${id}/`, data)
  }

  // 删除视频
  async deleteVideo(id: string): Promise<void> {
    return api.delete(`/videos/${id}/`)
  }

  // 搜索视频
  async searchVideos(query: string, filters?: VideoFilters): Promise<PaginatedResponse<Video>> {
    const params: VideoQueryParams = {
      search: query,
      groups: filters?.groups,
      competitions: filters?.competitions,
      year: filters?.year,
      tags: filters?.tags,
    }
    return this.getVideos(params)
  }

  // 获取最新视频
  async getLatestVideos(limit: number = 12): Promise<PaginatedResponse<Video>> {
    return this.getVideos({ 
      ordering: '-created_at', 
      page_size: limit 
    })
  }

  // 获取热门视频（按创建时间排序）
  async getPopularVideos(limit: number = 12): Promise<PaginatedResponse<Video>> {
    return this.getVideos({ 
      ordering: '-created_at', 
      page_size: limit 
    })
  }

  // 获取比赛视频
  async getCompetitionVideos(competitionId: string, year?: number): Promise<PaginatedResponse<Video>> {
    const params: VideoQueryParams = {
      competitions: [competitionId],
      page_size: 100, // 获取更多视频
      ordering: '-created_at'
    }
    
    if (year) {
      params.year = year
    }
    
    return this.getVideos(params)
  }

  // 获取比赛年份视频
  async getCompetitionYearVideos(competitionId: string, year: number, page: number = 1, pageSize: number = 50): Promise<PaginatedResponse<Video>> {
    return api.get<PaginatedResponse<Video>>(`/competitions/${competitionId}/years/${year}/videos/?page=${page}&page_size=${pageSize}`)
  }

  // 获取社团视频
  async getGroupVideos(groupId: string, page: number = 1, pageSize: number = 12): Promise<PaginatedResponse<Video>> {
    const queryParams = api.buildQueryParams({
      page,
      page_size: pageSize,
    })
    return api.get<PaginatedResponse<Video>>(`/groups/${groupId}/videos/${queryParams}`)
  }

  // 获取相关视频（根据标签）
  async getRelatedVideos(videoId: string, limit: number = 6): Promise<PaginatedResponse<Video>> {
    try {
      // 先获取当前视频的信息
      const currentVideo = await this.getVideoById(videoId)
      
      // 根据标签获取相关视频
      if (currentVideo.tags && currentVideo.tags.length > 0) {
        const tagIds = currentVideo.tags.map(tag => tag.id)
        return this.getVideos({
          tags: tagIds,
          page_size: limit + 1 // 多获取一个，用于排除当前视频
        }).then(response => {
          // 排除当前视频
          const filteredResults = response.results.filter(video => video.id !== videoId)
          return {
            ...response,
            results: filteredResults.slice(0, limit)
          }
        })
      }
      
      // 如果没有标签，返回最新视频
      return this.getLatestVideos(limit)
    } catch (error) {
      // 出错时返回最新视频
      return this.getLatestVideos(limit)
    }
  }

  // 批量导入视频
  async bulkImport(file: File, importType: string = 'video', validateOnly: boolean = true) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('import_type', importType)
    formData.append('validate_only', String(validateOnly))
    
    return api.post('/videos/bulk-import/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  }

  // 获取导入状态
  async getImportStatus(taskId: string) {
    return api.get(`/videos/import-status/${taskId}/`)
  }

  // 下载导入模板
  async downloadImportTemplate(type: string = 'video') {
    const response = await api.get<Blob>(`/videos/import-template/?type=${type}`, {
      responseType: 'blob',
    })
    
    // 创建下载链接
    const url = window.URL.createObjectURL(response)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${type}_import_template.xlsx`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  // 搜索社团（用于视频创建时选择社团）
  async searchGroups(search?: string, pageSize: number = 20) {
    const queryParams = api.buildQueryParams({
      search: search || '',
      page_size: pageSize,
    })
    return api.get(`/videos/search-groups/${queryParams}`)
  }

  // 获取视频统计
  async getVideoStats(): Promise<{ total_videos: number; weekly_new_videos: number }> {
    return api.get<{ total_videos: number; weekly_new_videos: number }>(`/videos/stats/`)
  }
}

export const videoService = new VideoService()