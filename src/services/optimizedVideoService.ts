import axios from 'axios'
import { Video } from '../types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

export interface VideoStats {
  total_videos: number
  year_distribution: Array<{
    year: number
    count: number
  }>
  award_distribution: Array<{
    award__name: string
    count: number
  }>
}

export interface OptimizedVideoParams {
  competitionId: string
  year?: number
  award?: string
  page?: number
  pageSize?: number
  ordering?: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
  total_pages: number
  current_page: number
  page_size: number
}

class OptimizedVideoService {
  /**
   * 获取比赛视频的统计信息
   */
  async getCompetitionStats(competitionId: string): Promise<VideoStats> {
    const response = await axios.get(`${API_BASE_URL}/videos/competition/${competitionId}/stats/`)
    return response.data
  }

  /**
   * 获取优化的比赛视频列表
   */
  async getCompetitionVideosOptimized(params: OptimizedVideoParams): Promise<PaginatedResponse<Video>> {
    const {
      competitionId,
      year,
      award,
      page = 1,
      pageSize = 100,
      ordering = '-created_at'
    } = params

    const queryParams = new URLSearchParams()
    if (year) queryParams.append('year', year.toString())
    if (award) queryParams.append('award', award)
    if (page) queryParams.append('page', page.toString())
    if (pageSize) queryParams.append('page_size', pageSize.toString())
    if (ordering) queryParams.append('ordering', ordering)

    const response = await axios.get(
      `${API_BASE_URL}/videos/competition/${competitionId}/optimized/?${queryParams.toString()}`
    )
    return response.data
  }

  /**
   * 批量获取比赛视频（支持并行请求）
   */
  async getCompetitionVideosBatch(
    competitionId: string,
    years: number[],
    pageSize: number = 50
  ): Promise<Map<number, PaginatedResponse<Video>>> {
    const promises = years.map(year => 
      this.getCompetitionVideosOptimized({
        competitionId,
        year,
        pageSize,
        page: 1
      }).then(response => [year, response] as [number, PaginatedResponse<Video>])
    )

    const results = await Promise.all(promises)
    return new Map(results)
  }

  /**
   * 获取所有年份的视频（自动分页）
   */
  async getAllCompetitionVideos(competitionId: string): Promise<Video[]> {
    const allVideos: Video[] = []
    let page = 1
    let hasMore = true

    while (hasMore) {
      const response = await this.getCompetitionVideosOptimized({
        competitionId,
        page,
        pageSize: 500 // 最大页面大小
      })

      allVideos.push(...response.results)
      hasMore = !!response.next
      page++
    }

    return allVideos
  }

  /**
   * 缓存友好的批量获取
   */
  async getCachedCompetitionVideos(
    competitionId: string,
    year?: number,
    page: number = 1,
    pageSize: number = 100
  ): Promise<PaginatedResponse<Video>> {
    const cacheKey = `videos_${competitionId}_${year || 'all'}_${page}_${pageSize}`
    
    // 检查缓存
    const cached = sessionStorage.getItem(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }

    const response = await this.getCompetitionVideosOptimized({
      competitionId,
      year,
      page,
      pageSize
    })

    // 缓存5分钟
    sessionStorage.setItem(cacheKey, JSON.stringify(response))
    setTimeout(() => sessionStorage.removeItem(cacheKey), 5 * 60 * 1000)

    return response
  }
}

export default new OptimizedVideoService()