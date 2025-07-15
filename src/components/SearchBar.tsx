import { Search, X } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
  placeholder?: string
  className?: string
}

function SearchBar({ value, onChange, onClear, placeholder = "搜索...", className = "" }: SearchBarProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
  }

  return (
    <div className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
        />
        <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
        
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 top-3.5 h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
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