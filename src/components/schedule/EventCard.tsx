import { Calendar, MapPin, Phone, Video, X, ExternalLink, CheckCircle, Users } from 'lucide-react'
import { Event, EventVideo } from '../../types'

interface EventCardProps {
  event: Event
  isAdmin?: boolean
  onLinkVideo?: (eventId: string) => void
  onUnlinkVideo?: (eventId: string, videoId: string) => void
  isFinal?: boolean
}

/** Format a date string (YYYY-MM-DD) to "X月X日" */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

/** Format start_date - end_date nicely */
function formatDateRange(start: string, end: string): string {
  const s = formatDate(start)
  const e = formatDate(end)
  if (s === e) return s
  return `${s} - ${e}`
}

/** Check if the event has ended (is in the past) */
function isEventPast(endDate: string): boolean {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(endDate + 'T23:59:59')
  return end < today
}

function getYearMatchedVideos(event: Event): EventVideo[] {
  const eventYear = event.start_date ? new Date(`${event.start_date}T00:00:00`).getFullYear() : null
  return (event.videos || []).filter((video) => !eventYear || !video.year || video.year === eventYear)
}

/** Group videos by team name */
function groupVideosByTeam(videos: EventVideo[]): { team: string; videos: EventVideo[] }[] {
  const groups: Record<string, EventVideo[]> = {}
  const noTeam: EventVideo[] = []

  for (const v of videos) {
    if (v.group_name && v.group_name.trim()) {
      if (!groups[v.group_name]) groups[v.group_name] = []
      groups[v.group_name].push(v)
    } else {
      noTeam.push(v)
    }
  }

  const result = Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b, 'zh-CN'))
    .map(([team, vids]) => ({ team, videos: vids }))

  if (noTeam.length > 0) {
    result.push({ team: '', videos: noTeam })
  }

  return result
}

