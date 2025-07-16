import { api } from './api'
import { Competition, PaginatedResponse } from '../types'

interface CompetitionQueryParams {
  page?: number
  page_size?: number
  search?: string
  year?: number
  ordering?: string
}

class CompetitionService {
  // 获取比赛列表
  async getCompetitions(params?: CompetitionQueryParams): Promise<PaginatedResponse<Competition>> {
    const queryParams = {
      page: params?.page || 1,
      page_size: params?.page_size || 12,
      ...params,
    }
    
    const queryString = api.buildQueryParams(queryParams)
    return api.get<PaginatedResponse<Competition>>(`/competitions/${queryString}`)
  }

  // 获取比赛详情
  async getCompetitionById(id: string): Promise<Competition> {
    return api.get<Competition>(`/competitions/${id}/`)
  }

  // 创建比赛
  async createCompetition(data: Partial<Competition>): Promise<Competition> {
    return api.post<Competition>('/competitions/', data)
  }

  // 更新比赛
  async updateCompetition(id: string, data: Partial<Competition>): Promise<Competition> {
    return api.patch<Competition>(`/competitions/${id}/`, data)
  }

  // 删除比赛
  async deleteCompetition(id: string): Promise<void> {
    return api.delete(`/competitions/${id}/`)
  }

  // 搜索比赛
  async searchCompetitions(query: string): Promise<PaginatedResponse<Competition>> {
    return this.getCompetitions({ search: query })
  }

  // 获取某年的比赛
  async getCompetitionsByYear(year: number): Promise<PaginatedResponse<Competition>> {
    return this.getCompetitions({ year })
  }

  // 获取最近的比赛
  async getRecentCompetitions(limit: number = 12): Promise<PaginatedResponse<Competition>> {
    return this.getCompetitions({ 
      ordering: '-year', 
      page_size: limit 
    })
  }

  // 获取比赛的视频
  async getCompetitionVideos(competitionId: string, page: number = 1, pageSize: number = 12) {
    const queryParams = api.buildQueryParams({
      competitions: [competitionId],
      page,
      page_size: pageSize,
    })
    return api.get(`/videos/${queryParams}`)
  }

  // 获取比赛的获奖记录
  async getCompetitionAwards(competitionId: string) {
    return api.get(`/competitions/${competitionId}/awards/`)
  }

  // 获取比赛的参赛社团
  async getCompetitionGroups(competitionId: string) {
    return api.get(`/competitions/${competitionId}/groups/`)
  }

  // 获取年份列表
  async getYearList(): Promise<number[]> {
    const response = await api.get<{ years: number[] }>('/competitions/years/')
    return response.years
  }
}

export const competitionService = new CompetitionService() 