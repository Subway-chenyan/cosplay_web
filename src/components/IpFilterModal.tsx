import { Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import type { AsyncSelectOption } from './AsyncMultiSelect'

const CATEGORIES = ['全部', '国漫', '日漫', '游戏', '影视', '其他'] as const

interface IpFilterModalProps {
  open: boolean
  options: AsyncSelectOption[]
  value: AsyncSelectOption[]
  onChange: (value: AsyncSelectOption[]) => void
  onClose: () => void
}

function IpFilterModal({ open, options, value, onChange, onClose }: IpFilterModalProps) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('全部')
  const searchRef = useRef<HTMLInputElement>(null)
  const selectedIds = useMemo(() => new Set(value.map((item) => item.id)), [value])

  useEffect(() => {
    if (!open) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    searchRef.current?.focus()
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose, open])

  const visible = options.filter((item) => {
    const matchesCategory = category === '全部' || (item.ip_category || '其他') === category
    return matchesCategory && item.name.toLowerCase().includes(query.trim().toLowerCase())
  })

  if (!open) return null

  const toggle = (option: AsyncSelectOption) => {
    onChange(selectedIds.has(option.id)
      ? value.filter((item) => item.id !== option.id)
      : [...value, option])
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-0 backdrop-blur-sm sm:items-center sm:p-6" role="presentation" onMouseDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="ip-filter-title"
        className="flex max-h-[90vh] w-full max-w-4xl flex-col border border-white/20 bg-[#090909] shadow-[10px_10px_0_#d90614] sm:max-h-[82vh]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-white/15 px-5 py-4 sm:px-7">
          <div>
            <h2 id="ip-filter-title" className="text-xl font-black text-white sm:text-2xl">选择 IP 作品</h2>
            <p className="mt-1 text-sm font-semibold text-white/55">按分类浏览，也可以直接搜索名称</p>
          </div>
          <button type="button" aria-label="关闭 IP 选择" onClick={onClose} className="flex h-11 w-11 cursor-pointer items-center justify-center border border-white/25 text-white transition-colors hover:border-p5-red hover:bg-p5-red focus:outline-none focus:ring-2 focus:ring-p5-red">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="border-b border-white/10 px-5 py-4 sm:px-7">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-black/45" />
            <input ref={searchRef} aria-label="搜索 IP 作品" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索火影忍者、原神、死神…" className="h-12 w-full bg-white pl-12 pr-4 text-base font-bold text-black outline-none focus:ring-2 focus:ring-p5-red" />
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="IP 分类">
            {CATEGORIES.map((item) => (
              <button key={item} type="button" role="tab" aria-selected={category === item} onClick={() => setCategory(item)} className={`min-h-11 shrink-0 cursor-pointer px-5 text-sm font-black transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-p5-red ${category === item ? 'bg-p5-red text-white' : 'border border-white/20 bg-black text-white/70 hover:border-white/60 hover:text-white'}`}>
                {item}
              </button>
            ))}
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-7">
          {visible.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {visible.map((option) => {
                const selected = selectedIds.has(option.id)
                return (
                  <button key={option.id} type="button" aria-pressed={selected} onClick={() => toggle(option)} className={`min-h-14 cursor-pointer border px-3 py-2 text-left transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-p5-red ${selected ? 'border-p5-red bg-p5-red text-white' : 'border-white/15 bg-[#121212] text-white hover:border-p5-red'}`}>
                    <span className="block line-clamp-2 text-sm font-black">{option.name}</span>
                    {typeof option.count === 'number' && <span className={`mt-1 block text-xs ${selected ? 'text-white/75' : 'text-white/40'}`}>{option.count} 个视频</span>}
                  </button>
                )
              })}
            </div>
          ) : <p className="py-12 text-center font-bold text-white/50">没有匹配的 IP 作品</p>}
        </div>
        <footer className="flex items-center justify-between gap-4 border-t border-white/15 px-5 py-4 sm:px-7">
          <span className="text-sm font-bold text-white/60">已选 {value.length} 项</span>
          <button type="button" onClick={onClose} className="min-h-11 cursor-pointer bg-p5-red px-7 text-sm font-black text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-white">完成选择</button>
        </footer>
      </section>
    </div>
  )
}

export default IpFilterModal
