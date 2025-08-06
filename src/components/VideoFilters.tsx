import { useState, useEffect, useCallback } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { RootState, AppDispatch } from '../store/store'
import { setFilters, clearFilters, setCurrentPage } from '../store/slices/videosSlice'
import { fetchTags } from '../store/slices/tagsSlice'
import { VideoFilters as VideoFiltersType } from '../types'
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react'

function VideoFilters() {
  const dispatch = useDispatch<AppDispatch>()
  const { filters, pagination } = useSelector((state: RootState) => state.videos)
  const { tags } = useSelector((state: RootState) => state.tags)
  
  const [isOpen, setIsOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [expandedCategories, setExpandedCategories] = useState<{[key: string]: boolean}>({
    'IP': false,
    '风格': false,
    '其他': false
  })

  useEffect(() => {
    dispatch(fetchTags())
  }, [dispatch])

  const handleTagClick = useCallback((tagId: string, category: string) => {
    if (isProcessing) return
    
    setIsProcessing(true)
    
    let newFilters: Partial<VideoFiltersType> = {}
    
    if (category === '风格') {
      // 风格标签单选
      newFilters.styleTag = filters.styleTag === tagId ? undefined : tagId
    } else if (category === 'IP') {
      // IP标签单选
      newFilters.ipTag = filters.ipTag === tagId ? undefined : tagId
    } else {
      // 其他标签多选（AND逻辑）
      const currentTags = filters.tags || []
      const newTags = currentTags.includes(tagId)
        ? currentTags.filter(t => t !== tagId)
        : [...currentTags, tagId]
      newFilters.tags = newTags
    }
    
    dispatch(setFilters(newFilters))
    dispatch(setCurrentPage(1))
    
    setTimeout(() => setIsProcessing(false), 200)
  }, [dispatch, filters, isProcessing])

  const toggleCategoryExpansion = useCallback((category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }, [])

  const isTagSelected = useCallback((tagId: string, category: string) => {
    if (category === '风格') {
      return filters.styleTag === tagId
    } else if (category === 'IP') {
      return filters.ipTag === tagId
    } else {
      return filters.tags?.includes(tagId) || false
    }
  }, [filters])

  const handleClearFilters = useCallback(() => {
    if (isProcessing) return // 防止重复点击
    
    setIsProcessing(true)
    dispatch(clearFilters())
    dispatch(setCurrentPage(1)) // 重置到第一页
    
    // 延迟重置处理状态
    setTimeout(() => setIsProcessing(false), 200)
  }, [dispatch, isProcessing])

  const hasActiveFilters = filters.tags.length > 0 || filters.styleTag || filters.ipTag

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
              disabled={isProcessing}
              className={`text-sm flex items-center space-x-1 transition-colors ${
                isProcessing 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <X className="w-4 h-4" />
              <span>清除全部</span>
            </button>
          )}
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-sm text-primary-600 hover:text-primary-700 transition-colors"
          >
            {isOpen ? '收起' : '展开'}
          </button>
        </div>
      </div>

      <div className={`space-y-6 ${isOpen ? 'block' : 'hidden md:block'}`}>
        {/* 标签筛选 */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">标签</h3>
          
          {/* 按分类分组显示标签 */}
          {['IP', '风格', '其他'].map((category) => {
            const categoryTags = tags.filter(tag => tag.category === category)
            if (categoryTags.length === 0) return null
            
            const isExpanded = expandedCategories[category]
            const maxVisibleTags = 6
            const visibleTags = isExpanded ? categoryTags : categoryTags.slice(0, maxVisibleTags)
            const hasMoreTags = categoryTags.length > maxVisibleTags
            
            return (
              <div key={category} className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-medium text-gray-500">
                    {category}
                    {(category === '风格' || category === 'IP') && (
                      <span className="ml-1 text-xs text-gray-400">(单选)</span>
                    )}
                  </h4>
                  {hasMoreTags && (
                    <button
                      onClick={() => toggleCategoryExpansion(category)}
                      className="flex items-center text-xs text-primary-600 hover:text-primary-700 transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          收起 <ChevronUp className="w-3 h-3 ml-1" />
                        </>
                      ) : (
                        <>
                          展开 <ChevronDown className="w-3 h-3 ml-1" />
                        </>
                      )}
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {visibleTags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => handleTagClick(tag.id, category)}
                      disabled={isProcessing}
                      className={`filter-chip transition-all duration-200 ${
                        isTagSelected(tag.id, category) ? 'active' : ''
                      } ${
                        isProcessing ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'
                      }`}
                      style={{
                        backgroundColor: isTagSelected(tag.id, category) ? tag.color : 'transparent',
                        borderColor: tag.color,
                        color: isTagSelected(tag.id, category) ? 'white' : tag.color,
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
              <span className="ml-2 space-x-2">
                {filters.styleTag && (
                  <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    风格: {tags.find(t => t.id === filters.styleTag)?.name}
                  </span>
                )}
                {filters.ipTag && (
                  <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                    IP: {tags.find(t => t.id === filters.ipTag)?.name}
                  </span>
                )}
                {filters.tags.length > 0 && (
                  <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
                    其他标签: {filters.tags.length}个
                  </span>
                )}
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