import { useState, useEffect } from 'react'
import { Check, X, Clock, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface Feedback {
  id: number
  user: string | null
  user_display: string
  feedback_type: string
  feedback_type_display: string
  content: string
  contact_info: string
  status: string
  status_display: string
  admin_reply: string
  created_at: string
  updated_at: string
}

interface FeedbackStats {
  total: number
  pending: number
  processing: number
  resolved: number
}

interface FeedbackPanelProps {
  token: string
}

function FeedbackPanel({ token }: FeedbackPanelProps) {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [stats, setStats] = useState<FeedbackStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [replyText, setReplyText] = useState<Record<number, string>>({})
  const [updating, setUpdating] = useState<number | null>(null)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  useEffect(() => {
    fetchFeedbacks()
    fetchStats()
  }, [statusFilter])

  const fetchFeedbacks = async () => {
    try {
      const url = statusFilter
        ? `/api/users/feedback/?status=${statusFilter}`
        : '/api/users/feedback/'

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setFeedbacks(data.results || data)
      }
    } catch (error) {
      console.error('Failed to fetch feedbacks:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/users/feedback/stats/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  const updateFeedback = async (id: number, status: string, adminReply?: string) => {
    setUpdating(id)
    try {
      const body: Record<string, string> = { status }
      if (adminReply !== undefined) {
        body.admin_reply = adminReply
      }

      const response = await fetch(`/api/users/feedback/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setMessage('更新成功')
        setMessageType('success')
        fetchFeedbacks()
        fetchStats()
      } else {
        setMessage('更新失败')
        setMessageType('error')
      }
    } catch {
      setMessage('网络错误')
      setMessageType('error')
    } finally {
      setUpdating(null)
      setTimeout(() => setMessage(''), 2000)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'processing':
        return <AlertCircle className="w-4 h-4 text-blue-500" />
      case 'resolved':
        return <Check className="w-4 h-4 text-green-500" />
      case 'rejected':
        return <X className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 border-yellow-500'
      case 'processing':
        return 'bg-blue-100 border-blue-500'
      case 'resolved':
        return 'bg-green-100 border-green-500'
      case 'rejected':
        return 'bg-red-100 border-red-500'
      default:
        return 'bg-gray-100 border-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-p5-red border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 统计信息 */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-gray-100 border-2 border-black p-3 text-center">
            <p className="text-2xl font-black">{stats.total}</p>
            <p className="text-xs font-bold text-gray-600 uppercase">总计</p>
          </div>
          <div className="bg-yellow-100 border-2 border-yellow-500 p-3 text-center">
            <p className="text-2xl font-black text-yellow-700">{stats.pending}</p>
            <p className="text-xs font-bold text-yellow-600 uppercase">待处理</p>
          </div>
          <div className="bg-blue-100 border-2 border-blue-500 p-3 text-center">
            <p className="text-2xl font-black text-blue-700">{stats.processing}</p>
            <p className="text-xs font-bold text-blue-600 uppercase">处理中</p>
          </div>
          <div className="bg-green-100 border-2 border-green-500 p-3 text-center">
            <p className="text-2xl font-black text-green-700">{stats.resolved}</p>
            <p className="text-xs font-bold text-green-600 uppercase">已解决</p>
          </div>
        </div>
      )}

      {/* 筛选器 */}
      <div className="flex items-center space-x-2 mb-4">
        <span className="font-bold text-sm">筛选:</span>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border-2 border-black font-bold text-sm"
        >
          <option value="">全部</option>
          <option value="pending">待处理</option>
          <option value="processing">处理中</option>
          <option value="resolved">已解决</option>
          <option value="rejected">已拒绝</option>
        </select>
      </div>

      {/* 消息提示 */}
      {message && (
        <div className={`p-3 border-2 font-bold text-sm ${
          messageType === 'success'
            ? 'bg-green-50 border-green-500 text-green-800'
            : 'bg-red-50 border-red-500 text-red-800'
        }`}>
          {message}
        </div>
      )}

      {/* 反馈列表 */}
      {feedbacks.length === 0 ? (
        <div className="text-center py-8 text-gray-500 font-bold">
          暂无反馈
        </div>
      ) : (
        <div className="space-y-3">
          {feedbacks.map((feedback) => (
            <div
              key={feedback.id}
              className={`border-2 ${getStatusBgColor(feedback.status)} transition-all`}
            >
              {/* 反馈头部 */}
              <div
                className="p-4 cursor-pointer flex items-center justify-between"
                onClick={() => setExpandedId(expandedId === feedback.id ? null : feedback.id)}
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(feedback.status)}
                  <div>
                    <p className="font-black text-sm">
                      [{feedback.feedback_type_display}] {feedback.user_display}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(feedback.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold px-2 py-1 bg-white border border-black">
                    {feedback.status_display}
                  </span>
                  {expandedId === feedback.id ? (
                    <ChevronUp className="w-5 h-5" />
                  ) : (
                    <ChevronDown className="w-5 h-5" />
                  )}
                </div>
              </div>

              {/* 展开详情 */}
              {expandedId === feedback.id && (
                <div className="border-t-2 border-black p-4 bg-white">
                  {/* 反馈内容 */}
                  <div className="mb-4">
                    <p className="text-xs font-black text-gray-500 uppercase mb-1">反馈内容</p>
                    <p className="text-sm font-bold whitespace-pre-wrap">{feedback.content}</p>
                  </div>

                  {/* 联系方式 */}
                  {feedback.contact_info && (
                    <div className="mb-4">
                      <p className="text-xs font-black text-gray-500 uppercase mb-1">联系方式</p>
                      <p className="text-sm font-bold">{feedback.contact_info}</p>
                    </div>
                  )}

                  {/* 管理员回复 */}
                  <div className="mb-4">
                    <p className="text-xs font-black text-gray-500 uppercase mb-1">管理员回复</p>
                    <textarea
                      value={replyText[feedback.id] ?? feedback.admin_reply}
                      onChange={(e) => setReplyText({ ...replyText, [feedback.id]: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border-2 border-black font-bold text-sm resize-none"
                      placeholder="输入回复内容..."
                    />
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => updateFeedback(
                        feedback.id,
                        'processing',
                        replyText[feedback.id] ?? feedback.admin_reply
                      )}
                      disabled={updating === feedback.id}
                      className="px-3 py-2 bg-blue-500 text-white font-bold text-xs border-2 border-black hover:bg-blue-600 disabled:opacity-50"
                    >
                      标记处理中
                    </button>
                    <button
                      onClick={() => updateFeedback(
                        feedback.id,
                        'resolved',
                        replyText[feedback.id] ?? feedback.admin_reply
                      )}
                      disabled={updating === feedback.id}
                      className="px-3 py-2 bg-green-500 text-white font-bold text-xs border-2 border-black hover:bg-green-600 disabled:opacity-50"
                    >
                      标记已解决
                    </button>
                    <button
                      onClick={() => updateFeedback(
                        feedback.id,
                        'rejected',
                        replyText[feedback.id] ?? feedback.admin_reply
                      )}
                      disabled={updating === feedback.id}
                      className="px-3 py-2 bg-red-500 text-white font-bold text-xs border-2 border-black hover:bg-red-600 disabled:opacity-50"
                    >
                      拒绝
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FeedbackPanel
