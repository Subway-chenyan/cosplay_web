import React, { useState, useEffect } from 'react'
import { Event } from '../types'
import { eventService } from '../services/eventService'
import { X as XIcon, ExternalLink, Users } from 'lucide-react'

interface EventCalendarProps {
  className?: string
}

const EventCalendar: React.FC<EventCalendarProps> = ({ className = '' }) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

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

  useEffect(() => {
    fetchEvents(currentDate)
  }, [currentDate])

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
      const checkDate = new Date(currentDateObj)
      checkDate.setHours(0,0,0,0)
      
      const dayEvents = events.filter(event => {
        const start = new Date(event.start_date)
        const end = new Date(event.end_date)
        start.setHours(0,0,0,0)
        end.setHours(0,0,0,0)
        return checkDate >= start && checkDate <= end
      }).sort((a, b) => {
        const startA = new Date(a.start_date).getTime()
        const startB = new Date(b.start_date).getTime()
        if (startA !== startB) return startA - startB
        const endA = new Date(a.end_date).getTime()
        const endB = new Date(b.end_date).getTime()
        if (endA !== endB) return endB - endA // longer events first
        return a.id.localeCompare(b.id)
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
      setSelectedDate(null)
    }
  
    // 格式化月份年份
    const formatMonthYear = (date: Date) => {
      return `${date.getFullYear()}年${date.getMonth() + 1}月`
    }
  
  
    const calendarDays = generateCalendarDays()
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div className={`relative group ${className}`}>
      {/* 装饰性背景层 */}
      <div className="absolute inset-0 bg-black transform translate-x-2 translate-y-2 z-0 shadow-lg"></div>

      <div className="relative z-10 bg-white border-4 border-black p-6 md:p-10 overflow-hidden">
        {/* 背景装饰 - 波点 */}
        <div className="absolute bottom-0 left-0 w-64 h-64 p5-halftone opacity-5 rotate-45 -translate-x-32 translate-y-32 pointer-events-none"></div>

        {/* 日历头部 */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 border-b-8 border-black pb-6">
          <div className="flex items-center space-x-6 mb-4 md:mb-0">
            <div className="bg-black p-2 md:p-4 transform -rotate-12 border-4 border-p5-red shadow-[4px_4px_0_0_black]">
              <span className="text-xl md:text-4xl font-black text-white italic tracking-tighter">赛事日历 / EVENT CALENDAR</span>
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

            <div className="bg-black px-8 py-3 border-4 border-p5-red shadow-[4px_4px_0_0_black]">
              <span className="text-2xl font-black text-white italic uppercase tracking-tighter inline-block">
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
        <div className="grid grid-cols-7 gap-2 mb-4">
          {weekDays.map(day => (
            <div key={day} className="bg-black py-2 text-center text-xs font-black text-white italic uppercase border border-p5-red">
              <span className="inline-block">{day}</span>
            </div>
          ))}
        </div>

        {/* 日历网格 */}
        <div className="grid grid-cols-7 gap-1 md:gap-2 mb-12">
          {calendarDays.map((day, index) => (
            <div
              key={index}
              onClick={() => setSelectedDate(day.date)}
              className={`
                min-h-[80px] md:min-h-[120px] p-1 md:p-3 border-[1px] md:border-2 border-black transition-all relative group/day cursor-pointer hover:z-30
                ${!day.isCurrentMonth ? 'bg-gray-100 opacity-40' : 'bg-white hover:bg-black hover:border-p5-red hover:-translate-y-1'}
                ${day.isToday ? 'bg-p5-red/10 border-p5-red ring-1 md:ring-2 ring-p5-red ring-inset' : ''}
                ${selectedDate && day.date.toDateString() === selectedDate.toDateString() ? 'ring-2 ring-black bg-gray-50' : ''}
              `}
            >
              {day.isToday && (
                <div className="hidden md:block absolute top-0 right-0 bg-p5-red text-white text-[10px] font-black px-2 py-0.5 z-10 transform -rotate-12 translate-x-1">
                  今日 / TODAY
                </div>
              )}

              <div className={`
                text-base md:text-xl font-black italic mb-1 md:mb-3 transition-colors group-hover/day:text-white
                ${day.isToday ? 'text-p5-red md:text-2xl scale-110 origin-top-left' : 'text-black'}
                ${!day.isCurrentMonth ? 'text-gray-400' : ''}
              `}>
                {day.date.getDate()}
              </div>

              {/* 赛事列表 */}
              <div className="space-y-1 md:space-y-1.5 relative z-10 w-full flex flex-col">
                {day.events.map(event => {
                  const startD = new Date(event.start_date)
                  const endD = new Date(event.end_date)
                  startD.setHours(0,0,0,0)
                  endD.setHours(0,0,0,0)
                  const currD = new Date(day.date)
                  currD.setHours(0,0,0,0)

                  const isStart = currD.getTime() === startD.getTime() || day.date.getDay() === 0
                  const isEnd = currD.getTime() === endD.getTime() || day.date.getDay() === 6
                  const isRealStart = currD.getTime() === startD.getTime()

                  return (
                    <div
                      key={event.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(event);
                      }}
                      className={`
                        text-[10px] bg-black text-white px-2 py-1 font-black italic uppercase tracking-tighter truncate hover:bg-p5-red transition-colors cursor-pointer border-p5-red
                        ${isRealStart ? 'border-l-4' : ''}
                        ${!isStart ? '-ml-[5px] md:-ml-[14px] pl-[5px] md:pl-[14px] border-l-0 rounded-l-none' : ''}
                        ${!isEnd ? '-mr-[5px] md:-mr-[14px] pr-[5px] md:pr-[14px] border-r-0 rounded-r-none relative z-20' : ''}
                      `}
                      title={`${event.title} - ${event.competition_name}`}
                    >
                      {(isRealStart || day.date.getDay() === 0) ? event.title : '\u00A0'}
                    </div>
                  )
                })}
              </div>

              {/* 背景装饰数字 - 隐约可见 */}
              <div className="absolute -bottom-4 -right-2 text-6xl font-black text-gray-200 opacity-20 pointer-events-none group-hover/day:text-p5-red group-hover/day:opacity-10 transition-colors z-0">
                {day.date.getDate()}
              </div>
            </div>
          ))}
        </div>

        {/* 赛事列表展示 */}
        <div className="border-t-4 border-black pt-10">
          <div className="flex items-center space-x-4 mb-8">
            <div className="bg-p5-red p-2 transform -rotate-6 border-2 border-black">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl md:text-3xl font-black text-black uppercase italic tracking-tighter">
                {selectedDate ? `${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日 赛事情报` : `${currentDate.getMonth() + 1}月 赛事情报`}
              </h3>
              <p className="text-xs font-black text-p5-red uppercase italic">
                {selectedDate ? '指定日期目标 / SELECTED TARGETS' : '本月目标 / MONTHLY TARGETS'}
              </p>
            </div>
          </div>

          {(() => {
            let displayEvents = events.filter(e => {
              const start = new Date(e.start_date);
              const end = new Date(e.end_date);
              const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
              const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
              return start <= monthEnd && end >= monthStart;
            });

            if (selectedDate) {
              displayEvents = displayEvents.filter(event => {
                const start = new Date(event.start_date);
                const end = new Date(event.end_date);
                start.setHours(0,0,0,0);
                end.setHours(0,0,0,0);
                const check = new Date(selectedDate);
                check.setHours(0,0,0,0);
                return check >= start && check <= end;
              });
            }
            
            return displayEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {displayEvents.map(event => {
                  const startD = new Date(event.start_date);
                  const endD = new Date(event.end_date);
                  const isMultiDay = startD.getTime() !== endD.getTime();
                  
                  return (
                    <div
                      key={event.id}
                      onClick={() => setSelectedEvent(event)}
                      className="group/upcoming relative"
                    >
                      <div className="absolute inset-0 bg-black transform translate-x-1 translate-y-1 z-0 opacity-0 group-hover/upcoming:opacity-100 transition-opacity"></div>
                      <div className="relative z-10 flex items-stretch bg-white border-2 border-black transition-all group-hover/upcoming:-translate-y-1 cursor-pointer">
                        <div className="w-24 bg-black flex flex-col items-center justify-center p-3 text-white border-r-2 border-p5-red">
                          <span className="text-sm font-black italic tracking-tighter uppercase opacity-60">
                            {startD.toLocaleDateString('zh-CN', { month: 'short' }).toUpperCase()}
                          </span>
                          <span className="text-xl md:text-2xl font-black italic tracking-tighter leading-none text-center">
                            {isMultiDay 
                              ? `${startD.getDate()}-${endD.getDate()}`
                              : startD.getDate()}
                          </span>
                        </div>
                        <div className="flex-1 p-4 bg-white overflow-hidden">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="bg-p5-red text-white text-[10px] font-black italic px-2 py-0.5">
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
                  <h4 className="text-xl md:text-2xl font-black text-gray-400 uppercase italic tracking-tighter">
                    {selectedDate ? '当日无赛事' : '本月无赛事'}
                  </h4>
                  <p className="text-sm font-bold text-gray-300 italic mt-2">区域活动未知 / TARGETS UNKNOWN</p>
                </div>
              </div>
            )
          })()}
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
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4 overflow-y-auto">
            <div className="relative w-full max-w-2xl group/modal my-8 max-h-[90vh] flex flex-col">
              {/* 装饰层 */}
              <div className="absolute inset-0 bg-p5-red transform translate-x-3 translate-y-3 z-0 shadow-2xl"></div>

              <div className="relative z-10 bg-white border-4 border-black p-6 md:p-8 overflow-y-auto max-h-[90vh] flex-1">
                {/* 背景波点 */}
                <div className="absolute top-0 right-0 w-64 h-64 p5-halftone opacity-5 rotate-12 translate-x-16 -translate-y-16 pointer-events-none"></div>

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-8 border-b-4 border-black pb-4">
                    <div className="flex-1">
                      <div className="bg-black inline-block px-4 py-1 transform -skew-x-12 mb-4">
                        <span className="text-sm font-black text-white italic uppercase tracking-tighter">情报确认 / TARGET IDENTIFIED</span>
                      </div>
                      <h3 className="text-2xl md:text-4xl font-black text-black uppercase italic tracking-tighter leading-none break-words" style={{ textShadow: '2px 2px 0px #d90614' }}>
                        {selectedEvent.title}
                      </h3>
                    </div>
                    <button
                      onClick={() => setSelectedEvent(null)}
                      className="bg-black text-white p-2 transform rotate-12 hover:bg-p5-red transition-all border-2 border-black ml-4 shrink-0"
                    >
                      <XIcon className="w-8 h-8" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="bg-gray-100 p-4 border-l-8 border-black">
                        <p className="text-[10px] font-black text-p5-red uppercase italic mb-1">执行日期 / EXECUTION DATE</p>
                        <p className="text-xl font-black italic">
                          {selectedEvent.start_date === selectedEvent.end_date
                            ? selectedEvent.start_date
                            : `${selectedEvent.start_date} ~ ${selectedEvent.end_date}`}
                        </p>
                      </div>

                      <div className="bg-gray-100 p-4 border-l-8 border-p5-red">
                        <p className="text-[10px] font-black text-black uppercase italic mb-1">所属档案 / BATTLE ARCHIVE</p>
                        <p className="text-xl font-black italic">{selectedEvent.competition_name}</p>
                      </div>

                      {selectedEvent.description && (
                        <div className="border-2 border-black p-4 bg-white shadow-[4px_4px_0_0_black]">
                          <p className="text-[10px] font-black text-black uppercase italic mb-2 border-b border-black inline-block">情报摘要 / INTEL BRIEF</p>
                          <p className="text-sm font-bold text-gray-800 leading-relaxed italic whitespace-pre-wrap">{selectedEvent.description}</p>
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