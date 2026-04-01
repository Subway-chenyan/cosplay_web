import { useState, useEffect, useMemo } from 'react'
import { eventService } from '../../services/eventService'
import { authService } from '../../services/authService'
import { Event } from '../../types'
import CompetitionSchedule from './CompetitionSchedule'
import VideoLinkModal from './VideoLinkModal'
import { Calendar, Loader2, AlertTriangle, ChevronDown } from 'lucide-react'

export default function ScheduleTab() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)

  // Competition filter
  const [selectedCompetition, setSelectedCompetition] = useState<string>('all')

  // Video link modal state
  const [linkModalEventId, setLinkModalEventId] = useState<string | null>(null)

  // Check admin status
  useEffect(() => {
    const checkAdmin = async () => {
      if (authService.isAuthenticated()) {
        try {
          const user = await authService.getCurrentUser()
          setIsAdmin(user.is_staff || user.is_superuser)
        } catch {
          setIsAdmin(false)
        }
      }
    }
    checkAdmin()
  }, [])

  // Load events
  useEffect(() => {
    const loadEvents = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await eventService.getActiveEvents()
        setEvents(data)
      } catch {
        setError('加载赛程失败，请稍后重试 / FAILED TO LOAD SCHEDULE')
      } finally {
        setLoading(false)
      }
    }
    loadEvents()
  }, [])

  // Group events by competition
  const competitionGroups = useMemo(() => {
    const groups: Record<string, { name: string; events: Event[] }> = {}

    for (const event of events) {
      const compId = event.competition || 'unknown'
      if (!groups[compId]) {
        groups[compId] = { name: event.competition_name || '未知赛事', events: [] }
      }
      groups[compId].events.push(event)
    }

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b, 'zh-CN'))
  }, [events])

  // Handle video linking
  const handleLinkVideo = (eventId: string) => {
    setLinkModalEventId(eventId)
  }

  const handleUnlinkVideo = async (eventId: string, videoId: string) => {
    try {
      const updated = await eventService.unlinkVideo(eventId, videoId)
      setEvents((prev) => prev.map((e) => (e.id === eventId ? updated : e)))
    } catch {
      // silently fail for now
    }
  }

  const handleVideoLink = async (eventId: string, videoId: string) => {
    try {
      const updated = await eventService.linkVideo(eventId, videoId)
      setEvents((prev) => prev.map((e) => (e.id === eventId ? updated : e)))
      setLinkModalEventId(null)
    } catch {
      // silently fail for now
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-p5-red transform translate-x-2 translate-y-2 -skew-x-3 border-2 border-black z-0"></div>
            <div className="relative z-10 bg-white border-4 border-black p-6 transform -skew-x-3">
              <Loader2 className="w-10 h-10 text-p5-red animate-spin" />
            </div>
          </div>
          <p className="text-sm font-black uppercase italic text-gray-600">
            正在加载赛程 / LOADING SCHEDULE...
          </p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center max-w-md">
          <div className="relative inline-block mb-6">
            <div className="absolute inset-0 bg-black transform translate-x-2 translate-y-2 -skew-x-3 border-2 border-gray-800 z-0"></div>
            <div className="relative z-10 bg-white border-4 border-black p-6 transform -skew-x-3">
              <AlertTriangle className="w-10 h-10 text-p5-red" />
            </div>
          </div>
          <p className="text-sm font-black uppercase italic text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-p5-red text-white px-6 py-2 font-black uppercase italic transform -skew-x-12 hover:bg-black transition-colors shadow-[4px_4px_0_0_black]"
          >
            <span className="transform skew-x-12 inline-block">重新加载 / RETRY</span>
          </button>
        </div>
      </div>
    )
  }

  // Empty state
  if (events.length === 0) {
    return (
      <div className="relative p-12 text-center overflow-hidden">
        <div className="absolute inset-0 bg-black transform -skew-y-1 z-0 border-y-8 border-p5-red shadow-2xl"></div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="bg-white p-5 transform rotate-12 border-4 border-black shadow-[6px_6px_0_0_#d90614] mb-6">
            <Calendar className="w-14 h-14 text-black transform -rotate-12" />
          </div>
          <h3 className="text-xl md:text-3xl font-black text-white uppercase italic tracking-tighter mb-3" style={{ textShadow: '4px 4px 0px #d90614' }}>
            暂无赛程 / NO SCHEDULE
          </h3>
          <p className="bg-p5-red text-white px-6 py-1 font-black uppercase italic transform -skew-x-12 border-2 border-white text-sm">
            当前没有活跃赛事 / NO ACTIVE EVENTS
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Section header */}
      <div className="relative group">
        <div className="absolute inset-0 bg-black transform translate-x-2 translate-y-2 -skew-x-1 z-0"></div>
        <div className="relative z-10 bg-white border-4 border-black p-6 transform -skew-x-1">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transform skew-x-1">
            <div className="flex items-center gap-3">
              <div className="bg-p5-red p-2 transform rotate-12 border-2 border-black">
                <Calendar className="w-6 h-6 text-white transform -rotate-12" />
              </div>
              <h2 className="text-xl md:text-2xl font-black text-black uppercase italic tracking-tighter" style={{ textShadow: '2px 2px 0px #d90614' }}>
                赛程总览 / SCHEDULE OVERVIEW
              </h2>
            </div>

            {/* Competition selector */}
            {competitionGroups.length > 1 && (
              <div className="relative">
                <select
                  value={selectedCompetition}
                  onChange={(e) => setSelectedCompetition(e.target.value)}
                  className="appearance-none bg-black text-white border-2 border-p5-red px-4 py-2 pr-8 font-black uppercase italic text-xs focus:outline-none cursor-pointer"
                >
                  <option value="all">全部赛事 / ALL</option>
                  {competitionGroups.map(([id, group]) => (
                    <option key={id} value={id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-p5-red pointer-events-none" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Competition schedules */}
      {competitionGroups
        .filter(([id]) => selectedCompetition === 'all' || selectedCompetition === id)
        .map(([id, group]) => (
          <CompetitionSchedule
            key={id}
            competitionName={group.name}
            events={group.events}
            isAdmin={isAdmin}
            onLinkVideo={handleLinkVideo}
            onUnlinkVideo={handleUnlinkVideo}
          />
        ))}

      {/* Total count */}
      <div className="text-center">
        <div className="inline-block bg-black text-white px-4 py-1 transform -skew-x-12 border-2 border-p5-red shadow-[4px_4px_0_0_black]">
          <span className="transform skew-x-12 inline-block font-black italic uppercase tracking-tighter text-xs">
            共 <span className="text-p5-red">{events.length}</span> 场活跃赛事 / ACTIVE EVENTS
          </span>
        </div>
      </div>

      {/* Video link modal */}
      <VideoLinkModal
        eventId={linkModalEventId || ''}
        isOpen={!!linkModalEventId}
        onClose={() => setLinkModalEventId(null)}
        onLink={handleVideoLink}
      />
    </div>
  )
}
