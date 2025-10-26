import { useEffect, useCallback, useState, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { RootState, AppDispatch } from '../store/store'
import { fetchVideos, setSearchQuery, clearSearch, setCurrentPage } from '../store/slices/videosSlice'
import VideoCard from '../components/VideoCard'
import ClubCard from '../components/ClubCard'
// import VideoFilters from '../components/VideoFilters'
import SearchBar from '../components/SearchBar'
import { Loader, Tv, Sparkles, List } from 'lucide-react'
import { videoService } from '../services/videoService'
import { agentService } from '../services/agentService'
import type { Video, Group } from '../types'

function HomePage() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { videos, loading, error, pagination, searchQuery, filters, currentPage } = useSelector((state: RootState) => state.videos)
  const [inputValue, setInputValue] = useState(searchQuery)
  const [isFilterLoading, setIsFilterLoading] = useState(false)
  const scrollPositionRef = useRef<number>(0)
  const filtersRef = useRef(filters)
  const searchQueryRef = useRef(searchQuery)

  const [stats, setStats] = useState<{ total_videos: number; weekly_new_videos: number } | null>(null)
  const [isAgentMode, setIsAgentMode] = useState(false)
  const [agentResults, setAgentResults] = useState<{
    text: string
    video_id_list: string[]
    group_id_list: string[]
    videos: Video[]
    groups: Group[]
  } | null>(null)
  const [isAgentLoading, setIsAgentLoading] = useState(false)

  const fetchStats = useCallback(async () => {
    try {
      const s = await videoService.getVideoStats()
      setStats(s)
    } catch (e) {
      // ignore
    }
  }, [])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 60000)
    return () => clearInterval(interval)
  }, [fetchStats])

  // 防抖函数
  const debounce = useCallback((func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout
    return (...args: any[]) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func(...args), delay)
    }
  }, [])

  // 保存滚动位置
  const saveScrollPosition = useCallback(() => {
    scrollPositionRef.current = window.scrollY
  }, [])

  // 恢复滚动位置
  const restoreScrollPosition = useCallback(() => {
    if (scrollPositionRef.current > 0) {
      window.scrollTo(0, scrollPositionRef.current)
    }
  }, [])

  // 获取视频数据
  const fetchVideosData = useCallback(async (params?: { 
    page?: number
    filters?: any
    searchQuery?: string
  }) => {
    const isFilterChange = JSON.stringify(params?.filters) !== JSON.stringify(filtersRef.current) ||
                          params?.searchQuery !== searchQueryRef.current
    
    if (isFilterChange) {
      setIsFilterLoading(true)
      saveScrollPosition()
    }

    try {
      await dispatch(fetchVideos(params) as any)
    } finally {
      if (isFilterChange) {
        setIsFilterLoading(false)
        // 延迟恢复滚动位置，确保DOM已更新
        setTimeout(restoreScrollPosition, 100)
      }
    }
  }, [dispatch, saveScrollPosition, restoreScrollPosition])

  // 防抖的筛选处理
  const debouncedFetchVideos = useCallback(
    debounce(fetchVideosData, 300),
    [fetchVideosData, debounce]
  )

  // 监听筛选和搜索变化
  useEffect(() => {
    const hasFiltersChanged = JSON.stringify(filters) !== JSON.stringify(filtersRef.current)
    const hasSearchChanged = searchQuery !== searchQueryRef.current

    if (hasFiltersChanged || hasSearchChanged) {
      filtersRef.current = filters
      searchQueryRef.current = searchQuery
      debouncedFetchVideos({
        page: 1, // 筛选时重置到第一页
        searchQuery,
        filters
      })
    }
  }, [filters, searchQuery, debouncedFetchVideos])

  // 监听页码变化（非筛选导致的）
  useEffect(() => {
    const hasFiltersChanged = JSON.stringify(filters) !== JSON.stringify(filtersRef.current)
    const hasSearchChanged = searchQuery !== searchQueryRef.current
    
    if (!hasFiltersChanged && !hasSearchChanged) {
      fetchVideosData({
        page: currentPage,
        searchQuery,
        filters
      })
    }
  }, [currentPage, fetchVideosData])

  // 组件挂载时的初始加载
  useEffect(() => {
    if (videos.length === 0) {
      fetchVideosData({
        page: currentPage,
        searchQuery,
        filters
      })
    }
  }, []) // 只在组件挂载时执行一次

  const handleVideoClick = (videoId: string) => {
    navigate(`/video/${videoId}`)
  }

  const handleClubClick = (clubId: string | number) => {
    navigate(`/group/${clubId}`)
  }

  const handleInputChange = (value: string) => {
    setInputValue(value)
  }

  const handleClearSearch = () => {
    setInputValue('')
    dispatch(clearSearch() as any)
    setAgentResults(null)
  }

  const handleSearch = async () => {
    if (isAgentMode) {
      // Agent搜索模式
      setIsAgentLoading(true)
      try {
        const results = await agentService.search(inputValue)
        setAgentResults({
          text: results.text || '',
          video_id_list: results.video_id_list || [],
          group_id_list: results.group_id_list || [],
          videos: results.videos || [],
          groups: results.groups || []
        })
      } catch (error) {
        console.error('Agent搜索失败:', error)
        // 如果Agent搜索失败，回退到普通搜索
        dispatch(setSearchQuery(inputValue) as any)
        dispatch(setCurrentPage(1) as any)
      } finally {
        setIsAgentLoading(false)
      }
    } else {
      // 普通搜索模式
      dispatch(setSearchQuery(inputValue) as any)
      dispatch(setCurrentPage(1) as any)
      setAgentResults(null)
    }
  }

  // 首次加载状态
  if (loading && videos.length === 0 && !isAgentMode) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-600" />
          <p className="text-gray-600">正在加载视频...</p>
        </div>
      </div>
    )
  }

  // Agent搜索加载状态
  if (isAgentLoading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Sparkles className="w-8 h-8 animate-pulse mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">AI正在智能搜索中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-red-600">加载失败: {error}</p>
          <button
            onClick={() => dispatch(fetchVideos() as any)}
            className="mt-4 btn-primary"
          >
            重新加载
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl text-white p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">
            Cosplay舞台剧视频数据库
          </h1>
          <p className="text-xl text-primary-100 mb-6">
            各大Cosplay舞台剧赛事数据汇总，持续更新中...
          </p>
          </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {isAgentMode ? '智能搜索' : '搜索视频'}
          </h2>
          <button
            onClick={() => setIsAgentMode(!isAgentMode)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isAgentMode
                ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {isAgentMode ? (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Agent模式</span>
              </>
            ) : (
              <>
                <List className="w-4 h-4" />
                <span>普通模式</span>
              </>
            )}
          </button>
        </div>
        <SearchBar
          value={inputValue}
          onChange={handleInputChange}
          onClear={handleClearSearch}
          onSearch={handleSearch}
          placeholder={
            isAgentMode
              ? '输入您的搜索需求，例如：查找上海地区的优秀社团'
              : '搜索视频标题、描述、社团、比赛或标签...'
          }
          className="max-w-2xl"
        />
        {isAgentMode && (
          <p className="text-sm text-gray-500 mt-2">
            💡 Agent模式支持自然语言搜索，可以同时搜索视频和社团
          </p>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">总视频数</div>
            <div className="text-2xl font-bold text-gray-900">{stats?.total_videos ?? pagination.count}</div>
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">近7天新增</div>
            <div className="text-2xl font-bold text-primary-600">{stats?.weekly_new_videos ?? 0}</div>
          </div>
        </div>
      </div>
      {/* Filters */}
      {/* <VideoFilters /> */}

      {/* 筛选加载指示器 */}
      {/* {isFilterLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-center space-x-2">
            <Loader className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-blue-600 text-sm">正在筛选...</span>
          </div>
        </div>
      )} */}

      {/* Agent Search Results */}
      {isAgentMode && agentResults && (
        <div className="space-y-8">
          {/* Agent搜索结果头部 - 显示LLM文本总结 */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-center space-x-2 mb-3">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span className="text-purple-800 font-medium">AI智能搜索总结</span>
            </div>
            <div className="text-purple-900">
              <p className="text-sm leading-relaxed">{agentResults.text}</p>
            </div>
            {(agentResults.video_id_list.length > 0 || agentResults.group_id_list.length > 0) && (
              <div className="mt-4 pt-4 border-t border-purple-200">
                <p className="text-purple-700 text-sm">
                  找到 {agentResults.video_id_list.length} 个相关视频和 {agentResults.group_id_list.length} 个相关社团
                </p>
              </div>
            )}
          </div>

          {/* 视频结果 - 基于video_id_list判断 */}
          {agentResults.video_id_list.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                相关视频
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({agentResults.video_id_list.length} 个)
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {agentResults.videos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onClick={() => handleVideoClick(video.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 社团结果 - 基于group_id_list判断 */}
          {agentResults.group_id_list.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                相关社团
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({agentResults.group_id_list.length} 个)
                </span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agentResults.groups.map((group) => (
                  <ClubCard
                    key={group.id}
                    club={group}
                    onClick={() => handleClubClick(group.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 无结果 - 基于ID列表判断 */}
          {agentResults.video_id_list.length === 0 && agentResults.group_id_list.length === 0 && (
            <div className="text-center py-12">
              <div className="bg-gray-50 rounded-lg p-8">
                <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">未找到相关内容</h3>
                <p className="text-gray-600">请尝试调整搜索关键词</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Regular Video Grid - 只在非Agent模式下显示 */}
      {!isAgentMode && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              舞台剧视频
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({pagination.count} 个视频)
              </span>
            </h2>

            {loading && !isFilterLoading && (
              <div className="flex items-center space-x-2 text-gray-500">
                <Loader className="w-4 h-4 animate-spin" />
                <span className="text-sm">加载中...</span>
              </div>
            )}
          </div>

          {videos.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gray-50 rounded-lg p-8">
                <Tv className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">暂无视频</h3>
                <p className="text-gray-600">请尝试调整筛选条件</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onClick={() => handleVideoClick(video.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Load More */}
      {pagination.next && (
        <div className="text-center">
          <button
            onClick={() => {
              dispatch(setCurrentPage(currentPage + 1))
            }}
            className="btn-primary"
            disabled={loading}
          >
            {loading ? '加载中...' : '加载更多'}
          </button>
        </div>
      )}
    </div>
  )
}

export default HomePage