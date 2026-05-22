import { api } from './api'
import { videoService } from './videoService'
import { groupService } from './groupService'
import type { Video, Group, AwardRecord } from '../types'

interface RawAgentResponse {
  natural_language_overview?: string
  video_id_list?: Array<string | number>
  group_id_list?: Array<string | number>
  query?: string
  answer_type?: string
  ui_type?: AgentUiType
  title?: string
  summary?: string
  data?: unknown[]
  sections?: AgentSection[]
  debug?: {
    selected_schemas?: string[]
    generated_sql?: string
  }
}

export type AgentUiType = 'video_grid' | 'group_list' | 'award_leaderboard' | 'mixed_text' | 'group_detail'

export interface AgentVideoGridItem {
  award_record?: AwardRecord | null
  group?: Group | null
  video?: Video | null
  competition?: {
    id?: string
    name?: string
    year?: number
  }
}

export interface AgentLeaderboardItem {
  group: Group
  metrics: {
    gold_award_count?: number
    award_count?: number
  }
  award_records: AwardRecord[]
  videos: Video[]
}

export interface AgentSection {
  type: AgentUiType | 'leaderboard'
  title: string
  items: Array<AgentVideoGridItem | AgentLeaderboardItem | GroupDetailItem>
}

export interface GroupDetailItem {
  group: Group
  award_records: AwardRecord[]
  videos: Video[]
}

export interface AgentSearchResponse {
  query: string
  answer_type: string
  ui_type: AgentUiType
  title: string
  summary: string
  text: string
  video_id_list: string[]
  group_id_list: string[]
  videos: Video[]
  groups: Group[]
  data: Array<AgentVideoGridItem | AgentLeaderboardItem | GroupDetailItem>
  sections: AgentSection[]
  debug?: RawAgentResponse['debug']
}

