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
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {/* 日历头部 */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">赛事日历</h2>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => changeMonth(-1)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            disabled={loading}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-xl font-semibold text-gray-700 min-w-[120px] text-center">
            {formatMonthYear(currentDate)}
          </span>
          <button
            onClick={() => changeMonth(1)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            disabled={loading}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="p-3 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      {/* 日历网格 */}
      <div className="grid grid-cols-7 gap-1 mb-8">
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={`
              min-h-[100px] p-2 border border-gray-200 rounded-lg cursor-pointer
              transition-colors hover:bg-gray-50
              ${!day.isCurrentMonth ? 'bg-gray-50 text-gray-400' : ''}
              ${day.isToday ? 'bg-blue-50 border-blue-200' : ''}
            `}
          >
            <div className={`
              text-sm font-medium mb-1
              ${day.isToday ? 'text-blue-600' : ''}
            `}>
              {day.date.getDate()}
            </div>
            
            {/* 赛事列表 - 使用颜色区分 */}
            <div className="space-y-1">
              {day.events.slice(0, 2).map(event => {
                const colors = getCompetitionColor(event.competition_name)
                return (
                  <div
                    key={event.id}
                    onClick={() => setSelectedEvent(event)}
                    className={`text-xs ${colors.bg} ${colors.text} px-2 py-1 rounded truncate ${colors.hover} transition-colors cursor-pointer`}
                    title={`${event.title} - ${event.competition_name}`}
                  >
                    {event.title}
                  </div>
                )
              })}
              {day.events.length > 2 && (
                <div className="text-xs text-gray-500 px-2">
                  +{day.events.length - 2} 更多
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 即将到来的赛事列表 */}
      <div className="border-t pt-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">即将到来的赛事</h3>
        {upcomingEvents.length > 0 ? (
          <div className="space-y-3">
            {upcomingEvents.map(event => {
              const colors = getCompetitionColor(event.competition_name)
              return (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${colors.bg} ${colors.text}`}>
                        {event.competition_name}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatEventDate(event.date)}
                      </span>
                    </div>
                    <h4 className="font-semibold text-gray-800 mt-2">{event.title}</h4>
                    {event.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{event.description}</p>
                    )}
                  </div>
                  <div className="text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p>暂无即将到来的赛事</p>
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold text-gray-800">{selectedEvent.title}</h3>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">日期：</span>
                <span className="text-sm text-gray-800">{selectedEvent.date}</span>
              </div>
              
              <div>
                <span className="text-sm font-medium text-gray-500">比赛：</span>
                <span className="text-sm text-gray-800">{selectedEvent.competition_name}</span>
              </div>
              
              {selectedEvent.description && (
                <div>
                  <span className="text-sm font-medium text-gray-500">描述：</span>
                  <p className="text-sm text-gray-800 mt-1">{selectedEvent.description}</p>
                </div>
              )}
              
              {selectedEvent.contact && (
                <div>
                  <span className="text-sm font-medium text-gray-500">联系方式：</span>
                  <span className="text-sm text-gray-800">{selectedEvent.contact}</span>
                </div>
              )}
              
              {selectedEvent.website && (
                <div>
                  <span className="text-sm font-medium text-gray-500">官网：</span>
                  <a 
                    href={selectedEvent.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    {selectedEvent.website}
                  </a>
                </div>
              )}
              
              {selectedEvent.promotional_image && (
                <div>
                  <span className="text-sm font-medium text-gray-500">宣传图：</span>
                  <img 
                    src={selectedEvent.promotional_image} 
                    alt={selectedEvent.title}
                    className="mt-2 max-w-full h-auto rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EventCalendar