import { Video } from '../types'
import { Play, Calendar, Clock, Users, Trophy, ImageIcon } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface VideoCardProps {
  video: Video
  onClick?: () => void
}

function VideoCard({ video, onClick }: VideoCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  // 懒加载实现
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const handleImageLoad = () => {
    setImageLoaded(true)
    setImageError(false)
  }

  const handleImageError = () => {
    setImageError(true)
    setImageLoaded(false)
  }

  // 获取缩略图URL，支持B站URL的处理
  const getThumbnailUrl = (thumbnail: string | undefined) => {
    if (!thumbnail) return null
    
    // 如果是B站URL，尝试添加referrer policy
    if (thumbnail.includes('hdslb.com') || thumbnail.includes('bilibili.com')) {
      return thumbnail
    }
    
    return thumbnail
  }

  const thumbnailUrl = getThumbnailUrl(video.thumbnail)

  return (
    <div
      ref={cardRef}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer card-hover"
      onClick={onClick}
    >
      {/* 缩略图 */}
      <div className="relative h-48 bg-gray-100 rounded-t-lg overflow-hidden">
        {isInView && (
          <>
            {/* 加载状态 */}
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse">
                <ImageIcon className="w-8 h-8 text-gray-400" />
              </div>
            )}

            {/* 图片 */}
            {thumbnailUrl && !imageError && (
              <img
                ref={imgRef}
                src={thumbnailUrl}
                alt={video.title}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={handleImageLoad}
                onError={handleImageError}
                loading="lazy"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
              />
            )}

            {/* 错误状态或无缩略图 */}
            {(imageError || !thumbnailUrl) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
                <span className="text-xs text-gray-500 text-center px-2">
                  {imageError ? '图片加载失败' : '暂无缩略图'}
                </span>
              </div>
            )}

            {/* 播放按钮覆盖层 */}
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center group">
              <Play className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 drop-shadow-lg" />
            </div>
          </>
        )}

        {/* 非可视区域的占位符 */}
        {!isInView && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <ImageIcon className="w-8 h-8 text-gray-300" />
          </div>
        )}
      </div>
      
      <div className="p-4">
        {/* 标题 */}
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2 leading-tight">
          {video.title}
        </h3>

        {/* 描述 */}
        {video.description && (
          <p className="text-gray-600 text-sm line-clamp-2 mb-3">
            {video.description}
          </p>
        )}

        <div className="space-y-1">
          {/* 社团 */}
          {video.group_name && (
            <div className="flex items-center space-x-2 text-gray-600">
              <Users className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm truncate">{video.group_name}</span>
            </div>
          )}
          
          {/* 比赛 */}
          {video.competition_name && (
            <div className="flex items-center space-x-2 text-gray-600">
              <Trophy className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm truncate">
                {video.competition_name}
                {video.competition_year && ` (${video.competition_year})`}
              </span>
            </div>
          )}
          
          {/* 创建时间 */}
          <div className="flex items-center space-x-2 text-gray-600">
            <Calendar className="w-4 h-4 flex-shrink-0" />
            <span className="text-sm">{formatDate(video.created_at)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoCard 