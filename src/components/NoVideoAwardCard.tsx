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
    if (competitionName?.includes('金龙')) {
      return '/assets/JL.png'
    }
    // 默认背景图片
    return 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTFpQ3dX8RyOjaIX0B2_JKjs6Glgg8pvanLCw&s'
  }

  const backgroundImage = getBackgroundImage(awardRecord.competition_name || '')

  return (
    <div className="max-w-sm relative group/no-video">
      {/* 底部阴影 */}
      <div className="absolute inset-0 bg-black transform translate-x-1 translate-y-1 -skew-x-2 z-0"></div>

      {/* Skewed Container */}
      <div className="relative z-10 bg-white border-2 border-black transform -skew-x-2 overflow-hidden transition-all group-hover/no-video:-translate-y-1">
        {/* 缩略图区域 */}
        <div className="relative aspect-video bg-gray-200 overflow-hidden">
          <img
            src={backgroundImage}
            alt="未捕获视频"
            className="w-full h-full object-cover filter grayscale opacity-60 transition-all group-hover/no-video:grayscale-0 group-hover/no-video:scale-110"
          />
          {/* 无视频标识 - P5风格遮罩 */}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="text-center transform rotate-12">
              <div className="bg-p5-red p-2 border-2 border-black shadow-[4px_4px_0_0_black] mb-2 transform -skew-x-12">
                <X className="w-10 h-10 text-white transform skew-x-12" />
              </div>
              <div className="bg-black text-white px-4 py-1 text-sm font-black uppercase italic transform -skew-x-12">
                <span className="transform skew-x-12 inline-block tracking-tighter">DATA RESTRICTED / 暂无视频</span>
              </div>
            </div>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="p-4 transform skew-x-2">
          {/* 剧名 */}
          {awardRecord.drama_name && (
            <h3 className="text-lg font-black text-black mb-2 line-clamp-2 uppercase italic tracking-tighter" style={{ textShadow: '1px 1px 0px rgba(0,0,0,0.1)' }}>
              {awardRecord.drama_name}
            </h3>
          )}

          {/* 社团名称 */}
          {awardRecord.group_name && (
            <div className="flex items-center space-x-2 text-xs font-black text-p5-red uppercase italic mb-2">
              <div className="bg-black p-1">
                <Users className="w-3 h-3 text-white" />
              </div>
              <span>{awardRecord.group_name}</span>
            </div>
          )}

          {/* 描述 */}
          {awardRecord.description && (
            <p className="text-xs font-bold text-gray-500 line-clamp-2 italic border-l-4 border-black pl-3 py-1">
              {awardRecord.description}
            </p>
          )}
        </div>
      </div>

      {/* 奖项标识 */}
      <div className={`absolute -top-2 -right-2 z-20 bg-p5-red text-white p-2 transform rotate-12 border-2 border-black shadow-[2px_2px_0_0_black]`}>
        {awardInfo.icon}
      </div>

      {/* 年份标识 */}
      {(awardRecord.competition_year_detail?.year || awardRecord.competition_year) && (
        <div className="absolute bottom-2 right-2 z-20 bg-black text-white px-3 py-0.5 font-black text-xs transform -skew-x-12 border border-p5-red">
          <span className="transform skew-x-12 inline-block">
            {awardRecord.competition_year_detail?.year || awardRecord.competition_year} ARCHIVE
          </span>
        </div>
      )}
    </div>
  )
}

export default NoVideoAwardCard