import { useState, useEffect } from 'react'
import { X, Search, Check } from 'lucide-react'

interface SelectOption {
  id: string
  name: string
  description?: string
}

interface SearchableMultiSelectModalProps {
  isOpen: boolean
  title: string
  options: SelectOption[]
  selectedIds: string[]
  onSelect: (ids: string[]) => void
  onClose: () => void
  searchPlaceholder?: string
}

function SearchableMultiSelectModal({
  isOpen,
  title,
  options,
  selectedIds,
  onSelect,
  onClose,
  searchPlaceholder = '搜索...'
}: SearchableMultiSelectModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredOptions, setFilteredOptions] = useState<SelectOption[]>(options)
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>(selectedIds)

  useEffect(() => {
    setLocalSelectedIds(selectedIds)
  }, [selectedIds])

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredOptions(options)
    } else {
      const term = searchTerm.toLowerCase()
      setFilteredOptions(
        options.filter(option =>
          option.name.toLowerCase().includes(term) ||
          (option.description && option.description.toLowerCase().includes(term))
        )
      )
    }
  }, [searchTerm, options])

  const handleToggle = (id: string) => {
    setLocalSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(selectedId => selectedId !== id)
      } else {
        return [...prev, id]
      }
    })
  }

  const handleConfirm = () => {
    onSelect(localSelectedIds)
    onClose()
    setSearchTerm('')
  }

  const handleCancel = () => {
    setLocalSelectedIds(selectedIds)
    onClose()
    setSearchTerm('')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="relative w-full max-w-2xl bg-white border-4 border-black shadow-2xl">
        {/* 标题栏 */}
        <div className="bg-p5-red text-white px-6 py-4 border-b-4 border-black">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black uppercase italic">{title}</h2>
            <button
              onClick={handleCancel}
              className="hover:bg-red-700 p-1 rounded transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* 搜索框 */}
        <div className="p-4 border-b-2 border-black">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border-2 border-black focus:border-p5-red focus:ring-p5-red font-bold"
              placeholder={searchPlaceholder}
              autoFocus
            />
          </div>
          <p className="text-sm text-gray-600 font-bold mt-2">
            已选择 {localSelectedIds.length} 项，共 {filteredOptions.length} 项可选
          </p>
        </div>

        {/* 选项列表 */}
        <div className="max-h-96 overflow-y-auto p-4">
          {filteredOptions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 font-bold">没有找到匹配的结果</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredOptions.map(option => (
                <label
                  key={option.id}
                  className={`flex items-start p-3 border-2 cursor-pointer transition-colors ${
                    localSelectedIds.includes(option.id)
                      ? 'border-p5-red bg-red-50'
                      : 'border-gray-300 hover:border-p5-red'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={localSelectedIds.includes(option.id)}
                    onChange={() => handleToggle(option.id)}
                    className="mt-1 w-5 h-5 text-p5-red border-black focus:ring-p5-red"
                  />
                  <div className="ml-3 flex-1">
                    <div className="font-bold text-black">{option.name}</div>
                    {option.description && (
                      <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t-4 border-black bg-gray-50 flex space-x-3">
          <button
            onClick={handleCancel}
            className="flex-1 bg-gray-500 text-white px-6 py-3 font-black uppercase italic border-2 border-black hover:bg-gray-600"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 bg-p5-red text-white px-6 py-3 font-black uppercase italic border-2 border-black hover:bg-red-700 flex items-center justify-center"
          >
            <Check className="w-5 h-5 mr-2" />
            确定 ({localSelectedIds.length})
          </button>
        </div>
      </div>
    </div>
  )
}

export default SearchableMultiSelectModal