export default function EventCard({ event, isAdmin, onLinkVideo, onUnlinkVideo, isFinal = false }: EventCardProps) {
  const past = isEventPast(event.end_date)
  const displayVideos = getYearMatchedVideos(event)
  const hasVideos = displayVideos.length > 0

  const borderColor = isFinal ? 'border-amber-600' : 'border-black'
  const accentBorder = isFinal ? 'border-amber-500' : 'border-p5-red'
  const accentText = isFinal ? 'text-amber-600' : 'text-p5-red'
  const shadowHover = isFinal ? 'group-hover:bg-amber-500' : 'group-hover:bg-p5-red'
  const finalGradient = isFinal ? 'bg-gradient-to-br from-amber-50 to-white' : ''

  // Completed event with videos: show as full-width card with prominent video section
  if (past && hasVideos) {
    const teamGroups = groupVideosByTeam(displayVideos)

    return (
      <div className={`relative group transition-all duration-300 ${isFinal ? 'ring-2 ring-amber-400/50' : ''}`}>
        {/* Shadow layer */}
        <div className={`absolute inset-0 bg-black transform translate-x-1.5 translate-y-1.5 -skew-x-1 border ${isFinal ? 'border-amber-800' : 'border-gray-800'} z-0 ${shadowHover} transition-colors`}></div>

        {/* Card body */}
        <div className={`relative z-10 bg-white border-2 ${borderColor} p-5 flex flex-col ${finalGradient}`}>
          {/* Header row: date + status + stage */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={`${isFinal ? 'bg-amber-700' : 'bg-black'} text-white px-2 py-0.5 text-xs font-black italic transform -skew-x-12 inline-flex items-center gap-1`}>
                <Calendar className="w-3 h-3" />
                <span className="transform skew-x-12 inline-block">
                  {formatDateRange(event.start_date, event.end_date)}
                </span>
              </div>
              <div className="bg-green-600 text-white px-2 py-0.5 text-[10px] font-black italic transform -skew-x-6 inline-flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                <span className="transform skew-x-6 inline-block">已结束</span>
              </div>
            </div>
            {event.stage_display && (
              <span className={`text-[10px] font-black italic ${accentText} border ${accentBorder} px-1.5 py-0.5 transform -skew-x-6`}>
                {event.stage_display}
              </span>
            )}
          </div>

          {/* Title */}
          <h4 className={`text-base md:text-lg font-black ${isFinal ? 'text-amber-800' : 'text-black'} italic border-b-2 ${accentBorder} inline-block pr-2 mb-2 leading-tight`}>
            {event.title}
          </h4>

          {/* Description */}
          {event.description && (
            <p className="text-xs text-gray-600 mb-3 flex items-start gap-1 italic border-l-2 border-gray-300 pl-2">
              <MapPin className={`w-3 h-3 mt-0.5 shrink-0 ${accentText}`} />
              <span>{event.description}</span>
            </p>
          )}

          {/* Team Videos Section */}
          <div className="mt-1 pt-3 border-t-2 border-dashed border-gray-300">
            <div className="flex items-center gap-2 mb-3">
              <div className={`${isFinal ? 'bg-amber-500' : 'bg-p5-red'} p-1 transform rotate-12 border border-black`}>
                <Video className="w-3.5 h-3.5 text-white transform -rotate-12" />
              </div>
              <span className="text-xs font-black italic text-black">
                参赛作品
              </span>
              <span className="text-[10px] font-black text-gray-400 italic">
                ({displayVideos.length} 个视频)
              </span>
              <div className="flex-1 border-b border-gray-200"></div>
            </div>

            <div className="space-y-3">
              {teamGroups.map(({ team, videos: teamVideos }) => (
                <div key={team || '_no-team'}>
                  {team && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Users className="w-3 h-3 text-p5-red" />
                      <span className="text-[11px] font-black italic text-p5-red border-b border-p5-red/30">
                        {team}
                      </span>
                    </div>
                  )}
                  <div className={`flex flex-wrap gap-1.5 ${team ? 'pl-5' : ''}`}>
                    {teamVideos.map((v: EventVideo) => (
                      <span key={v.id} className="inline-flex items-center group/vid">
                        <a
                          href={v.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] bg-black text-white px-2 py-0.5 font-bold transform -skew-x-6 hover:bg-p5-red transition-colors inline-flex items-center gap-0.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <span className="transform skew-x-6 inline-block">{v.title || v.bv_number}</span>
                        </a>
                        {isAdmin && onUnlinkVideo && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onUnlinkVideo(event.id, v.id)
                            }}
                            className="w-4 h-4 bg-red-600 text-white flex items-center justify-center text-[8px] ml-0.5 hover:bg-red-800 transition-colors"
                            title="取消关联"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Admin: Link video button */}
          {isAdmin && onLinkVideo && (
            <div className="mt-3">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onLinkVideo(event.id)
                }}
                className="text-[10px] font-black italic bg-p5-red text-white px-2 py-1 transform -skew-x-6 hover:bg-black transition-colors inline-flex items-center gap-1"
              >
                <span className="transform skew-x-6 inline-flex items-center gap-1">
                  <Video className="w-3 h-3" />
                  添加视频
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Default card: upcoming events or completed events without videos (compact)
  return (
    <div
      className={`relative group transition-all duration-300 hover:-translate-y-1 ${
        past ? 'opacity-60 grayscale' : ''
      } ${isFinal ? 'ring-2 ring-amber-400/50' : ''}`}
    >
      {/* Shadow layer */}
      <div className={`absolute inset-0 bg-black transform translate-x-1 translate-y-1 -skew-x-1 border ${isFinal ? 'border-amber-800' : 'border-gray-800'} z-0 ${shadowHover} transition-colors`}></div>

      {/* Card body */}
      <div className={`relative z-10 bg-white border-2 ${borderColor} p-4 flex flex-col h-full ${finalGradient}`}>
        {/* Date badge */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className={`${isFinal ? 'bg-amber-700' : 'bg-black'} text-white px-2 py-0.5 text-xs font-black italic transform -skew-x-12 inline-flex items-center gap-1`}>
              <Calendar className="w-3 h-3" />
              <span className="transform skew-x-12 inline-block">
                {formatDateRange(event.start_date, event.end_date)}
              </span>
            </div>
            {past && (
              <div className="bg-gray-500 text-white px-1.5 py-0.5 text-[10px] font-black italic transform -skew-x-6 inline-flex items-center gap-0.5">
                <CheckCircle className="w-2.5 h-2.5" />
                <span className="transform skew-x-6 inline-block">已结束</span>
              </div>
            )}
          </div>
          {event.stage_display && (
            <span className={`text-[10px] font-black italic ${accentText} border ${accentBorder} px-1.5 py-0.5 transform -skew-x-6`}>
              {event.stage_display}
            </span>
          )}
        </div>

        {/* Title */}
        <h4 className={`text-sm md:text-base font-black ${isFinal ? 'text-amber-800' : 'text-black'} italic border-b-2 ${accentBorder} inline-block pr-2 mb-2 leading-tight`}>
          {event.title}
        </h4>

        {/* Description (location info) */}
        {event.description && (
          <p className="text-xs text-gray-600 mb-2 flex items-start gap-1 italic border-l-2 border-gray-300 pl-2">
            <MapPin className={`w-3 h-3 mt-0.5 shrink-0 ${accentText}`} />
            <span>{event.description}</span>
          </p>
        )}

        {/* Contact */}
        {event.contact && (
          <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
            <Phone className="w-3 h-3 text-gray-400" />
            <span>{event.contact}</span>
          </p>
        )}

        {/* Website */}
        {event.website && (
          <a
            href={event.website}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-p5-red hover:underline font-bold italic flex items-center gap-1 mb-2"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-3 h-3" />
            官方链接
          </a>
        )}

        {/* Videos (compact for upcoming / no-video-past) */}
        {hasVideos && (
          <div className="mt-auto pt-2 border-t border-gray-200">
            <div className="flex items-center gap-1 mb-1">
              <Video className="w-3 h-3 text-p5-red" />
              <span className="text-[10px] font-black italic text-gray-500">
                关联视频
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {displayVideos.map((v: EventVideo) => (
                <span key={v.id} className="inline-flex items-center group/vid">
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] bg-black text-white px-1.5 py-0.5 font-bold transform -skew-x-6 hover:bg-p5-red transition-colors inline-flex items-center gap-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="transform skew-x-6 inline-block">{v.title || v.bv_number}</span>
                  </a>
                  {isAdmin && onUnlinkVideo && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onUnlinkVideo(event.id, v.id)
                      }}
                      className="w-4 h-4 bg-red-600 text-white flex items-center justify-center text-[8px] ml-0.5 hover:bg-red-800 transition-colors"
                      title="取消关联"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Admin: Link video button */}
        {isAdmin && onLinkVideo && (
          <div className="mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onLinkVideo(event.id)
              }}
              className="text-[10px] font-black italic bg-p5-red text-white px-2 py-1 transform -skew-x-6 hover:bg-black transition-colors inline-flex items-center gap-1"
            >
              <span className="transform skew-x-6 inline-flex items-center gap-1">
                <Video className="w-3 h-3" />
                关联视频
              </span>
            </button>
          </div>
        )}

        {/* Decorative bottom dots */}
        <div
          className={`absolute bottom-0 left-0 right-0 h-0.5 ${isFinal ? 'bg-amber-500 opacity-30' : 'bg-black opacity-10'}`}
          style={{ backgroundImage: `radial-gradient(${isFinal ? '#f59e0b' : '#d90614'} 20%, transparent 20%)`, backgroundSize: '4px 4px' }}
        ></div>
      </div>
    </div>
  )
}
