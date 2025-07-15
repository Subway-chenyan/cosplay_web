import { Video } from '../types'
import { Play, Calendar, Clock } from 'lucide-react'

interface VideoCardProps {
  video: Video
  onClick?: () => void
}

function VideoCard({ video, onClick }: VideoCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN')
  }

  return (
    <div
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer card-hover"
      onClick={onClick}
    >
      {/* 缩略图 */}
      <div className="relative aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
        <img
          src={video.thumbnail || 'https://picsum.photos/400/225'}
          alt={video.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
          <Play className="w-12 h-12 text-white opacity-0 hover:opacity-100 transition-opacity duration-300" />
        </div>
        
        {/* 时长 */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            {video.duration}
          </div>
        )}
        
        {/* 推荐标记 */}
        {video.is_featured && (
          <div className="absolute top-2 left-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-xs px-2 py-1 rounded-full">
            推荐
          </div>
        )}
      </div>

      {/* 内容 */}
      <div className="p-4">
        {/* 标题 */}
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2 mb-2">
          {video.title}
        </h3>

        {/* 描述 */}
        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
          {video.description}
        </p>

        {/* 社团 */}
        {video.groups.length > 0 && (
          <div className="mb-3">
            <span className="text-sm text-gray-500">社团: </span>
            <span className="text-sm font-medium text-primary-600">
              {video.groups[0].name}
            </span>
          </div>
        )}

        {/* 比赛 */}
        {video.competitions.length > 0 && (
          <div className="mb-3">
            <span className="text-sm text-gray-500">比赛: </span>
            <span className="text-sm font-medium text-secondary-600">
              {video.competitions[0].name}
            </span>
          </div>
        )}

        {/* 标签 */}
        {video.tags.length > 0 && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1">
              {video.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag.id}
                  className="inline-block px-2 py-1 text-xs rounded-full text-white"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
              {video.tags.length > 3 && (
                <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-600">
                  +{video.tags.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* 日期信息 */}
        <div className="text-sm text-gray-500 pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-1">
            {video.performance_date ? (
              <>
                <Calendar className="w-4 h-4" />
                <span>: {formatDate(video.performance_date)}</span>
              </>
            ) : (
              <>
                <Clock className="w-4 h-4" />
                <span>创建时间: {formatDate(video.created_at)}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoCard 