import React, { useState, useEffect } from 'react'
import { Search, Plus, Edit, Save, AlertCircle, CheckCircle, Lock } from 'lucide-react'
import { groupService } from '../services/groupService'
import { competitionService } from '../services/competitionService'
import { videoService } from '../services/videoService'
import { authService } from '../services/authService'
import { api } from '../services/api'
import { Group } from '../types'

interface SearchableSelectProps {
  placeholder: string
  onChange: (value: string, item?: any) => void
  searchFunction: (query: string) => Promise<any>
  displayField: string
  valueField: string
  disabled?: boolean
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  placeholder,
  onChange,
  searchFunction,
  displayField,
  valueField,
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [options, setOptions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)

  useEffect(() => {
    if (searchQuery.length > 0) {
      setLoading(true)
      searchFunction(searchQuery)
        .then(response => {
          setOptions(response.results || [])
        })
        .catch(error => {
          console.error('Search error:', error)
          setOptions([])
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setOptions([])
    }
  }, [searchQuery, searchFunction])

  const handleSelect = (item: any) => {
    setSelectedItem(item)
    onChange(item[valueField], item)
    setIsOpen(false)
    setSearchQuery('')
  }

  return (
    <div className="relative">
      <div className="relative">
        <input
          type="text"
          placeholder={selectedItem ? selectedItem[displayField] : placeholder}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
      </div>
      
      {isOpen && searchQuery.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {loading ? (
            <div className="px-3 py-2 text-gray-500">搜索中...</div>
          ) : options.length > 0 ? (
            options.map((item) => (
              <div
                key={item[valueField]}
                onClick={() => handleSelect(item)}
                className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium">{item[displayField]}</div>
                {item.description && (
                  <div className="text-sm text-gray-500 truncate">{item.description}</div>
                )}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-gray-500">未找到相关结果</div>
          )}
        </div>
      )}
    </div>
  )
}

const ManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'video' | 'group'>('video')
  const [groupMode, setGroupMode] = useState<'create' | 'edit'>('create')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  // 视频表单状态
  const [videoForm, setVideoForm] = useState({
    bv_number: '',
    title: '',
    description: '',
    url: '',
    thumbnail: '',
    year: new Date().getFullYear(),
    group: '',
    competition: '',
    uploaded_by_username: ''
  })

  // 社团表单状态
  const [groupForm, setGroupForm] = useState<Partial<Group>>({
    id: '',
    name: '',
    description: '',
    logo: '',
    founded_date: '',
    province: '',
    city: '',
    location: '',
    website: '',
    email: '',
    phone: '',
    weibo: '',
    wechat: '',
    qq_group: '',
    bilibili: ''
  })

  const [selectedGroupForEdit, setSelectedGroupForEdit] = useState<Group | null>(null)

  // 检查认证状态
  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated())
  }, [])

  // 处理管理密钥验证
  const handleVerifyManagementKey = async () => {
    if (!loginForm.username.trim()) return
    
    setIsLoggingIn(true)
    try {
      const result = await api.verifyManagementKey(loginForm.username.trim())
      if (result.valid && result.token) {
        localStorage.setItem('access_token', result.token)
        setIsAuthenticated(true)
        showMessage('success', '验证成功，欢迎使用管理功能')
      } else {
        showMessage('error', result.message || '验证失败')
      }
    } catch (error) {
      showMessage('error', '验证失败，请检查密钥是否正确')
    } finally {
      setIsLoggingIn(false)
    }
  }

  // 退出登录
  const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setIsAuthenticated(false)
    setLoginForm({ username: '', password: '' })
    showMessage('success', '已退出登录')
  }

  // 显示消息
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  // 重置表单
  const resetVideoForm = () => {
    setVideoForm({
      bv_number: '',
      title: '',
      description: '',
      url: '',
      thumbnail: '',
      year: new Date().getFullYear(),
      group: '',
      competition: '',
      uploaded_by_username: ''
    })
  }

  const resetGroupForm = () => {
    setGroupForm({
      id: '',
      name: '',
      description: '',
      logo: '',
      founded_date: '',
      province: '',
      city: '',
      location: '',
      website: '',
      email: '',
      phone: '',
      weibo: '',
      wechat: '',
      qq_group: '',
      bilibili: ''
    })
    setSelectedGroupForEdit(null)
  }

  // 处理社团选择（用于编辑）
  const handleGroupSelect = (_groupId: string, group: Group) => {
    setSelectedGroupForEdit(group)
    setGroupForm({
      id: group.id,
      name: group.name,
      description: group.description,
      logo: group.logo || '',
      founded_date: group.founded_date || '',
      province: group.province || '',
      city: group.city || '',
      location: group.location || '',
      website: group.website || '',
      email: group.email || '',
      phone: group.phone || '',
      weibo: group.weibo || '',
      wechat: group.wechat || '',
      qq_group: group.qq_group || '',
      bilibili: group.bilibili || ''
    })
  }

  // 提交视频表单
  const handleVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // 准备提交数据，确保格式正确
      const submitData = {
        bv_number: videoForm.bv_number,
        title: videoForm.title,
        description: videoForm.description,
        url: videoForm.url,
        thumbnail: videoForm.thumbnail,
        year: videoForm.year,
        group: videoForm.group || undefined, // 社团ID
        competition: videoForm.competition || undefined, // 比赛ID
        // 不传递uploaded_by_username，让后端处理
      }
      
      await videoService.createVideo(submitData)
      showMessage('success', '视频信息添加成功！')
      resetVideoForm()
    } catch (error) {
      console.error('Error creating video:', error)
      showMessage('error', '视频信息添加失败，请检查输入信息')
    } finally {
      setLoading(false)
    }
  }

  // 提交社团表单
  const handleGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 前端验证
    if (!groupForm.name?.trim()) {
      showMessage('error', '社团名称是必填项，请填写社团名称')
      return
    }
    
    setLoading(true)
    
    try {
      if (groupMode === 'create') {
        // 准备创建数据，移除id字段和空字符串字段
        const createData = {
          name: groupForm.name.trim(),
          description: groupForm.description || '',
          founded_date: groupForm.founded_date || undefined,
          province: groupForm.province || '',
          city: groupForm.city || '',
          location: groupForm.location || '',
          website: groupForm.website || '',
          email: groupForm.email || '',
          phone: groupForm.phone || '',
          weibo: groupForm.weibo || '',
          wechat: groupForm.wechat || '',
          qq_group: groupForm.qq_group || '',
          bilibili: groupForm.bilibili || ''
          // 不传递logo字段，因为后端是ImageField
        }
        await groupService.createGroup(createData)
        showMessage('success', '社团创建成功！')
      } else {
        if (!groupForm.id) {
          showMessage('error', '请先选择要编辑的社团')
          return
        }
        // 准备更新数据，确保格式正确
        const updateData = {
          name: groupForm.name?.trim(),
          description: groupForm.description || '',
          founded_date: groupForm.founded_date || undefined,
          province: groupForm.province || '',
          city: groupForm.city || '',
          location: groupForm.location || '',
          website: groupForm.website || '',
          email: groupForm.email || '',
          phone: groupForm.phone || '',
          weibo: groupForm.weibo || '',
          wechat: groupForm.wechat || '',
          qq_group: groupForm.qq_group || '',
          bilibili: groupForm.bilibili || ''
          // 不传递logo、id等字段
        }
        await groupService.updateGroup(groupForm.id, updateData)
        showMessage('success', '社团信息更新成功！')
      }
      resetGroupForm()
    } catch (error: any) {
      console.error('Error with group operation:', error)
      
      // 更详细的错误处理
      let errorMessage = `社团${groupMode === 'create' ? '创建' : '更新'}失败`
      
      if (error?.response?.data) {
        const errorData = error.response.data
        if (errorData.name && errorData.name.includes('already exists')) {
          errorMessage = '社团名称已存在，请使用其他名称'
        } else if (errorData.name) {
          errorMessage = `社团名称: ${errorData.name[0]}`
        } else if (errorData.detail) {
          errorMessage = errorData.detail
        } else if (typeof errorData === 'string') {
          errorMessage = errorData
        }
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      showMessage('error', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  // 如果未认证，显示权限验证界面
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-center mb-6">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                <Lock className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">管理权限验证</h2>
              <p className="text-sm text-gray-600">请输入管理密钥以访问数据管理功能</p>
            </div>
            
            {/* 错误信息显示 */}
            {message && (
              <div className={`mb-4 p-4 rounded-md ${
                message.type === 'error' 
                  ? 'bg-red-50 border border-red-200' 
                  : 'bg-green-50 border border-green-200'
              }`}>
                <div className="flex items-center">
                  {message.type === 'error' ? (
                    <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                  )}
                  <p className={`text-sm ${
                    message.type === 'error' ? 'text-red-800' : 'text-green-800'
                  }`}>
                    {message.text}
                  </p>
                </div>
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  管理密钥
                </label>
                <input
                  type="password"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && handleVerifyManagementKey()}
                  placeholder="请输入管理密钥"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <button
                onClick={handleVerifyManagementKey}
                disabled={!loginForm.username.trim() || isLoggingIn}
                className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {isLoggingIn ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    验证中...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    验证权限
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          {/* 头部 */}
          <div className="border-b border-gray-200">
            <div className="px-6 py-4 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">数据管理</h1>
                <p className="mt-1 text-sm text-gray-600">管理视频信息和社团信息</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                <Lock className="h-4 w-4 mr-1" />
                退出登录
              </button>
            </div>
            
            {/* 标签页 */}
            <div className="px-6">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('video')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'video'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  视频信息管理
                </button>
                <button
                  onClick={() => setActiveTab('group')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'group'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  社团信息管理
                </button>
              </nav>
            </div>
          </div>

          {/* 消息提示 */}
          {message && (
            <div className={`mx-6 mt-4 p-4 rounded-md flex items-center ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5 mr-2" />
              ) : (
                <AlertCircle className="h-5 w-5 mr-2" />
              )}
              {message.text}
            </div>
          )}

          {/* 内容区域 */}
          <div className="p-6">
            {activeTab === 'video' && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-6">添加新视频</h2>
                <form onSubmit={handleVideoSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        BV号 *
                      </label>
                      <input
                        type="text"
                        required
                        value={videoForm.bv_number}
                        onChange={(e) => setVideoForm({ ...videoForm, bv_number: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="例如：BV1234567890"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        年份 *
                      </label>
                      <input
                        type="number"
                        required
                        min="2000"
                        max="2030"
                        value={videoForm.year}
                        onChange={(e) => setVideoForm({ ...videoForm, year: parseInt(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      视频标题 *
                    </label>
                    <input
                      type="text"
                      required
                      value={videoForm.title}
                      onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="输入视频标题"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      视频描述
                    </label>
                    <textarea
                      rows={3}
                      value={videoForm.description}
                      onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="输入视频描述"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        视频链接
                      </label>
                      <input
                        type="url"
                        value={videoForm.url}
                        onChange={(e) => setVideoForm({ ...videoForm, url: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        缩略图链接
                      </label>
                      <input
                        type="url"
                        value={videoForm.thumbnail}
                        onChange={(e) => setVideoForm({ ...videoForm, thumbnail: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      上传者用户名
                    </label>
                    <input
                      type="text"
                      value={videoForm.uploaded_by_username}
                      onChange={(e) => setVideoForm({ ...videoForm, uploaded_by_username: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="输入上传者用户名"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        社团 *
                      </label>
                      <SearchableSelect
                        placeholder="搜索并选择社团"
                        onChange={(value) => setVideoForm({ ...videoForm, group: value })}
                        searchFunction={groupService.searchGroups.bind(groupService)}
                        displayField="name"
                        valueField="id"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        比赛 *
                      </label>
                      <SearchableSelect
                        placeholder="搜索并选择比赛"
                        onChange={(value) => setVideoForm({ ...videoForm, competition: value })}
                        searchFunction={competitionService.searchCompetitions.bind(competitionService)}
                        displayField="name"
                        valueField="id"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={resetVideoForm}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      重置
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          提交中...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          添加视频
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'group' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium text-gray-900">社团信息管理</h2>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setGroupMode('create')
                        resetGroupForm()
                      }}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        groupMode === 'create'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Plus className="h-4 w-4 inline mr-1" />
                      新增社团
                    </button>
                    <button
                      onClick={() => {
                        setGroupMode('edit')
                        resetGroupForm()
                      }}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        groupMode === 'edit'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Edit className="h-4 w-4 inline mr-1" />
                      修改社团
                    </button>
                  </div>
                </div>

                {groupMode === 'edit' && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      选择要编辑的社团
                    </label>
                    <SearchableSelect
                      placeholder="搜索并选择要编辑的社团"
                      onChange={handleGroupSelect}
                      searchFunction={groupService.searchGroups.bind(groupService)}
                      displayField="name"
                      valueField="id"
                    />
                  </div>
                )}

                <form onSubmit={handleGroupSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        社团名称 *
                      </label>
                      <input
                        type="text"
                        required
                        value={groupForm.name || ''}
                        onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="输入社团名称"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        成立日期
                      </label>
                      <input
                        type="date"
                        value={groupForm.founded_date || ''}
                        onChange={(e) => setGroupForm({ ...groupForm, founded_date: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      社团描述
                    </label>
                    <textarea
                      rows={3}
                      value={groupForm.description || ''}
                      onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="输入社团描述"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      社团Logo链接
                    </label>
                    <input
                      type="url"
                      value={groupForm.logo || ''}
                      onChange={(e) => setGroupForm({ ...groupForm, logo: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        省份
                      </label>
                      <input
                        type="text"
                        value={groupForm.province || ''}
                        onChange={(e) => setGroupForm({ ...groupForm, province: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="例如：北京市"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        城市
                      </label>
                      <input
                        type="text"
                        value={groupForm.city || ''}
                        onChange={(e) => setGroupForm({ ...groupForm, city: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="例如：朝阳区"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        详细地址
                      </label>
                      <input
                        type="text"
                        value={groupForm.location || ''}
                        onChange={(e) => setGroupForm({ ...groupForm, location: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="详细地址"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        官方网站
                      </label>
                      <input
                        type="url"
                        value={groupForm.website || ''}
                        onChange={(e) => setGroupForm({ ...groupForm, website: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="https://..."
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        邮箱
                      </label>
                      <input
                        type="email"
                        value={groupForm.email || ''}
                        onChange={(e) => setGroupForm({ ...groupForm, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="contact@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        联系电话
                      </label>
                      <input
                        type="tel"
                        value={groupForm.phone || ''}
                        onChange={(e) => setGroupForm({ ...groupForm, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="联系电话"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        微博账号
                      </label>
                      <input
                        type="text"
                        value={groupForm.weibo || ''}
                        onChange={(e) => setGroupForm({ ...groupForm, weibo: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="微博用户名或链接"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        微信号
                      </label>
                      <input
                        type="text"
                        value={groupForm.wechat || ''}
                        onChange={(e) => setGroupForm({ ...groupForm, wechat: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="微信号"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        QQ群
                      </label>
                      <input
                        type="text"
                        value={groupForm.qq_group || ''}
                        onChange={(e) => setGroupForm({ ...groupForm, qq_group: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="QQ群号"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        哔哩哔哩
                      </label>
                      <input
                        type="text"
                        value={groupForm.bilibili || ''}
                        onChange={(e) => setGroupForm({ ...groupForm, bilibili: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="B站用户名或链接"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={resetGroupForm}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      重置
                    </button>
                    <button
                      type="submit"
                      disabled={loading || (groupMode === 'edit' && !selectedGroupForEdit)}
                      className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {groupMode === 'create' ? '创建中...' : '更新中...'}
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          {groupMode === 'create' ? '创建社团' : '更新社团'}
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ManagementPage