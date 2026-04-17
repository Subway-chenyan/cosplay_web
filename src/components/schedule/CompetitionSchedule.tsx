import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, CheckCircle, Video, ImageIcon, Users, Play } from 'lucide-react'
import { Event, EventVideo } from '../../types'
import RegionAccordion from './RegionAccordion'
import StageGroup from './StageGroup'

interface CompetitionScheduleProps {
  competitionName: string
  events: Event[]
  isAdmin?: boolean
  onLinkVideo?: (eventId: string) => void
  onUnlinkVideo?: (eventId: string, videoId: string) => void
}

/** Order for stage sorting */
const STAGE_ORDER: Record<string, number> = {
  preliminary: 0,
  advancing: 1,
  final: 2,
}

/** Group events by stage */
function groupByStage(events: Event[]): { stage: string; stageDisplay: string; events: Event[] }[] {
  const groups: Record<string, { stageDisplay: string; events: Event[] }> = {}

  for (const event of events) {
    const key = event.stage || 'other'
    if (!groups[key]) {
      groups[key] = { stageDisplay: event.stage_display || '', events: [] }
    }
    groups[key].events.push(event)
  }

  return Object.entries(groups)
    .sort(([a], [b]) => {
      const orderA = STAGE_ORDER[a] ?? 99
      const orderB = STAGE_ORDER[b] ?? 99
      return orderA - orderB
    })
    .map(([stage, data]) => ({
      stage,
      stageDisplay: data.stageDisplay,
      events: data.events,
    }))
}

/** Check if event has ended */
function isEventPast(endDate: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(endDate + 'T23:59:59')
  return end < today
}

/** Format date range */
function formatDateRange(start: string, end: string): string {
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  const fmt = (d: Date) => `${d.getMonth() + 1}月${d.getDate()}日`
  const ss = fmt(s), es = fmt(e)
  return ss === es ? ss : `${ss} - ${es}`
}

/** Full video card linking to /video/:id */
function ScheduleVideoCard({ video }: { video: EventVideo }) {
  const navigate = useNavigate()
  const [imageError, setImageError] = useState(false)

  return (
    <div
      onClick={() => navigate(`/video/${video.id}`)}
      className="relative group cursor-pointer transition-all duration-300 transform hover:-translate-y-1"
    >
      {/* Shadow */}
      <div className="absolute inset-0 bg-black transform translate-x-1 translate-y-1 -skew-x-1 border border-gray-800 z-0 group-hover:bg-p5-red transition-colors"></div>

      {/* Card */}
      <div className="relative z-10 bg-white border-2 border-black h-full flex flex-col overflow-hidden">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden border-b-2 border-black group-hover:border-p5-red transition-colors">
          {video.thumbnail && !imageError ? (
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-full h-full object-cover transition-all duration-500 group-hover:scale-110"
              onError={() => setImageError(true)}
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100">
              <ImageIcon className="w-8 h-8 text-gray-400 mb-1" />
              <span className="text-[10px] text-gray-400 font-bold">NO IMAGE</span>
            </div>
          )}

          {/* Play overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <Play className="w-10 h-10 text-p5-red fill-current transform scale-0 group-hover:scale-110 transition-transform duration-300" />
          </div>

          {/* BV badge */}
          <div className="absolute top-0 right-0 bg-black text-white text-[10px] font-bold px-1.5 py-0.5 transform skew-x-12 origin-top-right border-l border-b border-white">
            <span className="transform -skew-x-12 inline-block">{video.bv_number}</span>
          </div>
        </div>

        {/* Info */}
        <div className="p-2 flex-grow flex flex-col bg-white">
          <h4 className="text-xs font-black text-black leading-tight line-clamp-2 group-hover:text-p5-red transition-colors">
            {video.title || video.bv_number}
          </h4>
          {video.group_name && (
            <div className="mt-auto flex items-center gap-1 pt-1">
              <Users className="w-3 h-3 text-p5-red flex-shrink-0" />
              <span className="text-[10px] text-gray-600 font-bold truncate">{video.group_name}</span>
            </div>
          )}
        </div>

        {/* Bottom strip */}
        <div className="h-1 bg-black w-full" style={{ backgroundImage: 'radial-gradient(circle, #d90614 1px, transparent 1px)', backgroundSize: '4px 4px' }}></div>
      </div>
    </div>
  )
}

