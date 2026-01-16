import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Edit3, Shield, AlertCircle, CheckCircle, Save, Upload, Database, FileText, Users, Video } from 'lucide-react'
import Header from '../components/Header'
import SearchableMultiSelectModal from '../components/SearchableMultiSelectModal'
import RoleApprovalPanel from '../components/RoleApprovalPanel'

interface UserProfile {
  id: string
  username: string
  email: string
  nickname: string
  bio: string
  avatar: string
  role: string
  role_application_pending: boolean
  role_application_reason: string
  role_application_date: string
  groups: Array<{ id: string; name: string; description: string }>
  performed_videos: Array<{ id: string; title: string; bv_number: string }>
}

interface Group {
  id: string
  name: string
  description: string
}

interface Video {
  id: string
  title: string
  bv_number: string
}

function UserCenterPage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    nickname: '',
    bio: '',
    group_ids: [] as string[],
    performed_video_ids: [] as string[],
  })

  const [showApplicationForm, setShowApplicationForm] = useState(false)
  const [applicationReason, setApplicationReason] = useState('')
  const [submittingApplication, setSubmittingApplication] = useState(false)

  const [availableGroups, setAvailableGroups] = useState<Group[]>([])
  const [availableVideos, setAvailableVideos] = useState<Video[]>([])

  // 模态框状态
  const [showGroupModal, setShowGroupModal] = useState(false)
  const [showVideoModal, setShowVideoModal] = useState(false)

  useEffect(() => {
    fetchProfile()
    fetchGroups()
    fetchVideos()
  }, [])

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        navigate('/login')
        return
      }

      const response = await fetch('/api/users/me/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data)
        setEditForm({
          nickname: data.nickname || '',
          bio: data.bio || '',
          group_ids: data.groups?.map((g: Group) => g.id) || [],
          performed_video_ids: data.performed_videos?.map((v: Video) => v.id) || [],
        })
      } else {
        showMessage('获取用户信息失败', 'error')
      }
    } catch (error) {
      showMessage('网络错误，请检查连接', 'error')
    } finally {
      setLoading(false)
    }
  }

  const fetchGroups = async () => {
    try {
      // 获取所有社团，自动分页
      let allGroups: Group[] = []
      let page = 1
      let hasMore = true

      while (hasMore) {
        const response = await fetch(`/api/groups/?page=${page}&page_size=1000`)
        if (response.ok) {
          const data = await response.json()
          const results = data.results || data
          allGroups = [...allGroups, ...results]

          // 检查是否还有更多数据
          if (data.next) {
            page++
          } else {
            hasMore = false
          }
        } else {
          console.error(`Failed to fetch groups page ${page}:`, response.status)
          hasMore = false
        }
      }

      setAvailableGroups(allGroups)
      console.log(`Fetched ${allGroups.length} groups`)
    } catch (error) {
      console.error('Failed to fetch groups:', error)
      showMessage('获取社团列表失败，请刷新页面重试', 'error')
    }
  }

  const fetchVideos = async () => {
    try {
      // 获取所有视频，自动分页
      let allVideos: Video[] = []
      let page = 1
      let hasMore = true

      while (hasMore) {
        const response = await fetch(`/api/videos/?page=${page}&page_size=1000`)
        if (response.ok) {
          const data = await response.json()
          const results = data.results || data
          allVideos = [...allVideos, ...results]

          // 检查是否还有更多数据
          if (data.next) {
            page++
          } else {
            hasMore = false
          }
        } else {
          console.error(`Failed to fetch videos page ${page}:`, response.status)
          hasMore = false
        }
      }

      setAvailableVideos(allVideos)
      console.log(`Fetched ${allVideos.length} videos`)
    } catch (error) {
      console.error('Failed to fetch videos:', error)
      showMessage('获取视频列表失败，请刷新页面重试', 'error')
    }
  }

  const showMessage = (msg: string, type: 'success' | 'error') => {
    setMessage(msg)
    setMessageType(type)
    setTimeout(() => setMessage(''), 3000)
  }

  const getInitial = (name: string) => {
    return name ? name.charAt(0).toUpperCase() : '?'
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch('/api/users/update-profile/', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.data)
        setIsEditing(false)
        showMessage('资料更新成功！', 'success')
      } else {
        const errorData = await response.json()
        console.error('Update profile error:', errorData)

        // 更优雅地处理错误消息
        let errorMessage = '更新失败'

        if (errorData.detail) {
          errorMessage = errorData.detail
        } else if (errorData.group_ids) {
          errorMessage = `社团ID错误: ${errorData.group_ids.join(', ')}`
        } else if (errorData.performed_video_ids) {
          errorMessage = `视频ID错误: ${errorData.performed_video_ids.join(', ')}`
        } else if (errorData.non_field_errors) {
          errorMessage = errorData.non_field_errors.join(', ')
        } else {
          // 尝试提取所有错误消息
          const messages = Object.values(errorData).flat()
          if (messages.length > 0) {
            errorMessage = messages.join(', ')
          }
        }

        showMessage(errorMessage, 'error')
      }
    } catch (error) {
      console.error('Save profile error:', error)
      showMessage('网络错误，请检查连接', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingAvatar(true)
    try {
      const token = localStorage.getItem('access_token')
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch('/api/users/update-profile/', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          // 注意：不要手动设置 Content-Type，让浏览器自动处理以包含 boundary
        },
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.data)
        showMessage('头像更新成功！', 'success')
      } else {
        showMessage('头像更新失败', 'error')
      }
    } catch (error) {
      showMessage('网络错误', 'error')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleApplyForContributor = async () => {
    if (applicationReason.length < 10) {
      showMessage('申请理由至少需要 10 个字', 'error')
      return
    }

    setSubmittingApplication(true)
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch('/api/users/apply-role/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: applicationReason }),
      })

      if (response.ok) {
        showMessage('申请已提交，请等待管理员审核', 'success')
        setShowApplicationForm(false)
        setApplicationReason('')
        fetchProfile()
      } else {
        const errorData = await response.json()
        showMessage(errorData.detail || errorData.non_field_errors?.[0] || '申请提交失败', 'error')
      }
    } catch (error) {
      showMessage('网络错误，请检查连接', 'error')
    } finally {
      setSubmittingApplication(false)
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-p5-red border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-bold">正在加载...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-4" />
          <p className="text-gray-600 font-bold mb-4">无法加载用户信息</p>
          <button
            onClick={() => navigate('/login')}
            className="bg-p5-red text-white px-6 py-2 font-black uppercase italic border-2 border-black hover:bg-red-700"
          >
            返回登录
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* 页面标题 */}
          <div className="relative group">
            <div className="absolute inset-0 bg-p5-red transform translate-x-3 translate-y-3 -skew-x-3 z-0"></div>
            <div className="relative z-10 bg-white border-4 border-black p-6 transform -skew-x-3">
              <div className="transform skew-x-3 flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  {/* 头像展示与上传 */}
                  <div className="relative group/avatar">
                    <div className="w-24 h-24 bg-black border-4 border-p5-red transform rotate-3 overflow-hidden shadow-[4px_4px_0_0_black] flex items-center justify-center">
                      {profile.avatar ? (
                        <img src={profile.avatar} alt={profile.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white text-4xl font-black italic transform -rotate-3">
                          {getInitial(profile.nickname || profile.username)}
                        </div>
                      )}
                      {uploadingAvatar && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      )}
                    </div>
                    <label className="absolute -bottom-2 -right-2 bg-p5-red p-2 border-2 border-black cursor-pointer hover:bg-black transition-colors shadow-[2px_2px_0_0_white]">
                      <Upload className="w-4 h-4 text-white" />
                      <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} disabled={uploadingAvatar} />
                    </label>
                  </div>

                  <div>
                    <h1 className="text-4xl md:text-5xl font-black text-black uppercase italic tracking-tighter">
                      用户中心 / USER CENTER
                    </h1>
                    <p className="text-gray-600 font-bold mt-1 text-xl italic uppercase">
                      {profile.nickname || profile.username}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="inline-block bg-black text-white px-4 py-2 transform -skew-x-12">
                    <span className="block transform skew-x-12 font-black uppercase italic">
                      {getRoleDisplayName(profile.role)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

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

          {/* 用户信息卡片 */}
          <div className="relative">
            <div className="absolute inset-0 bg-black transform translate-x-2 translate-y-2 -skew-x-2 z-0"></div>
            <div className="relative z-10 bg-white border-4 border-black p-8">
              {/* 头部：编辑按钮 */}
              <div className="flex justify-between items-center mb-6 pb-4 border-b-2 border-black">
                <h2 className="text-2xl font-black uppercase italic flex items-center">
                  <User className="w-6 h-6 mr-2" />
                  基本信息 / BASIC INFO
                </h2>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-p5-red text-white px-4 py-2 font-black uppercase italic border-2 border-black hover:bg-red-700 flex items-center"
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    编辑
                  </button>
                ) : (
                  <div className="space-x-2">
                    <button
                      onClick={() => {
                        setIsEditing(false)
                        setEditForm({
                          nickname: profile.nickname || '',
                          bio: profile.bio || '',
                          group_ids: profile.groups?.map((g: Group) => g.id) || [],
                          performed_video_ids: profile.performed_videos?.map((v: Video) => v.id) || [],
                        })
                      }}
                      className="bg-gray-500 text-white px-4 py-2 font-black uppercase italic border-2 border-black hover:bg-gray-600"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-p5-red text-white px-4 py-2 font-black uppercase italic border-2 border-black hover:bg-red-700 flex items-center disabled:opacity-50"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? '保存中...' : '保存'}
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-6">
                {/* 用户名（只读） */}
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2 uppercase italic">
                    用户名 / USERNAME
                  </label>
                  <input
                    type="text"
                    value={profile.username}
                    disabled
                    className="w-full px-4 py-3 border-2 border-gray-300 bg-gray-100 font-bold cursor-not-allowed"
                  />
                </div>

                {/* 邮箱（只读） */}
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2 uppercase italic">
                    邮箱 / EMAIL
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    disabled
                    className="w-full px-4 py-3 border-2 border-gray-300 bg-gray-100 font-bold cursor-not-allowed"
                  />
                </div>

                {/* 昵称（可编辑） */}
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2 uppercase italic">
                    昵称 / NICKNAME
                  </label>
                  <input
                    type="text"
                    value={isEditing ? editForm.nickname : (profile.nickname || '未设置')}
                    disabled={!isEditing}
                    onChange={(e) => setEditForm({ ...editForm, nickname: e.target.value })}
                    className={`w-full px-4 py-3 border-2 font-bold ${isEditing ? 'border-black focus:border-p5-red' : 'border-gray-300 bg-gray-100 cursor-not-allowed'}`}
                    placeholder="请输入昵称"
                  />
                </div>

                {/* 个人简介（可编辑） */}
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2 uppercase italic">
                    个人简介 / BIO
                  </label>
                  <textarea
                    value={isEditing ? editForm.bio : (profile.bio || '未设置')}
                    disabled={!isEditing}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    rows={4}
                    className={`w-full px-4 py-3 border-2 font-bold ${isEditing ? 'border-black focus:border-p5-red' : 'border-gray-300 bg-gray-100 cursor-not-allowed'}`}
                    placeholder="介绍一下你自己..."
                  />
                </div>

                {/* 所属社团（可编辑） */}
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2 uppercase italic">
                    所属社团 / GROUPS
                  </label>
                  {isEditing ? (
                    <button
                      onClick={() => setShowGroupModal(true)}
                      className="w-full px-4 py-3 border-2 border-black bg-white font-bold text-left hover:bg-gray-50 transition-colors"
                    >
                      {editForm.group_ids.length > 0
                        ? `已选择 ${editForm.group_ids.length} 个社团`
                        : '点击选择社团'}
                    </button>
                  ) : (
                    <div className="w-full px-4 py-3 border-2 border-gray-300 bg-gray-100 min-h-[48px]">
                      {profile.groups && profile.groups.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {profile.groups.map((group) => (
                            <a
                              key={group.id}
                              href={`/group/${group.id}`}
                              className="inline-block bg-p5-red text-white px-3 py-1 font-bold text-sm hover:bg-red-700 transition-colors cursor-pointer"
                            >
                              {group.name}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-500">未设置</span>
                      )}
                    </div>
                  )}
                </div>

                {/* 参演视频（可编辑） */}
                <div>
                  <label className="block text-sm font-black text-gray-700 mb-2 uppercase italic">
                    参演视频 / PERFORMED VIDEOS
                  </label>
                  {isEditing ? (
                    <button
                      onClick={() => setShowVideoModal(true)}
                      className="w-full px-4 py-3 border-2 border-black bg-white font-bold text-left hover:bg-gray-50 transition-colors"
                    >
                      {editForm.performed_video_ids.length > 0
                        ? `已选择 ${editForm.performed_video_ids.length} 个视频`
                        : '点击选择视频'}
                    </button>
                  ) : (
                    <div className="w-full px-4 py-3 border-2 border-gray-300 bg-gray-100 min-h-[48px]">
                      {profile.performed_videos && profile.performed_videos.length > 0 ? (
                        <ul className="space-y-1">
                          {profile.performed_videos.map((video) => (
                            <li key={video.id} className="text-sm font-bold">
                              <a
                                href={`/video/${video.id}`}
                                className="hover:text-p5-red transition-colors"
                              >
                                • {video.title}
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-500">未设置</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 权限管理卡片 */}
          <div className="relative">
            <div className="absolute inset-0 bg-black transform translate-x-2 translate-y-2 -skew-x-2 z-0"></div>
            <div className="relative z-10 bg-white border-4 border-black p-8">
              <h2 className="text-2xl font-black uppercase italic flex items-center mb-6 pb-4 border-b-2 border-black">
                <Shield className="w-6 h-6 mr-2" />
                权限管理 / PERMISSION
              </h2>

              <div className="space-y-4">
                {/* 当前权限 */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-black text-lg">当前权限</p>
                    <p className="text-gray-600 font-bold">{getRoleDisplayName(profile.role)}</p>
                  </div>
                  <div className={`inline-block px-4 py-2 font-black uppercase italic border-2 border-black ${profile.role === 'admin' || profile.role === 'editor' || profile.role === 'contributor'
                      ? 'bg-p5-red text-white'
                      : 'bg-gray-200 text-gray-700'
                    }`}>
                    {profile.role === 'admin' || profile.role === 'editor' || profile.role === 'contributor'
                      ? '已认证 / VERIFIED'
                      : '未认证 / UNVERIFIED'}
                  </div>
                </div>

                {/* 申请状态 */}
                {profile.role_application_pending && (
                  <div className="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-4">
                    <p className="font-black text-yellow-800 mb-2">申请审核中</p>
                    <p className="text-sm text-yellow-700">
                      申请时间: {profile.role_application_date ? new Date(profile.role_application_date).toLocaleString() : '未知'}
                    </p>
                    <p className="text-sm text-yellow-700 mt-2">
                      申请理由: {profile.role_application_reason || '无'}
                    </p>
                  </div>
                )}

                {/* 申请按钮 */}
                {!profile.role_application_pending &&
                  profile.role !== 'admin' &&
                  profile.role !== 'editor' &&
                  profile.role !== 'contributor' && (
                    <div className="pt-4 border-t-2 border-black">
                      {!showApplicationForm ? (
                        <button
                          onClick={() => setShowApplicationForm(true)}
                          className="w-full bg-p5-red text-white px-6 py-3 font-black uppercase italic border-2 border-black hover:bg-red-700"
                        >
                          申请成为贡献者 / APPLY FOR CONTRIBUTOR
                        </button>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-black text-gray-700 mb-2 uppercase italic">
                              申请理由 / REASON *
                            </label>
                            <textarea
                              value={applicationReason}
                              onChange={(e) => setApplicationReason(e.target.value)}
                              rows={4}
                              className="w-full px-4 py-3 border-2 border-black focus:border-p5-red font-bold"
                              placeholder="请说明您希望成为贡献者的原因（至少 10 个字）"
                            />
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setShowApplicationForm(false)
                                setApplicationReason('')
                              }}
                              className="flex-1 bg-gray-500 text-white px-4 py-2 font-black uppercase italic border-2 border-black hover:bg-gray-600"
                            >
                              取消
                            </button>
                            <button
                              onClick={handleApplyForContributor}
                              disabled={submittingApplication}
                              className="flex-1 bg-p5-red text-white px-4 py-2 font-black uppercase italic border-2 border-black hover:bg-red-700 disabled:opacity-50"
                            >
                              {submittingApplication ? '提交中...' : '提交申请'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
              </div>
            </div>
          </div>

          {/* 管理员审批面板（仅管理员可见） */}
          {profile.role === 'admin' && (
            <div className="relative">
              <div className="absolute inset-0 bg-p5-red transform translate-x-2 translate-y-2 -skew-x-2 z-0"></div>
              <div className="relative z-10 bg-white border-4 border-black p-8">
                <h2 className="text-2xl font-black uppercase italic flex items-center mb-6 pb-4 border-b-2 border-black">
                  <Shield className="w-6 h-6 mr-2" />
                  待审批申请 / PENDING APPLICATIONS
                </h2>
                <RoleApprovalPanel
                  token={localStorage.getItem('access_token') || ''}
                  onRefresh={fetchProfile}
                />
              </div>
            </div>
          )}

          {/* 数据管理入口（授权用户可见） */}
          {(profile.role === 'contributor' || profile.role === 'editor' || profile.role === 'admin') && (
            <div className="relative">
              <div className="absolute inset-0 bg-black transform translate-x-2 translate-y-2 -skew-x-2 z-0"></div>
              <div className="relative z-10 bg-white border-4 border-black p-8">
                <h2 className="text-2xl font-black uppercase italic flex items-center mb-6 pb-4 border-b-2 border-black">
                  <Database className="w-6 h-6 mr-2" />
                  数据管理 / DATA MANAGEMENT
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* 数据导入（贡献者及以上可见） */}
                  <a
                    href="/data-import"
                    className="relative group block p-6 border-4 border-black bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div className="absolute inset-0 bg-p5-red transform translate-x-2 translate-y-2 -skew-x-3 opacity-0 group-hover:opacity-100 transition-opacity z-0"></div>
                    <div className="relative z-10">
                      <Upload className="w-12 h-12 text-p5-red mb-4" />
                      <h3 className="text-xl font-black mb-2">数据导入 / DATA IMPORT</h3>
                      <p className="text-gray-600 font-bold text-sm">导入 Bilibili 视频数据和社团信息</p>
                    </div>
                  </a>

                  {/* 数据管理（编辑及以上可见） */}
                  {(profile.role === 'editor' || profile.role === 'admin') && (
                    <a
                      href="/management"
                      className="relative group block p-6 border-4 border-black bg-white hover:bg-gray-50 transition-colors"
                    >
                      <div className="absolute inset-0 bg-p5-red transform translate-x-2 translate-y-2 -skew-x-3 opacity-0 group-hover:opacity-100 transition-opacity z-0"></div>
                      <div className="relative z-10">
                        <FileText className="w-12 h-12 text-p5-red mb-4" />
                        <h3 className="text-xl font-black mb-2">数据管理 / DATA MANAGEMENT</h3>
                        <p className="text-gray-600 font-bold text-sm">管理数据库中的视频、社团和标签信息</p>
                      </div>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 模态框 */}
      <SearchableMultiSelectModal
        isOpen={showGroupModal}
        title="选择所属社团 / SELECT GROUPS"
        options={availableGroups.map(g => ({ id: g.id, name: g.name, description: g.description }))}
        selectedIds={editForm.group_ids}
        onSelect={(ids) => setEditForm({ ...editForm, group_ids: ids })}
        onClose={() => setShowGroupModal(false)}
        searchPlaceholder="搜索社团名称..."
      />
      <SearchableMultiSelectModal
        isOpen={showVideoModal}
        title="选择参演视频 / SELECT VIDEOS"
        options={availableVideos.map(v => ({ id: v.id, name: v.title, description: `BV: ${v.bv_number}` }))}
        selectedIds={editForm.performed_video_ids}
        onSelect={(ids) => setEditForm({ ...editForm, performed_video_ids: ids })}
        onClose={() => setShowVideoModal(false)}
        searchPlaceholder="搜索视频标题..."
      />
    </>
  )
}

export default UserCenterPage
