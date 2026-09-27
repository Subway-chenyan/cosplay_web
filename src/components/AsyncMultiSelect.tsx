import { Loader, Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'


export interface AsyncSelectOption {
  id: string
  name: string
  count?: number
  ip_category?: string
}

interface AsyncMultiSelectProps {
  label: string
  value: AsyncSelectOption[]
  loadOptions: (query: string, signal: AbortSignal) => Promise<AsyncSelectOption[]>
  onChange: (options: AsyncSelectOption[]) => void
}

function AsyncMultiSelect({
  label,
  value,
  loadOptions,
  onChange,
}: AsyncMultiSelectProps) {
  const [query, setQuery] = useState('')
  const [options, setOptions] = useState<AsyncSelectOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        setOptions(await loadOptions(query.trim(), controller.signal))
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : '选项加载失败')
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, 300)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [loadOptions, query])

  const selectedIds = useMemo(() => new Set(value.map((item) => item.id)), [value])
  const availableOptions = options.filter((item) => !selectedIds.has(item.id))

  const removeOption = (id: string) => {
    onChange(value.filter((item) => item.id !== id))
  }

  const addOption = (option: AsyncSelectOption) => {
    if (!selectedIds.has(option.id)) onChange([...value, option])
    setQuery('')
  }

  return (
    <div ref={rootRef} className="relative space-y-2">
      <label className="block text-sm font-black text-white" htmlFor={`search-${label}`}>
        {label}（可多选）
      </label>
      {value.length > 0 && <div className="flex flex-wrap gap-2">
        {value.map((option) => (
          <span
            key={option.id}
            className="inline-flex items-center gap-1 border border-p5-red bg-black px-2 py-1 text-xs font-bold text-white"
          >
            {option.name}
            <button
              type="button"
              aria-label={`移除${option.name}`}
              onClick={() => removeOption(option.id)}
              className="text-white/70 hover:text-p5-red"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-black/55" />
        <input
          id={`search-${label}`}
          aria-label={`搜索${label}`}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={`搜索${label}`}
          className="h-10 w-full bg-white pl-9 pr-9 text-sm font-semibold text-black outline-none ring-1 ring-white/20 focus:ring-2 focus:ring-p5-red"
        />
        {loading && <Loader className="absolute right-3 top-3 h-4 w-4 animate-spin text-p5-red" />}
      </div>
      {open && error && <p className="absolute z-30 mt-1 w-full bg-black p-3 text-xs font-bold text-p5-red">{error}</p>}
      {open && availableOptions.length > 0 && (
        <div className="absolute z-30 mt-1 max-h-52 w-full overflow-y-auto border border-white/20 bg-[#121212] p-1 shadow-2xl">
          {availableOptions.map((option) => (
            <button
              key={option.id}
              type="button"
              aria-label={`选择${option.name}`}
              onClick={() => addOption(option)}
              className="block min-h-11 w-full cursor-pointer px-3 py-2 text-left text-sm font-bold text-white transition-colors duration-200 hover:bg-p5-red focus:bg-p5-red focus:outline-none"
            >
              {option.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default AsyncMultiSelect