export default function CompetitionSchedule({
  competitionName,
  events,
  isAdmin,
  onLinkVideo,
  onUnlinkVideo,
}: CompetitionScheduleProps) {
  const [completedOpen, setCompletedOpen] = useState(true)

  // Split events into completed and upcoming
  const { completedEvents, upcomingEvents } = useMemo(() => {
    const completed: Event[] = []
    const upcoming: Event[] = []

    for (const event of events) {
      if (isEventPast(event.end_date)) {
        completed.push(event)
      } else {
        upcoming.push(event)
      }
    }

    // Completed: most recent first
    completed.sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())

    return { completedEvents: completed, upcomingEvents: upcoming }
  }, [events])

  // Group upcoming events by region
  const { hasRegions, regionGroups, eventsWithoutRegion } = useMemo(() => {
    const regions: Record<string, Event[]> = {}
    const noRegion: Event[] = []

    for (const event of upcomingEvents) {
      if (event.region && event.region.trim()) {
        if (!regions[event.region]) {
          regions[event.region] = []
        }
        regions[event.region].push(event)
      } else {
        noRegion.push(event)
      }
    }

    const isFinalRegion = (name: string) => name.includes('总决赛') || name.includes('final')
    const sortedRegions = Object.entries(regions).sort(([a], [b]) => {
      const aFinal = isFinalRegion(a)
      const bFinal = isFinalRegion(b)
      if (aFinal && !bFinal) return 1
      if (!aFinal && bFinal) return -1
      return a.localeCompare(b, 'zh-CN')
    })

    return {
      hasRegions: sortedRegions.length > 0,
      regionGroups: sortedRegions,
      eventsWithoutRegion: noRegion,
    }
  }, [upcomingEvents])

  // Total video count across completed events
  const totalCompletedVideos = completedEvents.reduce((sum, e) => sum + (e.videos?.length || 0), 0)

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-500 font-bold">暂无赛程信息</p>
      </div>
    )
  }

  return (
    <div>
      {/* Competition name header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 border-b-4 border-p5-red/60">
          <h3 className="text-lg md:text-2xl font-black text-white inline-block border-b-4 border-p5-red pb-1" style={{ textShadow: '2px 2px 0px #000000' }}>
            {competitionName}
          </h3>
        </div>
        <div className="bg-black text-white px-3 py-1 text-xs font-black shadow-[3px_3px_0_0_#d90614]">
          <span>{events.length} 场赛事</span>
        </div>
      </div>

      {/* ========== Completed Events Section (Collapsible) ========== */}
      {completedEvents.length > 0 && (
        <div className="mb-6">
          {/* Accordion header */}
          <button
            onClick={() => setCompletedOpen(!completedOpen)}
            className="w-full text-left relative group/header"
          >
            {/* Shadow */}
            <div className={`absolute inset-0 bg-black ${completedOpen ? 'translate-x-1 translate-y-1' : 'translate-x-0.5 translate-y-0.5'} z-0 transition-all ${completedOpen ? '' : 'group-hover/header:translate-x-1 group-hover/header:translate-y-1'}`}></div>

            {/* Header bar */}
            <div className={`relative z-10 flex items-center justify-between border-2 border-black px-4 py-3 transition-colors ${completedOpen ? 'bg-green-700 text-white' : 'bg-white text-black group-hover/header:bg-gray-100'}`}>
              <div className="flex items-center gap-3">
                <CheckCircle className={`w-4 h-4 ${completedOpen ? 'text-white' : 'text-green-600'}`} />
                <span className="font-black text-sm md:text-base">
                  已完成赛事
                </span>
                <span className={`text-xs font-black px-2 py-0.5 ${completedOpen ? 'bg-white text-green-700' : 'bg-green-700 text-white'}`}>
                  <span>{completedEvents.length} 场</span>
                </span>
                {totalCompletedVideos > 0 && (
                  <span className="text-xs font-bold flex items-center gap-1 opacity-80">
                    <Video className="w-3 h-3" />
                    {totalCompletedVideos} 个视频
                  </span>
                )}
              </div>
              <div>
                <ChevronDown className={`w-5 h-5 transition-transform duration-300 ${completedOpen ? 'rotate-180' : ''}`} />
              </div>
            </div>
          </button>

          {/* Accordion content */}
          <div className={`overflow-hidden transition-all duration-300 ${completedOpen ? 'max-h-[10000px] opacity-100' : 'max-h-0 opacity-0'}`}>
            <div className="bg-white border-2 border-black border-t-0 p-4 md:p-6">
              {completedEvents.map((event) => (
                <div key={event.id} className="mb-6 last:mb-0">
                  {/* Event header */}
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <div className="bg-black text-white px-2 py-0.5 text-xs font-black inline-flex items-center gap-1">
                      <span>
                        {formatDateRange(event.start_date, event.end_date)}
                      </span>
                    </div>
                    <h4 className="text-sm md:text-base font-black text-black">
                      {event.title}
                    </h4>
                    {event.stage_display && (
                      <span className="text-[10px] font-black text-p5-red border border-p5-red px-1.5 py-0.5">
                        {event.stage_display}
                      </span>
                    )}
                  </div>

                  {/* Video cards grid */}
                  {event.videos && event.videos.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {event.videos.map((v: EventVideo) => (
                        <ScheduleVideoCard key={v.id} video={v} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 italic pl-2 border-l-2 border-gray-200">
                      暂无参赛视频
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========== Upcoming / Region Events Section ========== */}
      {upcomingEvents.length > 0 && (
        <>
          {hasRegions ? (
            <div>
              {regionGroups.map(([region, regionEvents], idx) => (
                <RegionAccordion
                  key={region}
                  region={region}
                  events={regionEvents}
                  isAdmin={isAdmin}
                  onLinkVideo={onLinkVideo}
                  onUnlinkVideo={onUnlinkVideo}
                  defaultOpen={idx === 0}
                  isFinal={region.includes('总决赛') || region.toLowerCase().includes('final')}
                />
              ))}

              {/* Events without region */}
              {eventsWithoutRegion.length > 0 && (
                <div className="mt-4">
                  {groupByStage(eventsWithoutRegion).map((group) => (
                    <StageGroup
                      key={group.stage}
                      stage={group.stage}
                      stageDisplay={group.stageDisplay}
                      events={group.events}
                      isAdmin={isAdmin}
                      onLinkVideo={onLinkVideo}
                      onUnlinkVideo={onUnlinkVideo}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              {groupByStage(upcomingEvents).map((group) => (
                <StageGroup
                  key={group.stage}
                  stage={group.stage}
                  stageDisplay={group.stageDisplay}
                  events={group.events}
                  isAdmin={isAdmin}
                  onLinkVideo={onLinkVideo}
                  onUnlinkVideo={onUnlinkVideo}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
