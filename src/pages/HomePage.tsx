import { useEffect, useCallback, useState, useRef } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { RootState, AppDispatch } from '../store/store'
import { fetchVideos, setSearchQuery, clearSearch, setCurrentPage } from '../store/slices/videosSlice'
import VideoCard from '../components/VideoCard'
import VideoFilters from '../components/VideoFilters'
import SearchBar from '../components/SearchBar'
import { Loader, Tv } from 'lucide-react'

function HomePage() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { videos, loading, error, pagination, searchQuery, filters, currentPage } = useSelector((state: RootState) => state.videos)
  const [inputValue, setInputValue] = useState(searchQuery)
  const [isFilterLoading, setIsFilterLoading] = useState(false)
  const scrollPositionRef = useRef<number>(0)
  const filtersRef = useRef(filters)
  const searchQueryRef = useRef(searchQuery)

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

  const handleInputChange = (value: string) => {
    setInputValue(value)
  }

  const handleClearSearch = () => {
    setInputValue('')
    dispatch(clearSearch() as any)
  }

  const handleSearch = () => {
    dispatch(setSearchQuery(inputValue) as any)
    dispatch(setCurrentPage(1) as any)
  }

  // 首次加载状态
  if (loading && videos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-600" />
          <p className="text-gray-600">正在加载视频...</p>
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
            探索精彩的cosplay舞台剧表演，发现优秀的社团作品
          </p>
          </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">搜索视频</h2>
        <SearchBar
          value={inputValue}
          onChange={handleInputChange}
          onClear={handleClearSearch}
          onSearch={handleSearch}
          placeholder="搜索视频标题、描述、BV号、社团、比赛或标签..."
          className="max-w-2xl"
        />
      </div>

      {/* Filters */}
      <VideoFilters />

      {/* 筛选加载指示器 */}
      {isFilterLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-center space-x-2">
            <Loader className="w-4 h-4 animate-spin text-blue-600" />
            <span className="text-blue-600 text-sm">正在筛选...</span>
          </div>
        </div>
      )}

      {/* Video Grid */}
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