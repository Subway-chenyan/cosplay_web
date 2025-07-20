import { Video } from '../types'
import { Play, Calendar, Clock, Users, Trophy } from 'lucide-react'

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
      <div className="relative">
        <img 
          src={video.thumbnail || 'https://via.placeholder.com/300x200'} 
          alt={video.title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
          <Play className="w-12 h-12 text-white opacity-0 hover:opacity-100 transition-opacity duration-300" />
        </div>
      </div>
      
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
        {video.group_name && (
          <div className="flex items-center space-x-2 text-gray-600">
            <Users className="w-4 h-4" />
            <span className="text-sm">{video.group_name}</span>
          </div>
        )}
        
        {/* 比赛 */}
        {video.competition_name && (
          <div className="flex items-center space-x-2 text-gray-600">
            <Trophy className="w-4 h-4" />
            <span className="text-sm">
              {video.competition_name}
              {video.competition_year && ` (${video.competition_year})`}
            </span>
          </div>
        )}
        
        {/* 创建时间 */}
        <div className="flex items-center space-x-2 text-gray-600">
          <Calendar className="w-4 h-4" />
          <span className="text-sm">{formatDate(video.created_at)}</span>
        </div>
      </div>
    </div>
  )
}

export default VideoCard 