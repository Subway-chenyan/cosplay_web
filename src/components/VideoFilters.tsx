import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../store/store'
import { setFilters, clearFilters, setCurrentPage } from '../store/slices/videosSlice'
import { fetchGroups } from '../store/slices/groupsSlice'
import { fetchCompetitions } from '../store/slices/competitionsSlice'
import { fetchTags } from '../store/slices/tagsSlice'
import { VideoFilters as VideoFiltersType } from '../types'
import { Filter, X } from 'lucide-react'

function VideoFilters() {
  const dispatch = useDispatch<AppDispatch>()
  const { filters, pagination } = useSelector((state: RootState) => state.videos)
  const { groups } = useSelector((state: RootState) => state.groups)
  const { competitions } = useSelector((state: RootState) => state.competitions)
  const { tags } = useSelector((state: RootState) => state.tags)
  
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    dispatch(fetchGroups())
    dispatch(fetchCompetitions())
    dispatch(fetchTags())
  }, [dispatch])

  const handleFilterChange = (filterType: keyof VideoFiltersType, value: string) => {
    const currentValues = filters[filterType] as string[]
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value]
    
    dispatch(setFilters({ [filterType]: newValues }))
    dispatch(setCurrentPage(1)) // 重置到第一页
  }

  const handleClearFilters = () => {
    dispatch(clearFilters())
    dispatch(setCurrentPage(1)) // 重置到第一页
  }

  const hasActiveFilters = filters.groups.length > 0 || filters.competitions.length > 0 || filters.tags.length > 0

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">筛选条件</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1"
            >
              <X className="w-4 h-4" />
              <span>清除全部</span>
            </button>
          )}
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-sm text-primary-600 hover:text-primary-700"
          >
            {isOpen ? '收起' : '展开'}
          </button>
        </div>
      </div>

      <div className={`space-y-6 ${isOpen ? 'block' : 'hidden md:block'}`}>
        {/* 社团筛选 */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">社团</h3>
          <div className="flex flex-wrap gap-2">
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => handleFilterChange('groups', group.id)}
                className={`filter-chip ${
                  filters.groups.includes(group.id) ? 'active' : ''
                }`}
              >
                {group.name}
              </button>
            ))}
          </div>
        </div>

        {/* 比赛筛选 */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">比赛</h3>
          <div className="flex flex-wrap gap-2">
            {competitions.map((competition) => (
              <button
                key={competition.id}
                onClick={() => handleFilterChange('competitions', competition.id)}
                className={`filter-chip ${
                  filters.competitions.includes(competition.id) ? 'active' : ''
                }`}
              >
                {competition.name}
              </button>
            ))}
          </div>
        </div>

        {/* 标签筛选 */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">标签</h3>
          
          {/* 按分类分组显示标签 */}
          {['IP', '风格', '年份', '地区'].map((category) => {
            const categoryTags = tags.filter(tag => tag.category === category)
            if (categoryTags.length === 0) return null
            
            return (
              <div key={category} className="mb-4">
                <h4 className="text-xs font-medium text-gray-500 mb-2">{category}</h4>
                <div className="flex flex-wrap gap-2">
                  {categoryTags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => handleFilterChange('tags', tag.id)}
                      className={`filter-chip ${
                        filters.tags.includes(tag.id) ? 'active' : ''
                      }`}
                      style={{
                        backgroundColor: filters.tags.includes(tag.id) ? tag.color : 'transparent',
                        borderColor: tag.color,
                        color: filters.tags.includes(tag.id) ? 'white' : tag.color,
                      }}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 当前筛选条件摘要 */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              当前筛选: 
              <span className="ml-2">
                {filters.groups.length > 0 && `社团 ${filters.groups.length}个`}
                {filters.competitions.length > 0 && ` 比赛 ${filters.competitions.length}个`}
                {filters.tags.length > 0 && ` 标签 ${filters.tags.length}个`}
              </span>
            </div>
            
            <div className="text-sm font-medium text-primary-600">
              共找到 {pagination.count} 个视频
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VideoFilters 