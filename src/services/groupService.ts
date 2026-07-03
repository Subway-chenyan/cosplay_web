import { api } from './api'
import { Group, GroupManager, PaginatedResponse, ProvinceStats, CityStats } from '../types'

interface GroupQueryParams {
  page?: number
  page_size?: number
  search?: string
  province?: string
  city?: string
  is_active?: boolean
  is_verified?: boolean
  ordering?: string
}

class GroupService {
  // 获取社团列表
  async getGroups(
    params?: GroupQueryParams,
    signal?: AbortSignal,
  ): Promise<PaginatedResponse<Group>> {
    const queryParams = {
      page: params?.page || 1,
      page_size: params?.page_size || 12,
      ...params,
    }
    
    const queryString = api.buildQueryParams(queryParams)
    console.log('GroupService - API URL:', `/groups/${queryString}`)
    return api.get<PaginatedResponse<Group>>(`/groups/${queryString}`, { signal })
  }

  // 获取社团详情
  async getGroupById(id: string): Promise<Group> {
    return api.get<Group>(`/groups/${id}/`)
  }

  async getManagedGroups(): Promise<PaginatedResponse<Group>> {
    return api.get<PaginatedResponse<Group>>('/groups/managed/?page_size=1000')
  }

  async getGroupManagers(groupId: string): Promise<PaginatedResponse<GroupManager>> {
    return api.get<PaginatedResponse<GroupManager>>(`/groups/${groupId}/managers/`)
  }

  async addGroupManager(groupId: string, userId: string): Promise<{ detail: string; managers: GroupManager[] }> {
    return api.post<{ detail: string; managers: GroupManager[] }>(`/groups/${groupId}/managers/`, {
      user_id: userId,
    })
  }

  async removeGroupManager(groupId: string, userId: string): Promise<{ detail: string }> {
    return api.delete<{ detail: string }>(`/groups/${groupId}/managers/${userId}/`)
  }

  // 创建社团
  async createGroup(data: Partial<Group>): Promise<Group> {
    return api.post<Group>('/groups/', data)
  }

  // 更新社团
  async updateGroup(id: string, data: Partial<Group>): Promise<Group> {
    return api.patch<Group>(`/groups/${id}/`, data)
  }

  // 获取文件上传签名
  async getUploadUrl(fileName: string, fileType: string): Promise<{ upload_url: string, public_url: string, key: string }> {
    return api.post('/auth/r2-sign/', {
      file_name: fileName,
      file_type: fileType,
      folder: 'groups'
    })
  }

  // 删除社团
  async deleteGroup(id: string): Promise<void> {
    return api.delete(`/groups/${id}/`)
  }

  // 搜索社团
  async searchGroups(query: string, signal?: AbortSignal): Promise<PaginatedResponse<Group>> {
    console.log('GroupService - searchGroups called with query:', query)
    return this.getGroups({ search: query, page_size: 20 }, signal)
  }

  // 获取活跃社团
  async getActiveGroups(): Promise<PaginatedResponse<Group>> {
    return this.getGroups({ is_active: true })
  }

  // 获取认证社团
  async getVerifiedGroups(): Promise<PaginatedResponse<Group>> {
    return this.getGroups({ is_verified: true })
  }

  // 获取热门社团（按视频数量排序）
  async getPopularGroups(limit: number = 12): Promise<PaginatedResponse<Group>> {
    return this.getGroups({ 
      ordering: '-video_count', 
      page_size: limit 
    })
  }

  // 获取社团的视频
  async getGroupVideos(groupId: string, page: number = 1, pageSize: number = 12) {
    const queryParams = api.buildQueryParams({
      page,
      page_size: pageSize,
    })
    return api.get(`/groups/${groupId}/videos/${queryParams}`)
  }

  // 获取社团成员
  async getGroupMembers(groupId: string) {
    return api.get(`/groups/${groupId}/members/`)
  }

  // 加入社团
  async joinGroup(groupId: string) {
    return api.post(`/groups/${groupId}/join/`)
  }

  // 退出社团
  async leaveGroup(groupId: string) {
    return api.post(`/groups/${groupId}/leave/`)
  }

  // 获取省份统计数据
  async getProvinceStats(): Promise<{ province_stats: ProvinceStats[] }> {
    return api.get<{ province_stats: ProvinceStats[] }>('/groups/by_province/')
  }

  // 获取城市统计数据
  async getCityStats(province?: string): Promise<{ city_stats: CityStats[] }> {
    const queryParams = province ? api.buildQueryParams({ province }) : ''
    return api.get<{ city_stats: CityStats[] }>(`/groups/by_city/${queryParams}`)
  }

  // 按省份筛选社团
  async getGroupsByProvince(province: string, params?: Omit<GroupQueryParams, 'province'>): Promise<PaginatedResponse<Group>> {
    return this.getGroups({ ...params, province })
  }

  // 按城市筛选社团
  async getGroupsByCity(city: string, params?: Omit<GroupQueryParams, 'city'>): Promise<PaginatedResponse<Group>> {
    return this.getGroups({ ...params, city })
  }
}

export const groupService = new GroupService()
