import { api } from './api'
import { Award, AwardRecord, PaginatedResponse } from '../types'

interface AwardQueryParams {
  page?: number
  page_size?: number
  competition?: string
  level?: string
  ordering?: string
}

interface AwardRecordQueryParams {
  page?: number
  page_size?: number
  award?: string
  video?: string
  group?: string
  year?: number
  ordering?: string
}

class AwardService {
  // 获取奖项列表
  async getAwards(params?: AwardQueryParams): Promise<PaginatedResponse<Award>> {
    const queryParams = {
      page: params?.page || 1,
      page_size: params?.page_size || 50,
      ...params,
    }
    
    const queryString = api.buildQueryParams(queryParams)
    return api.get<PaginatedResponse<Award>>(`/awards/${queryString}`)
  }

  // 获取奖项详情
  async getAwardById(id: string): Promise<Award> {
    return api.get<Award>(`/awards/${id}/`)
  }

  // 获取比赛的所有奖项
  async getCompetitionAwards(competitionId: string): Promise<Award[]> {
    const queryString = api.buildQueryParams({ competition: competitionId })
    return api.get<Award[]>(`/awards/by_competition/${queryString}`)
  }

  // 获取获奖记录列表
  async getAwardRecords(params?: AwardRecordQueryParams): Promise<PaginatedResponse<AwardRecord>> {
    const queryParams = {
      page: params?.page || 1,
      page_size: params?.page_size || 50,
      ...params,
    }
    
    const queryString = api.buildQueryParams(queryParams)
    return api.get<PaginatedResponse<AwardRecord>>(`/awards/records/${queryString}`)
  }

  // 获取比赛的所有获奖记录
  async getCompetitionAwardRecords(competitionId: string, year?: number): Promise<AwardRecord[]> {
    const queryParams: any = {}
    if (year) {
      queryParams.year = year
    }
    
    const queryString = api.buildQueryParams({ ...queryParams, competition: competitionId })
    return api.get<AwardRecord[]>(`/awards/records/by_competition/${queryString}`)
  }

  // 获取视频的获奖记录
  async getVideoAwardRecords(videoId: string): Promise<AwardRecord[]> {
    const response = await this.getAwardRecords({
      video: videoId,
      page_size: 50
    })
    return response.results
  }

  // 获取奖项的视频
  async getAwardVideos(awardId: string, page: number = 1, pageSize: number = 12) {
    const queryParams = api.buildQueryParams({
      page,
      page_size: pageSize,
    })
    return api.get(`/awards/${awardId}/videos/${queryParams}`)
  }

  // 获取奖项特定年份的视频
  async getAwardYearVideos(awardId: string, competitionYearId: number, page: number = 1, pageSize: number = 12): Promise<AwardRecord[]> {
    const queryParams = api.buildQueryParams({
      page,
      page_size: pageSize,
    })
    const response = await api.get<PaginatedResponse<AwardRecord>>(`/awards/${awardId}/years/${competitionYearId}/videos/${queryParams}`)
    return response.results
  }

  // 获取社团的获奖记录
  async getGroupAwardRecords(groupId: string): Promise<AwardRecord[]> {
    const response = await this.getAwardRecords({
      group: groupId,
      page_size: 100
    })
    return response.results
  }

  // 创建奖项
  async createAward(data: Partial<Award>): Promise<Award> {
    return api.post<Award>('/awards/', data)
  }

  // 更新奖项
  async updateAward(id: string, data: Partial<Award>): Promise<Award> {
    return api.patch<Award>(`/awards/${id}/`, data)
  }

  // 删除奖项
  async deleteAward(id: string): Promise<void> {
    return api.delete(`/awards/${id}/`)
  }

  // 创建获奖记录
  async createAwardRecord(data: Partial<AwardRecord>): Promise<AwardRecord> {
    return api.post<AwardRecord>('/awards/records/', data)
  }

  // 更新获奖记录
  async updateAwardRecord(id: string, data: Partial<AwardRecord>): Promise<AwardRecord> {
    return api.patch<AwardRecord>(`/awards/records/${id}/`, data)
  }

  // 删除获奖记录
  async deleteAwardRecord(id: string): Promise<void> {
    return api.delete(`/awards/records/${id}/`)
  }
}

export const awardService = new AwardService()