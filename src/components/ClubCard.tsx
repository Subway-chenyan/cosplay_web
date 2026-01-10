import { MapPin, Video } from 'lucide-react'

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
      className="relative group cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:scale-105"
      onClick={handleClick}
    >
      <div className="absolute inset-0 bg-black transform translate-x-1 translate-y-1 rotate-1 border-2 border-gray-800 z-0"></div>

      <div className="relative z-10 bg-white border-2 border-black p-5 h-full flex flex-col overflow-hidden">
        {/* Decorative corner */}
        <div className="absolute -top-6 -right-6 w-12 h-12 bg-p5-red transform rotate-45 z-0"></div>

        {/* 社团名称 */}
        <div className="mb-4 relative z-10">
          <h3 className="text-xl font-black text-black uppercase transform -skew-x-6 border-b-4 border-p5-red inline-block pr-2 mb-1">
            {club.name}
          </h3>
        </div>

        {/* 位置信息 */}
        <div className="flex items-center text-sm font-bold text-gray-800 mb-2">
          <MapPin className="w-4 h-4 mr-2 text-p5-red" />
          <span className="bg-black text-white px-1 transform skew-x-12 inline-block">
            <span className="transform -skew-x-12 inline-block">{displayLocation}</span>
          </span>
        </div>

        {/* 视频数量 */}
        <div className="flex items-center text-sm font-bold text-gray-800 mb-4">
          <Video className="w-4 h-4 mr-2 text-p5-red" />
          <span>
            {club.video_count || 0} VIDEOS
          </span>
        </div>

        {/* 描述 */}
        {club.description && (
          <div className="mb-4 flex-grow">
            <p className="text-xs text-gray-600 line-clamp-3 font-medium border-l-2 border-gray-300 pl-2 italic">
              {club.description}
            </p>
          </div>
        )}

        {/* Comic dots decoration at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-p5-red opacity-10" style={{ backgroundImage: 'radial-gradient(#000 20%, transparent 20%)', backgroundSize: '4px 4px' }}></div>
      </div>
    </div>
  )
}

export default ClubCard