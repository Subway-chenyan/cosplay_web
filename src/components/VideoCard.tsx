import { Video } from '../types'
import { Play, Users, Trophy, ImageIcon } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

interface VideoCardProps {
  video: Video
  onClick?: () => void
  dramaName?: string // 可选的剧名，用于覆盖视频标题
}

function VideoCard({ video, onClick, dramaName }: VideoCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const cardRef = useRef<HTMLDivElement>(null)

  // const formatDate = (dateString: string) => {
  //   return new Date(dateString).toLocaleDateString('zh-CN')
  // }

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
      className="relative group cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
      onClick={onClick}
    >
      {/* Background decoration */}
      <div className="absolute inset-0 bg-black transform translate-x-1 translate-y-1 -skew-x-2 border-2 border-gray-800 z-0"></div>

      {/* Main card content */}
      <div className="relative z-10 bg-white border-2 border-black h-full flex flex-col overflow-hidden">
        {/* Thumbnail Section */}
        <div className="relative aspect-video overflow-hidden border-b-2 border-black group-hover:border-p5-red transition-colors">
          {isInView && (
            <>
              {!imageLoaded && !imageError && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}

              {thumbnailUrl && !imageError && (
                <img
                  ref={imgRef}
                  src={thumbnailUrl}
                  alt={video.title}
                  className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${imageLoaded ? 'opacity-100' : 'opacity-0'
                    }`}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />
              )}

              {/* Error state */}
              {(imageError || !thumbnailUrl) && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100">
                  <ImageIcon className="w-12 h-12 text-gray-400 mb-2" />
                  <span className="text-xs text-gray-500">NO IMAGE</span>
                </div>
              )}

              {/* Play overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <Play className="w-12 h-12 text-p5-red fill-current transform scale-0 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </>
          )}

          {/* Date Badge - P5 Style */}
          <div className="absolute top-0 right-0 bg-p5-red text-white text-xs font-bold px-2 py-1 transform skew-x-12 origin-top-right border-l-2 border-b-2 border-white shadow-md">
            <span className="transform -skew-x-12 inline-block">{video.year}</span>
          </div>
        </div>

        <div className="p-3 flex-grow flex flex-col bg-white">
          {/* Title */}
          <h3 className="text-base font-black text-black leading-tight mb-2 line-clamp-2 group-hover:text-p5-red transition-colors">
            {dramaName || video.title}
          </h3>

          {/* Metadata */}
          <div className="mt-auto space-y-1 text-xs font-bold text-gray-600">
            {video.group_name && (
              <div className="flex items-center space-x-1">
                <Users className="w-3 h-3 text-p5-red" />
                <span className="truncate">{video.group_name}</span>
              </div>
            )}

            {video.competition_name && (
              <div className="flex items-center space-x-1">
                <Trophy className="w-3 h-3 text-black" />
                <span className="truncate">
                  {video.competition_name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Comic halftone effect decorative strip */}
        <div className="h-1 bg-black w-full" style={{ backgroundImage: 'radial-gradient(circle, #d90614 1px, transparent 1px)', backgroundSize: '4px 4px' }}></div>
      </div>
    </div>
  )
}

export default VideoCard