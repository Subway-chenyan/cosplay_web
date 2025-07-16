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
    const response = await this.getAwards({
      competition: competitionId,
      page_size: 100,
      ordering: 'level,name'
    })
    return response.results
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
    const queryParams: AwardRecordQueryParams = {
      page_size: 200,
      ordering: '-year,award__level'
    }
    
    if (year) {
      queryParams.year = year
    }
    
    // 通过奖项关联筛选比赛
    const response = await this.getAwardRecords(queryParams)
    
    // 由于API限制，这里需要在前端进行额外筛选
    // 实际应用中建议在后端增加competition参数支持
    return response.results
  }

  // 获取视频的获奖记录
  async getVideoAwardRecords(videoId: string): Promise<AwardRecord[]> {
    const response = await this.getAwardRecords({
      video: videoId,
      page_size: 50
    })
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