import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store/store'
import { fetchCompetitions } from '../store/slices/competitionsSlice'
import { fetchCompetitionAwards } from '../store/slices/awardsSlice'
import { 
  CompetitionCustomConfig,
  getCompetitionCustomConfig 
} from '../config/competitionCustomConfig'
import { competitionService } from '../services/competitionService'
import { 
  ArrowLeft, 
  Settings, 
  Palette, 
  Trophy,
  Save,
  Eye,
  Image,
  Layers,
  Paintbrush,
  GripVertical,
  X
} from 'lucide-react'

function CompetitionConfigPage() {
  const { id } = useParams<{ id: string }>()
  const dispatch = useDispatch()
  const { competitions } = useSelector((state: RootState) => state.competitions)
  const { competitionAwards } = useSelector((state: RootState) => state.awards)
  
  const [config, setConfig] = useState<CompetitionCustomConfig>({
    bannerBackground: { type: 'gradient', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    awardOrder: { sortRule: 'default', priorityAwards: [] }
  })
  const [previewBackground, setPreviewBackground] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  
  const competition = competitions.find(c => c.id === id)
  
  useEffect(() => {
    if (competitions.length === 0) {
      dispatch(fetchCompetitions() as any)
    }
    if (id) {
      dispatch(fetchCompetitionAwards(id) as any)
    }
  }, [dispatch, id, competitions.length])

  // 从API加载配置
  useEffect(() => {
    const loadConfig = async () => {
      if (!id) return
      
      try {
        setLoading(true)
        const response = await competitionService.getCompetitionConfig(id) as any
         if (response.config) {
           setConfig(response.config)
           if (response.config.bannerBackground) {
             setPreviewBackground(getBannerStyleString(response.config.bannerBackground))
          }
        }
      } catch (error) {
        console.error('加载配置失败:', error)
        // 使用本地默认配置作为fallback
        const fallbackConfig = getCompetitionCustomConfig(id)
        setConfig(fallbackConfig)
        if (fallbackConfig.bannerBackground) {
          setPreviewBackground(getBannerStyleString(fallbackConfig.bannerBackground))
        }
      } finally {
        setLoading(false)
      }
    }
    
    loadConfig()
  }, [id])
  
  const getBannerStyleString = (bannerConfig: any) => {
    switch (bannerConfig.type) {
      case 'gradient':
      case 'color':
        return bannerConfig.value
      case 'image':
        return `url(${bannerConfig.value})`
      default:
        return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }
  }
  
  const handleBannerTypeChange = (type: 'gradient' | 'image' | 'color') => {
    const newConfig = {
      ...config,
      bannerBackground: {
        type,
        value: type === 'gradient' 
          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          : type === 'image'
          ? 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1200&h=400&fit=crop'
          : '#667eea'
      }
    }
    setConfig(newConfig)
    setPreviewBackground(getBannerStyleString(newConfig.bannerBackground))
  }
  
  const handleBannerValueChange = (value: string) => {
    const newConfig = {
      ...config,
      bannerBackground: {
        ...config.bannerBackground!,
        value
      }
    }
    setConfig(newConfig)
    setPreviewBackground(getBannerStyleString(newConfig.bannerBackground))
  }
  
  const handleAwardOrderChange = (sortRule: 'custom' | 'alphabetical' | 'default') => {
    setConfig({
      ...config,
      awardOrder: {
        ...config.awardOrder,
        sortRule,
        priorityAwards: config.awardOrder?.priorityAwards || []
      }
    })
  }
  
  const handlePriorityAwardsChange = (awardIds: string[]) => {
    setConfig({
      ...config,
      awardOrder: {
        ...config.awardOrder,
        sortRule: config.awardOrder?.sortRule || 'custom',
        priorityAwards: awardIds
      }
    })
  }
  
  // 拖拽处理函数
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }
  
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    setDragOverIndex(index)
  }
  
  const handleDragLeave = () => {
    setDragOverIndex(null)
  }
  
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }
    
    const currentPriority = config.awardOrder?.priorityAwards || []
    const newPriority = [...currentPriority]
    const draggedItem = newPriority[draggedIndex]
    
    // 移除拖拽的项目
    newPriority.splice(draggedIndex, 1)
    // 在新位置插入
    newPriority.splice(dropIndex, 0, draggedItem)
    
    handlePriorityAwardsChange(newPriority)
    setDraggedIndex(null)
    setDragOverIndex(null)
  }
  
  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }
  
  // 移除优先级奖项
  const removePriorityAward = (awardId: string) => {
    const currentPriority = config.awardOrder?.priorityAwards || []
    handlePriorityAwardsChange(currentPriority.filter(id => id !== awardId))
  }
  
  // 添加优先级奖项
  const addPriorityAward = (awardId: string) => {
    const currentPriority = config.awardOrder?.priorityAwards || []
    handlePriorityAwardsChange([...currentPriority, awardId])
  }
  
  const saveConfig = async () => {
    if (!id) {
      alert('比赛ID无效')
      return
    }
    
    try {
      await competitionService.updateCompetitionConfig(id, config)
      alert('配置保存成功！')
    } catch (error) {
      console.error('保存配置失败:', error)
      alert('保存配置失败，请重试')
    }
  }
  
  const presetGradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    'linear-gradient(135deg, #ff8a80 0%, #ea80fc 100%)',
    'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)'
  ]
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载配置中...</p>
        </div>
      </div>
    )
  }

  if (!competition) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-50 rounded-lg p-8 max-w-md mx-auto">
          <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">比赛未找到</h3>
          <p className="text-gray-600 mb-4">请检查比赛链接是否正确</p>
          <Link to="/competitions" className="btn-primary">
            返回比赛列表
          </Link>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-8">
      {/* 返回按钮 */}
      <div className="flex items-center justify-between">
        <Link
          to={`/competitions/${id}`}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回比赛详情</span>
        </Link>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span>{showPreview ? '隐藏预览' : '显示预览'}</span>
          </button>
          
          <button
            onClick={saveConfig}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>保存配置</span>
          </button>
        </div>
      </div>
      
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">比赛配置</h1>
        <p className="text-gray-600">{competition.name}</p>
      </div>
      
      {/* 预览区域 */}
      {showPreview && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Banner预览</h2>
          <div 
            className="rounded-2xl text-white p-8 shadow-xl relative overflow-hidden h-48"
            style={{
              background: config.bannerBackground?.type === 'image' 
                ? undefined 
                : previewBackground,
              backgroundImage: config.bannerBackground?.type === 'image' 
                ? previewBackground 
                : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/30"></div>
            <div className="text-center relative z-10">
              <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold mb-2">{competition.name}</h1>
              <p className="text-white/90">这是预览效果</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Banner背景配置 */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Palette className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Banner背景配置</h2>
          </div>
          
          {/* 背景类型选择 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">背景类型</label>
            <div className="flex space-x-4">
              <button
                onClick={() => handleBannerTypeChange('gradient')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  config.bannerBackground?.type === 'gradient'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>渐变</span>
              </button>
              
              <button
                onClick={() => handleBannerTypeChange('image')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  config.bannerBackground?.type === 'image'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Image className="w-4 h-4" />
                <span>图片</span>
              </button>
              
              <button
                onClick={() => handleBannerTypeChange('color')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  config.bannerBackground?.type === 'color'
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Paintbrush className="w-4 h-4" />
                <span>纯色</span>
              </button>
            </div>
          </div>
          
          {/* 渐变预设 */}
          {config.bannerBackground?.type === 'gradient' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">预设渐变</label>
              <div className="grid grid-cols-3 gap-3">
                {presetGradients.map((gradient, index) => (
                  <button
                    key={index}
                    onClick={() => handleBannerValueChange(gradient)}
                    className="h-12 rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-colors"
                    style={{ background: gradient }}
                    title={gradient}
                  />
                ))}
              </div>
            </div>
          )}
          
          {/* 背景值输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {config.bannerBackground?.type === 'gradient' && 'CSS渐变值'}
              {config.bannerBackground?.type === 'image' && '图片URL'}
              {config.bannerBackground?.type === 'color' && '颜色值'}
            </label>
            <textarea
              value={config.bannerBackground?.value || ''}
              onChange={(e) => handleBannerValueChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={config.bannerBackground?.type === 'gradient' ? 3 : 1}
              placeholder={
                config.bannerBackground?.type === 'gradient' 
                  ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                  : config.bannerBackground?.type === 'image'
                  ? 'https://example.com/image.jpg'
                  : '#667eea'
              }
            />
          </div>
        </div>
        
        {/* 奖项排序配置 */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Trophy className="w-6 h-6 text-yellow-600" />
            <h2 className="text-xl font-bold text-gray-900">奖项排序配置</h2>
          </div>
          
          {/* 排序规则选择 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">排序规则</label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="sortRule"
                  value="default"
                  checked={config.awardOrder?.sortRule === 'default'}
                  onChange={() => handleAwardOrderChange('default')}
                  className="mr-2"
                />
                <span>默认排序（按奖项权重）</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  name="sortRule"
                  value="alphabetical"
                  checked={config.awardOrder?.sortRule === 'alphabetical'}
                  onChange={() => handleAwardOrderChange('alphabetical')}
                  className="mr-2"
                />
                <span>字母顺序</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  name="sortRule"
                  value="custom"
                  checked={config.awardOrder?.sortRule === 'custom'}
                  onChange={() => handleAwardOrderChange('custom')}
                  className="mr-2"
                />
                <span>自定义排序</span>
              </label>
            </div>
          </div>
          
          {/* 自定义排序配置 */}
          {config.awardOrder?.sortRule === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                优先显示的奖项（拖拽排序）
              </label>
              
              {/* 已选择的奖项 - 可拖拽排序 */}
              {config.awardOrder?.priorityAwards && config.awardOrder.priorityAwards.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-600 mb-2">已选择的奖项（可拖拽调整顺序）</h4>
                  <div className="space-y-2">
                    {config.awardOrder.priorityAwards.map((awardId, index) => {
                      const award = competitionAwards.find(a => a.id === awardId)
                      if (!award) return null
                      
                      return (
                        <div
                          key={awardId}
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, index)}
                          onDragEnd={handleDragEnd}
                          className={`flex items-center justify-between p-3 bg-blue-50 border-2 rounded-lg cursor-move transition-all ${
                            draggedIndex === index ? 'opacity-50' : ''
                          } ${
                            dragOverIndex === index ? 'border-blue-400 bg-blue-100' : 'border-blue-200'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <GripVertical className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-blue-800">{award.name}</span>
                            <span className="text-xs text-blue-600 bg-blue-200 px-2 py-1 rounded">#{index + 1}</span>
                          </div>
                          <button
                            onClick={() => removePriorityAward(awardId)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded transition-colors"
                            title="移除"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
              
              {/* 可选择的奖项 */}
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-2">可选择的奖项</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {competitionAwards
                    .filter(award => !config.awardOrder?.priorityAwards?.includes(award.id))
                    .map((award) => (
                    <div
                      key={award.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="font-medium">{award.name}</span>
                      <button
                        onClick={() => addPriorityAward(award.id)}
                        className="px-3 py-1 rounded text-sm transition-colors bg-gray-200 text-gray-600 hover:bg-gray-300"
                      >
                        选择
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CompetitionConfigPage