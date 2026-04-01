import { api } from './api'
import { Event } from '../types'

export const eventService = {
  // 获取所有赛事
  getEvents: async (): Promise<Event[]> => {
    return await api.get<Event[]>('/competitions/events/')
  },

  // 根据ID获取单个赛事
  getEvent: async (id: string): Promise<Event> => {
    return await api.get<Event>(`/competitions/events/${id}/`)
  },

  // 按月份获取赛事
  getEventsByMonth: async (year: number, month: number): Promise<Event[]> => {
    return await api.get<Event[]>(`/competitions/events/by_month/?year=${year}&month=${month}`)
  },

  // 按日期范围获取赛事
  getEventsByDateRange: async (startDate: string, endDate: string): Promise<Event[]> => {
    return await api.get<Event[]>(`/competitions/events/by_date_range/?start_date=${startDate}&end_date=${endDate}`)
  },

  // 创建赛事
  createEvent: async (eventData: Partial<Event>): Promise<Event> => {
    return await api.post<Event>('/competitions/events/', eventData)
  },

  // 更新赛事
  updateEvent: async (id: string, eventData: Partial<Event>): Promise<Event> => {
    return await api.patch<Event>(`/competitions/events/${id}/`, eventData)
  },

  // 删除赛事
  deleteEvent: async (id: string): Promise<void> => {
    await api.delete<void>(`/competitions/events/${id}/`)
  },

  // 获取当前活跃赛事
  getActiveEvents: async (): Promise<Event[]> => {
    return await api.get<Event[]>('/competitions/events/active/')
  },

  // 获取比赛赛程
  getCompetitionSchedule: async (competitionId: string): Promise<Event[]> => {
    return await api.get<Event[]>(`/competitions/competitions/${competitionId}/schedule/`)
  },

  // 关联视频到赛事
  linkVideo: async (eventId: string, videoId: string): Promise<Event> => {
    return await api.post<Event>(`/competitions/events/${eventId}/link_video/`, { video_id: videoId })
  },

  // 取消关联视频
  unlinkVideo: async (eventId: string, videoId: string): Promise<Event> => {
    return await api.post<Event>(`/competitions/events/${eventId}/unlink_video/`, { video_id: videoId })
  },
}