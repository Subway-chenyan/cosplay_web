import { useEffect, useState, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { RootState, AppDispatch } from '../store/store'
import { fetchGroups, searchGroups, setCurrentPage } from '../store/slices/groupsSlice'
import SearchBar from '../components/SearchBar'
import ChinaMapModule from '../components/ChinaMapModule'
import { Users, MapPin, Calendar, ExternalLink, X, Loader } from 'lucide-react'
import { Group } from '../types'

function GroupsPage() {
  const dispatch = useDispatch<AppDispatch>()
  const navigate = useNavigate()
  const { groups, loading, error, pagination, currentPage } = useSelector((state: RootState) => state.groups)
  const [inputValue, setInputValue] = useState('')
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null)
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([])

  // Calculate display groups based on province filter and search
  const displayGroups = selectedProvince ? filteredGroups : groups

  useEffect(() => {
    console.log('GroupsPage - useEffect triggered')
    if (groups.length === 0) {
      dispatch(fetchGroups({ page: 1 }))
    }
  }, [dispatch, groups.length])

  const handleInputChange = useCallback((value: string) => {
    console.log('GroupsPage - handleInputChange:', value)
    setInputValue(value)
  }, [])

  const handleClearSearch = useCallback(() => {
    console.log('GroupsPage - handleClearSearch')
    setInputValue('')
    dispatch(fetchGroups())
  }, [dispatch])

  const handleProvinceSelect = useCallback((province: string, groups: Group[]) => {
    console.log('GroupsPage - handleProvinceSelect:', province, groups)
    setSelectedProvince(province)
    setFilteredGroups(groups)
  }, [])

  const clearProvinceFilter = useCallback(() => {
    console.log('GroupsPage - clearProvinceFilter')
    setSelectedProvince(null)
    setFilteredGroups([])
  }, [])

  const handleSearch = useCallback(() => {
    if (inputValue.trim()) {
      console.log('GroupsPage - dispatching searchGroups')
      dispatch(searchGroups(inputValue))
    } else {
        console.log('GroupsPage - dispatching fetchGroups')
        dispatch(fetchGroups({ page: 1 }))
      }
  }, [dispatch, inputValue])

  const handleLoadMore = () => {
    if (pagination.next && !loading) {
      dispatch(setCurrentPage(currentPage + 1))
      dispatch(fetchGroups({ page: currentPage + 1 }))
    }
  }

  const handleGroupClick = (groupId: string) => {
    navigate(`/group/${groupId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载社团...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-red-600">加载失败: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">社团展示</h1>
        <p className="text-gray-600 mb-4">
          探索优秀的cosplay社团，了解他们的作品和活动
        </p>
        
        {/* Search Bar */}
        <div className="mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">搜索社团</h2>
          <SearchBar
            value={inputValue}
            onChange={handleInputChange}
            onClear={handleClearSearch}
            onSearch={handleSearch}
            placeholder="搜索社团名称、描述或地区..."
            className="max-w-xl"
          />
        </div>
      </div>

      {/* China Map Module */}
      <ChinaMapModule className="mb-6" onProvinceSelect={handleProvinceSelect} />

      {/* Province Filter Status */}
      {selectedProvince && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-blue-600" />
              <span className="text-blue-800 font-medium">
                当前显示：{selectedProvince} 地区社团 ({filteredGroups.length} 个)
              </span>
            </div>
            <button
              onClick={clearProvinceFilter}
              className="flex items-center gap-1 px-3 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded transition-colors"
            >
              <X className="w-4 h-4" />
              <span>清除过滤</span>
            </button>
          </div>
        </div>
      )}

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayGroups.length > 0 ? (
          displayGroups.map((group: any) => (
            <div
              key={group.id}
              className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-300 card-hover cursor-pointer flex flex-col h-full"
              onClick={() => handleGroupClick(group.id)}
            >
              {/* Group Header */}
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                    {group.logo ? (
                      <img
                        src={group.logo}
                        alt={group.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                        <span className="text-white font-bold text-xl">
                          {group.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {group.name}
                      </h3>
                    </div>
                    
                    {group.location && (
                      <div className="flex items-center text-gray-500 text-sm mt-1">
                        <MapPin className="w-4 h-4 mr-1" />
                        <span>{group.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="flex-1 mb-4">
                  <p className="text-gray-600 text-sm line-clamp-3 h-16">
                    {group.description}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-1">
                    <div className="w-4 h-4 bg-primary-500 rounded flex items-center justify-center">
                      <span className="text-white text-xs font-bold">视</span>
                    </div>
                    <span>{group.video_count} 视频</span>
                  </div>
                </div>

                {/* Founded Date */}
                {group.founded_date && (
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span>成立于 {new Date(group.founded_date).getFullYear()}年</span>
                  </div>
                )}

                {/* Social Links */}
                <div className="space-y-2">
                  {group.website && (
                    <a
                      href={group.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm text-primary-600 hover:text-primary-700"
                    >
                      <ExternalLink className="w-4 h-4 mr-1" />
                      <span>官方网站</span>
                    </a>
                  )}
                  
                  {group.bilibili && (
                    <a
                      href={group.bilibili}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-sm text-pink-600 hover:text-pink-700"
                    >
                      <div className="w-4 h-4 mr-1 bg-pink-500 rounded text-white text-xs font-bold flex items-center justify-center">
                        B
                      </div>
                      <span>哔哩哔哩</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Action Footer */}
              <div className="px-6 py-4 bg-gray-50 rounded-b-lg">
                <div className="w-full btn-primary text-sm text-center">
                  查看详情
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full">
            {selectedProvince ? (
              <div className="text-center py-12">
                <div className="bg-gray-50 rounded-lg p-8">
                  <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{selectedProvince} 地区暂无社团</h3>
                  <p className="text-gray-600">该地区还没有社团信息</p>
                </div>
              </div>
            ) : inputValue ? (
              <div className="text-center py-12">
                <div className="bg-gray-50 rounded-lg p-8">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">未找到匹配的社团</h3>
                  <p className="text-gray-600">请尝试调整搜索条件</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="bg-gray-50 rounded-lg p-8">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">暂无社团</h3>
                  <p className="text-gray-600">目前还没有社团信息</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Load More Button */}
      {pagination.next && !inputValue && (
        <div className="text-center mt-8">
          <button
            onClick={handleLoadMore}
            className="btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader className="w-4 h-4 animate-spin mr-2" />
                加载中...
              </>
            ) : (
              '加载更多社团'
            )}
          </button>
        </div>
      )}

      {/* Total Count Display */}
      {groups.length > 0 && (
        <div className="text-center mt-4 text-sm text-gray-500">
          已显示 {groups.length} / {pagination.count} 个社团
        </div>
      )}
    </div>
  )
}

export default GroupsPage