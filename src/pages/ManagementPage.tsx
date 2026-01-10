import React, { useState, useEffect } from 'react'
import { Search, Plus, Edit, Save, AlertCircle, CheckCircle, Lock } from 'lucide-react'
import { groupService } from '../services/groupService'
import { competitionService } from '../services/competitionService'
import { videoService } from '../services/videoService'
import { eventService } from '../services/eventService'
import { authService } from '../services/authService'
import { api } from '../services/api'
import { Group, Event } from '../types'

interface SearchableSelectProps {
  placeholder: string
  onChange: (value: string, item?: any) => void
  searchFunction: (query: string) => Promise<any>
  displayField: string
  valueField: string
  disabled?: boolean
}

interface DropdownSelectProps {
  placeholder: string
  onChange: (value: string, item?: any) => void
  loadOptions: () => Promise<any>
  displayField: string
  valueField: string
  disabled?: boolean
  value?: string
}

const DropdownSelect: React.FC<DropdownSelectProps> = ({
  placeholder,
  onChange,
  loadOptions,
  displayField,
  valueField,
  disabled = false,
  value
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)

  useEffect(() => {
    setLoading(true)
    loadOptions()
      .then(response => {
        const optionsList = response.results || []
        setOptions(optionsList)

        if (value) {
          const foundItem = optionsList.find((item: any) => item[valueField] === value)
          if (foundItem) {
            setSelectedItem(foundItem)
          }
        }
      })
      .catch(error => {
        console.error('Load options error:', error)
        setOptions([])
      })
      .finally(() => {
        setLoading(false)
      })
  }, [loadOptions, value, valueField])

  const handleSelect = (item: any) => {
    setSelectedItem(item)
    onChange(item[valueField], item)
    setIsOpen(false)
  }

  const handleClear = () => {
    setSelectedItem(null)
    onChange('', null)
  }

  return (
    <div className="relative">
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full p-4 text-left font-black uppercase italic transition-colors flex items-center justify-between ${disabled ? 'bg-gray-200 cursor-not-allowed opacity-50' : 'bg-gray-50 hover:bg-gray-100'
            }`}
        >
          <span className={selectedItem ? 'text-black' : 'text-gray-400'}>
            {selectedItem ? selectedItem[displayField] : placeholder}
          </span>
          <div className="flex items-center">
            <svg className={`w-6 h-6 text-black transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </div>
        </button>

        {selectedItem && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-12 top-1/2 -translate-y-1/2 h-6 w-6 text-p5-red hover:scale-110 transition-transform"
          >
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border-4 border-black shadow-[8px_8px_0_0_black] max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
          {loading ? (
            <div className="px-4 py-3 text-gray-500 font-black italic animate-pulse">LOADING / 加载中...</div>
          ) : options.length > 0 ? (
            options.map((item) => (
              <div
                key={item[valueField]}
                onClick={() => handleSelect(item)}
                className={`px-4 py-3 hover:bg-black hover:text-white cursor-pointer border-b-2 border-gray-100 last:border-b-0 transition-colors ${selectedItem && selectedItem[valueField] === item[valueField] ? 'bg-p5-red text-white' : ''
                  }`}
              >
                <div className="font-black italic uppercase tracking-tighter">{item[displayField]}</div>
                {item.description && (
                  <div className={`text-xs mt-1 truncate ${selectedItem && selectedItem[valueField] === item[valueField] ? 'text-white/80' : 'text-gray-500'}`}>
                    {item.description}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-gray-500 font-black italic">NO DATA / 暂无选项</div>
          )}
        </div>
      )}
    </div>
  )
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
          className="w-full p-4 border-0 focus:ring-0 font-black uppercase italic tracking-tighter bg-gray-50 placeholder-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          {loading ? (
            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Search className="h-6 w-6 text-black" />
          )}
        </div>
      </div>

      {isOpen && searchQuery.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border-4 border-black shadow-[8px_8px_0_0_black] max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
          {loading ? (
            <div className="px-4 py-3 text-gray-500 font-black italic animate-pulse">SEARCHING / 搜索中...</div>
          ) : options.length > 0 ? (
            options.map((item) => (
              <div
                key={item[valueField]}
                onClick={() => handleSelect(item)}
                className="px-4 py-3 hover:bg-black hover:text-white cursor-pointer border-b-2 border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="font-black italic uppercase tracking-tighter">{item[displayField]}</div>
                {item.description && (
                  <div className="text-xs text-gray-500 mt-1 truncate group-hover:text-white/80">{item.description}</div>
                )}
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-gray-500 font-black italic">NO RESULTS / 未找到相关结果</div>
          )}
        </div>
      )}
    </div>
  )
}

const ManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'video' | 'group' | 'event'>('video')
  const [groupMode, setGroupMode] = useState<'create' | 'edit'>('create')
  const [eventMode, setEventMode] = useState<'create' | 'edit'>('create')
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

  // 赛事表单状态
  const [eventForm, setEventForm] = useState<Partial<Event>>({
    id: '',
    date: '',
    competition: '',
    title: '',
    description: '',
    contact: '',
    website: '',
    promotional_image: ''
  })

  const [selectedEventForEdit, setSelectedEventForEdit] = useState<Event | null>(null)

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

  const resetEventForm = () => {
    setEventForm({
      id: '',
      date: '',
      competition: '',
      title: '',
      description: '',
      contact: '',
      website: '',
      promotional_image: ''
    })
    setSelectedEventForEdit(null)
  }

  // 处理赛事选择（用于编辑）
  const handleEventSelect = (_eventId: string, event: Event) => {
    setSelectedEventForEdit(event)
    setEventForm({
      id: event.id,
      date: event.date,
      competition: event.competition,
      title: event.title,
      description: event.description || '',
      contact: event.contact || '',
      website: event.website || '',
      promotional_image: event.promotional_image || ''
    })
    setEventMode('edit')
  }

  // 处理赛事提交
  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!eventForm.date || !eventForm.competition || !eventForm.title) {
      showMessage('error', '请填写必填字段：日期、比赛和标题')
      return
    }

    setLoading(true)
    try {
      const eventData = {
        date: eventForm.date,
        competition: eventForm.competition,
        title: eventForm.title,
        description: eventForm.description || '',
        contact: eventForm.contact || '',
        website: eventForm.website || '',
        promotional_image: eventForm.promotional_image || ''
      }

      if (eventMode === 'create') {
        await eventService.createEvent(eventData)
        showMessage('success', '赛事创建成功')
      } else if (eventMode === 'edit' && selectedEventForEdit) {
        await eventService.updateEvent(selectedEventForEdit.id, eventData)
        showMessage('success', '赛事更新成功')
      }

      resetEventForm()
      setEventMode('create')
    } catch (error: any) {
      showMessage('error', `操作失败: ${error.message || '未知错误'}`)
    } finally {
      setLoading(false)
    }
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
      <div className="min-h-screen bg-transparent py-16">
        <div className="max-w-md mx-auto px-4 relative group">
          <div className="absolute inset-0 bg-black transform -rotate-2 translate-x-3 translate-y-3 z-0"></div>
          <div className="relative z-10 bg-white border-4 border-black p-8 transform rotate-1">
            <div className="text-center mb-10 transform -rotate-1">
              <div className="mx-auto flex items-center justify-center h-16 w-16 bg-black transform rotate-12 border-4 border-p5-red shadow-[4px_4px_0_0_#d90614] mb-6">
                <Lock className="h-8 w-8 text-p5-red transform -rotate-12" />
              </div>
              <h2 className="text-3xl font-black text-black uppercase italic mb-2 leading-none">ADMIN OVERRIDE / 管理验证</h2>
              <p className="text-sm text-gray-500 font-bold border-b-2 border-p5-red inline-block pb-1">IDENTIFICATION REQUIRED FOR SYSTEM ACCESS</p>
            </div>

            {/* 错误信息显示 */}
            {message && (
              <div className={`mb-8 p-4 border-l-8 transform -skew-x-3 ${message.type === 'error'
                ? 'bg-black border-p5-red text-p5-red'
                : 'bg-black border-green-500 text-green-500'
                }`}>
                <div className="flex items-center transform skew-x-3">
                  {message.type === 'error' ? (
                    <AlertCircle className="h-6 w-6 mr-3" />
                  ) : (
                    <CheckCircle className="h-6 w-6 mr-3" />
                  )}
                  <p className="text-sm font-black uppercase italic tracking-tighter">
                    {message.text}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-8 transform -rotate-1">
              <div className="relative">
                <label className="block text-xs font-black text-white bg-p5-red px-2 py-0.5 absolute -top-3 left-4 transform rotate-2 uppercase">
                  Management Key
                </label>
                <input
                  type="password"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && handleVerifyManagementKey()}
                  placeholder="ENTER ACCESS CODE..."
                  className="w-full p-4 border-4 border-black font-black uppercase focus:ring-0 focus:border-p5-red transition-colors placeholder-gray-300 bg-gray-50"
                />
              </div>

              <button
                onClick={handleVerifyManagementKey}
                disabled={!loginForm.username.trim() || isLoggingIn}
                className="group relative w-full overflow-hidden"
              >
                <div className="absolute inset-0 bg-black transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300"></div>
                <div className="relative z-10 flex items-center justify-center px-4 py-4 bg-p5-red text-white font-black uppercase italic text-2xl border-2 border-transparent group-hover:border-black transition-all disabled:bg-gray-400">
                  {isLoggingIn ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                      VERIFYING...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-3 h-6 w-6" />
                      SYSTEM LOGIN / 验证权限
                    </>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="relative group mb-12">
          <div className="absolute inset-0 bg-black transform translate-x-2 translate-y-2 -skew-y-1 z-0 shadow-2xl"></div>
          <div className="relative z-10 bg-white border-4 border-black p-8 md:p-12 transform -skew-y-1 overflow-hidden">
            <div className="p5-halftone absolute inset-0 opacity-10 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 transform skew-y-1">
              <div>
                <h1 className="text-5xl font-black text-black uppercase italic tracking-tighter mb-2 p5-text-shadow-red">
                  CORE OVERRIDE / 数据管理
                </h1>
                <p className="bg-black text-white px-4 py-1 inline-block font-black italic transform -skew-x-12">
                  SYSTEM COMMAND CENTER / 进行视频和社团信息的高度度管控
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="bg-p5-red text-white px-8 py-3 font-black uppercase italic border-4 border-black hover:bg-black hover:border-p5-red hover:shadow-[8px_8px_0_0_#d90614] transition-all transform -skew-x-12 active:translate-y-1"
              >
                <span className="flex items-center transform skew-x-12">
                  <Lock className="h-6 w-6 mr-3" />
                  ABORT SESSION / 退出登录
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Side Navigation Tabs */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-black p-4 transform -skew-x-6 border-2 border-white shadow-[4px_4px_0_0_#d90614] mb-8">
              <span className="text-white font-black italic uppercase tracking-widest text-xs">Menu Select / 功能选择</span>
            </div>

            {[
              { id: 'video', label: '视频管理', sub: 'VIDEO INTEL' },
              { id: 'group', label: '社团管理', sub: 'ALLIANCE DATA' },
              { id: 'event', label: '赛事管理', sub: 'BATTLE ARCHIVE' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full text-left p-6 transition-all transform -skew-x-6 border-4 relative overflow-hidden group ${activeTab === tab.id
                  ? 'bg-p5-red border-white text-white translate-x-4 shadow-[8px_8px_0_0_black]'
                  : 'bg-white border-black text-black hover:border-p5-red hover:translate-x-2'
                  }`}
              >
                {activeTab === tab.id && (
                  <div className="absolute right-0 top-0 bottom-0 w-2 bg-white transform skew-x-12 translate-x-1"></div>
                )}
                <div className="relative z-10">
                  <p className={`text-[10px] font-black uppercase italic mb-1 ${activeTab === tab.id ? 'text-black' : 'text-p5-red'}`}>{tab.sub}</p>
                  <p className="text-2xl font-black italic uppercase tracking-tighter">{tab.label}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            {/* 消息提示 */}
            {message && (
              <div className={`mb-8 p-6 transform -skew-x-2 border-l-8 shadow-xl ${message.type === 'success'
                ? 'bg-black border-green-500 text-green-500'
                : 'bg-black border-p5-red text-p5-red'
                }`}>
                <div className="flex items-center transform skew-x-2">
                  {message.type === 'success' ? (
                    <CheckCircle className="h-8 w-8 mr-4" />
                  ) : (
                    <AlertCircle className="h-8 w-8 mr-4" />
                  )}
                  <p className="text-lg font-black uppercase italic tracking-tighter">{message.text}</p>
                </div>
              </div>
            )}

            <div className="bg-white border-2 border-black p-8 md:p-12 transform -skew-x-1 relative overflow-hidden min-h-[600px]">
              <div className="p5-halftone absolute inset-0 opacity-5 pointer-events-none"></div>
              <div className="relative z-10 transform skew-x-1">
                {activeTab === 'video' && (
                  <div className="animate-in fade-in slide-in-from-left-4 duration-500">
                    <div className="flex items-center space-x-4 mb-10 border-b-8 border-p5-red pb-2">
                      <div className="bg-black p-3 transform rotate-12 border-2 border-white">
                        <Plus className="w-8 h-8 text-white transform -rotate-12" />
                      </div>
                      <h2 className="text-3xl font-black text-black uppercase italic tracking-tighter p5-text-shadow">
                        DATA ENTRY / 添加新视频
                      </h2>
                    </div>

                    <form onSubmit={handleVideoSubmit} className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="relative">
                          <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                            BV Number / BV号 *
                          </label>
                          <input
                            type="text"
                            required
                            value={videoForm.bv_number}
                            onChange={(e) => setVideoForm({ ...videoForm, bv_number: e.target.value })}
                            className="w-full p-4 border-4 border-black font-black uppercase focus:ring-0 focus:border-p5-red transition-colors placeholder-gray-300 bg-gray-50 shadow-[4px_4px_0_0_black]"
                            placeholder="BV1234567890"
                          />
                        </div>

                        <div className="relative">
                          <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                            Calendar Year / 年份 *
                          </label>
                          <input
                            type="number"
                            required
                            min="2000"
                            max="2030"
                            value={videoForm.year}
                            onChange={(e) => setVideoForm({ ...videoForm, year: parseInt(e.target.value) })}
                            className="w-full p-4 border-4 border-black font-black uppercase focus:ring-0 focus:border-p5-red transition-colors bg-gray-50 shadow-[4px_4px_0_0_black]"
                          />
                        </div>
                      </div>

                      <div className="relative">
                        <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                          Intel Title / 视频标题 *
                        </label>
                        <input
                          type="text"
                          required
                          value={videoForm.title}
                          onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                          className="w-full p-4 border-4 border-black font-black uppercase focus:ring-0 focus:border-p5-red transition-colors placeholder-gray-300 bg-gray-50 shadow-[4px_4px_0_0_black]"
                          placeholder="ENTER VIDEO TITLE..."
                        />
                      </div>

                      <div className="relative">
                        <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                          Description / 视频描述
                        </label>
                        <textarea
                          rows={4}
                          value={videoForm.description}
                          onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                          className="w-full p-4 border-4 border-black font-black focus:ring-0 focus:border-p5-red transition-colors placeholder-gray-300 bg-gray-50 shadow-[4px_4px_0_0_black]"
                          placeholder="ENTER INTEL DESCRIPTION..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="relative">
                          <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                            Source Link / 视频链接
                          </label>
                          <input
                            type="url"
                            value={videoForm.url}
                            onChange={(e) => setVideoForm({ ...videoForm, url: e.target.value })}
                            className="w-full p-4 border-4 border-black font-black focus:ring-0 focus:border-p5-red transition-colors placeholder-gray-300 bg-gray-50 shadow-[4px_4px_0_0_black]"
                            placeholder="https://..."
                          />
                        </div>

                        <div className="relative">
                          <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                            Thumbnail / 缩略图链接
                          </label>
                          <input
                            type="url"
                            value={videoForm.thumbnail}
                            onChange={(e) => setVideoForm({ ...videoForm, thumbnail: e.target.value })}
                            className="w-full p-4 border-4 border-black font-black focus:ring-0 focus:border-p5-red transition-colors placeholder-gray-300 bg-gray-50 shadow-[4px_4px_0_0_black]"
                            placeholder="https://..."
                          />
                        </div>
                      </div>

                      <div className="relative">
                        <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                          Uploader / 上传者用户名
                        </label>
                        <input
                          type="text"
                          value={videoForm.uploaded_by_username}
                          onChange={(e) => setVideoForm({ ...videoForm, uploaded_by_username: e.target.value })}
                          className="w-full p-4 border-4 border-black font-black focus:ring-0 focus:border-p5-red transition-colors placeholder-gray-300 bg-gray-50 shadow-[4px_4px_0_0_black]"
                          placeholder="ENTER USERNAME..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="relative">
                          <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                            Alliance / 社团 *
                          </label>
                          <div className="border-4 border-black focus-within:border-p5-red transition-colors shadow-[4px_4px_0_0_black]">
                            <SearchableSelect
                              placeholder="SEARCH ALLIANCE..."
                              onChange={(value) => setVideoForm({ ...videoForm, group: value })}
                              searchFunction={videoService.searchGroups.bind(videoService)}
                              displayField="name"
                              valueField="id"
                            />
                          </div>
                        </div>

                        <div className="relative">
                          <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                            Battle / 比赛 *
                          </label>
                          <div className="border-4 border-black focus-within:border-p5-red transition-colors shadow-[4px_4px_0_0_black]">
                            <SearchableSelect
                              placeholder="SEARCH BATTLE..."
                              onChange={(value) => setVideoForm({ ...videoForm, competition: value })}
                              searchFunction={competitionService.searchCompetitions.bind(competitionService)}
                              displayField="name"
                              valueField="id"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-6 pt-6">
                        <button
                          type="button"
                          onClick={resetVideoForm}
                          className="px-6 py-2 border-4 border-black text-black font-black uppercase italic hover:bg-black hover:text-white transition-all transform -skew-x-12"
                        >
                          <span className="transform skew-x-12 inline-block">RESET / 重置</span>
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-8 py-3 bg-p5-red text-white font-black uppercase italic border-4 border-black hover:bg-black hover:shadow-[8px_8px_0_0_#d90614] transition-all transform -skew-x-12 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-[4px_4px_0_0_black]"
                        >
                          <span className="flex items-center transform skew-x-12">
                            {loading ? (
                              <>
                                <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                                DEPLOYING...
                              </>
                            ) : (
                              <>
                                <Save className="h-5 w-5 mr-3" />
                                EXECUTE / 添加视频
                              </>
                            )}
                          </span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {activeTab === 'group' && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 border-b-8 border-black pb-4">
                      <div className="flex items-center space-x-4">
                        <div className="bg-p5-red p-3 transform -rotate-6 border-4 border-black shadow-[4px_4px_0_0_black]">
                          <Users className="w-8 h-8 text-white transform rotate-6" />
                        </div>
                        <h2 className="text-3xl font-black text-black uppercase italic tracking-tighter p5-text-shadow-red">
                          ALLIANCE / 社团信息管理
                        </h2>
                      </div>
                      <div className="flex space-x-4 mt-6 md:mt-0">
                        <button
                          onClick={() => {
                            setGroupMode('create')
                            resetGroupForm()
                          }}
                          className={`px-6 py-2 font-black uppercase italic transform -skew-x-12 transition-all border-4 border-black ${groupMode === 'create'
                            ? 'bg-black text-white shadow-[4px_4px_0_0_#d90614]'
                            : 'bg-white text-black hover:bg-gray-100 shadow-[4px_4px_0_0_black]'
                            }`}
                        >
                          <span className="transform skew-x-12 flex items-center">
                            <Plus className="h-5 w-5 mr-2" />
                            NEW / 新增社团
                          </span>
                        </button>
                        <button
                          onClick={() => {
                            setGroupMode('edit')
                            resetGroupForm()
                          }}
                          className={`px-6 py-2 font-black uppercase italic transform -skew-x-12 transition-all border-4 border-black ${groupMode === 'edit'
                            ? 'bg-black text-white shadow-[4px_4px_0_0_#d90614]'
                            : 'bg-white text-black hover:bg-gray-100 shadow-[4px_4px_0_0_black]'
                            }`}
                        >
                          <span className="transform skew-x-12 flex items-center">
                            <Edit className="h-5 w-5 mr-2" />
                            MODIFY / 修改社团
                          </span>
                        </button>
                      </div>
                    </div>

                    {groupMode === 'edit' && (
                      <div className="mb-10 p-6 bg-black transform -skew-x-2 border-l-8 border-p5-red shadow-xl">
                        <div className="transform skew-x-2">
                          <label className="block text-sm font-black text-p5-red uppercase mb-3 tracking-widest">
                            TARGET SELECTION / 选择要编辑的社团
                          </label>
                          <div className="border-4 border-white shadow-[4px_4px_0_0_rgba(255,255,255,0.2)]">
                            <SearchableSelect
                              placeholder="SEARCH ALLIANCE TO REPROGRAM..."
                              onChange={handleGroupSelect}
                              searchFunction={groupService.searchGroups.bind(groupService)}
                              displayField="name"
                              valueField="id"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleGroupSubmit} className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="relative">
                          <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                            Alliance Name / 社团名称 *
                          </label>
                          <input
                            type="text"
                            required
                            value={groupForm.name || ''}
                            onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                            className="w-full p-4 border-4 border-black font-black uppercase focus:ring-0 focus:border-p5-red transition-colors placeholder-gray-300 bg-gray-50 shadow-[4px_4px_0_0_black]"
                            placeholder="NAME OF THE COVEN..."
                          />
                        </div>

                        <div className="relative">
                          <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                            Founded Date / 成立日期
                          </label>
                          <input
                            type="date"
                            value={groupForm.founded_date || ''}
                            onChange={(e) => setGroupForm({ ...groupForm, founded_date: e.target.value })}
                            className="w-full p-4 border-4 border-black font-black uppercase focus:ring-0 focus:border-p5-red transition-colors bg-gray-50 shadow-[4px_4px_0_0_black]"
                          />
                        </div>
                      </div>

                      <div className="relative">
                        <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                          Alliance Intel / 社团描述
                        </label>
                        <textarea
                          rows={3}
                          value={groupForm.description || ''}
                          onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                          className="w-full p-4 border-4 border-black font-black focus:ring-0 focus:border-p5-red transition-colors placeholder-gray-300 bg-gray-50 shadow-[4px_4px_0_0_black]"
                          placeholder="BRIEFLY DESCRIBE THIS ALLIANCE..."
                        />
                      </div>

                      <div className="relative">
                        <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                          Emblem URL / 社团Logo链接
                        </label>
                        <input
                          type="url"
                          value={groupForm.logo || ''}
                          onChange={(e) => setGroupForm({ ...groupForm, logo: e.target.value })}
                          className="w-full p-4 border-4 border-black font-black focus:ring-0 focus:border-p5-red transition-colors placeholder-gray-300 bg-gray-50 shadow-[4px_4px_0_0_black]"
                          placeholder="https://..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="relative">
                          <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                            Province / 省份
                          </label>
                          <input
                            type="text"
                            value={groupForm.province || ''}
                            onChange={(e) => setGroupForm({ ...groupForm, province: e.target.value })}
                            className="w-full p-4 border-4 border-black font-black uppercase focus:ring-0 focus:border-p5-red transition-colors placeholder-gray-300 bg-gray-50 shadow-[4px_4px_0_0_black]"
                            placeholder="REGION..."
                          />
                        </div>

                        <div className="relative">
                          <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                            City / 城市
                          </label>
                          <input
                            type="text"
                            value={groupForm.city || ''}
                            onChange={(e) => setGroupForm({ ...groupForm, city: e.target.value })}
                            className="w-full p-4 border-4 border-black font-black uppercase focus:ring-0 focus:border-p5-red transition-colors placeholder-gray-300 bg-gray-50 shadow-[4px_4_0_0_black]"
                            placeholder="CITY..."
                          />
                        </div>

                        <div className="relative">
                          <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                            Base Address / 详细地址
                          </label>
                          <input
                            type="text"
                            value={groupForm.location || ''}
                            onChange={(e) => setGroupForm({ ...groupForm, location: e.target.value })}
                            className="w-full p-4 border-4 border-black font-black focus:ring-0 focus:border-p5-red transition-colors placeholder-gray-300 bg-gray-50 shadow-[4px_4px_0_0_black]"
                            placeholder="STREET ADDRESS..."
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="relative">
                          <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                            Official Site / 官方网站
                          </label>
                          <input
                            type="url"
                            value={groupForm.website || ''}
                            onChange={(e) => setGroupForm({ ...groupForm, website: e.target.value })}
                            className="w-full p-4 border-4 border-black font-black focus:ring-0 focus:border-p5-red transition-colors placeholder-gray-300 bg-gray-50 shadow-[4px_4px_0_0_black]"
                            placeholder="https://..."
                          />
                        </div>

                        <div className="relative">
                          <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                            Secure Mail / 邮箱
                          </label>
                          <input
                            type="email"
                            value={groupForm.email || ''}
                            onChange={(e) => setGroupForm({ ...groupForm, email: e.target.value })}
                            className="w-full p-4 border-4 border-black font-black focus:ring-0 focus:border-p5-red transition-colors placeholder-gray-300 bg-gray-50 shadow-[4px_4px_0_0_black]"
                            placeholder="contact@hq.com"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="relative">
                          <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                            Hotline / 联系电话
                          </label>
                          <input
                            type="tel"
                            value={groupForm.phone || ''}
                            onChange={(e) => setGroupForm({ ...groupForm, phone: e.target.value })}
                            className="w-full p-4 border-4 border-black font-black focus:ring-0 focus:border-p5-red transition-colors placeholder-gray-300 bg-gray-50 shadow-[4px_4px_0_0_black]"
                            placeholder="PHONE NUMBER..."
                          />
                        </div>

                        <div className="relative">
                          <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                            Weibo / 微博账号
                          </label>
                          <input
                            type="text"
                            value={groupForm.weibo || ''}
                            onChange={(e) => setGroupForm({ ...groupForm, weibo: e.target.value })}
                            className="w-full p-4 border-4 border-black font-black focus:ring-0 focus:border-p5-red transition-colors placeholder-gray-300 bg-gray-50 shadow-[4px_4px_0_0_black]"
                            placeholder="WEIBO DOMAIN..."
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="relative">
                          <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                            WeChat / 微信号
                          </label>
                          <input
                            type="text"
                            value={groupForm.wechat || ''}
                            onChange={(e) => setGroupForm({ ...groupForm, wechat: e.target.value })}
                            className="w-full p-4 border-4 border-black font-black focus:ring-0 focus:border-p5-red transition-colors placeholder-gray-300 bg-gray-50 shadow-[4px_4px_0_0_black]"
                            placeholder="WECHAT ID..."
                          />
                        </div>

                        <div className="relative">
                          <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                            QQ Group / QQ群
                          </label>
                          <input
                            type="text"
                            value={groupForm.qq_group || ''}
                            onChange={(e) => setGroupForm({ ...groupForm, qq_group: e.target.value })}
                            className="w-full p-4 border-4 border-black font-black focus:ring-0 focus:border-p5-red transition-colors placeholder-gray-300 bg-gray-50 shadow-[4px_4px_0_0_black]"
                            placeholder="QQ GROUP NUMBER..."
                          />
                        </div>

                        <div className="relative">
                          <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                            Bilibili / 哔哩哔哩
                          </label>
                          <input
                            type="text"
                            value={groupForm.bilibili || ''}
                            onChange={(e) => setGroupForm({ ...groupForm, bilibili: e.target.value })}
                            className="w-full p-4 border-4 border-black font-black focus:ring-0 focus:border-p5-red transition-colors placeholder-gray-300 bg-gray-50 shadow-[4px_4px_0_0_black]"
                            placeholder="BILI SPACE..."
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-6 pt-6">
                        <button
                          type="button"
                          onClick={resetGroupForm}
                          className="px-6 py-2 border-4 border-black text-black font-black uppercase italic hover:bg-black hover:text-white transition-all transform -skew-x-12"
                        >
                          <span className="transform skew-x-12 inline-block">ABORT / 重置</span>
                        </button>
                        <button
                          type="submit"
                          disabled={loading || (groupMode === 'edit' && !selectedGroupForEdit)}
                          className="px-8 py-3 bg-p5-red text-white font-black uppercase italic border-4 border-black hover:bg-black hover:shadow-[8px_8px_0_0_#d90614] transition-all transform -skew-x-12 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-[4px_4px_0_0_black]"
                        >
                          <span className="flex items-center transform skew-x-12">
                            {loading ? (
                              <>
                                <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                                PROCESSING...
                              </>
                            ) : (
                              <>
                                <Save className="h-5 w-5 mr-3" />
                                {groupMode === 'create' ? 'INITIATE / 创建社团' : 'OVERWRITE / 更新社团'}
                              </>
                            )}
                          </span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {activeTab === 'event' && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 border-b-8 border-p5-red pb-4">
                      <div className="flex items-center space-x-4">
                        <div className="bg-black p-3 transform rotate-6 border-4 border-white shadow-[4px_4px_0_0_black]">
                          <Calendar className="w-8 h-8 text-white transform -rotate-6" />
                        </div>
                        <h2 className="text-3xl font-black text-black uppercase italic tracking-tighter p5-text-shadow">
                          {eventMode === 'create' ? 'BATTLE ENTRY / 添加新赛事' : 'ARCHIVE EDIT / 编辑赛事信息'}
                        </h2>
                      </div>
                      <div className="flex space-x-4 mt-6 md:mt-0">
                        <button
                          onClick={() => {
                            setEventMode('create')
                            resetEventForm()
                          }}
                          className={`px-6 py-2 font-black uppercase italic transform -skew-x-12 transition-all border-4 border-black ${eventMode === 'create'
                            ? 'bg-p5-red text-white shadow-[4px_4px_0_0_black]'
                            : 'bg-white text-black hover:bg-gray-100 shadow-[4px_4px_0_0_black]'
                            }`}
                        >
                          <span className="transform skew-x-12 flex items-center">
                            <Plus className="h-5 w-5 mr-2" />
                            NEW / 新建
                          </span>
                        </button>
                        <button
                          onClick={() => setEventMode('edit')}
                          className={`px-6 py-2 font-black uppercase italic transform -skew-x-12 transition-all border-4 border-black ${eventMode === 'edit'
                            ? 'bg-p5-red text-white shadow-[4px_4px_0_0_black]'
                            : 'bg-white text-black hover:bg-gray-100 shadow-[4px_4px_0_0_black]'
                            }`}
                        >
                          <span className="transform skew-x-12 flex items-center">
                            <Edit className="h-5 w-5 mr-2" />
                            EDIT / 编辑
                          </span>
                        </button>
                      </div>
                    </div>

                    {eventMode === 'edit' && (
                      <div className="mb-10 p-6 bg-p5-red transform skew-x-2 border-r-8 border-black shadow-xl">
                        <div className="transform -skew-x-2">
                          <label className="block text-sm font-black text-white uppercase mb-3 tracking-widest">
                            SELECT ARCHIVE / 选择要编辑的赛事
                          </label>
                          <div className="border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,0.3)]">
                            <SearchableSelect
                              placeholder="SEARCH BATTLE ARCHIVE..."
                              onChange={handleEventSelect}
                              searchFunction={() => eventService.getEvents()}
                              displayField="title"
                              valueField="id"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleEventSubmit} className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="relative">
                          <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                            Battle Date / 赛事日期 *
                          </label>
                          <input
                            type="date"
                            required
                            value={eventForm.date}
                            onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                            className="w-full p-4 border-4 border-black font-black uppercase focus:ring-0 focus:border-p5-red transition-colors bg-gray-50 shadow-[4px_4px_0_0_black]"
                          />
                        </div>

                        <div className="relative">
                          <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                            Linked Competition / 关联比赛 *
                          </label>
                          <div className="border-4 border-black focus-within:border-p5-red transition-colors shadow-[4px_4px_0_0_black]">
                            <DropdownSelect
                              placeholder="SELECT COMPETITION..."
                              value={eventForm.competition}
                              onChange={(value) => setEventForm({ ...eventForm, competition: value })}
                              loadOptions={() => competitionService.getCompetitions({ page_size: 100 })}
                              displayField="name"
                              valueField="id"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="relative">
                        <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                          Archive Title / 赛事标题 *
                        </label>
                        <input
                          type="text"
                          required
                          value={eventForm.title}
                          onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                          className="w-full p-4 border-4 border-black font-black uppercase focus:ring-0 focus:border-p5-red transition-colors placeholder-gray-300 bg-gray-50 shadow-[4px_4px_0_0_black]"
                          placeholder="ENTER BATTLE TITLE..."
                        />
                      </div>

                      <div className="relative">
                        <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                          Battle Intel / 赛事描述
                        </label>
                        <textarea
                          rows={4}
                          value={eventForm.description}
                          onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                          className="w-full p-4 border-4 border-black font-black focus:ring-0 focus:border-p5-red transition-colors placeholder-gray-300 bg-gray-50 shadow-[4px_4px_0_0_black]"
                          placeholder="DETAILED INTEL ON THIS EVENT..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="relative">
                          <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                            Contact Info / 联系方式
                          </label>
                          <input
                            type="text"
                            value={eventForm.contact}
                            onChange={(e) => setEventForm({ ...eventForm, contact: e.target.value })}
                            className="w-full p-4 border-4 border-black font-black focus:ring-0 focus:border-p5-red transition-colors placeholder-gray-300 bg-gray-50 shadow-[4px_4px_0_0_black]"
                            placeholder="COMMUNICATIONS CHANNEL..."
                          />
                        </div>

                        <div className="relative">
                          <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                            HQ Website / 官网链接
                          </label>
                          <input
                            type="url"
                            value={eventForm.website}
                            onChange={(e) => setEventForm({ ...eventForm, website: e.target.value })}
                            className="w-full p-4 border-4 border-black font-black focus:ring-0 focus:border-p5-red transition-colors placeholder-gray-300 bg-gray-50 shadow-[4px_4px_0_0_black]"
                            placeholder="https://..."
                          />
                        </div>
                      </div>

                      <div className="relative">
                        <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                          Promo Visual / 宣传图片链接
                        </label>
                        <input
                          type="url"
                          value={eventForm.promotional_image}
                          onChange={(e) => setEventForm({ ...eventForm, promotional_image: e.target.value })}
                          className="w-full p-4 border-4 border-black font-black focus:ring-0 focus:border-p5-red transition-colors placeholder-gray-300 bg-gray-50 shadow-[4px_4px_0_0_black]"
                          placeholder="https://..."
                        />
                      </div>

                      <div className="flex justify-end space-x-6 pt-6">
                        <button
                          type="button"
                          onClick={resetEventForm}
                          className="px-6 py-2 border-4 border-black text-black font-black uppercase italic hover:bg-black hover:text-white transition-all transform -skew-x-12"
                        >
                          <span className="transform skew-x-12 inline-block">ABORT / 重置</span>
                        </button>
                        <button
                          type="submit"
                          disabled={loading || (eventMode === 'edit' && !selectedEventForEdit)}
                          className="px-8 py-3 bg-p5-red text-white font-black uppercase italic border-4 border-black hover:bg-black hover:shadow-[8px_8px_0_0_#d90614] transition-all transform -skew-x-12 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-[4px_4px_0_0_black]"
                        >
                          <span className="flex items-center transform skew-x-12">
                            {loading ? (
                              <>
                                <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                                SYNCING...
                              </>
                            ) : (
                              <>
                                <Save className="h-5 w-5 mr-3" />
                                {eventMode === 'create' ? 'FILE ENTRY / 创建赛事' : 'UPDATE FILE / 更新赛事'}
                              </>
                            )}
                          </span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ManagementPage