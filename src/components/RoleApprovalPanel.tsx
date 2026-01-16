import { useState, useEffect } from 'react'
import { Shield, Clock, CheckCircle, XCircle, User as UserIcon, Mail, AlertCircle } from 'lucide-react'

interface RoleApplication {
  user_id: string
  username: string
  nickname: string
  email: string
  role_application_reason: string
  role_application_date: string
  current_role: string
}

interface RoleApprovalPanelProps {
  token: string
  onRefresh: () => void
}

function RoleApprovalPanel({ token, onRefresh }: RoleApprovalPanelProps) {
  const [applications, setApplications] = useState<RoleApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [processing, setProcessing] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/users/list-role-applications/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setApplications(data.results || [])
      } else {
        const errorData = await response.json()
        setError(errorData.detail || '获取申请列表失败')
      }
    } catch (err) {
      setError('网络错误，请检查连接')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApplications()
  }, [token])

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg)
    setMessageType(type)
    setTimeout(() => setMessage(''), 3000)
  }

  const handleApprove = async (userId: string, targetRole: string) => {
    setProcessing(userId)
    try {
      const response = await fetch('/api/users/approve-role-application/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: userId,
          target_role: targetRole,
          action: 'approve',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        showMessage(data.detail || '已批准申请', 'success')
        fetchApplications()
        onRefresh()
      } else {
        const errorData = await response.json()
        showMessage(errorData.detail || '操作失败', 'error')
      }
    } catch (err) {
      showMessage('网络错误，请检查连接', 'error')
    } finally {
      setProcessing(null)
    }
  }

  const handleReject = async (userId: string) => {
    if (!confirm('确定要拒绝这个申请吗？')) return

    setProcessing(userId)
    try {
      const response = await fetch('/api/users/approve-role-application/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: userId,
          action: 'reject',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        showMessage(data.detail || '已拒绝申请', 'success')
        fetchApplications()
      } else {
        const errorData = await response.json()
        showMessage(errorData.detail || '操作失败', 'error')
      }
    } catch (err) {
      showMessage('网络错误，请检查连接', 'error')
    } finally {
      setProcessing(null)
    }
  }

  const getRoleDisplayName = (role: string) => {
    const roleMap: Record<string, string> = {
      'admin': '管理员',
      'editor': '编辑',
      'viewer': '浏览用户',
      'contributor': '贡献者',
    }
    return roleMap[role] || role
  }

  const getRoleBadgeColor = (role: string) => {
    if (role === 'admin' || role === 'editor' || role === 'contributor') {
      return 'bg-p5-red text-white'
    }
    return 'bg-gray-200 text-gray-700'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="w-8 h-8 border-4 border-p5-red border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 消息提示 */}
      {message && (
        <div className={`relative ${messageType === 'success' ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'} border-2 rounded-lg p-4 flex items-center space-x-3`}>
          {messageType === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
          )}
          <p className={`font-bold text-sm ${messageType === 'success' ? 'text-green-800' : 'text-red-800'}`}>
            {message}
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <p className="font-bold text-sm text-red-800">{error}</p>
        </div>
      )}

      {applications.length === 0 ? (
        <div className="bg-gray-50 border-2 border-gray-300 rounded-lg p-8 text-center">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 font-bold">暂无待审批的申请</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map(app => (
            <div key={app.user_id} className="bg-white border-4 border-black p-6">
              {/* 申请人信息 */}
              <div className="flex items-start justify-between mb-4 pb-4 border-b-2 border-black">
                <div className="flex items-center space-x-3">
                  <div className="bg-p5-red text-white p-2 rounded-full">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg">
                      {app.nickname || app.username}
                      <span className="ml-2 text-sm font-bold text-gray-500">({app.username})</span>
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <Mail className="w-4 h-4 mr-1" />
                      {app.email}
                    </div>
                  </div>
                </div>
                <div className={`px-3 py-1 font-black uppercase italic border-2 border-black text-sm ${getRoleBadgeColor(app.current_role)}`}>
                  当前：{getRoleDisplayName(app.current_role)}
                </div>
              </div>

              {/* 申请理由 */}
              <div className="mb-4">
                <label className="block text-sm font-black text-gray-700 mb-2 uppercase italic">
                  申请理由 / REASON
                </label>
                <div className="bg-gray-50 border-2 border-gray-300 p-3 font-bold">
                  {app.role_application_reason}
                </div>
              </div>

              {/* 申请时间 */}
              <div className="mb-4 text-sm text-gray-600">
                <Clock className="w-4 h-4 inline mr-1" />
                申请时间：{new Date(app.role_application_date).toLocaleString()}
              </div>

              {/* 操作按钮 */}
              {processing === app.user_id ? (
                <div className="flex items-center justify-center py-3">
                  <div className="w-6 h-6 border-3 border-p5-red border-t-transparent rounded-full animate-spin mr-2"></div>
                  <span className="font-bold text-gray-600">处理中...</span>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleApprove(app.user_id, 'contributor')}
                    className="flex-1 min-w-[120px] bg-green-600 text-white px-4 py-2 font-black uppercase italic border-2 border-black hover:bg-green-700 text-sm"
                  >
                    授予贡献者
                  </button>
                  <button
                    onClick={() => handleApprove(app.user_id, 'editor')}
                    className="flex-1 min-w-[120px] bg-blue-600 text-white px-4 py-2 font-black uppercase italic border-2 border-black hover:bg-blue-700 text-sm"
                  >
                    授予编辑
                  </button>
                  <button
                    onClick={() => handleApprove(app.user_id, 'admin')}
                    className="flex-1 min-w-[120px] bg-p5-red text-white px-4 py-2 font-black uppercase italic border-2 border-black hover:bg-red-700 text-sm"
                  >
                    授予管理员
                  </button>
                  <button
                    onClick={() => handleReject(app.user_id)}
                    className="flex-1 min-w-[120px] bg-gray-500 text-white px-4 py-2 font-black uppercase italic border-2 border-black hover:bg-gray-600 text-sm"
                  >
                    <XCircle className="w-4 h-4 inline mr-1" />
                    拒绝
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default RoleApprovalPanel
