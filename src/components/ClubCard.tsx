import { Users, MapPin, Video } from 'lucide-react'

interface Club {
  id: string | number
  name: string
  location?: string
  province?: string
  city?: string
  video_count?: number
  description?: string
  is_active?: boolean
}

interface ClubCardProps {
  club: Club
  onClick?: (clubId: string | number) => void
}

function ClubCard({ club, onClick }: ClubCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick(club.id)
    }
  }

  const displayLocation = club.location ||
    (club.province || club.city ? `${club.province || ''}${club.city || ''}`.trim() : '未知地区')

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={handleClick}
    >
      {/* 社团名称 */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
          {club.name}
        </h3>
      </div>

      {/* 位置信息 */}
      <div className="flex items-center text-gray-600 mb-3">
        <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
        <span className="text-sm">{displayLocation}</span>
      </div>

      {/* 视频数量 */}
      <div className="flex items-center text-gray-600 mb-3">
        <Video className="w-4 h-4 mr-2 flex-shrink-0" />
        <span className="text-sm">
          {club.video_count || 0} 个视频
        </span>
      </div>

      {/* 描述 */}
      {club.description && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 line-clamp-3">
            {club.description}
          </p>
        </div>
      )}

      {/* 状态标签 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Users className="w-4 h-4 mr-1 text-gray-400" />
          <span className="text-xs text-gray-500">社团</span>
        </div>
        {club.is_active ? (
          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
            活跃
          </span>
        ) : (
          <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
            未激活
          </span>
        )}
      </div>
    </div>
  )
}

export default ClubCard