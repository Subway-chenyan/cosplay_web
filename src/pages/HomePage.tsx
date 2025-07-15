import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { RootState } from '../store/store'
import { fetchVideos, setSearchQuery, clearSearch } from '../store/slices/videosSlice'
import VideoCard from '../components/VideoCard'
import VideoFilters from '../components/VideoFilters'
import SearchBar from '../components/SearchBar'
import { Loader, Tv } from 'lucide-react'

function HomePage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { videos, filteredVideos, loading, error, pagination, searchQuery } = useSelector((state: RootState) => state.videos)

  useEffect(() => {
    dispatch(fetchVideos() as any)
  }, [dispatch])

  const handleVideoClick = (videoId: string) => {
    // 跳转到视频详情页
    navigate(`/video/${videoId}`)
  }

  const handleSearchChange = (query: string) => {
    dispatch(setSearchQuery(query) as any)
  }

  const handleClearSearch = () => {
    dispatch(clearSearch() as any)
  }

  if (loading && filteredVideos.length === 0) {
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
          
          <div className="flex justify-center space-x-8 text-primary-100">
            <div className="text-center">
              <div className="text-2xl font-bold">{pagination.count}</div>
              <div className="text-sm">精彩视频</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">50+</div>
              <div className="text-sm">优质社团</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">20+</div>
              <div className="text-sm">热门比赛</div>
            </div>
          </div>
        </div>
      </div>



      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">搜索视频</h2>
        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          onClear={handleClearSearch}
          placeholder="搜索视频标题、描述、BV号、社团、比赛或标签..."
          className="max-w-2xl"
        />
      </div>

      {/* Filters */}
      <VideoFilters />

      {/* Video Grid */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            舞台剧视频
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({pagination.count} 个视频)
            </span>
          </h2>
          
          {loading && (
            <div className="flex items-center space-x-2 text-gray-500">
              <Loader className="w-4 h-4 animate-spin" />
              <span className="text-sm">加载中...</span>
            </div>
          )}
        </div>

        {filteredVideos.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-50 rounded-lg p-8">
              <Tv className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无视频</h3>
              <p className="text-gray-600">请尝试调整筛选条件</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVideos.map((video) => (
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
              // TODO: 实现加载更多功能
              console.log('加载更多')
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