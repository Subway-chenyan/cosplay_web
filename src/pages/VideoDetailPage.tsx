import { useEffect, useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../store/store'
import { fetchVideoDetail } from '../store/slices/videosSlice'
import { groupService } from '../services/groupService'
import { eventService } from '../services/eventService'
import { authService } from '../services/authService'
import { api } from '../services/api'
import { Group, VideoEvent } from '../types'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  ExternalLink,
  Play,
  Globe,
  Loader2,
  Trophy,
  Search,
  X,
  Plus,
  Trash2
} from 'lucide-react'

/** Search events modal for binding */
function EventBindModal({ videoId, isOpen, onClose, onBound }: {
  videoId: string
  isOpen: boolean
  onClose: () => void
  onBound: () => void
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ id: string; title: string; region: string; stage_display: string; start_date: string }[]>([])
  const [loading, setLoading] = useState(false)

  const searchEvents = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return }
    setLoading(true)
    try {
      const data = await api.get<any[]>(`/competitions/events/?search=${encodeURIComponent(q)}&page_size=10`)
      setResults(Array.isArray(data) ? data : (data as any).results || [])
    } catch { setResults([]) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const t = setTimeout(() => searchEvents(query), 400)
    return () => clearTimeout(t)
  }, [query, isOpen, searchEvents])

  useEffect(() => { if (isOpen) { setQuery(''); setResults([]) } }, [isOpen])
  useEffect(() => {
    if (!isOpen) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleBind = async (eventId: string) => {
    try {
      await eventService.linkVideo(eventId, videoId)
      onBound()
      onClose()
    } catch { /* silent */ }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative w-full max-w-lg z-10">
        <div className="absolute inset-0 bg-p5-red transform translate-x-2 translate-y-2 -skew-x-2 border-2 border-black z-0"></div>
        <div className="relative z-10 bg-white border-4 border-black transform -skew-x-1 overflow-hidden">
          <div className="bg-black text-white px-4 py-3 flex items-center justify-between border-b-4 border-p5-red">
            <div className="flex items-center gap-2 transform skew-x-1">
              <Trophy className="w-5 h-5 text-p5-red" />
              <h3 className="font-black text-sm">绑定赛事</h3>
            </div>
            <button onClick={onClose} className="w-8 h-8 bg-p5-red text-white flex items-center justify-center border-2 border-white hover:bg-white hover:text-p5-red transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4 transform skew-x-1">
            <div className="relative">
              <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索赛事名称..."
                className="w-full border-2 border-black px-3 py-2 pr-10 text-sm font-bold focus:outline-none focus:border-p5-red focus:ring-2 focus:ring-p5-red/20" autoFocus />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
          <div className="px-4 pb-4 max-h-80 overflow-y-auto transform skew-x-1">
            {loading && <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 text-p5-red animate-spin" /></div>}
            {!loading && query && results.length === 0 && <p className="text-center py-8 text-sm text-gray-500 font-bold italic">无搜索结果</p>}
            {!loading && results.length > 0 && (
              <div className="space-y-2">
                {results.map((ev) => (
                  <button key={ev.id} onClick={() => handleBind(ev.id)}
                    className="w-full text-left flex items-center gap-3 p-2 border-2 border-gray-200 hover:border-p5-red hover:bg-red-50 transition-all">
                    <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-black truncate">{ev.title}</p>
                      <p className="text-[10px] text-gray-400 font-bold">{ev.region} · {ev.stage_display || ev.start_date}</p>
                    </div>
                    <Plus className="w-4 h-4 text-p5-red" />
                  </button>
                ))}
              </div>
            )}
            {!query && !loading && (
              <div className="text-center py-6">
                <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400 font-bold">输入关键词搜索赛事</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function VideoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { currentVideo, loading } = useSelector((state: RootState) => state.videos)
  const [isPlayerLoaded, setIsPlayerLoaded] = useState(false)

  const [groupDetails, setGroupDetails] = useState<Group | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [bindModalOpen, setBindModalOpen] = useState(false)
  const [videoEvents, setVideoEvents] = useState<VideoEvent[]>([])

  useEffect(() => {
    const checkAdmin = async () => {
      if (authService.isAuthenticated()) {
        try {
          const user = await authService.getCurrentUser()
          setIsAdmin(user.is_staff || user.is_superuser)
        } catch { setIsAdmin(false) }
      }
    }
    checkAdmin()
  }, [])

  useEffect(() => {
    if (id) {
      dispatch(fetchVideoDetail(id))
    }
  }, [dispatch, id])

  useEffect(() => {
    const fetchRelatedData = async () => {
      if (currentVideo && currentVideo.id === id) {
        try {
          // 获取社团详情
          if (currentVideo.group) {
            const group = await groupService.getGroupById(currentVideo.group)
            setGroupDetails(group)
          }
          // Set events from video data
          setVideoEvents(currentVideo.events || [])
        } catch (error) {
          console.error('Error fetching related data:', error)
        }
      }
    }

    fetchRelatedData()
  }, [currentVideo, id])

  const refreshVideo = () => {
    if (id) dispatch(fetchVideoDetail(id))
  }

  const handleUnbindEvent = async (eventId: string) => {
    try {
      await eventService.unlinkVideo(eventId, id!)
      refreshVideo()
    } catch { /* silent */ }
  }

  const video = currentVideo && currentVideo.id === id ? currentVideo : null

  // 从B站URL提取视频ID和分P信息
  const getBilibiliVideoInfo = (url: string) => {
    const bvMatch = url.match(/(?:bilibili\.com\/video\/)?(BV[a-zA-Z0-9]+)/i)
    const pageMatch = url.match(/[?&]p=(\d+)/i)

    return {
      bvNumber: bvMatch ? bvMatch[1] : null,
      page: pageMatch ? parseInt(pageMatch[1]) : 1
    }
  }

  const handleGroupClick = () => {
    if (groupDetails) {
      navigate(`/group/${groupDetails.id}`)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-600" />
          <p className="text-gray-600">正在加载视频详情...</p>
        </div>
      </div>
    )
  }

  if (!video) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-50 rounded-lg p-8 max-w-md mx-auto">
          <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">视频未找到</h3>
          <p className="text-gray-600 mb-4">请检查视频链接是否正确</p>
          <Link to="/" className="btn-primary">
            返回首页
          </Link>
        </div>
      </div>
    )
  }

  const { bvNumber, page } = getBilibiliVideoInfo(video.url)

  /** Format date */
  const fmtDate = (d: string) => {
    const dt = new Date(d + 'T00:00:00')
    return `${dt.getMonth() + 1}月${dt.getDate()}日`
  }

  return (
    <div className="space-y-6">
      {/* 返回按钮 */}
      <div className="flex items-center">
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center bg-black text-white px-4 py-2 hover:bg-p5-red transition-all shadow-[4px_4px_0_0_rgba(0,0,0,0.2)]"
        >
          <span className="flex items-center">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-black">返回上一页</span>
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左侧视频播放区域 */}
        <div className="lg:col-span-2 space-y-8">
          {/* 视频播放器 */}
          <div className="bg-white border-4 border-black p-2 shadow-[8px_8px_0_0_black] overflow-hidden">
            <div className="aspect-video bg-gray-900 relative">
              {bvNumber ? (
                <>
                  {!isPlayerLoaded && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white">
                        <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                        <p className="text-lg">正在加载播放器...</p>
                      </div>
                    </div>
                  )}
                  <iframe
                    src={`//player.bilibili.com/player.html?bvid=${bvNumber}&page=${page}&autoplay=0`}
                    className="w-full h-full"
                    scrolling="no"
                    frameBorder="0"
                    allowFullScreen
                    onLoad={() => setIsPlayerLoaded(true)}
                  />
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-white">
                  <div className="text-center">
                    <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg">无法加载视频</p>
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center space-x-2 text-blue-400 hover:text-blue-300"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>在B站观看</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* 跳转原视频模块 */}
            <div className="p-6 bg-black text-white border-t-4 border-p5-red">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border-2 border-p5-red">
                    <span className="text-p5-red font-black text-xl">B</span>
                  </div>
                  <div>
                    <div className="text-xl font-black">B站原片</div>
                    <div className="text-xs font-bold text-gray-400">获得更好的观看体验</div>
                  </div>
                </div>

                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-p5-red hover:bg-white hover:text-black text-white px-6 py-2 font-black transition-all shadow-[4px_4px_0_0_black]"
                >
                  <span className="flex items-center">
                    <ExternalLink className="w-5 h-5 mr-2" />
                    <span>前往B站</span>
                  </span>
                </a>
              </div>
            </div>
          </div>

          {/* 视频信息 */}
          <div className="relative group">
            <div className="absolute inset-0 bg-black transform translate-x-2 translate-y-2 -skew-x-1 z-0"></div>
            <div className="relative z-10 bg-white border-4 border-black p-8 transform -skew-x-1">
              <div className="transform skew-x-1">
                <h1 className="text-3xl font-black text-black mb-6 uppercase italic border-b-8 border-p5-red inline-block" style={{ textShadow: '2px 2px 0px #d90614' }}>
                  {video.title}
                </h1>

                <div className="flex items-center space-x-8 text-sm font-black uppercase italic mb-8">
                  <div className="flex items-center space-x-2 bg-black text-white px-3 py-1 transform -skew-x-12">
                    <div className="transform skew-x-12 flex items-center">
                      <Calendar className="w-5 h-5 text-p5-red mr-2" />
                      <span>{video.year}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 border-2 border-black px-3 py-1 transform -skew-x-12">
                    <div className="transform skew-x-12">
                      <span className="text-gray-500 mr-2">BV:</span>
                      <span className="text-black">{video.bv_number}</span>
                    </div>
                  </div>
                </div>

                {/* 标签 */}
                {video.tags.length > 0 && (
                  <div className="mb-8 p-4 bg-gray-50 border-l-8 border-black">
                    <h3 className="text-xs font-black text-black mb-3 tracking-widest border-b border-p5-red inline-block">标签</h3>
                    <div className="flex flex-wrap gap-3">
                      {video.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="px-3 py-1 text-xs font-black border-2 transition-all hover:scale-105 active:bg-black active:text-white"
                          style={{ backgroundColor: 'white', borderColor: 'black', color: 'black' }}
                        >
                          <span className="inline-block">#{tag.name} · {tag.category}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 描述 */}
                <div className="relative">
                  <h3 className="text-lg font-black text-black mb-3 border-b-2 border-black inline-block p5-text-shadow">详情介绍</h3>
                  <p className="text-black font-bold leading-relaxed border-l-4 border-p5-red pl-6 py-4 bg-white shadow-[4px_4px_0_0_black] border-2 border-black">
                    {video.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧信息栏 */}
        <div className="space-y-8">
          {/* ========== 赛事信息 ========== */}
          {(videoEvents.length > 0 || isAdmin) && (
            <div className="relative group">
              <div className="absolute inset-0 bg-black transform translate-x-2 translate-y-2 z-0 shadow-lg"></div>
              <div className="relative z-10 bg-white border-4 border-black p-6 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 p5-halftone opacity-10 -rotate-45 translate-x-16 -translate-y-16"></div>

                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-black text-black border-b-4 border-p5-red inline-block" style={{ textShadow: '2px 2px 0px #d90614' }}>
                    赛事信息
                  </h2>
                  {isAdmin && (
                    <button
                      onClick={() => setBindModalOpen(true)}
                      className="bg-p5-red text-white px-2 py-1 text-[10px] font-black hover:bg-black transition-colors inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span className="transform skew-x-6 inline-block">绑定</span>
                    </button>
                  )}
                </div>

                {videoEvents.length > 0 ? (
                  <div className="space-y-3">
                    {videoEvents.map((ev) => (
                      <div key={ev.id} className="p-3 bg-gray-50 border-2 border-black transform -skew-x-1 relative group/ev hover:bg-red-50 transition-colors">
                        <div className="transform skew-x-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-black text-black uppercase italic truncate">
                                {ev.title}
                              </h4>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                                {ev.competition_name && (
                                  <span className="text-[10px] font-bold text-p5-red bg-p5-red/10 px-1.5 py-0.5">
                                    {ev.competition_name}
                                  </span>
                                )}
                                {ev.region && (
                                  <span className="text-[10px] font-bold text-gray-500 inline-flex items-center gap-0.5">
                                    <MapPin className="w-2.5 h-2.5" />
                                    {ev.region}
                                  </span>
                                )}
                                {ev.stage_display && (
                                  <span className="text-[10px] font-black text-white bg-black px-1.5 py-0.5">
                                    <span>{ev.stage_display}</span>
                                  </span>
                                )}
                              </div>
                              {ev.start_date && (
                                <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400 font-bold">
                                  <Calendar className="w-2.5 h-2.5" />
                                  {fmtDate(ev.start_date)}{ev.end_date && ev.end_date !== ev.start_date ? ` - ${fmtDate(ev.end_date)}` : ''}
                                </div>
                              )}
                            </div>
                            {isAdmin && (
                              <button
                                onClick={() => handleUnbindEvent(ev.id)}
                                className="w-6 h-6 bg-gray-200 text-gray-500 flex items-center justify-center hover:bg-red-600 hover:text-white transition-colors flex-shrink-0"
                                title="取消绑定"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400">未绑定赛事</p>
                )}
              </div>
            </div>
          )}

          {/* 社团详细信息 */}
          {groupDetails && (
            <div className="relative group">
              <div className="absolute inset-0 bg-black transform translate-x-2 translate-y-2 z-0 shadow-lg"></div>
              <div className="relative z-10 bg-white border-4 border-black p-8 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 p5-halftone opacity-10 -rotate-45 translate-x-16 -translate-y-16"></div>

                <h2 className="text-2xl font-black text-black mb-8 border-b-4 border-p5-red inline-block p5-text-shadow-red">
                  所属社团
                </h2>

                {/* 社团头部 */}
                <div className="flex items-center space-x-4 mb-8">
                  <button
                    onClick={handleGroupClick}
                  className="w-20 h-20 bg-p5-red border-4 border-black shadow-[4px_4px_0_0_black] overflow-hidden flex-shrink-0 cursor-pointer"
                  >
                    {groupDetails.logo ? (
                      <img
                        src={groupDetails.logo}
                        alt={groupDetails.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="text-white font-black text-3xl italic">
                          {groupDetails.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <button
                      onClick={handleGroupClick}
                      className="text-2xl font-black text-black leading-none hover:text-p5-red transition-colors cursor-pointer block text-left"
                    >
                      {groupDetails.name}
                    </button>

                    {groupDetails.location && (
                      <div className="flex items-center text-black font-black text-xs mt-2 bg-gray-100 px-2 py-1 border-l-4 border-p5-red">
                        <MapPin className="w-4 h-4 mr-1 text-p5-red" />
                        <span className="inline-block">驻地: {groupDetails.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 社团描述 */}
                <div className="mb-8 p-4 bg-gray-100 font-bold text-sm border-2 border-black border-dashed">
                  {groupDetails.description}
                </div>

                {/* 社交链接 */}
                <div className="space-y-3">
                  {groupDetails.website && (
                    <a
                      href={groupDetails.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center bg-black text-white px-4 py-2 hover:bg-white hover:text-black hover:border-2 hover:border-black transition-all group/link"
                    >
                      <Globe className="w-5 h-5 mr-3 group-hover/link:text-p5-red" />
                      <span className="font-black text-sm">官方网站</span>
                    </a>
                  )}

                  {groupDetails.bilibili && (
                    <a
                      href={groupDetails.bilibili}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center bg-p5-red text-white px-4 py-2 hover:bg-black transition-all group/link"
                    >
                      <div className="w-5 h-5 mr-3 bg-white rounded flex items-center justify-center">
                        <span className="text-p5-red font-black text-xs">B</span>
                      </div>
                      <span className="font-black text-sm">哔哩哔哩</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Event Bind Modal */}
      <EventBindModal
        videoId={id || ''}
        isOpen={bindModalOpen}
        onClose={() => setBindModalOpen(false)}
        onBound={refreshVideo}
      />
    </div>
  )
}

export default VideoDetailPage
