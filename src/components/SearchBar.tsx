import { Search, X } from 'lucide-react'
import React from 'react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  onSearch: () => void
  placeholder?: string
  className?: string
}

function SearchBar({ value, onChange, onClear, onSearch, className = "" }: SearchBarProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  const handleClear = () => {
    onClear()
  }

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative flex items-center space-x-2">
        <div className="relative flex-grow">
          <div className="absolute inset-0 bg-black transform -skew-x-12 translate-x-1 translate-y-1"></div>
          <div className="relative bg-white transform -skew-x-12 border-2 border-black focus-within:border-p5-red transition-colors flex items-center">
            <Search className="h-5 w-5 text-black ml-4 transform skew-x-12" />
            <input
              type="text"
              placeholder="我想搜索... (例如: 2025 ChinaJoy 金奖)"
              value={value}
              onChange={handleInputChange}
              className="w-full pl-2 pr-10 py-3 bg-transparent border-none focus:ring-0 placeholder-gray-400 text-black font-black transform skew-x-12"
            />
          </div>
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-black hover:text-p5-red z-10"
              aria-label="清除搜索"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <button
          type="submit"
          className="h-12 px-6 bg-p5-red text-white font-black transform -skew-x-12 border-2 border-b-4 border-black active:border-b-2 active:translate-y-1 transition-all hover:bg-black flex-shrink-0"
        >
          <span className="transform skew-x-12 inline-block">搜索 / GO</span>
        </button>
      </form>
      {value && (
        <div className="mt-2 text-xs font-black text-white bg-black inline-block px-3 py-1 transform -skew-x-12 border border-p5-red">
          <span className="transform skew-x-12 inline-block italic uppercase tracking-tighter">
            正在搜索: <span className="text-p5-red">"{value}"</span> / INVESTIGATION IN PROGRESS
          </span>
        </div>
      )}
    </div>
  )
}

export default SearchBar