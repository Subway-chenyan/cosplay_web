import { Video } from '../types'
import { ImageIcon, Play } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface VideoCardProps {
  video: Video
  onClick?: () => void
  dramaName?: string
}

function VideoCard({ video, onClick, dramaName }: VideoCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.08 }
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const thumbnailUrl = video.thumbnail || ''
  return (
    <div
      ref={cardRef}
      className="group cursor-pointer overflow-hidden border border-white/16 bg-[#070707] transition duration-300 hover:-translate-y-1 hover:border-p5-red"
      onClick={onClick}
    >
      <div className="relative aspect-video overflow-hidden bg-[#111]">
        {isInView && (
          <>
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#161616]">
                <ImageIcon className="h-8 w-8 text-white/25" />
              </div>
            )}

            {thumbnailUrl && !imageError && (
              <img
                src={thumbnailUrl}
                alt={video.title}
                className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${
                  imageLoaded ? 'opacity-100' : 'opacity-0'
                }`}
                onLoad={() => {
                  setImageLoaded(true)
                  setImageError(false)
                }}
                onError={() => {
                  setImageError(true)
                  setImageLoaded(false)
                }}
                loading="lazy"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
              />
            )}

            {(imageError || !thumbnailUrl) && (
              <div className="absolute inset-0 overflow-hidden bg-[#111]">
                <div className="absolute inset-0 bg-[linear-gradient(145deg,transparent_0%,transparent_32%,#d90614_33%,#d90614_43%,transparent_44%,transparent_62%,rgba(255,255,255,0.08)_63%,rgba(255,255,255,0.08)_69%,transparent_70%)]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ImageIcon className="h-10 w-10 text-white/35" />
                </div>
              </div>
            )}

            <div className="absolute inset-0 flex items-center justify-center bg-black/45 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="flex h-14 w-14 items-center justify-center border border-white/50 bg-p5-red">
                <Play className="h-7 w-7 fill-current text-white" />
              </div>
            </div>
          </>
        )}

        <div className="absolute right-0 top-0 bg-p5-red px-3 py-1.5 text-sm font-black text-white">
          {video.year || new Date(video.created_at).getFullYear()}
        </div>
      </div>

      <div className="bg-white p-4 text-black">
        <h3 className="line-clamp-2 min-h-[44px] text-[16px] font-black leading-snug">
          {dramaName || video.title}
        </h3>
        <p className="mt-2 truncate text-sm font-medium text-black/65">
          {video.competition_name || video.group_name || 'Cosplay 舞台剧'}
        </p>
      </div>
    </div>
  )
}

export default VideoCard
