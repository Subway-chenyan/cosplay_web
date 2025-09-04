import { X, Users } from 'lucide-react'
import { AwardRecord } from '../types'

interface NoVideoAwardCardProps {
  awardRecord: AwardRecord
  awardInfo: {
    label: string
    color: string
    textColor: string
    borderColor: string
    icon: React.ReactNode
  }
}

function NoVideoAwardCard({ awardRecord, awardInfo }: NoVideoAwardCardProps) {
  // 根据比赛名称选择背景图片
  const getBackgroundImage = (competitionName: string) => {
    if (competitionName?.includes('ChinaJoy') || competitionName?.includes('超级联赛')) {
      return '/assets/CJ.png'
    }
    // 默认背景图片
    return 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTFpQ3dX8RyOjaIX0B2_JKjs6Glgg8pvanLCw&s'
  }

  const backgroundImage = getBackgroundImage(awardRecord.competition_name || '')

  return (
    <div className="max-w-sm relative">
      {/* 模拟VideoCard的样式结构 */}
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden cursor-pointer group">
        {/* 缩略图区域 */}
        <div className="relative aspect-video bg-gray-100">
          <img
            src={backgroundImage}
            alt="无视频"
            className="w-full h-full object-cover"
          />
          {/* 无视频标识 */}
          <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
            <div className="text-white text-center">
              <X className="w-8 h-8 mx-auto mb-2" />
              <span className="text-sm font-medium">暂无视频</span>
            </div>
          </div>
        </div>
        
        {/* 内容区域 */}
        <div className="p-4">
          {/* 剧名 */}
          {awardRecord.drama_name && (
            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
              {awardRecord.drama_name}
            </h3>
          )}
          
          {/* 社团名称 */}
          {awardRecord.group_name && (
            <div className="flex items-center space-x-1 text-sm text-gray-600 mb-2">
              <Users className="w-4 h-4" />
              <span>{awardRecord.group_name}</span>
            </div>
          )}
          
          {/* 描述 */}
          {awardRecord.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {awardRecord.description}
            </p>
          )}
        </div>
      </div>
      
      {/* 奖项标识 */}
      <div className={`absolute top-2 right-2 ${awardInfo.color} rounded-lg px-2 py-1 flex items-center space-x-1 shadow-sm backdrop-blur-sm border ${awardInfo.borderColor}`}>
        {awardInfo.icon}
        <span className={`text-xs font-medium ${awardInfo.textColor}`}>
          {awardInfo.label}
        </span>
      </div>
      
      {/* 年份标识 */}
      {(awardRecord.competition_year_detail?.year || awardRecord.competition_year) && (
        <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white rounded px-2 py-1 text-xs">
          {awardRecord.competition_year_detail?.year || awardRecord.competition_year}年
        </div>
      )}
    </div>
  )
}

export default NoVideoAwardCard