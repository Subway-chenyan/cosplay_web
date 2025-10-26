import { api } from './api'
import { videoService } from './videoService'
import { groupService } from './groupService'
import type { Video, Group } from '../types'

// 后端原始返回结构
interface RawAgentResponse {
  natural_language_overview: string
  video_id_list: Array<string | number>
  group_id_list: Array<string | number>
}

export interface AgentSearchResponse {
  text: string // LLM生成的自然语言总结（映射自 natural_language_overview）
  video_id_list: string[] // 视频ID列表
  group_id_list: string[] // 社团ID列表
  videos: Video[]
  groups: Group[]
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

      console.debug('[AgentService] raw agent response:', raw)

      const videoIds = (raw.video_id_list || []).map((id) => String(id))
      const groupIds = (raw.group_id_list || []).map((id) => String(id))

      // 并发获取详情，容错处理
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
        text: raw.natural_language_overview || '',
        video_id_list: videoIds,
        group_id_list: groupIds,
        videos,
        groups,
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