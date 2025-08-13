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

function SearchBar({ value, onChange, onClear, onSearch, placeholder = "搜索...", className = "" }: SearchBarProps) {
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

  const handleSearchClick = () => {
    onSearch()
  }

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          className="w-full pl-10 pr-20 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
        />
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-20 top-3.5 h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="清除搜索"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <button
          type="submit"
          onClick={handleSearchClick}
          className="absolute right-2 top-2 h-8 px-4 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors text-sm"
        >
          搜索
        </button>
      </form>
      {value && (
        <div className="mt-2 text-sm text-gray-500">
          搜索: "{value}"
        </div>
      )}
    </div>
  )
}

export default SearchBar