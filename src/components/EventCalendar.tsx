import React, { useState, useEffect } from 'react'
import { Event } from '../types'
import { eventService } from '../services/eventService'

interface EventCalendarProps {
  className?: string
}

const EventCalendar: React.FC<EventCalendarProps> = ({ className = '' }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([])

  // 颜色映射函数 - 根据比赛名称生成一致的颜色
  const getCompetitionColor = (competitionName: string) => {
    const colors = [
      { bg: 'bg-blue-100', text: 'text-blue-800', hover: 'hover:bg-blue-200' },
      { bg: 'bg-green-100', text: 'text-green-800', hover: 'hover:bg-green-200' },
      { bg: 'bg-purple-100', text: 'text-purple-800', hover: 'hover:bg-purple-200' },
      { bg: 'bg-red-100', text: 'text-red-800', hover: 'hover:bg-red-200' },
      { bg: 'bg-yellow-100', text: 'text-yellow-800', hover: 'hover:bg-yellow-200' },
      { bg: 'bg-indigo-100', text: 'text-indigo-800', hover: 'hover:bg-indigo-200' },
      { bg: 'bg-pink-100', text: 'text-pink-800', hover: 'hover:bg-pink-200' },
      { bg: 'bg-teal-100', text: 'text-teal-800', hover: 'hover:bg-teal-200' },
      { bg: 'bg-orange-100', text: 'text-orange-800', hover: 'hover:bg-orange-200' },
      { bg: 'bg-cyan-100', text: 'text-cyan-800', hover: 'hover:bg-cyan-200' }
    ]

    // 使用比赛名称的哈希值来确保相同比赛总是使用相同颜色
    let hash = 0
    for (let i = 0; i < competitionName.length; i++) {
      const char = competitionName.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // 转换为32位整数
    }

    return colors[Math.abs(hash) % colors.length]
  }

  // 获取当前月份的赛事
  const fetchEvents = async (date: Date) => {
    setLoading(true)
    try {
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const eventData = await eventService.getEventsByMonth(year, month)
      setEvents(eventData)
    } catch (error) {
      console.error('获取赛事数据失败:', error)
      setEvents([])
    } finally {
      setLoading(false)
    }
  }

  // 获取即将到来的事件
  const fetchUpcomingEvents = async () => {
    try {
      const today = new Date()
      const nextMonth = new Date(today.getFullYear(), today.getMonth() + 2, 0) // 获取下个月的最后一天

      // 获取当前月和下个月的事件
      const currentMonthEvents = await eventService.getEventsByMonth(today.getFullYear(), today.getMonth() + 1)
      const nextMonthEvents = await eventService.getEventsByMonth(nextMonth.getFullYear(), nextMonth.getMonth() + 1)

      const allEvents = [...currentMonthEvents, ...nextMonthEvents]

      // 筛选从今天开始的事件并按日期排序
      const upcoming = allEvents
        .filter(event => new Date(event.date) >= today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(0, 10) // 只显示前10个事件

      setUpcomingEvents(upcoming)
    } catch (error) {
      console.error('获取即将到来的赛事失败:', error)
      setUpcomingEvents([])
    }
  }

  useEffect(() => {
    fetchEvents(currentDate)
  }, [currentDate])

  useEffect(() => {
    fetchUpcomingEvents()
  }, [])

  // 获取月份的第一天和最后一天
  const getMonthInfo = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay()) // 从周日开始

    return { firstDay, lastDay, startDate }
  }

  // 生成日历网格
  const generateCalendarDays = () => {
    const { startDate } = getMonthInfo(currentDate)
    const days = []
    const currentDateObj = new Date(startDate)

    for (let i = 0; i < 42; i++) { // 6周 * 7天
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.date)
        return eventDate.toDateString() === currentDateObj.toDateString()
      })

      days.push({
        date: new Date(currentDateObj),
        isCurrentMonth: currentDateObj.getMonth() === currentDate.getMonth(),
        isToday: currentDateObj.toDateString() === new Date().toDateString(),
        events: dayEvents
      })

      currentDateObj.setDate(currentDateObj.getDate() + 1)
    }

    return days
  }

  // 切换月份
  const changeMonth = (delta: number) => {
    const newDate = new Date(currentDate)
    newDate.setMonth(newDate.getMonth() + delta)
    setCurrentDate(newDate)
  }

  // 格式化月份年份
  const formatMonthYear = (date: Date) => {
    return `${date.getFullYear()}年${date.getMonth() + 1}月`
  }

  // 格式化日期显示
  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.toDateString() === today.toDateString()) {
      return '今天'
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return '明天'
    } else {
      return `${date.getMonth() + 1}月${date.getDate()}日`
    }
  }

  const calendarDays = generateCalendarDays()
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div className={`relative group ${className}`}>
      {/* 装饰性背景层 */}
      <div className="absolute inset-0 bg-black transform translate-x-2 translate-y-2 -skew-x-1 z-0 shadow-lg"></div>

      <div className="relative z-10 bg-white border-4 border-black p-6 md:p-10 transform -skew-x-1 overflow-hidden">
        {/* 背景装饰 - 波点 */}
        <div className="absolute bottom-0 left-0 w-64 h-64 p5-halftone opacity-5 rotate-45 -translate-x-32 translate-y-32 pointer-events-none"></div>

        {/* 日历头部 */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 transform skew-x-1 border-b-8 border-black pb-6">
          <div className="flex items-center space-x-6 mb-4 md:mb-0">
            <div className="bg-black p-4 transform -rotate-12 border-4 border-p5-red shadow-[4px_4px_0_0_black]">
              <span className="text-4xl font-black text-white italic tracking-tighter">赛事日历 / EVENT CALENDAR</span>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <button
              onClick={() => changeMonth(-1)}
              className="group/btn relative"
              disabled={loading}
            >
              <div className="bg-black p-3 transform -skew-x-12 border-2 border-white hover:bg-p5-red transition-all">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" />
                </svg>
              </div>
            </button>

            <div className="bg-black px-8 py-3 transform skew-x-12 border-4 border-p5-red shadow-[4px_4px_0_0_black]">
              <span className="text-2xl font-black text-white italic uppercase tracking-tighter transform -skew-x-12 inline-block">
                {formatMonthYear(currentDate)}
              </span>
            </div>

            <button
              onClick={() => changeMonth(1)}
              className="group/btn relative"
              disabled={loading}
            >
              <div className="bg-black p-3 transform skew-x-12 border-2 border-white hover:bg-p5-red transition-all">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>

        {/* 星期标题 */}
        <div className="grid grid-cols-7 gap-2 mb-4 transform skew-x-1">
          {weekDays.map(day => (
            <div key={day} className="bg-black py-2 text-center text-xs font-black text-white italic uppercase transform -skew-x-12 border border-p5-red">
              <span className="transform skew-x-12 inline-block">{day}</span>
            </div>
          ))}
        </div>

        {/* 日历网格 */}
        <div className="grid grid-cols-7 gap-2 mb-12 transform skew-x-1">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              className={`
                min-h-[120px] p-3 border-2 border-black transform -skew-x-1 transition-all relative overflow-hidden group/day
                ${!day.isCurrentMonth ? 'bg-gray-100 opacity-40' : 'bg-white hover:bg-black hover:border-p5-red hover:-translate-y-1'}
                ${day.isToday ? 'bg-p5-red/10 border-p5-red ring-2 ring-p5-red ring-inset' : ''}
              `}
            >
              {day.isToday && (
                <div className="absolute top-0 right-0 bg-p5-red text-white text-[10px] font-black px-2 py-0.5 z-10 transform -rotate-12 translate-x-1">
                  今日 / TODAY
                </div>
              )}

              <div className={`
                text-xl font-black italic mb-3 transition-colors group-hover/day:text-white
                ${day.isToday ? 'text-p5-red text-2xl scale-110 origin-top-left' : 'text-black'}
                ${!day.isCurrentMonth ? 'text-gray-400' : ''}
              `}>
                {day.date.getDate()}
              </div>

              {/* 赛事列表 */}
              <div className="space-y-1.5 relative z-10">
                {day.events.slice(0, 2).map(event => {
                  return (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="text-[10px] bg-black text-white px-2 py-1 font-black italic uppercase tracking-tighter truncate border-l-4 border-p5-red hover:bg-p5-red transition-colors cursor-pointer"
                      title={`${event.title} - ${event.competition_name}`}
                    >
                      {event.title}
                    </div>
                  )
                })}
                {day.events.length > 2 && (
                  <div className="text-[10px] font-black text-gray-500 italic bg-gray-100 px-2 group-hover/day:text-p5-red transition-colors">
                    +{day.events.length - 2} 更多情报 / MORE INTEL
                  </div>
                )}
              </div>

              {/* 背景装饰数字 - 隐约可见 */}
              <div className="absolute -bottom-4 -right-2 text-6xl font-black text-gray-200 opacity-20 pointer-events-none group-hover/day:text-p5-red group-hover/day:opacity-10 transition-colors">
                {day.date.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* 即将到来的赛事列表 */}
        <div className="border-t-4 border-black pt-10 transform skew-x-1">
          <div className="flex items-center space-x-4 mb-8">
            <div className="bg-p5-red p-2 transform -rotate-6 border-2 border-black">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-3xl font-black text-black uppercase italic tracking-tighter">历战档案 / UPCOMING INTEL</h3>
              <p className="text-xs font-black text-p5-red uppercase italic">目标已锁定 / TARGETS IDENTIFIED</p>
            </div>
          </div>

          {upcomingEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {upcomingEvents.map(event => {
                return (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className="group/upcoming relative"
                  >
                    <div className="absolute inset-0 bg-black transform translate-x-1 translate-y-1 -skew-x-2 z-0 opacity-0 group-hover/upcoming:opacity-100 transition-opacity"></div>
                    <div className="relative z-10 flex items-stretch bg-white border-2 border-black transform -skew-x-2 transition-all group-hover/upcoming:-translate-y-1 cursor-pointer">
                      <div className="w-24 bg-black flex flex-col items-center justify-center p-3 text-white border-r-2 border-p5-red">
                        <span className="text-sm font-black italic tracking-tighter uppercase opacity-60">
                          {new Date(event.date).toLocaleDateString('zh-CN', { month: 'short' }).toUpperCase()}
                        </span>
                        <span className="text-3xl font-black italic tracking-tighter leading-none">
                          {new Date(event.date).getDate()}
                        </span>
                      </div>
                      <div className="flex-1 p-4 bg-white overflow-hidden">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="bg-p5-red text-white text-[10px] font-black italic px-2 py-0.5 transform -skew-x-12">
                            {event.competition_name}
                          </span>
                        </div>
                        <h4 className="font-black text-black text-xl italic uppercase tracking-tighter line-clamp-1">{event.title}</h4>
                        {event.description && (
                          <p className="text-xs font-bold text-gray-500 mt-2 line-clamp-1 italic border-l-2 border-black pl-2 leading-none">
                            {event.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="relative p-12 text-center group/empty">
              <div className="p5-halftone absolute inset-0 opacity-10"></div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="bg-gray-100 p-6 rounded-full transform -rotate-12 border-2 border-dashed border-gray-300 mb-6">
                  <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h4 className="text-2xl font-black text-gray-400 uppercase italic tracking-tighter">未截获情报 / NO INTEL SECURED</h4>
                <p className="text-sm font-bold text-gray-300 italic mt-2">区域活动未知 / TARGETS UNKNOWN</p>
              </div>
            </div>
          )}
        </div>

        {/* 加载状态 */}
        {loading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">加载中...</span>
            </div>
          </div>
        )}

        {/* 赛事详情弹窗 */}
        {selectedEvent && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <div className="relative w-full max-w-2xl group/modal">
              {/* 装饰层 */}
              <div className="absolute inset-0 bg-p5-red transform translate-x-3 translate-y-3 -skew-x-2 z-0 shadow-2xl"></div>

              <div className="relative z-10 bg-white border-4 border-black p-8 md:p-12 transform -skew-x-2 overflow-hidden">
                {/* 背景波点 */}
                <div className="absolute top-0 right-0 w-64 h-64 p5-halftone opacity-5 rotate-12 translate-x-16 -translate-y-16 pointer-events-none"></div>

                <div className="relative z-10 transform skew-x-2">
                  <div className="flex justify-between items-start mb-8 border-b-4 border-black pb-4">
                    <div className="flex-1">
                      <div className="bg-black inline-block px-4 py-1 transform -skew-x-12 mb-4">
                        <span className="text-sm font-black text-white italic uppercase tracking-tighter">情报确认 / TARGET IDENTIFIED</span>
                      </div>
                      <h3 className="text-4xl font-black text-black uppercase italic tracking-tighter leading-none break-words" style={{ textShadow: '2px 2px 0px #d90614' }}>
                        {selectedEvent.title}
                      </h3>
                    </div>
                    <button
                      onClick={() => setSelectedEvent(null)}
                      className="bg-black text-white p-2 transform rotate-12 hover:bg-p5-red transition-all border-2 border-black ml-4"
                    >
                      <X className="w-8 h-8" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="bg-gray-100 p-4 border-l-8 border-black transform -skew-x-2">
                        <p className="text-[10px] font-black text-p5-red uppercase italic mb-1">执行日期 / EXECUTION DATE</p>
                        <p className="text-xl font-black italic">{selectedEvent.date}</p>
                      </div>

                      <div className="bg-gray-100 p-4 border-l-8 border-p5-red transform skew-x-2">
                        <p className="text-[10px] font-black text-black uppercase italic mb-1">所属档案 / BATTLE ARCHIVE</p>
                        <p className="text-xl font-black italic">{selectedEvent.competition_name}</p>
                      </div>

                      {selectedEvent.description && (
                        <div className="border-2 border-black p-4 bg-white shadow-[4px_4px_0_0_black]">
                          <p className="text-[10px] font-black text-black uppercase italic mb-2 border-b border-black inline-block">情报摘要 / INTEL BRIEF</p>
                          <p className="text-sm font-bold text-gray-800 leading-relaxed italic">{selectedEvent.description}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-6">
                      {selectedEvent.contact && (
                        <div className="flex items-center space-x-4 bg-black text-white p-4 transform rotate-1 shadow-[4px_4px_0_0_#d90614]">
                          <div className="bg-p5-red p-2 transform -rotate-12 border border-white">
                            <Users className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-p5-red uppercase italic">联络渠道 / CONTACT</p>
                            <p className="text-sm font-black">{selectedEvent.contact}</p>
                          </div>
                        </div>
                      )}

                      {selectedEvent.website && (
                        <a
                          href={selectedEvent.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center space-x-4 bg-white border-4 border-black p-4 transform -rotate-1 hover:border-p5-red transition-all group/link"
                        >
                          <div className="bg-black p-2 transform rotate-12 border border-white group-hover/link:bg-p5-red">
                            <ExternalLink className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-black uppercase italic group-hover/link:text-p5-red">官方来源 / SOURCE</p>
                            <p className="text-sm font-black truncate max-w-[150px]">{selectedEvent.website}</p>
                          </div>
                        </a>
                      )}

                      {selectedEvent.promotional_image && (
                        <div className="relative group/poster">
                          <div className="absolute inset-0 bg-p5-red transform translate-x-2 translate-y-2 z-0"></div>
                          <img
                            src={selectedEvent.promotional_image}
                            alt={selectedEvent.title}
                            className="relative z-10 w-full h-auto border-4 border-black grayscale group-hover/poster:grayscale-0 transition-all font-black"
                            onError={(e) => {
                              (e.target as HTMLImageElement).parentElement?.style.setProperty('display', 'none')
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default EventCalendar