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
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({
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
    <div className="relative group mb-8">
      <div className="absolute inset-0 bg-black transform translate-x-1 translate-y-1 -skew-x-2 z-0"></div>
      <div className="relative z-10 bg-white border-4 border-black p-6 transform -skew-x-2">
        <div className="flex items-center justify-between mb-6 transform skew-x-2">
          <div className="flex items-center space-x-3">
            <div className="bg-p5-red p-2 transform rotate-12 border-2 border-black shadow-[2px_2px_0_0_black]">
              <Filter className="w-5 h-5 text-white transform -rotate-12" />
            </div>
            <h2 className="text-2xl font-black text-black uppercase italic border-b-4 border-p5-red">
              FILTER OPTIONS / 筛选条件
            </h2>
          </div>

          <div className="flex items-center space-x-3">
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                disabled={isProcessing}
                className={`flex items-center space-x-1 px-3 py-1 bg-black text-white font-black uppercase italic transform -skew-x-12 transition-all shadow-[2px_2px_0_0_rgba(0,0,0,0.2)] ${isProcessing
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-p5-red'
                  }`}
              >
                <span className="transform skew-x-12 flex items-center">
                  <X className="w-4 h-4 mr-1" />
                  <span>Clear / 清除全部</span>
                </span>
              </button>
            )}

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden px-3 py-1 bg-p5-red text-white font-black uppercase italic transform -skew-x-12"
            >
              <span className="transform skew-x-12">
                {isOpen ? 'COLLAPSE / 收起' : 'EXPAND / 展开'}
              </span>
            </button>
          </div>
        </div>

        <div className={`space-y-8 transform skew-x-2 ${isOpen ? 'block' : 'hidden md:block'}`}>
          {/* 标签筛选 */}
          <div className="space-y-6">
            {/* 按分类分组显示标签 */}
            {['IP', '风格', '其他'].map((category) => {
              const categoryTags = tags.filter(tag => tag.category === category)
              if (categoryTags.length === 0) return null

              const isExpanded = expandedCategories[category]
              const maxVisibleTags = 6
              const visibleTags = isExpanded ? categoryTags : categoryTags.slice(0, maxVisibleTags)
              const hasMoreTags = categoryTags.length > maxVisibleTags

              return (
                <div key={category} className="group/cat">
                  <div className="flex items-center justify-between mb-4 border-l-4 border-black pl-3">
                    <h4 className="text-lg font-black text-black uppercase italic tracking-wider">
                      {category}
                      {(category === '风格' || category === 'IP') && (
                        <span className="ml-2 text-xs text-gray-500 font-bold opacity-50">/ SINGLE CHOICE</span>
                      )}
                    </h4>
                    {hasMoreTags && (
                      <button
                        onClick={() => toggleCategoryExpansion(category)}
                        className="px-2 py-0.5 text-xs font-black bg-gray-100 text-black border border-black hover:bg-p5-red hover:text-white transition-colors transform -skew-x-12"
                      >
                        <span className="transform skew-x-12 flex items-center">
                          {isExpanded ? 'LESS' : 'MORE'}
                          {isExpanded ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                        </span>
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {visibleTags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => handleTagClick(tag.id, category)}
                        disabled={isProcessing}
                        className={`filter-chip h-auto py-1.5 px-4 font-black uppercase italic border-2 transition-all ${isTagSelected(tag.id, category) ? 'active scale-105 shadow-[4px_4px_0_0_black]' : 'hover:scale-105'
                          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        style={{
                          backgroundColor: isTagSelected(tag.id, category) ? '#d90614' : 'white',
                          borderColor: 'black',
                          color: isTagSelected(tag.id, category) ? 'white' : 'black',
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
          <div className="mt-8 pt-6 border-t-4 border-black border-dashed transform skew-x-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2 text-sm font-black text-black">
                <span className="uppercase italic bg-p5-red text-white px-2 py-0.5">CURRENT INVESTIGATION:</span>
                {filters.styleTag && (
                  <span className="px-2 py-0.5 border-2 border-black bg-white italic">
                    STYLE: {tags.find(t => t.id === filters.styleTag)?.name}
                  </span>
                )}
                {filters.ipTag && (
                  <span className="px-2 py-0.5 border-2 border-black bg-white italic">
                    IP content: {tags.find(t => t.id === filters.ipTag)?.name}
                  </span>
                )}
                {filters.tags.length > 0 && (
                  <span className="px-2 py-0.5 border-2 border-black bg-white italic">
                    TAGS: {filters.tags.length}
                  </span>
                )}
              </div>

              <div className="text-xl font-black text-p5-red italic bg-black px-4 py-1 transform -skew-x-12 shadow-[4px_4px_0_0_#d90614]">
                <span className="transform skew-x-12 inline-block">
                  TOTAL FOUND: {pagination.count}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>)
}

export default VideoFilters