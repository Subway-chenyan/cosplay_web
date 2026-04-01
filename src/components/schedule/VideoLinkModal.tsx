import { useState, useEffect, useCallback } from 'react'
import { X, Search, Video, Loader2 } from 'lucide-react'
import { api } from '../../services/api'

interface SearchResult {
  id: string
  bv_number: string
  title: string
  url: string
  thumbnail: string
}

interface VideoLinkModalProps {
  eventId: string
  isOpen: boolean
  onClose: () => void
  onLink: (eventId: string, videoId: string) => void
}

export default function VideoLinkModal({ eventId, isOpen, onClose, onLink }: VideoLinkModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const searchVideos = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setLoading(true)
    setError('')
    try {
      const data = await api.get<{ results: SearchResult[] }>(`/videos/?search=${encodeURIComponent(query)}&page_size=10`)
      setResults(data.results || [])
    } catch {
      setError('搜索失败，请重试')
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounced search
  useEffect(() => {
    if (!isOpen) return

    const timer = setTimeout(() => {
      searchVideos(searchQuery)
    }, 400)

    return () => clearTimeout(timer)
  }, [searchQuery, isOpen, searchVideos])

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
      setResults([])
      setError('')
    }
  }, [isOpen])

  // Close on Escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      return () => document.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal */}
      <div className="relative w-full max-w-lg z-10">
        {/* Shadow */}
        <div className="absolute inset-0 bg-p5-red transform translate-x-2 translate-y-2 -skew-x-2 border-2 border-black z-0"></div>

        {/* Modal body */}
        <div className="relative z-10 bg-white border-4 border-black transform -skew-x-1 overflow-hidden">
          {/* Header */}
          <div className="bg-black text-white px-4 py-3 flex items-center justify-between border-b-4 border-p5-red">
            <div className="flex items-center gap-2 transform skew-x-1">
              <Video className="w-5 h-5 text-p5-red" />
              <h3 className="font-black uppercase italic text-sm md:text-base">
                关联视频 / LINK VIDEO
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-p5-red text-white flex items-center justify-center border-2 border-white hover:bg-white hover:text-p5-red transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search input */}
          <div className="p-4 transform skew-x-1">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索视频标题或BV号..."
                className="w-full border-2 border-black px-3 py-2 pr-10 text-sm font-bold focus:outline-none focus:border-p5-red focus:ring-2 focus:ring-p5-red/20"
                autoFocus
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>

          {/* Results */}
          <div className="px-4 pb-4 max-h-80 overflow-y-auto transform skew-x-1">
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-p5-red animate-spin" />
                <span className="ml-2 text-sm font-bold italic text-gray-500">搜索中...</span>
              </div>
            )}

            {error && (
              <div className="text-center py-4">
                <p className="text-sm text-red-600 font-bold italic">{error}</p>
              </div>
            )}

            {!loading && !error && searchQuery && results.length === 0 && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 font-bold italic">无搜索结果 / NO RESULTS</p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="space-y-2">
                {results.map((video) => (
                  <button
                    key={video.id}
                    onClick={() => onLink(eventId, video.id)}
                    className="w-full text-left flex items-center gap-3 p-2 border-2 border-gray-200 hover:border-p5-red hover:bg-red-50 transition-all group/res"
                  >
                    {/* Thumbnail */}
                    <div className="w-16 h-10 bg-gray-100 border border-gray-300 flex-shrink-0 overflow-hidden">
                      {video.thumbnail ? (
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black uppercase italic text-black truncate group-hover/res:text-p5-red transition-colors">
                        {video.title}
                      </p>
                      <p className="text-[10px] text-gray-400 font-bold">{video.bv_number}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!searchQuery && !loading && (
              <div className="text-center py-6">
                <Search className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400 font-bold italic">输入关键词搜索视频</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