class AgentService {
  /**
   * Agent智能搜索
   * @param query 搜索查询
   * @returns 搜索结果（包含详情）
   */
  async search(query: string): Promise<AgentSearchResponse> {
    try {
      // 增加该接口的超时时间，避免默认10秒在AI搜索上过短
      const raw = await api.post<RawAgentResponse>('/videos/agent-search/', {
        query: query.trim()
      }, { timeout: 30000 })

      console.debug('[AgentService] raw agent response keys:', Object.keys(raw), 'ui_type:', raw.ui_type, 'data_type:', typeof raw.data, 'isArray:', Array.isArray(raw.data), 'data_len:', Array.isArray(raw.data) ? raw.data.length : 'N/A')

      const videoIds = (raw.video_id_list || []).map((id) => String(id))
      const groupIds = (raw.group_id_list || []).map((id) => String(id))

      if (raw.ui_type && Array.isArray(raw.data)) {
        let hydratedVideos = new Map<string, Video>()
        let hydratedGroups = new Map<string, Group>()

        try {
          const collectFromItem = (item: any) => {
            if (item?.video?.id) hydratedVideos.set(String(item.video.id), item.video)
            if (item?.group?.id) hydratedGroups.set(String(item.group.id), item.group)
            if (Array.isArray(item?.videos)) {
              item.videos.forEach((video: Video) => {
                if (video?.id) hydratedVideos.set(String(video.id), video)
              })
            }
            if (Array.isArray(item?.award_records)) {
              item.award_records.forEach((record: AwardRecord) => {
                if (record?.video && item?.videos) {
                  const video = item.videos.find((v: Video) => v.id === record.video)
                  if (video?.id) hydratedVideos.set(String(video.id), video)
                }
              })
            }
          }

          raw.data.forEach(collectFromItem)
        } catch (transformError) {
          console.error('[AgentService] data transform error, falling back to raw structure:', transformError)
          hydratedVideos = new Map()
          hydratedGroups = new Map()
        }

        return {
          query: raw.query || query.trim(),
          answer_type: raw.answer_type || 'mixed',
          ui_type: raw.ui_type,
          title: raw.title || '智能检索结果',
          summary: raw.summary || raw.natural_language_overview || '',
          text: raw.natural_language_overview || raw.summary || '',
          video_id_list: videoIds,
          group_id_list: groupIds,
          videos: Array.from(hydratedVideos.values()),
          groups: Array.from(hydratedGroups.values()),
          data: raw.data as Array<AgentVideoGridItem | AgentLeaderboardItem | GroupDetailItem>,
          sections: raw.sections || [],
          debug: raw.debug,
        }
      }

      // 兼容旧版后端：只返回 ID 时再并发获取详情
      const videoSettled = await Promise.allSettled(
        videoIds.map((id) => videoService.getVideoById(id))
      )
      const groupSettled = await Promise.allSettled(
        groupIds.map((id) => groupService.getGroupById(id))
      )

      // 记录失败项，帮助定位无结果原因
      const videoFailures: Array<{ id: string; reason: any }> = []
      videoSettled.forEach((r, i) => {
        if (r.status === 'rejected') {
          videoFailures.push({ id: videoIds[i], reason: (r as PromiseRejectedResult).reason })
        }
      })
      const groupFailures: Array<{ id: string; reason: any }> = []
      groupSettled.forEach((r, i) => {
        if (r.status === 'rejected') {
          groupFailures.push({ id: groupIds[i], reason: (r as PromiseRejectedResult).reason })
        }
      })

      if (videoFailures.length || groupFailures.length) {
        console.warn('[AgentService] detail fetch failures', {
          videoFailures,
          groupFailures,
        })
      }

      const videos: Video[] = videoSettled
        .filter((r): r is PromiseFulfilledResult<Video> => r.status === 'fulfilled')
        .map((r) => r.value)

      const groups: Group[] = groupSettled
        .filter((r): r is PromiseFulfilledResult<Group> => r.status === 'fulfilled')
        .map((r) => r.value)

      console.debug('[AgentService] summary', {
        query: query.trim(),
        overview_len: (raw.natural_language_overview || '').length,
        video_id_count: videoIds.length,
        group_id_count: groupIds.length,
        resolved_videos: videos.length,
        resolved_groups: groups.length,
        sample_video_ids: videoIds.slice(0, 3),
        sample_group_ids: groupIds.slice(0, 3),
      })

      return {
        query: query.trim(),
        answer_type: 'legacy',
        ui_type: videos.length ? 'video_grid' : groups.length ? 'group_list' : 'mixed_text',
        title: '智能检索结果',
        summary: raw.natural_language_overview || '',
        text: raw.natural_language_overview || '',
        video_id_list: videoIds,
        group_id_list: groupIds,
        videos,
        groups,
        data: [
          ...videos.map((video) => ({ video, group: null, award_record: null })),
          ...groups.map((group) => ({ group, video: null, award_record: null })),
        ],
        sections: [],
      }
    } catch (error: any) {
      console.error('[AgentService] search error', error)
      if (error.response?.status === 503) {
        throw new Error('AI搜索服务暂不可用，请稍后重试')
      } else if (error.response?.status === 400) {
        throw new Error('搜索查询不能为空')
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('搜索超时，请稍后重试或简化查询')
      } else if (error.message) {
        throw new Error(`搜索失败: ${error.message}`)
      } else {
        throw new Error('搜索失败，请稍后重试')
      }
    }
  }

  /**
   * 检查Agent服务是否可用
   * @returns 服务状态
   */
  async checkServiceStatus(): Promise<boolean> {
    try {
      // 发送一个简单的测试请求
      await api.post('/videos/agent-search/', {
        query: 'test'
      }, { timeout: 10000 })
      return true
    } catch (error: any) {
      if (error.response?.status === 503) {
        return false
      }
      // 其他错误可能不是服务不可用，返回true
      return true
    }
  }
}

export const agentService = new AgentService()
