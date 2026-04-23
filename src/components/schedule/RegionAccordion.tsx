import { useState } from 'react'
import { ChevronDown, MapPin } from 'lucide-react'
import { Event } from '../../types'
import StageGroup from './StageGroup'

interface RegionAccordionProps {
  region: string
  events: Event[]
  isAdmin?: boolean
  onLinkVideo?: (eventId: string) => void
  onUnlinkVideo?: (eventId: string, videoId: string) => void
  defaultOpen?: boolean
  isFinal?: boolean
}

/** Order for stage sorting */
const STAGE_ORDER: Record<string, number> = {
  preliminary: 0,
  advancing: 1,
  final: 2,
}

/** Group events by stage, ordered: preliminary -> advancing -> final */
function groupByStage(events: Event[]): { stage: string; stageDisplay: string; events: Event[] }[] {
  const groups: Record<string, { stageDisplay: string; events: Event[] }> = {}

  for (const event of events) {
    const key = event.stage || 'other'
    if (!groups[key]) {
      groups[key] = { stageDisplay: event.stage_display || '', events: [] }
    }
    groups[key].events.push(event)
  }

  // Sort by stage order
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

export default function RegionAccordion({
  region,
  events,
  isAdmin,
  onLinkVideo,
  onUnlinkVideo,
  defaultOpen = false,
  isFinal = false,
}: RegionAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const stageGroups = groupByStage(events)

  // Final uses gold/amber theme, normal uses red theme
  const accentBg = isFinal ? 'bg-amber-500' : 'bg-p5-red'
  const accentText = isFinal ? 'text-amber-500' : 'text-p5-red'
  const hoverBg = isFinal ? 'group-hover/header:bg-amber-50' : 'group-hover/header:bg-gray-100'
  const badgeBg = isFinal ? 'bg-amber-500' : 'bg-black'

  return (
    <div className={`mb-4 ${isFinal ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-white' : ''}`}>
      {/* Accordion header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-left relative group/header"
      >
        {/* Shadow */}
        <div className={`absolute inset-0 bg-black transform ${isOpen ? 'translate-x-1 translate-y-1' : 'translate-x-0.5 translate-y-0.5'} -skew-x-2 z-0 transition-all ${isOpen ? '' : 'group-hover/header:translate-x-1 group-hover/header:translate-y-1'}`}></div>

        {/* Header bar */}
        <div className={`relative z-10 flex items-center justify-between border-2 ${isFinal ? 'border-amber-700' : 'border-black'} px-4 py-3 transform -skew-x-2 transition-colors ${isOpen ? `${accentBg} text-white` : `bg-white text-black ${hoverBg}`}`}>
          <div className="flex items-center gap-3 transform skew-x-2">
            <MapPin className={`w-4 h-4 ${isOpen ? 'text-white' : accentText}`} />
            <span className={`font-black italic text-sm md:text-base ${isFinal ? 'tracking-wider' : ''}`}>
              {region}
            </span>
            <span className={`text-xs font-black italic px-2 py-0.5 transform -skew-x-12 ${isOpen ? `bg-white ${accentText}` : `${badgeBg} text-white`}`}>
              <span className="transform skew-x-12 inline-block">{events.length} 场</span>
            </span>
          </div>
          <div className="transform skew-x-2">
            <ChevronDown
              className={`w-5 h-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
            />
          </div>
        </div>
      </button>

      {/* Accordion content */}
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className={`bg-white border-2 ${isFinal ? 'border-amber-700' : 'border-black'} border-t-0 p-4 md:p-6 ${isFinal ? 'bg-gradient-to-b from-amber-50 to-white' : ''}`}>
          {stageGroups.map((group) => (
            <StageGroup
              key={group.stage}
              stage={group.stage}
              stageDisplay={group.stageDisplay}
              events={group.events}
              isAdmin={isAdmin}
              onLinkVideo={onLinkVideo}
              onUnlinkVideo={onUnlinkVideo}
              isFinal={isFinal}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
