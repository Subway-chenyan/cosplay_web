import { useMemo } from 'react'
import { Event } from '../../types'
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

export default function CompetitionSchedule({
  competitionName,
  events,
  isAdmin,
  onLinkVideo,
  onUnlinkVideo,
}: CompetitionScheduleProps) {
  // Group events by region
  const { hasRegions, regionGroups, eventsWithoutRegion } = useMemo(() => {
    const regions: Record<string, Event[]> = {}
    const noRegion: Event[] = []

    for (const event of events) {
      if (event.region && event.region.trim()) {
        if (!regions[event.region]) {
          regions[event.region] = []
        }
        regions[event.region].push(event)
      } else {
        noRegion.push(event)
      }
    }

    // Sort regions alphabetically
    const sortedRegions = Object.entries(regions).sort(([a], [b]) => a.localeCompare(b, 'zh-CN'))

    return {
      hasRegions: sortedRegions.length > 0,
      regionGroups: sortedRegions,
      eventsWithoutRegion: noRegion,
    }
  }, [events])

  if (!events || events.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-500 font-bold italic">暂无赛程信息 / NO SCHEDULE DATA</p>
      </div>
    )
  }

  return (
    <div>
      {/* Competition name header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 border-b-4 border-black">
          <h3 className="text-lg md:text-2xl font-black text-black uppercase italic inline-block border-b-4 border-p5-red pb-1" style={{ textShadow: '2px 2px 0px #d90614' }}>
            {competitionName}
          </h3>
        </div>
        <div className="bg-black text-white px-3 py-1 text-xs font-black uppercase italic transform -skew-x-12 shadow-[3px_3px_0_0_#d90614]">
          <span className="transform skew-x-12 inline-block">{events.length} 场赛事</span>
        </div>
      </div>

      {/* Region-based layout */}
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
        /* Flat layout: group by stage directly */
        <div>
          {groupByStage(events).map((group) => (
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
  )
}
