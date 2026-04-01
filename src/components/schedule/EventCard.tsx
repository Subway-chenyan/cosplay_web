import { Calendar, MapPin, Phone, Video, X, ExternalLink } from 'lucide-react'
import { Event, EventVideo } from '../../types'

interface EventCardProps {
  event: Event
  isAdmin?: boolean
  onLinkVideo?: (eventId: string) => void
  onUnlinkVideo?: (eventId: string, videoId: string) => void
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

export default function EventCard({ event, isAdmin, onLinkVideo, onUnlinkVideo }: EventCardProps) {
  const past = isEventPast(event.end_date)

  return (
    <div
      className={`relative group transition-all duration-300 hover:-translate-y-1 ${
        past ? 'opacity-60 grayscale' : ''
      }`}
    >
      {/* Shadow layer */}
      <div className="absolute inset-0 bg-black transform translate-x-1 translate-y-1 -skew-x-1 border border-gray-800 z-0 group-hover:bg-p5-red transition-colors"></div>

      {/* Card body */}
      <div className="relative z-10 bg-white border-2 border-black p-4 flex flex-col h-full">
        {/* Date badge */}
        <div className="flex items-center justify-between mb-2">
          <div className="bg-black text-white px-2 py-0.5 text-xs font-black uppercase italic transform -skew-x-12 inline-flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span className="transform skew-x-12 inline-block">
              {formatDateRange(event.start_date, event.end_date)}
            </span>
          </div>
          {event.stage_display && (
            <span className="text-[10px] font-black uppercase italic text-p5-red border border-p5-red px-1.5 py-0.5 transform -skew-x-6">
              {event.stage_display}
            </span>
          )}
        </div>

        {/* Title */}
        <h4 className="text-sm md:text-base font-black text-black uppercase italic border-b-2 border-p5-red inline-block pr-2 mb-2 leading-tight">
          {event.title}
        </h4>

        {/* Description (location info) */}
        {event.description && (
          <p className="text-xs text-gray-600 mb-2 flex items-start gap-1 italic border-l-2 border-gray-300 pl-2">
            <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-p5-red" />
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
            className="text-xs text-p5-red hover:underline font-bold uppercase italic flex items-center gap-1 mb-2"
            onClick={(e) => e.stopPropagation()}
          >
            <ExternalLink className="w-3 h-3" />
            官方链接
          </a>
        )}

        {/* Videos */}
        {event.videos && event.videos.length > 0 && (
          <div className="mt-auto pt-2 border-t border-gray-200">
            <div className="flex items-center gap-1 mb-1">
              <Video className="w-3 h-3 text-p5-red" />
              <span className="text-[10px] font-black uppercase italic text-gray-500">
                关联视频 / LINKED VIDEOS
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {event.videos.map((v: EventVideo) => (
                <span key={v.id} className="inline-flex items-center group/vid">
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] bg-black text-white px-1.5 py-0.5 font-bold uppercase transform -skew-x-6 hover:bg-p5-red transition-colors inline-flex items-center gap-0.5"
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
              className="text-[10px] font-black uppercase italic bg-p5-red text-white px-2 py-1 transform -skew-x-6 hover:bg-black transition-colors inline-flex items-center gap-1"
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
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-black opacity-10"
          style={{ backgroundImage: 'radial-gradient(#d90614 20%, transparent 20%)', backgroundSize: '4px 4px' }}
        ></div>
      </div>
    </div>
  )
}
