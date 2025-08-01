import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../store/store'
import { fetchVideoDetail, fetchRelatedVideos } from '../store/slices/videosSlice'
import { videoService } from '../services/videoService'
import { groupService } from '../services/groupService'
import VideoCard from '../components/VideoCard'
import { Video, Group } from '../types'
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Users, 
  MapPin, 
  ExternalLink, 
  CheckCircle,
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
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([])
  const [groupDetails, setGroupDetails] = useState<Group | null>(null)
  const [loadingRelated, setLoadingRelated] = useState(false)

  useEffect(() => {
    if (id) {
      dispatch(fetchVideoDetail(id))
    }
  }, [dispatch, id])

  useEffect(() => {
    const fetchRelatedData = async () => {
      if (currentVideo && currentVideo.id === id) {
        setLoadingRelated(true)
        try {
          // 获取社团详情
          if (currentVideo.group) {
            const group = await groupService.getGroupById(currentVideo.group)
            setGroupDetails(group)
            
            // 获取相关视频
            const related = await videoService.getRelatedVideos(currentVideo.id, 8)
            setRelatedVideos(related.results)
          }
        } catch (error) {
          console.error('Error fetching related data:', error)
        } finally {
          setLoadingRelated(false)
        }
      }
    }
    
    fetchRelatedData()
  }, [currentVideo, id])

  const video = currentVideo && currentVideo.id === id ? currentVideo : null

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  // 从B站URL提取视频ID
  const getBilibiliVideoId = (url: string) => {
    const match = url.match(/(?:bilibili\.com\/video\/)?(BV[a-zA-Z0-9]+)/i)
    return match ? match[1] : null
  }

  const handleVideoClick = (videoId: string) => {
    // 跳转到其他视频的详情页
    navigate(`/video/${videoId}`)
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

  const bvNumber = getBilibiliVideoId(video.url)

  return (
    <div className="space-y-6">
      {/* 返回按钮 */}
      <div className="flex items-center">
        <Link
          to="/"
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回主页</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左侧视频播放区域 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 视频播放器 */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
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
                    src={`//player.bilibili.com/player.html?bvid=${bvNumber}&page=1&autoplay=0`}
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
            <div className="p-4 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">B</span>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">在B站观看完整视频</div>
                    <div className="text-xs text-gray-500">获得更好的观看体验</div>
                  </div>
                </div>
                
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>前往B站</span>
                </a>
              </div>
            </div>
          </div>

          {/* 视频信息 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{video.title}</h1>
            
            <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                <span>{video.year}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <span>BV号: {video.bv_number}</span>
              </div>
            </div>

            {/* 标签 */}
            {video.tags.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">标签</h3>
                <div className="flex flex-wrap gap-2">
                  {video.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="inline-block px-3 py-1 text-sm rounded-full text-white"
                      style={{ backgroundColor: tag.color }}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 比赛信息 - 暂时隐藏，需要通过awards关联获取 */}

            {/* 描述 */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">视频描述</h3>
              <p className="text-gray-600 leading-relaxed">{video.description}</p>
            </div>
          </div>
        </div>

        {/* 右侧社团信息 */}
        <div className="space-y-6">
          {/* 社团详细信息 */}
          {groupDetails && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">社团信息</h2>
              
              {/* 社团头部 */}
              <div className="flex items-center space-x-4 mb-4">
                <button
                  onClick={handleGroupClick}
                  className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden flex-shrink-0 hover:ring-2 hover:ring-primary-300 transition-all duration-200 hover:scale-105 cursor-pointer"
                  title="点击查看社团详情"
                >
                  {groupDetails.logo ? (
                    <img
                      src={groupDetails.logo}
                      alt={groupDetails.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                      <span className="text-white font-bold text-xl">
                        {groupDetails.name.charAt(0)}
                      </span>
                    </div>
                  )}
                </button>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <button
                      onClick={handleGroupClick}
                      className="text-lg font-semibold text-gray-900 truncate hover:text-primary-600 transition-colors cursor-pointer"
                      title="点击查看社团详情"
                    >
                      {groupDetails.name}
                    </button>
                  </div>
                  
                  {groupDetails.location && (
                    <div className="flex items-center text-gray-500 text-sm">
                      <MapPin className="w-4 h-4 mr-1" />
                      <span>{groupDetails.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 社团描述 */}
              <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                {groupDetails.description}
              </p>

              {/* 社交链接 */}
              <div className="space-y-2">
                {groupDetails.website && (
                  <a
                    href={groupDetails.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-primary-600 hover:text-primary-700"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    <span>官方网站</span>
                  </a>
                )}
                
                {groupDetails.bilibili && (
                  <a
                    href={groupDetails.bilibili}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-pink-600 hover:text-pink-700"
                  >
                    <div className="w-4 h-4 mr-2 bg-pink-500 rounded text-white text-xs font-bold flex items-center justify-center">
                      B
                    </div>
                    <span>哔哩哔哩</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* 相关视频 */}
          {relatedVideos.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                更多来自 {video.group_name} 的视频
              </h2>
              
              <div className="space-y-4">
                {relatedVideos.map((relatedVideo) => (
                  <div key={relatedVideo.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    <VideoCard
                      video={relatedVideo}
                      onClick={() => handleVideoClick(relatedVideo.id)}
                    />
                  </div>
                ))}
              </div>
              
              {relatedVideos.length >= 8 && (
                <div className="mt-4 text-center">
                  <Link
                    to={`/groups`}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    查看更多视频 →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VideoDetailPage