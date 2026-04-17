import { Swords, Target, Trophy, Flag, Crown } from 'lucide-react'
import { Event } from '../../types'
import EventCard from './EventCard'

interface StageGroupProps {
  stage: string
  stageDisplay: string
  events: Event[]
  isAdmin?: boolean
  onLinkVideo?: (eventId: string) => void
  onUnlinkVideo?: (eventId: string, videoId: string) => void
  isFinal?: boolean
}

function getStageIcon(stage: string, isFinal?: boolean) {
  if (isFinal) return <Crown className="w-5 h-5 text-white" />
  switch (stage) {
    case 'preliminary':
      return <Swords className="w-5 h-5 text-white" />
    case 'advancing':
      return <Target className="w-5 h-5 text-white" />
    case 'final':
      return <Trophy className="w-5 h-5 text-white" />
    default:
      return <Flag className="w-5 h-5 text-white" />
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

/** Check if the event has ended */
function isEventPast(endDate: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(endDate + 'T23:59:59')
  return end < today
}

export default function StageGroup({
  stage,
  stageDisplay,
  events,
  isAdmin,
  onLinkVideo,
  onUnlinkVideo,
  isFinal = false,
}: StageGroupProps) {
  if (!events || events.length === 0) return null

  const iconBg = isFinal ? 'bg-amber-500' : 'bg-p5-red'
  const borderAccent = isFinal ? 'border-amber-500' : 'border-p5-red'

  // Sort: completed events first (sorted by end_date desc), then upcoming (sorted by start_date asc)
  const sortedEvents = [...events].sort((a, b) => {
    const aPast = isEventPast(a.end_date)
    const bPast = isEventPast(b.end_date)
    if (aPast && !bPast) return -1
    if (!aPast && bPast) return 1
    // Both past: most recent first
    if (aPast && bPast) return new Date(b.end_date).getTime() - new Date(a.end_date).getTime()
    // Both upcoming: soonest first
    return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  })

  // Separate completed and upcoming for layout
  const completedEvents = sortedEvents.filter((e) => isEventPast(e.end_date))
  const upcomingEvents = sortedEvents.filter((e) => !isEventPast(e.end_date))

  return (
    <div className="mb-8">
      {/* Stage header */}
      <div className="flex items-center gap-3 mb-4">
        <div className={`${iconBg} p-2 border-2 border-black shadow-[3px_3px_0_0_black]`}>
          {getStageIcon(stage, isFinal)}
        </div>
        <div>
          <h3 className={`text-lg md:text-xl font-black uppercase italic tracking-tighter ${isFinal ? 'text-amber-700' : 'text-black'}`}
            style={{ textShadow: isFinal ? '1px 1px 0px rgba(0,0,0,0.15)' : '1px 1px 0px rgba(217,6,20,0.15)' }}
          >
            {stageDisplay || getStageLabel(stage)}
          </h3>
          <p className="text-[10px] font-black text-gray-500 uppercase italic">
            {events.length} 场赛事
          </p>
        </div>
        <div className={`flex-1 border-b-4 ${borderAccent} ml-2 opacity-80`}></div>
      </div>

      {/* Completed events: full-width single column for better video display */}
      {completedEvents.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px flex-1 bg-gray-300"></div>
            <span className="text-[10px] font-black uppercase italic text-gray-500 px-2">
              已完成（{completedEvents.length}）
            </span>
            <div className="h-px flex-1 bg-gray-300"></div>
          </div>
          <div className="space-y-4">
            {completedEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isAdmin={isAdmin}
                onLinkVideo={onLinkVideo}
                onUnlinkVideo={onUnlinkVideo}
                isFinal={isFinal}
              />
            ))}
          </div>
        </div>
      )}

      {/* Upcoming events: compact grid */}
      {upcomingEvents.length > 0 && (
        <div>
          {completedEvents.length > 0 && (
            <div className="flex items-center gap-2 mb-3">
              <div className="h-px flex-1 bg-gray-300"></div>
              <span className="text-[10px] font-black uppercase italic text-gray-500 px-2">
                即将开始（{upcomingEvents.length}）
              </span>
              <div className="h-px flex-1 bg-gray-300"></div>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingEvents.map((event) => (
              <EventCard
                key={event.id}
                event={event}
                isAdmin={isAdmin}
                onLinkVideo={onLinkVideo}
                onUnlinkVideo={onUnlinkVideo}
                isFinal={isFinal}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
