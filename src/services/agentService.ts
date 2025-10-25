import { api } from './api'

export interface AgentSearchResponse {
  query: string
  text: string  // LLM生成的自然语言总结
  video_id_list: number[]  // 视频ID列表
  group_id_list: number[]  // 社团ID列表
  videos: any[]
  groups: any[]
  video_count: number
  group_count: number
  total_count: number
  agent_analysis?: string  // 意图分析（调试用）
}

class AgentService {
  /**
   * Agent智能搜索
   * @param query 搜索查询
   * @returns 搜索结果
   */
  async search(query: string): Promise<AgentSearchResponse> {
    try {
      const response = await api.post<AgentSearchResponse>('/videos/agent-search/', {
        query: query.trim()
      })

      // 检查响应是否包含错误信息
      if ('error' in response && response.error) {
        throw new Error(response.error as string)
      }

      return response
    } catch (error: any) {
      if (error.response?.status === 503) {
        throw new Error('AI搜索服务暂不可用，请稍后重试')
      } else if (error.response?.status === 400) {
        throw new Error('搜索查询不能为空')
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
      })
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