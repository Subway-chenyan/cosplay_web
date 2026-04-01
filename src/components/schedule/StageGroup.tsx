import { Swords, Target, Trophy, Flag } from 'lucide-react'
import { Event } from '../../types'
import EventCard from './EventCard'

interface StageGroupProps {
  stage: string
  stageDisplay: string
  events: Event[]
  isAdmin?: boolean
  onLinkVideo?: (eventId: string) => void
  onUnlinkVideo?: (eventId: string, videoId: string) => void
}

function getStageIcon(stage: string) {
  switch (stage) {
    case 'preliminary':
      return <Swords className="w-5 h-5 text-white transform -rotate-12" />
    case 'advancing':
      return <Target className="w-5 h-5 text-white transform -rotate-12" />
    case 'final':
      return <Trophy className="w-5 h-5 text-white transform -rotate-12" />
    default:
      return <Flag className="w-5 h-5 text-white transform -rotate-12" />
  }
}

function getStageLabel(stage: string): string {
  switch (stage) {
    case 'preliminary':
      return '初赛 / PRELIMINARY'
    case 'advancing':
      return '复赛 / ADVANCING'
    case 'final':
      return '决赛 / FINAL'
    default:
      return '其他 / OTHER'
  }
}

export default function StageGroup({
  stage,
  stageDisplay,
  events,
  isAdmin,
  onLinkVideo,
  onUnlinkVideo,
}: StageGroupProps) {
  if (!events || events.length === 0) return null

  return (
    <div className="mb-8">
      {/* Stage header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-p5-red p-2 transform rotate-12 border-2 border-black shadow-[3px_3px_0_0_black]">
          {getStageIcon(stage)}
        </div>
        <div>
          <h3 className="text-lg md:text-xl font-black text-black uppercase italic tracking-tighter"
            style={{ textShadow: '2px 2px 0px #d90614' }}
          >
            {stageDisplay || getStageLabel(stage)}
          </h3>
          <p className="text-[10px] font-black text-gray-400 uppercase italic">
            {events.length} 场赛事 / {events.length} EVENTS
          </p>
        </div>
        <div className="flex-1 border-b-4 border-p5-red ml-2"></div>
      </div>

      {/* Event cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            isAdmin={isAdmin}
            onLinkVideo={onLinkVideo}
            onUnlinkVideo={onUnlinkVideo}
          />
        ))}
      </div>
    </div>
  )
}
