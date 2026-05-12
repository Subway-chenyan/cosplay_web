import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Search, Plus, Edit, Save, AlertCircle, CheckCircle, Lock, Loader2, Users, Calendar, Upload, Trophy, X, Trash2 } from 'lucide-react'
import { groupService } from '../services/groupService'
import { competitionService } from '../services/competitionService'
import { videoService } from '../services/videoService'
import { eventService } from '../services/eventService'
import { authService } from '../services/authService'
import { api } from '../services/api'
import { Group, Event, GroupManager, UserSearchResult, Video } from '../types'
// import { provinceNameMap } from '../data/chinaGeoJSON'
import { chinaDivisions } from '../data/chinaDivisions'

interface SearchableSelectProps {
  placeholder: string
  onChange: (value: string, item?: any) => void
  searchFunction?: (query: string) => Promise<any>
  optionsList?: any[]
  displayField: string
  valueField: string
  disabled?: boolean
  value?: string
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
            <div className="px-4 py-3 text-gray-500 font-black italic animate-pulse">加载中...</div>
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
            <div className="px-4 py-3 text-gray-500 font-black italic">暂无选项</div>
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
  optionsList,
  displayField,
  valueField,
  disabled = false,
  value
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [options, setOptions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any>(null)

  // 处理初始值
  useEffect(() => {
    if (value) {
      if (optionsList) {
        const found = optionsList.find(opt => opt[valueField] === value);
        if (found) setSelectedItem(found);
      } else if (searchFunction) {
        // 如果是异步的，可能需要通过ID加载详情，这里简化处理
      }
    } else {
      setSelectedItem(null);
    }
  }, [value, optionsList, valueField]);

  useEffect(() => {
    if (optionsList) {
      if (searchQuery.trim() === '') {
        setOptions(optionsList)
      } else {
        const filtered = optionsList.filter(item =>
          item[displayField].toLowerCase().includes(searchQuery.toLowerCase())
        )
        setOptions(filtered)
      }
    } else if (searchFunction && searchQuery.length > 0) {
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
  }, [searchQuery, searchFunction, optionsList, displayField])

  const handleSelect = (item: any) => {
    setSelectedItem(item)
    onChange(item[valueField], item)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleClear = () => {
    setSelectedItem(null)
    onChange('', null)
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
          onFocus={() => {
            if (optionsList) {
              setOptions(optionsList)
            }
            setIsOpen(true)
          }}
          onBlur={() => {
            // 延迟关闭，以便点击选项
            setTimeout(() => setIsOpen(false), 200);
          }}
          disabled={disabled}
          className="w-full p-4 border-0 focus:ring-0 font-black uppercase italic tracking-tighter bg-gray-50 placeholder-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center space-x-2">
          {selectedItem && (
            <button
              type="button"
              onClick={handleClear}
              className="text-p5-red hover:scale-110 transition-transform"
            >
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          {loading ? (
            <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Search className="h-6 w-6 text-black" />
          )}
        </div>
      </div>

      {isOpen && (optionsList || (searchFunction && searchQuery.length > 0)) && (
        <div className="absolute z-50 w-full mt-2 bg-white border-4 border-black shadow-[8px_8px_0_0_black] max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
          {loading ? (
            <div className="px-4 py-3 text-gray-500 font-black italic animate-pulse">搜索中...</div>
          ) : options.length > 0 ? (
            options.map((item, index) => (
              <div
                key={index}
                onMouseDown={() => handleSelect(item)}
                className="px-4 py-3 hover:bg-black hover:text-white cursor-pointer border-b-2 border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="font-black italic uppercase tracking-tighter">{item[displayField]}</div>
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-gray-500 font-black italic">未找到相关结果</div>
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
  const [resultDialog, setResultDialog] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState<string>('')
  const [managedGroups, setManagedGroups] = useState<Group[]>([])
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [bilibiliUrl, setBilibiliUrl] = useState('')
  const [isFetchingBilibili, setIsFetchingBilibili] = useState(false)
  const [videoMode, setVideoMode] = useState<'create' | 'edit'>('create')
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [managedVideos, setManagedVideos] = useState<Video[]>([])
  const [loadingManagedVideos, setLoadingManagedVideos] = useState(false)
  const [groupManagers, setGroupManagers] = useState<GroupManager[]>([])
  const [managerSearchQuery, setManagerSearchQuery] = useState('')
  const [managerSearchResults, setManagerSearchResults] = useState<UserSearchResult[]>([])
  const [managerSearching, setManagerSearching] = useState(false)
  const [managerUpdating, setManagerUpdating] = useState(false)

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

  const [groupLogoFile, setGroupLogoFile] = useState<File | null>(null)
  const [groupLogoPreview, setGroupLogoPreview] = useState<string | null>(null)

  const [selectedGroupForEdit, setSelectedGroupForEdit] = useState<Group | null>(null)

  // 视频赛事绑定状态
  const eventSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [videoEventSearch, setVideoEventSearch] = useState('')
  const [videoEventResults, setVideoEventResults] = useState<{ id: string; title: string; region: string; stage_display: string; start_date: string; competition_name: string }[]>([])
  const [videoEventSearching, setVideoEventSearching] = useState(false)
  const [selectedEvents, setSelectedEvents] = useState<{ id: string; title: string; competition_name: string; region: string; stage_display: string }[]>([])

  // 赛事表单状态
  const [eventForm, setEventForm] = useState<Partial<Event>>({
    id: '',
    start_date: '',
    end_date: '',
    competition: '',
    title: '',
    description: '',
    contact: '',
    website: '',
    promotional_image: ''
  })

  const [selectedEventForEdit, setSelectedEventForEdit] = useState<Event | null>(null)

  const [availableCities, setAvailableCities] = useState<{ name: string, id: string }[]>([])

  const provinceOptions = useMemo(() => Object.keys(chinaDivisions).map(name => ({ name, id: name })), [])
  const isContributor = currentUserRole === 'contributor'
  const canManageGroupBindings = currentUserRole === 'admin'
  const visibleTabs = isContributor
    ? [
      { id: 'video', label: '社团工作台', sub: '一站式管理' }
    ]
    : [
      { id: 'video', label: '视频管理', sub: '视频资料' },
      { id: 'group', label: '社团管理', sub: '社团资料' },
      { id: 'event', label: '赛事管理', sub: '赛事档案' }
    ]

  // 当省份改变时，获取对应城市
  useEffect(() => {
    if (groupForm.province && chinaDivisions[groupForm.province]) {
      const cities = chinaDivisions[groupForm.province].map(city => ({
        name: city,
        id: city
      }))
      setAvailableCities(cities)
    } else {
      setAvailableCities([])
    }
  }, [groupForm.province])

  // 检查认证状态
  useEffect(() => {
    const initAuth = async () => {
      const hasToken = authService.isAuthenticated()
      setIsAuthenticated(hasToken)
      if (!hasToken) return

      try {
        const user = await authService.getCurrentUser() as any
        setCurrentUserRole(user.role || '')
        if (user.role === 'contributor') {
          setGroupMode('edit')
          const groups = await groupService.getManagedGroups()
          setManagedGroups(groups.results || [])
          if ((groups.results || []).length === 1) {
            const group = groups.results[0]
            setVideoForm(prev => ({ ...prev, group: group.id }))
            handleGroupSelect(group.id, group)
            setGroupMode('edit')
            loadManagedVideos(group.id)
          }
        }
      } catch (error) {
        setCurrentUserRole('')
      }
    }
    initAuth()
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
        setCurrentUserRole('')
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
    setCurrentUserRole('')
    setManagedGroups([])
    setLoginForm({ username: '', password: '' })
    showMessage('success', '已退出登录')
  }

  const switchContributorTask = (task: 'video' | 'group') => {
    if (task === 'group') {
      setGroupMode('edit')
    }
    setActiveTab(task)
  }

  // 显示消息
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setResultDialog({ type, text })
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
    setSelectedEvents([])
    setVideoEventSearch('')
    setVideoEventResults([])
    setBilibiliUrl('')
    setVideoMode('create')
    setSelectedVideo(null)
  }

  const loadManagedVideos = async (groupId?: string) => {
    const targetGroupId = groupId || videoForm.group || groupForm.id
    if (!targetGroupId) {
      setManagedVideos([])
      return
    }

    setLoadingManagedVideos(true)
    try {
      const response = await videoService.getGroupVideos(targetGroupId, 1, 100)
      setManagedVideos(response.results || [])
    } catch (error) {
      setManagedVideos([])
    } finally {
      setLoadingManagedVideos(false)
    }
  }

  const loadGroupManagers = async (groupId: string) => {
    if (!canManageGroupBindings || !groupId) {
      setGroupManagers([])
      return
    }

    try {
      const response = await groupService.getGroupManagers(groupId)
      setGroupManagers(response.results || [])
    } catch (error: any) {
      setGroupManagers([])
      showMessage('error', error?.response?.data?.detail || '加载社团管理员失败')
    }
  }

  const handleManagerSearch = async (query: string) => {
    setManagerSearchQuery(query)
    const keyword = query.trim()
    if (!keyword) {
      setManagerSearchResults([])
      return
    }

    setManagerSearching(true)
    try {
      const response = await authService.searchUsers(keyword)
      setManagerSearchResults(response.results || [])
    } catch (error: any) {
      setManagerSearchResults([])
      showMessage('error', error?.response?.data?.detail || '搜索用户失败')
    } finally {
      setManagerSearching(false)
    }
  }

  const handleAddGroupManager = async (userId: string) => {
    if (!groupForm.id) {
      showMessage('error', '请先选择社团')
      return
    }

    if (isContributor) {
      showMessage('error', '权限不足，仅管理员可管理社团管理员绑定')
      return
    }

    setManagerUpdating(true)
    try {
      const response = await groupService.addGroupManager(groupForm.id, userId)
      setGroupManagers(response.managers || [])
      setManagerSearchQuery('')
      setManagerSearchResults([])
      showMessage('success', '已新增社团管理员绑定')
    } catch (error: any) {
      showMessage('error', error?.response?.data?.detail || '新增绑定失败')
    } finally {
      setManagerUpdating(false)
    }
  }

  const handleRemoveGroupManager = async (manager: GroupManager) => {
    if (isContributor) {
      showMessage('error', '权限不足，仅管理员可管理社团管理员绑定')
      return
    }

    if (!groupForm.id) return
    const name = manager.nickname || manager.username
    if (!window.confirm(`确定移除「${name}」的社团管理员绑定吗？`)) return

    setManagerUpdating(true)
    try {
      await groupService.removeGroupManager(groupForm.id, manager.id)
      await loadGroupManagers(groupForm.id)
      showMessage('success', '已移除社团管理员绑定')
    } catch (error: any) {
      showMessage('error', error?.response?.data?.detail || '移除绑定失败')
    } finally {
      setManagerUpdating(false)
    }
  }

  const handleVideoEditSelect = (video: Video) => {
    setSelectedVideo(video)
    setVideoMode('edit')
    setBilibiliUrl(video.url || '')
    setSelectedEvents((video.events || []).map(event => ({
      id: event.id,
      title: event.title,
      competition_name: event.competition_name || '',
      region: event.region || '',
      stage_display: event.stage_display || '',
    })))
    setVideoForm({
      bv_number: video.bv_number,
      title: video.title,
      description: video.description || '',
      url: video.url || '',
      thumbnail: video.thumbnail || '',
      year: video.year || new Date().getFullYear(),
      group: video.group || '',
      competition: video.competition || '',
      uploaded_by_username: video.uploaded_by_username || ''
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleVideoDelete = async (video: Video) => {
    if (!window.confirm(`确定删除视频「${video.title}」吗？`)) return

    setLoading(true)
    try {
      await videoService.deleteVideo(video.id)
      showMessage('success', '视频已删除')
      if (selectedVideo?.id === video.id) {
        resetVideoForm()
      }
      await loadManagedVideos(video.group || videoForm.group)
    } catch (error: any) {
      showMessage('error', error?.response?.data?.detail || '删除视频失败')
    } finally {
      setLoading(false)
    }
  }

  const handleFetchBilibiliMetadata = async () => {
    if (!bilibiliUrl.trim()) {
      showMessage('error', '请先粘贴 B 站视频链接')
      return
    }

    setIsFetchingBilibili(true)
    try {
      const metadata = await videoService.fetchBilibiliMetadata(bilibiliUrl.trim())
      setVideoForm(prev => ({
        ...prev,
        bv_number: metadata.bv_number || prev.bv_number,
        title: metadata.title || prev.title,
        description: metadata.description || prev.description,
        url: metadata.url || bilibiliUrl.trim(),
        thumbnail: metadata.thumbnail || prev.thumbnail,
        year: metadata.year || prev.year,
      }))
      showMessage('success', '已获取 B 站视频信息，可继续修改后提交')
    } catch (error: any) {
      showMessage('error', error?.response?.data?.error || '获取 B 站视频信息失败')
    } finally {
      setIsFetchingBilibili(false)
    }
  }

  // 搜索赛事用于绑定
  const searchEventsForBinding = async (q: string) => {
    setVideoEventSearching(true)
    try {
      const url = q.trim()
        ? `/competitions/events/?search=${encodeURIComponent(q)}&page_size=50`
        : `/competitions/events/?page_size=50`
      const data = await api.get<any>(url)
      setVideoEventResults(Array.isArray(data) ? data : (data as any).results || [])
    } catch { setVideoEventResults([]) }
    finally { setVideoEventSearching(false) }
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
    setGroupLogoFile(null)
    setGroupLogoPreview(null)
    setSelectedGroupForEdit(null)
    setGroupManagers([])
    setManagerSearchQuery('')
    setManagerSearchResults([])
  }

  const resetEventForm = () => {
    setEventForm({
      id: '',
      start_date: '',
      end_date: '',
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
      start_date: event.start_date,
      end_date: event.end_date,
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
    if (!eventForm.start_date || !eventForm.competition || !eventForm.title) {
      showMessage('error', '请填写必填字段：开始日期、比赛和标题')
      return
    }

    setLoading(true)
    try {
      const eventData = {
        start_date: eventForm.start_date,
        end_date: eventForm.end_date || eventForm.start_date, // 如果未设置结束日期，默认与开始日期相同
        competition: eventForm.competition,
        title: eventForm.title,
        description: eventForm.description || '',
        contact: eventForm.contact || '',
        website: eventForm.website || '',
        promotional_image: eventForm.promotional_image || '',
        region: '',
        stage: '' as const,
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
    setGroupLogoPreview(group.logo || null)
    setGroupLogoFile(null)
    setManagerSearchQuery('')
    setManagerSearchResults([])
    if (canManageGroupBindings) {
      loadGroupManagers(group.id)
    }
    if (isContributor) {
      setVideoForm(prev => ({ ...prev, group: group.id }))
      loadManagedVideos(group.id)
    }
  }

  // 处理社团Logo文件选择
  const handleGroupLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setGroupLogoFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setGroupLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // 提交视频表单
  const handleVideoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!videoForm.url.trim() || !videoForm.bv_number.trim() || !videoForm.title.trim()) {
      showMessage('error', '请先粘贴 B 站链接并补全视频标题/BV号')
      return
    }
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

      const saved = videoMode === 'edit' && selectedVideo
        ? await videoService.updateVideo(selectedVideo.id, submitData)
        : await videoService.createVideo(submitData)

      try {
        const originalEventIds = new Set((selectedVideo?.events || []).map(event => event.id))
        const selectedEventIds = new Set(selectedEvents.map(event => event.id))

        if (videoMode === 'edit' && selectedVideo) {
          for (const event of selectedVideo.events || []) {
            if (!selectedEventIds.has(event.id)) {
              await videoService.unlinkEvent(saved.id, event.id)
            }
          }
        }

        for (const ev of selectedEvents) {
          if (videoMode === 'create' || !originalEventIds.has(ev.id)) {
            await videoService.linkEvent(saved.id, ev.id)
          }
        }
      } catch (eventError) {
        console.error('Error syncing video events:', eventError)
        showMessage('error', '视频已保存，但赛事绑定同步失败，请重新编辑视频确认')
        return
      }

      showMessage('success', videoMode === 'edit' ? '视频信息更新成功！' : '视频信息添加成功！')
      await loadManagedVideos(saved.group || videoForm.group)
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

    if (isContributor && groupMode === 'create') {
      showMessage('error', '创建新社团需要在用户中心提交审核申请')
      return
    }

    // 前端验证
    if (!groupForm.name?.trim()) {
      showMessage('error', '社团名称是必填项，请填写社团名称')
      return
    }

    setLoading(true)

    try {
      let finalLogoUrl = groupForm.logo

      // 1. 如果有新选择的文件，先进行上传
      if (groupLogoFile) {
        try {
          const { upload_url, public_url } = await groupService.getUploadUrl(
            groupLogoFile.name,
            groupLogoFile.type
          )

          // 使用 fetch 直接上传文件到 R2
          await fetch(upload_url, {
            method: 'PUT',
            body: groupLogoFile,
            headers: {
              'Content-Type': groupLogoFile.type
            }
          })

          finalLogoUrl = public_url
        } catch (uploadError: any) {
          console.error('File upload error:', uploadError)
          showMessage('error', `图片上传失败: ${uploadError.message || '未知错误'}`)
          setLoading(false)
          return // 中止提交
        }
      }

      // 2. 准备提交给后端的数据 (JSON)
      const submitData: Partial<Group> = {
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
        bilibili: groupForm.bilibili || '',
        logo: finalLogoUrl || ''
      }

      // 3. 提交社团数据
      if (groupMode === 'create') {
        await groupService.createGroup(submitData)
        showMessage('success', '社团创建成功！')
        resetGroupForm()
      } else {
        if (!groupForm.id) {
          showMessage('error', '请先选择要编辑的社团')
          setLoading(false)
          return
        }
        const updatedGroup = await groupService.updateGroup(groupForm.id, submitData)
        showMessage('success', '社团信息更新成功！')
        // 更新成功后，将表单数据更新为后端返回的最新数据，而不是重置
        setSelectedGroupForEdit(updatedGroup)
        setGroupForm({
          id: updatedGroup.id,
          name: updatedGroup.name,
          description: updatedGroup.description,
          logo: updatedGroup.logo || '',
          founded_date: updatedGroup.founded_date || '',
          province: updatedGroup.province || '',
          city: updatedGroup.city || '',
          location: updatedGroup.location || '',
          website: updatedGroup.website || '',
          email: updatedGroup.email || '',
          phone: updatedGroup.phone || '',
          weibo: updatedGroup.weibo || '',
          wechat: updatedGroup.wechat || '',
          qq_group: updatedGroup.qq_group || '',
          bilibili: updatedGroup.bilibili || ''
        })
        setGroupLogoPreview(updatedGroup.logo || null)
        setGroupLogoFile(null)
      }
    } catch (error: any) {
      console.error('Error with group operation:', error)
      if (error.response?.data) {
        console.error('Server error details:', error.response.data)
      }

      // 更详细的错误处理
      let errorMessage = `社团${groupMode === 'create' ? '创建' : '更新'}失败`

      if (error?.response?.data) {
        const errorData = error.response.data
        if (typeof errorData === 'object') {
          // 提取具体的字段错误
          const firstError = Object.entries(errorData)[0]
          if (firstError) {
            const [field, msgs] = firstError
            const msg = Array.isArray(msgs) ? msgs[0] : msgs
            errorMessage = `${field}: ${msg}`
          }
        } else if (errorData.detail) {
          errorMessage = errorData.detail
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
              <h2 className="text-3xl font-black text-black uppercase italic mb-2 leading-none">管理验证</h2>
              <p className="text-sm text-gray-500 font-bold border-b-2 border-p5-red inline-block pb-1">请输入管理密钥以继续</p>
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
                  placeholder="请输入管理密钥..."
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
                      验证中...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-3 h-6 w-6" />
                      验证权限
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
      {resultDialog && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="result-dialog-title"
          onMouseDown={() => setResultDialog(null)}
        >
          <div
            className="relative w-full max-w-md border-4 border-black bg-white p-6 shadow-[10px_10px_0_0_#d90614] sm:p-8"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setResultDialog(null)}
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center border-2 border-black bg-white text-black transition-colors hover:bg-black hover:text-white"
              aria-label="关闭提示"
            >
              <X className="h-5 w-5" />
            </button>

            <div className={`mb-5 inline-flex h-14 w-14 items-center justify-center border-4 border-black ${resultDialog.type === 'success' ? 'bg-green-500' : 'bg-p5-red'} text-white shadow-[4px_4px_0_0_black]`}>
              {resultDialog.type === 'success' ? (
                <CheckCircle className="h-8 w-8" />
              ) : (
                <AlertCircle className="h-8 w-8" />
              )}
            </div>

            <h3 id="result-dialog-title" className="mb-3 text-3xl font-black italic text-black">
              {resultDialog.type === 'success' ? '操作成功' : '操作失败'}
            </h3>
            <p className="mb-8 text-base font-bold leading-relaxed text-gray-700">
              {resultDialog.text}
            </p>
            <button
              type="button"
              onClick={() => setResultDialog(null)}
              className="w-full border-4 border-black bg-p5-red px-6 py-3 font-black italic text-white transition-colors hover:bg-black"
            >
              知道了
            </button>
          </div>
        </div>
      )}
      <div className="max-w-6xl mx-auto px-4">
        <div className="relative group mb-12">
          <div className="absolute inset-0 bg-black transform translate-x-2 translate-y-2 -skew-y-1 z-0 shadow-2xl"></div>
          <div className="relative z-10 bg-white border-4 border-black p-8 md:p-12 transform -skew-y-1 overflow-hidden">
            <div className="p5-halftone absolute inset-0 opacity-10 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 transform skew-y-1">
              <div>
                <h1 className="text-3xl md:text-5xl font-black text-black uppercase italic tracking-tighter mb-2 p5-text-shadow-red">
                  数据管理
                </h1>
                <p className="bg-black text-white px-4 py-1 inline-block font-black italic transform -skew-x-12">
                  管理视频、社团和赛事信息
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="bg-p5-red text-white px-8 py-3 font-black uppercase italic border-4 border-black hover:bg-black hover:border-p5-red hover:shadow-[8px_8px_0_0_#d90614] transition-all transform -skew-x-12 active:translate-y-1"
              >
                <span className="flex items-center transform skew-x-12">
                  <Lock className="h-6 w-6 mr-3" />
                  退出登录
                </span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Side Navigation Tabs */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-black p-4 transform -skew-x-6 border-2 border-white shadow-[4px_4px_0_0_#d90614] mb-8">
              <span className="text-white font-black italic uppercase tracking-widest text-xs">功能选择</span>
            </div>

            {visibleTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full text-left p-6 transition-all transform -skew-x-6 border-4 relative overflow-hidden group ${(activeTab === tab.id) || (isContributor && tab.id === 'video' && activeTab === 'group')
                  ? 'bg-p5-red border-white text-white translate-x-4 shadow-[8px_8px_0_0_black]'
                  : 'bg-white border-black text-black hover:border-p5-red hover:translate-x-2'
                  }`}
              >
                {((activeTab === tab.id) || (isContributor && tab.id === 'video' && activeTab === 'group')) && (
                  <div className="absolute right-0 top-0 bottom-0 w-2 bg-white transform skew-x-12 translate-x-1"></div>
                )}
                <div className="relative z-10">
                  <p className={`text-[10px] font-black uppercase italic mb-1 ${(activeTab === tab.id) || (isContributor && tab.id === 'video' && activeTab === 'group') ? 'text-black' : 'text-p5-red'}`}>{tab.sub}</p>
                  <p className="text-2xl font-black italic uppercase tracking-tighter">{tab.label}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            {isContributor && (
              <div className="mb-8 border-4 border-black bg-white p-6 shadow-[6px_6px_0_0_black]">
                <div className="mb-5 flex flex-col gap-3 border-b-4 border-p5-red pb-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase italic tracking-widest text-p5-red">社团工作台</p>
                    <h2 className="text-2xl font-black italic text-black">先选社团，再处理资料和视频</h2>
                    <p className="mt-1 text-sm font-bold text-gray-600">
                      贡献者可以管理多个社团。选中一个社团后，下方操作都会围绕这个社团展开。
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => switchContributorTask('video')}
                      className={`border-2 border-black px-4 py-2 text-sm font-black ${activeTab === 'video' ? 'bg-p5-red text-white' : 'bg-white text-black hover:bg-black hover:text-white'}`}
                    >
                      视频管理/上传
                    </button>
                    <button
                      type="button"
                      onClick={() => switchContributorTask('group')}
                      className={`border-2 border-black px-4 py-2 text-sm font-black ${activeTab === 'group' ? 'bg-p5-red text-white' : 'bg-white text-black hover:bg-black hover:text-white'}`}
                    >
                      社团资料维护
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_auto] md:items-end">
                  <div>
                    <label className="mb-2 block text-sm font-black text-gray-700">
                      当前操作社团
                    </label>
                    <div className="border-4 border-black focus-within:border-p5-red">
                      <SearchableSelect
                        placeholder="选择要管理的社团..."
                        onChange={handleGroupSelect}
                        optionsList={managedGroups}
                        displayField="name"
                        valueField="id"
                        value={groupForm.id || videoForm.group}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => groupForm.id && loadManagedVideos(groupForm.id)}
                    disabled={!groupForm.id}
                    className="min-h-[56px] border-4 border-black bg-black px-5 font-black text-white hover:bg-p5-red disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    刷新当前社团
                  </button>
                </div>

                {!groupForm.id && (
                  <div className="mt-4 border-2 border-dashed border-gray-400 bg-gray-50 p-4 text-sm font-bold text-gray-600">
                    请先选择一个社团。选择后可以直接上传视频、编辑已上传视频，或维护社团资料。
                  </div>
                )}
              </div>
            )}

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
                      <h2 className="text-xl md:text-3xl font-black text-black uppercase italic tracking-tighter p5-text-shadow">
                        {isContributor ? (videoMode === 'edit' ? '编辑当前社团视频' : '上传当前社团视频') : (videoMode === 'edit' ? '编辑视频' : '添加新视频')}
                      </h2>
                    </div>

                    {isContributor && (
                      <div className="mb-10 border-4 border-black bg-gray-50 p-5 shadow-[4px_4px_0_0_black]">
                        <div className="mb-4 flex flex-col gap-3 border-b-4 border-p5-red pb-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <h3 className="text-lg font-black italic text-black">当前社团已上传视频</h3>
                            <p className="text-xs font-bold text-gray-500">
                              {groupForm.name ? `正在管理：${groupForm.name}` : '请先在上方选择社团'}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => loadManagedVideos()}
                            disabled={!videoForm.group && !groupForm.id}
                            className="border-2 border-black bg-white px-4 py-2 text-sm font-black hover:bg-black hover:text-white"
                          >
                            刷新列表
                          </button>
                        </div>

                        {loadingManagedVideos ? (
                          <div className="py-6 text-center font-black text-gray-500">加载中...</div>
                        ) : managedVideos.length > 0 ? (
                          <div className="space-y-3">
                            {managedVideos.map(video => (
                              <div key={video.id} className="flex flex-col gap-3 border-2 border-black bg-white p-4 md:flex-row md:items-center md:justify-between">
                                <div className="min-w-0">
                                  <p className="truncate font-black text-black">{video.title}</p>
                                  <p className="mt-1 text-xs font-bold text-gray-500">
                                    {video.bv_number} · {video.year || '年份未填'}
                                  </p>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleVideoEditSelect(video)}
                                    className="inline-flex items-center border-2 border-black bg-white px-3 py-2 text-sm font-black hover:bg-black hover:text-white"
                                  >
                                    <Edit className="mr-1 h-4 w-4" />
                                    编辑
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleVideoDelete(video)}
                                    className="inline-flex items-center border-2 border-black bg-p5-red px-3 py-2 text-sm font-black text-white hover:bg-black"
                                  >
                                    <Trash2 className="mr-1 h-4 w-4" />
                                    删除
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-6 text-center font-bold text-gray-500">当前社团还没有上传视频</div>
                        )}
                      </div>
                    )}

                    <form onSubmit={handleVideoSubmit} className="space-y-8">
                      <div className="border-4 border-black bg-gray-50 p-6 shadow-[4px_4px_0_0_black]">
                        <label className="mb-3 block text-xs font-black uppercase italic text-p5-red">
                          B站视频链接 *
                        </label>
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
                          <input
                            type="url"
                            value={bilibiliUrl}
                            onChange={(e) => {
                              setBilibiliUrl(e.target.value)
                              setVideoForm({ ...videoForm, url: e.target.value })
                            }}
                            className="w-full border-4 border-black bg-white p-4 font-bold focus:border-p5-red focus:ring-0"
                            placeholder="https://www.bilibili.com/video/BV..."
                          />
                          <button
                            type="button"
                            onClick={handleFetchBilibiliMetadata}
                            disabled={isFetchingBilibili}
                            className="min-h-[56px] border-4 border-black bg-p5-red px-6 font-black uppercase italic text-white transition-all hover:bg-black disabled:opacity-50"
                          >
                            {isFetchingBilibili ? '获取中...' : '自动填充'}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="relative">
                          <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                            BV号 *
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
                            年份 *
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
                          视频标题 *
                        </label>
                        <input
                          type="text"
                          required
                          value={videoForm.title}
                          onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                          className="w-full p-4 border-4 border-black font-black uppercase focus:ring-0 focus:border-p5-red transition-colors placeholder-gray-300 bg-gray-50 shadow-[4px_4px_0_0_black]"
                          placeholder="请输入视频标题..."
                        />
                      </div>

                      <div className="relative">
                        <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                          视频描述
                        </label>
                        <textarea
                          rows={4}
                          value={videoForm.description}
                          onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                          className="w-full p-4 border-4 border-black font-black focus:ring-0 focus:border-p5-red transition-colors placeholder-gray-300 bg-gray-50 shadow-[4px_4px_0_0_black]"
                          placeholder="请输入视频描述..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="relative">
                          <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                            视频链接
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
                            缩略图链接
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="relative">
                          <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                            社团
                          </label>
                          <div className="border-4 border-black focus-within:border-p5-red transition-colors shadow-[4px_4px_0_0_black]">
                            <SearchableSelect
                              placeholder="搜索社团..."
                              onChange={(value) => {
                                setVideoForm({ ...videoForm, group: value })
                                if (isContributor) loadManagedVideos(value)
                              }}
                              searchFunction={isContributor ? undefined : videoService.searchGroups.bind(videoService)}
                              optionsList={isContributor ? managedGroups : undefined}
                              displayField="name"
                              valueField="id"
                              value={videoForm.group}
                            />
                          </div>
                        </div>

                        <div className="relative">
                          <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                            比赛 *
                          </label>
                          <div className="border-4 border-black focus-within:border-p5-red transition-colors shadow-[4px_4px_0_0_black]">
                            <SearchableSelect
                              placeholder="搜索比赛..."
                              onChange={(value) => setVideoForm({ ...videoForm, competition: value })}
                              searchFunction={competitionService.searchCompetitions.bind(competitionService)}
                              displayField="name"
                              valueField="id"
                            />
                          </div>
                        </div>
                      </div>

                      {/* 赛事选择 - 搜索并多选赛事 */}
                      <div className="border-4 border-black p-6 bg-gray-50 shadow-[4px_4px_0_0_black]">
                        <div className="flex items-center gap-3 mb-4 border-b-4 border-p5-red pb-2">
                          <div className="bg-p5-red p-2 border-2 border-black">
                            <Trophy className="w-5 h-5 text-white" />
                          </div>
                          <h3 className="text-sm font-black text-black uppercase italic tracking-tighter">
                            绑定赛事
                          </h3>
                          {selectedEvents.length > 0 && (
                            <span className="text-[10px] font-bold text-p5-red bg-p5-red/10 px-2 py-0.5">
                              已选 {selectedEvents.length} 个
                            </span>
                          )}
                        </div>

                        {/* 已选择的赛事标签 */}
                        {selectedEvents.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {selectedEvents.map(ev => (
                              <span key={ev.id} className="inline-flex items-center gap-1.5 px-2 py-1 border-2 border-black bg-white text-xs font-black uppercase italic">
                                <span className="truncate max-w-[180px]">{ev.title}</span>
                                {ev.competition_name && <span className="text-p5-red font-bold">({ev.competition_name})</span>}
                                <button
                                  type="button"
                                  onClick={() => setSelectedEvents(prev => prev.filter(e => e.id !== ev.id))}
                                  className="w-4 h-4 bg-black text-white flex items-center justify-center hover:bg-p5-red transition-colors flex-shrink-0"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* 搜索赛事输入框 */}
                        <div className="relative">
                          <input
                            type="text"
                            value={videoEventSearch}
                            onChange={(e) => {
                              const q = e.target.value
                              setVideoEventSearch(q)
                              if (eventSearchTimerRef.current) clearTimeout(eventSearchTimerRef.current)
                              eventSearchTimerRef.current = setTimeout(() => searchEventsForBinding(q), 300)
                            }}
                            onFocus={() => searchEventsForBinding(videoEventSearch)}
                            className="w-full p-3 border-4 border-black font-bold focus:ring-0 focus:border-p5-red transition-colors placeholder-gray-300 bg-white text-sm"
                            placeholder="输入赛事名称搜索并选择..."
                          />
                          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          {videoEventSearching && (
                            <Loader2 className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-p5-red animate-spin" />
                          )}
                        </div>

                        {/* 搜索结果下拉 */}
                        {videoEventResults.length > 0 && (
                          <div className="mt-2 max-h-48 overflow-y-auto border-2 border-black bg-white">
                            {videoEventResults
                              .filter(ev => !selectedEvents.some(s => s.id === ev.id))
                              .map(ev => (
                                <button
                                  key={ev.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedEvents(prev => [...prev, {
                                      id: ev.id,
                                      title: ev.title,
                                      competition_name: ev.competition_name || '',
                                      region: ev.region || '',
                                      stage_display: ev.stage_display || ''
                                    }])
                                  }}
                                  className="w-full text-left flex items-center gap-3 p-2 border-b border-gray-100 hover:bg-red-50 transition-all"
                                >
                                  <Plus className="w-4 h-4 text-p5-red flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-black uppercase italic text-black truncate">{ev.title}</p>
                                    <p className="text-[10px] text-gray-400 font-bold">{ev.region}{ev.stage_display ? ` · ${ev.stage_display}` : ''}{ev.start_date ? ` · ${ev.start_date}` : ''}</p>
                                  </div>
                                </button>
                              ))
                            }
                          </div>
                        )}
                        {videoEventSearch && !videoEventSearching && videoEventResults.filter(ev => !selectedEvents.some(s => s.id === ev.id)).length === 0 && (
                          <p className="text-xs text-gray-400 italic mt-2 text-center py-2">无搜索结果</p>
                        )}
                      </div>

                      <div className="flex justify-end space-x-6 pt-6">
                        <button
                          type="button"
                          onClick={resetVideoForm}
                          className="px-6 py-2 border-4 border-black text-black font-black uppercase italic hover:bg-black hover:text-white transition-all transform -skew-x-12"
                        >
                          <span className="transform skew-x-12 inline-block">{videoMode === 'edit' ? '取消编辑' : '重置'}</span>
                        </button>
                        <button
                            type="submit"
                          disabled={loading || (isContributor && !videoForm.group)}
                          className="px-8 py-3 bg-p5-red text-white font-black uppercase italic border-4 border-black hover:bg-black hover:shadow-[8px_8px_0_0_#d90614] transition-all transform -skew-x-12 disabled:opacity-50 disabled:cursor-not-allowed flex items-center shadow-[4px_4px_0_0_black]"
                        >
                          <span className="flex items-center transform skew-x-12">
                            {loading ? (
                              <>
                                <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                                提交中...
                              </>
                            ) : (
                              <>
                                <Save className="h-5 w-5 mr-3" />
                                {videoMode === 'edit' ? '更新视频' : '添加视频'}
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
                        <h2 className="text-xl md:text-3xl font-black text-black uppercase italic tracking-tighter p5-text-shadow-red">
                          社团信息管理
                        </h2>
                      </div>
                      <div className="flex space-x-4 mt-6 md:mt-0">
                        {!isContributor && (
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
                            新增社团
                          </span>
                        </button>
                        )}
                        {!isContributor && (
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
                            修改社团
                          </span>
                        </button>
                        )}
                      </div>
                    </div>

                    {groupMode === 'edit' && !isContributor && (
                      <div className="mb-10 p-6 bg-black transform -skew-x-2 border-l-8 border-p5-red shadow-xl relative z-20">
                        <div className="transform skew-x-2">
                          <label className="block text-sm font-black text-p5-red uppercase mb-3 tracking-widest">
                            选择要编辑的社团
                          </label>
                          <div className="border-4 border-white shadow-[4px_4px_0_0_rgba(255,255,255,0.2)]">
                            <SearchableSelect
                              placeholder="搜索要编辑的社团..."
                              onChange={handleGroupSelect}
                              searchFunction={isContributor ? undefined : groupService.searchGroups.bind(groupService)}
                              optionsList={isContributor ? managedGroups : undefined}
                              displayField="name"
                              valueField="id"
                              value={groupForm.id}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {canManageGroupBindings && groupMode === 'edit' && selectedGroupForEdit && (
                      <div className="mb-10 border-4 border-black bg-gray-50 p-6 shadow-[6px_6px_0_0_black]">
                        <div className="mb-5 flex flex-col gap-3 border-b-4 border-p5-red pb-4 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-xs font-black text-p5-red uppercase italic tracking-widest">管理员绑定</p>
                            <h3 className="text-2xl font-black italic text-black">社团管理员</h3>
                            <p className="mt-1 text-xs font-bold text-gray-500">一个社团可以绑定多个管理员，管理员之间权限互不覆盖</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => loadGroupManagers(selectedGroupForEdit.id)}
                            disabled={managerUpdating}
                            className="border-2 border-black bg-white px-4 py-2 text-sm font-black hover:bg-black hover:text-white disabled:opacity-50"
                          >
                            刷新绑定
                          </button>
                        </div>

                        <div className="mb-6 space-y-3">
                          {groupManagers.length > 0 ? (
                            groupManagers.map(manager => (
                              <div key={manager.id} className="flex flex-col gap-3 border-2 border-black bg-white p-4 md:flex-row md:items-center md:justify-between">
                                <div className="min-w-0">
                                  <p className="truncate font-black text-black">
                                    {manager.nickname || manager.username}
                                    <span className="ml-2 text-xs text-gray-500">@{manager.username}</span>
                                  </p>
                                  <p className="mt-1 text-xs font-bold text-gray-500">
                                    {manager.email || '未填写邮箱'} · {manager.role}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveGroupManager(manager)}
                                  disabled={managerUpdating}
                                  className="inline-flex items-center justify-center border-2 border-black bg-p5-red px-3 py-2 text-sm font-black text-white hover:bg-black disabled:opacity-50"
                                >
                                  <Trash2 className="mr-1 h-4 w-4" />
                                  移除
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="border-2 border-dashed border-gray-400 bg-white p-5 text-center font-bold text-gray-500">
                              当前社团还没有绑定管理员
                            </div>
                          )}
                        </div>

                        <div className="border-2 border-black bg-white p-4">
                          <label className="mb-3 block text-xs font-black uppercase italic text-p5-red">
                            搜索用户并新增绑定
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={managerSearchQuery}
                              onChange={(e) => handleManagerSearch(e.target.value)}
                              className="w-full border-4 border-black bg-gray-50 p-4 pr-12 font-black focus:border-p5-red focus:ring-0"
                              placeholder="输入用户名 / 昵称 / 邮箱..."
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                              {managerSearching ? (
                                <Loader2 className="h-5 w-5 animate-spin text-black" />
                              ) : (
                                <Search className="h-5 w-5 text-black" />
                              )}
                            </div>
                          </div>

                          {managerSearchResults.length > 0 && (
                            <div className="mt-4 max-h-72 overflow-y-auto border-2 border-black">
                              {managerSearchResults.map(user => {
                                const alreadyBound = groupManagers.some(manager => manager.id === user.id)
                                return (
                                  <div key={user.id} className="flex flex-col gap-3 border-b-2 border-black p-4 last:border-b-0 md:flex-row md:items-center md:justify-between">
                                    <div className="min-w-0">
                                      <p className="truncate font-black text-black">
                                        {user.nickname || user.username}
                                        <span className="ml-2 text-xs text-gray-500">@{user.username}</span>
                                      </p>
                                      <p className="mt-1 text-xs font-bold text-gray-500">
                                        {user.email || '未填写邮箱'} · {user.role}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleAddGroupManager(user.id)}
                                      disabled={managerUpdating || alreadyBound}
                                      className={`inline-flex items-center justify-center border-2 border-black px-3 py-2 text-sm font-black disabled:opacity-50 ${alreadyBound ? 'bg-gray-200 text-gray-500' : 'bg-black text-white hover:bg-p5-red'}`}
                                    >
                                      <Plus className="mr-1 h-4 w-4" />
                                      {alreadyBound ? '已绑定' : '绑定'}
                                    </button>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {isContributor && (
                      <div className="mb-8 border-4 border-black bg-gray-50 p-5 shadow-[4px_4px_0_0_black]">
                        <p className="text-xs font-black uppercase italic tracking-widest text-p5-red">当前维护对象</p>
                        <h3 className="mt-1 text-xl font-black text-black">
                          {groupForm.name || '请先在上方选择社团'}
                        </h3>
                        <p className="mt-2 text-sm font-bold text-gray-600">
                          修改这里会更新社团公开资料；视频上传和编辑请切换到“视频管理/上传”。
                        </p>
                      </div>
                    )}

                    <form onSubmit={handleGroupSubmit} className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="relative">
                          <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                            社团名称 *
                          </label>
                          <input
                            type="text"
                            required
                            value={groupForm.name || ''}
                            onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                            className="w-full p-4 border-4 border-black font-black uppercase focus:ring-0 focus:border-p5-red transition-colors placeholder-gray-300 bg-gray-50 shadow-[4px_4px_0_0_black]"
                            placeholder="请输入社团名称..."
                          />
                        </div>

                        <div className="relative">
                          <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                            成立日期
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
                          社团描述
                        </label>
                        <textarea
                          rows={3}
                          value={groupForm.description || ''}
                          onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                          className="w-full p-4 border-4 border-black font-black focus:ring-0 focus:border-p5-red transition-colors placeholder-gray-300 bg-gray-50 shadow-[4px_4px_0_0_black]"
                          placeholder="请简单介绍这个社团..."
                        />
                      </div>

                      <div className="relative">
                        <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                          社团 Logo 上传
                        </label>
                        <div className="w-full p-4 border-4 border-black font-black focus-within:border-p5-red transition-colors bg-gray-50 shadow-[4px_4px_0_0_black] flex flex-col items-center">
                          {groupLogoPreview ? (
                            <div className="relative mb-4 group/preview">
                              <img
                                src={groupLogoPreview}
                                alt="Logo Preview"
                                className="h-32 w-32 object-cover border-4 border-black shadow-[4px_4px_0_0_black]"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  setGroupLogoFile(null)
                                  setGroupLogoPreview(null)
                                }}
                                className="absolute -top-2 -right-2 bg-p5-red text-white p-1 border-2 border-black hover:bg-black transition-colors"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ) : (
                            <div className="mb-4 text-gray-400 italic">未选择 Logo</div>
                          )}
                          <label className="cursor-pointer bg-black text-white px-6 py-2 font-black uppercase italic hover:bg-p5-red transition-colors transform -skew-x-12">
                            <span className="transform skew-x-12 flex items-center">
                              <Upload className="w-5 h-5 mr-2" />
                              选择图片
                            </span>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={handleGroupLogoChange}
                            />
                          </label>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="relative">
                          <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                            省份
                          </label>
                          <div className="border-4 border-black focus-within:border-p5-red transition-colors shadow-[4px_4px_0_0_black]">
                            <SearchableSelect
                              placeholder="选择省份..."
                              value={groupForm.province}
                              onChange={(value) => setGroupForm({ ...groupForm, province: value, city: '' })}
                              optionsList={provinceOptions}
                              displayField="name"
                              valueField="id"
                            />
                          </div>
                        </div>

                        <div className="relative">
                          <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                            城市
                          </label>
                          <div className="border-4 border-black focus-within:border-p5-red transition-colors shadow-[4px_4px_0_0_black]">
                            <SearchableSelect
                              placeholder={groupForm.province ? "选择城市..." : "请先选择省份..."}
                              value={groupForm.city}
                              onChange={(value) => setGroupForm({ ...groupForm, city: value })}
                              optionsList={availableCities}
                              displayField="name"
                              valueField="id"
                              disabled={!groupForm.province}
                            />
                          </div>
                        </div>

                        <div className="relative">
                          <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                            详细地址
                          </label>
                          <input
                            type="text"
                            value={groupForm.location || ''}
                            onChange={(e) => setGroupForm({ ...groupForm, location: e.target.value })}
                            className="w-full p-4 border-4 border-black font-black focus:ring-0 focus:border-p5-red transition-colors placeholder-gray-300 bg-gray-50 shadow-[4px_4px_0_0_black]"
                            placeholder="请输入详细地址..."
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="relative">
                          <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                            官方网站
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
                            邮箱
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
                            联系电话
                          </label>
                          <input
                            type="tel"
                            value={groupForm.phone || ''}
                            onChange={(e) => setGroupForm({ ...groupForm, phone: e.target.value })}
                            className="w-full p-4 border-4 border-black font-black focus:ring-0 focus:border-p5-red transition-colors placeholder-gray-300 bg-gray-50 shadow-[4px_4px_0_0_black]"
                            placeholder="请输入联系电话..."
                          />
                        </div>

                        <div className="relative">
                          <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                            微博账号
                          </label>
                          <input
                            type="text"
                            value={groupForm.weibo || ''}
                            onChange={(e) => setGroupForm({ ...groupForm, weibo: e.target.value })}
                            className="w-full p-4 border-4 border-black font-black focus:ring-0 focus:border-p5-red transition-colors placeholder-gray-300 bg-gray-50 shadow-[4px_4px_0_0_black]"
                            placeholder="请输入微博链接..."
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="relative">
                          <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                            微信号
                          </label>
                          <input
                            type="text"
                            value={groupForm.wechat || ''}
                            onChange={(e) => setGroupForm({ ...groupForm, wechat: e.target.value })}
                            className="w-full p-4 border-4 border-black font-black focus:ring-0 focus:border-p5-red transition-colors placeholder-gray-300 bg-gray-50 shadow-[4px_4px_0_0_black]"
                            placeholder="请输入微信号..."
                          />
                        </div>

                        <div className="relative">
                          <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                            QQ群
                          </label>
                          <input
                            type="text"
                            value={groupForm.qq_group || ''}
                            onChange={(e) => setGroupForm({ ...groupForm, qq_group: e.target.value })}
                            className="w-full p-4 border-4 border-black font-black focus:ring-0 focus:border-p5-red transition-colors placeholder-gray-300 bg-gray-50 shadow-[4px_4px_0_0_black]"
                            placeholder="请输入 QQ 群号..."
                          />
                        </div>

                        <div className="relative">
                          <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                            哔哩哔哩
                          </label>
                          <input
                            type="text"
                            value={groupForm.bilibili || ''}
                            onChange={(e) => setGroupForm({ ...groupForm, bilibili: e.target.value })}
                            className="w-full p-4 border-4 border-black font-black focus:ring-0 focus:border-p5-red transition-colors placeholder-gray-300 bg-gray-50 shadow-[4px_4px_0_0_black]"
                            placeholder="请输入 B 站主页链接..."
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-6 pt-6">
                        <button
                          type="button"
                          onClick={resetGroupForm}
                          className="px-6 py-2 border-4 border-black text-black font-black uppercase italic hover:bg-black hover:text-white transition-all transform -skew-x-12"
                        >
                          <span className="transform skew-x-12 inline-block">重置</span>
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
                                处理中...
                              </>
                            ) : (
                              <>
                                <Save className="h-5 w-5 mr-3" />
                                {groupMode === 'create' ? '创建社团' : '更新社团'}
                              </>
                            )}
                          </span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {!isContributor && activeTab === 'event' && (
                  <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 border-b-8 border-p5-red pb-4">
                      <div className="flex items-center space-x-4">
                        <div className="bg-black p-3 transform rotate-6 border-4 border-white shadow-[4px_4px_0_0_black]">
                          <Calendar className="w-8 h-8 text-white transform -rotate-6" />
                        </div>
                        <h2 className="text-xl md:text-3xl font-black text-black uppercase italic tracking-tighter p5-text-shadow">
                          {eventMode === 'create' ? '添加新赛事' : '编辑赛事信息'}
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
                            新建
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
                            编辑
                          </span>
                        </button>
                      </div>
                    </div>

                    {eventMode === 'edit' && (
                      <div className="mb-10 p-6 bg-p5-red transform skew-x-2 border-r-8 border-black shadow-xl relative z-20">
                        <div className="transform -skew-x-2">
                          <label className="block text-sm font-black text-white uppercase mb-3 tracking-widest">
                            选择要编辑的赛事
                          </label>
                          <div className="border-4 border-black shadow-[4px_4px_0_0_rgba(0,0,0,0.3)]">
                            <SearchableSelect
                              placeholder="搜索要编辑的赛事..."
                              onChange={handleEventSelect}
                              searchFunction={() => eventService.getAllEvents()}
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
                            开始日期 *
                          </label>
                          <input
                            type="date"
                            required
                            value={eventForm.start_date}
                            onChange={(e) => setEventForm({ ...eventForm, start_date: e.target.value })}
                            className="w-full p-4 border-4 border-black font-black uppercase focus:ring-0 focus:border-p5-red transition-colors bg-gray-50 shadow-[4px_4px_0_0_black]"
                          />
                        </div>

                        <div className="relative">
                          <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                            结束日期
                          </label>
                          <input
                            type="date"
                            value={eventForm.end_date}
                            min={eventForm.start_date}
                            onChange={(e) => setEventForm({ ...eventForm, end_date: e.target.value })}
                            className="w-full p-4 border-4 border-black font-black uppercase focus:ring-0 focus:border-p5-red transition-colors bg-gray-50 shadow-[4px_4px_0_0_black]"
                          />
                        </div>

                        <div className="relative md:col-span-2">
                          <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                            关联比赛 *
                          </label>
                          <div className="border-4 border-black focus-within:border-p5-red transition-colors shadow-[4px_4px_0_0_black]">
                            <DropdownSelect
                              placeholder="选择比赛..."
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
                          赛事标题 *
                        </label>
                        <input
                          type="text"
                          required
                          value={eventForm.title}
                          onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                          className="w-full p-4 border-4 border-black font-black uppercase focus:ring-0 focus:border-p5-red transition-colors placeholder-gray-300 bg-gray-50 shadow-[4px_4px_0_0_black]"
                          placeholder="请输入赛事标题..."
                        />
                      </div>

                      <div className="relative">
                        <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                          赛事描述
                        </label>
                        <textarea
                          rows={4}
                          value={eventForm.description}
                          onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                          className="w-full p-4 border-4 border-black font-black focus:ring-0 focus:border-p5-red transition-colors placeholder-gray-300 bg-gray-50 shadow-[4px_4px_0_0_black]"
                          placeholder="请输入赛事描述..."
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="relative">
                          <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                            联系方式
                          </label>
                          <input
                            type="text"
                            value={eventForm.contact}
                            onChange={(e) => setEventForm({ ...eventForm, contact: e.target.value })}
                            className="w-full p-4 border-4 border-black font-black focus:ring-0 focus:border-p5-red transition-colors placeholder-gray-300 bg-gray-50 shadow-[4px_4px_0_0_black]"
                            placeholder="请输入联系方式..."
                          />
                        </div>

                        <div className="relative">
                          <label className="block text-xs font-black text-white bg-black px-2 py-0.5 absolute -top-3 left-4 transform -skew-x-12 uppercase z-10">
                            官网链接
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
                          宣传图片链接
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
                          <span className="transform skew-x-12 inline-block">重置</span>
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
                                同步中...
                              </>
                            ) : (
                              <>
                                <Save className="h-5 w-5 mr-3" />
                                {eventMode === 'create' ? '创建赛事' : '更新赛事'}
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
