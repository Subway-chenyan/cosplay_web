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

function SearchBar({ value, onChange, onClear, onSearch, placeholder, className = '' }: SearchBarProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch()
  }

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="flex w-full items-stretch">
        <div className="relative min-w-0 flex-1 bg-white">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-black/70" />
          <input
            type="text"
            placeholder={placeholder || '请输入关键词搜索'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="h-14 w-full border-0 bg-transparent py-0 pl-12 pr-11 text-[15px] font-medium text-black outline-none placeholder:text-black/45 focus:ring-0"
          />
          {value && (
            <button
              type="button"
              onClick={onClear}
              className="absolute right-4 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center text-black/70 hover:text-p5-red"
              aria-label="清除搜索"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="h-14 shrink-0 bg-p5-red px-7 text-[15px] font-black text-white transition-colors hover:bg-red-700 sm:px-10"
        >
          搜索
        </button>
      </form>
      {value && (
        <div className="mt-2 text-xs font-semibold text-white/65">
          正在搜索：<span className="text-white">{value}</span>
        </div>
      )}
    </div>
  )
}

export default SearchBar
