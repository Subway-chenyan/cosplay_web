import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../store/store'
import { fetchVideoDetail } from '../store/slices/videosSlice'
import { groupService } from '../services/groupService'
import { Group } from '../types'
import {
  ArrowLeft,
  Calendar,
  MapPin,
  ExternalLink,
  Play,
  Globe,
  Loader
} from 'lucide-react'

function VideoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { currentVideo, loading } = useSelector((state: RootState) => state.videos)
  const [isPlayerLoaded, setIsPlayerLoaded] = useState(false)

  const [groupDetails, setGroupDetails] = useState<Group | null>(null)


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
        } catch (error) {
          console.error('Error fetching related data:', error)
        }
      }
    }

    fetchRelatedData()
  }, [currentVideo, id])

  const video = currentVideo && currentVideo.id === id ? currentVideo : null

  // const formatDate = (dateString: string) => {
  //   return new Date(dateString).toLocaleDateString('zh-CN')
  // }

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
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-600" />
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

  return (
    <div className="space-y-6">
      {/* 返回按钮 */}
      <div className="flex items-center">
        <button
          onClick={() => navigate(-1)}
          className="group flex items-center bg-black text-white px-4 py-2 transform -skew-x-12 hover:bg-p5-red transition-all shadow-[4px_4px_0_0_rgba(0,0,0,0.2)]"
        >
          <span className="flex items-center transform skew-x-12">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-black uppercase italic">Go Back / 返回上一页</span>
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
            <div className="p-6 bg-black text-white border-t-4 border-p5-red transform skew-x-1">
              <div className="flex items-center justify-between transform -skew-x-1">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center transform rotate-12 border-2 border-p5-red">
                    <span className="text-p5-red font-black text-xl">B</span>
                  </div>
                  <div>
                    <div className="text-xl font-black italic uppercase">Bilibili Recording / 原片档案</div>
                    <div className="text-xs font-bold text-gray-400">ACCESSING ORIGINAL DATA / 获得更好的观看体验</div>
                  </div>
                </div>

                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-p5-red hover:bg-white hover:text-black text-white px-6 py-2 font-black uppercase italic transform -skew-x-12 transition-all shadow-[4px_4px_0_0_black]"
                >
                  <span className="transform skew-x-12 flex items-center">
                    <ExternalLink className="w-5 h-5 mr-2" />
                    <span>Watch / 前往B站</span>
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
                    <h3 className="text-xs font-black text-black uppercase italic mb-3 tracking-widest border-b border-p5-red inline-block">标签情报 / INTEL TAGS</h3>
                    <div className="flex flex-wrap gap-3">
                      {video.tags.map((tag) => (
                        <span
                          key={tag.id}
                          className="px-3 py-1 text-xs font-black uppercase italic transform -skew-x-12 border-2 transition-all hover:scale-105 active:bg-black active:text-white"
                          style={{ backgroundColor: 'white', borderColor: 'black', color: 'black' }}
                        >
                          <span className="transform skew-x-12 inline-block">#{tag.name} / {tag.category}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 描述 */}
                <div className="relative">
                  <h3 className="text-lg font-black text-black uppercase italic mb-3 border-b-2 border-black inline-block p5-text-shadow">详情介绍 / DESCRIPTION</h3>
                  <p className="text-black font-bold leading-relaxed italic border-l-4 border-p5-red pl-6 py-4 bg-white shadow-[4px_4px_0_0_black] border-2 border-black">
                    {video.description}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 右侧社团信息 */}
        <div className="space-y-8">
          {/* 社团详细信息 */}
          {groupDetails && (
            <div className="relative group">
              <div className="absolute inset-0 bg-black transform translate-x-2 translate-y-2 z-0 shadow-lg"></div>
              <div className="relative z-10 bg-white border-4 border-black p-8 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 p5-halftone opacity-10 -rotate-45 translate-x-16 -translate-y-16"></div>

                <h2 className="text-2xl font-black text-black uppercase italic mb-8 border-b-4 border-p5-red inline-block p5-text-shadow-red">
                  所属社团 / ALLIANCE
                </h2>

                {/* 社团头部 */}
                <div className="flex items-center space-x-4 mb-8">
                  <button
                    onClick={handleGroupClick}
                    className="w-20 h-20 bg-p5-red transform -rotate-6 border-4 border-black shadow-[4px_4px_0_0_black] overflow-hidden flex-shrink-0 hover:rotate-0 transition-transform cursor-pointer"
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
                      className="text-2xl font-black text-black uppercase italic leading-none hover:text-p5-red transition-colors cursor-pointer block text-left"
                    >
                      {groupDetails.name}
                    </button>

                    {groupDetails.location && (
                      <div className="flex items-center text-black font-black italic text-xs mt-2 uppercase bg-gray-100 px-2 py-1 transform -skew-x-12 border-l-4 border-p5-red">
                        <MapPin className="w-4 h-4 mr-1 text-p5-red transform skew-x-12" />
                        <span className="transform skew-x-12 inline-block">驻地: {groupDetails.location} / BASE</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 社团描述 */}
                <div className="mb-8 p-4 bg-gray-100 italic font-bold text-sm border-2 border-black border-dashed">
                  {groupDetails.description}
                </div>

                {/* 社交链接 */}
                <div className="space-y-3">
                  {groupDetails.website && (
                    <a
                      href={groupDetails.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center bg-black text-white px-4 py-2 transform -skew-x-12 hover:bg-white hover:text-black hover:border-2 hover:border-black transition-all group/link"
                    >
                      <Globe className="w-5 h-5 mr-3 group-hover/link:text-p5-red" />
                      <span className="transform skew-x-12 font-black uppercase italic text-sm">Official Website / 官方网站</span>
                    </a>
                  )}

                  {groupDetails.bilibili && (
                    <a
                      href={groupDetails.bilibili}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center bg-p5-red text-white px-4 py-2 transform -skew-x-12 hover:bg-black transition-all group/link"
                    >
                      <div className="w-5 h-5 mr-3 bg-white rounded flex items-center justify-center transform skew-x-12">
                        <span className="text-p5-red font-black text-xs">B</span>
                      </div>
                      <span className="transform skew-x-12 font-black uppercase italic text-sm">Bilibili / 哔哩哔哩</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>


      </div>
    </div>
  )
}

export default VideoDetailPage