import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  Clapperboard,
  Crown,
  Loader2,
  MapPin,
  Play,
  Users,
} from 'lucide-react'
import { eventService } from '../services/eventService'
import type { Event, EventVideo } from '../types'

type AdvancingVideo = EventVideo & {
  advancingRegion: string
  advancingEventTitle: string
}

type Finalist = {
  date: string
  session: '上午' | '下午'
  order: number
  category: '小团' | '大团'
  group: string
  drama: string
  aliases?: string[]
}

const FINALISTS: Finalist[] = [
  { date: '7月31日', session: '上午', order: 1, category: '小团', group: '玖伍贰柒制片厂', drama: '十万个冷笑话——冷笑话就是用来吐槽的口牙' },
  { date: '7月31日', session: '上午', order: 2, category: '小团', group: 'OrangeHill', drama: '燕云十六声-去我之名' },
  { date: '7月31日', session: '上午', order: 3, category: '小团', group: 'C.U.again', drama: '光辉岁月' },
  { date: '7月31日', session: '上午', order: 4, category: '小团', group: '星辰梦之都', drama: '苍云·戍梦' },
  { date: '7月31日', session: '上午', order: 5, category: '小团', group: '翡珀翠庭', drama: '都市潮男下乡上电视' },
  { date: '7月31日', session: '下午', order: 6, category: '大团', group: '鉴茶院三处', drama: '我的剑就要姆拉姆拉的出鞘了' },
  { date: '7月31日', session: '下午', order: 7, category: '大团', group: '瓦尔铁钻', drama: '终焉巨至', aliases: ['瓦尔铁砧', '终焉已至'] },
  { date: '7月31日', session: '下午', order: 8, category: '大团', group: '积木之森动漫社', drama: '绝对魔兽战线-巴比伦尼亚' },
  { date: '8月1日', session: '上午', order: 1, category: '小团', group: '江南七院', drama: 'HERO' },
  { date: '8月1日', session: '上午', order: 2, category: '小团', group: '无上苍城', drama: '！你的臣子我笑纳了，你的宠妃我笑纳了，你我也笑纳了！' },
  { date: '8月1日', session: '上午', order: 3, category: '小团', group: '没有苏丹', drama: '苏丹的游戏：阿迪莱' },
  { date: '8月1日', session: '上午', order: 4, category: '小团', group: '玩家国度', drama: '以撒的结合-重生' },
  { date: '8月1日', session: '上午', order: 5, category: '小团', group: '梦日月', drama: '百草传世一卷生光' },
  { date: '8月1日', session: '下午', order: 6, category: '小团', group: '风翼动漫社', drama: '空月之歌' },
  { date: '8月1日', session: '下午', order: 7, category: '大团', group: '在线蹲一个团长', drama: '燕云十六声-归月' },
  { date: '8月1日', session: '下午', order: 8, category: '大团', group: 'Next Stop：AWL Station!', drama: '快醒醒！别睡了！' },
  { date: '8月1日', session: '下午', order: 9, category: '大团', group: 'Crazy', drama: '风云之天命' },
  { date: '8月2日', session: '上午', order: 1, category: '大团', group: '十方阁', drama: '沙漏之诗' },
  { date: '8月2日', session: '上午', order: 2, category: '大团', group: '欢愉之馆', drama: '皮城之上' },
  { date: '8月2日', session: '上午', order: 3, category: '大团', group: '禾必俊', drama: '绣衣天下' },
  { date: '8月2日', session: '下午', order: 4, category: '大团', group: '零落纪', drama: '少女歌剧-未被书写的剧本' },
  { date: '8月2日', session: '下午', order: 5, category: '大团', group: '文武两道', drama: '盗墓笔记' },
  { date: '8月2日', session: '下午', order: 6, category: '大团', group: '联合行动', drama: '估序有炎' },
  { date: '8月3日', session: '上午', order: 1, category: '大团', group: '把子肉烧冬瓜', drama: '燕云十六声·天下声' },
  { date: '8月3日', session: '上午', order: 2, category: '大团', group: 'Happy Ending', drama: '河床与水泡' },
  { date: '8月3日', session: '上午', order: 3, category: '大团', group: '两极反转', drama: '双城之战-时间回响' },
]

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .replace(/[!！:：\s\-—·.。]/g, '')
}

function isChinaJoy2026AdvancingEvent(event: Event) {
  const year = new Date(`${event.start_date}T00:00:00`).getFullYear()
  const text = `${event.competition_name} ${event.title} ${event.region}`
  return year === 2026 && event.stage === 'advancing' && /ChinaJoy|CJ|超级联赛/i.test(text)
}

function findMatchingVideos(finalist: Finalist, videos: AdvancingVideo[]) {
  const groupName = normalizeName(finalist.group)
  const dramaName = normalizeName(finalist.drama)
  const aliases = (finalist.aliases || []).map(normalizeName)

  return videos.filter((video) => {
    const videoText = normalizeName(`${video.group_name || ''} ${video.title || ''}`)
    return videoText.includes(groupName) || videoText.includes(dramaName) || aliases.some((alias) => videoText.includes(alias))
  })
}

export default function ChinaJoy2026FinalistsPage() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    eventService.getAllEvents()
      .then((data) => {
        if (!cancelled) setEvents(data)
      })
      .catch(() => {
        if (!cancelled) setError('复赛视频加载失败，名单仍可查看')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const advancingVideos = useMemo(() => {
    const byId = new Map<string, AdvancingVideo>()

    events
      .filter(isChinaJoy2026AdvancingEvent)
      .flatMap((event) => (event.videos || []).map((video) => ({
        ...video,
        advancingRegion: event.region || event.title,
        advancingEventTitle: event.title,
      })))
      .filter((video) => !video.year || video.year === 2026)
      .forEach((video) => byId.set(video.id, video))

    return Array.from(byId.values())
  }, [events])

  const dates = useMemo(() => Array.from(new Set(FINALISTS.map((item) => item.date))), [])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-8 inline-flex items-center gap-2 bg-black px-4 py-2 font-black text-white shadow-[4px_4px_0_0_#d90614] transition hover:bg-p5-red"
      >
        <ArrowLeft className="h-4 w-4" />
        返回
      </button>

      <section className="relative overflow-hidden border-4 border-black bg-white p-6 text-black shadow-[8px_8px_0_0_#d90614] md:p-10">
        <div className="absolute inset-x-0 top-0 h-2 bg-p5-red" />
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 bg-black px-3 py-1 text-xs font-black text-white">
              <Crown className="h-4 w-4 text-p5-red" />
              2026 ChinaJoy Cosplay 超级联赛
            </div>
            <h1 className="text-3xl font-black leading-tight md:text-5xl">
              晋级全国总决赛名单
            </h1>
            <p className="mt-3 max-w-3xl text-sm font-bold text-gray-600 md:text-base">
              这里集中展示 2026 年 ChinaJoy 晋级决赛社团、决赛节目，以及已关联的复赛比赛视频。
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="border-2 border-black px-4 py-3">
              <div className="text-2xl font-black text-p5-red">{FINALISTS.length}</div>
              <div className="text-xs font-black text-gray-500">晋级社团</div>
            </div>
            <div className="border-2 border-black px-4 py-3">
              <div className="text-2xl font-black text-p5-red">{advancingVideos.length}</div>
              <div className="text-xs font-black text-gray-500">复赛视频</div>
            </div>
            <div className="border-2 border-black px-4 py-3">
              <div className="text-2xl font-black text-p5-red">4</div>
              <div className="text-xs font-black text-gray-500">决赛日程</div>
            </div>
          </div>
        </div>
      </section>

      {loading && (
        <div className="mt-6 flex items-center justify-center gap-2 border-2 border-white/20 bg-black p-4 text-sm font-black text-white">
          <Loader2 className="h-4 w-4 animate-spin text-p5-red" />
          正在匹配复赛关联视频...
        </div>
      )}

      {error && (
        <div className="mt-6 border-2 border-p5-red bg-black p-4 text-sm font-black text-white">
          {error}
        </div>
      )}

      <div className="mt-8 space-y-8">
        {dates.map((date) => (
          <section key={date} className="relative">
            <div className="mb-4 inline-flex items-center gap-2 bg-p5-red px-4 py-2 font-black text-white shadow-[4px_4px_0_0_black]">
              <CalendarDays className="h-5 w-5" />
              {date}
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              {FINALISTS.filter((item) => item.date === date).map((item) => {
                const videos = findMatchingVideos(item, advancingVideos)
                const regions = Array.from(new Set(videos.map((video) => video.advancingRegion).filter(Boolean)))

                return (
                  <article
                    key={`${item.date}-${item.session}-${item.order}-${item.group}`}
                    className="relative h-full bg-white text-black"
                  >
                    <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 bg-black" />
                    <div className="relative flex h-full flex-col border-2 border-black bg-white p-5">
                      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="bg-black px-2 py-1 text-xs font-black text-white">
                            {item.session}
                          </span>
                          <span className="border border-p5-red px-2 py-1 text-xs font-black text-p5-red">
                            {item.category}
                          </span>
                          {regions.length > 0 && regions.map((region) => (
                            <span
                              key={region}
                              className="border border-black bg-white px-2 py-1 text-xs font-black text-black"
                              title="晋级赛区"
                            >
                              {region}
                            </span>
                          ))}
                        </div>
                        <span className="text-sm font-black text-gray-400">#{item.order}</span>
                      </div>

                      <h2 className="flex items-center gap-2 text-xl font-black">
                        <Users className="h-5 w-5 text-p5-red" />
                        {item.group}
                      </h2>
                      <p className="mt-2 flex items-start gap-2 border-l-4 border-p5-red pl-3 text-sm font-bold text-gray-700">
                        <Clapperboard className="mt-0.5 h-4 w-4 shrink-0 text-p5-red" />
                        {item.drama}
                      </p>

                      <div className="mt-auto border-t-2 border-dashed border-gray-300 pt-4">
                        <div className="mb-3 flex items-center gap-2 text-xs font-black text-gray-500">
                          <Play className="h-4 w-4 text-p5-red" />
                          复赛关联视频
                        </div>
                        {videos.length > 0 ? (
                          <div className="space-y-2">
                            {videos.map((video) => (
                              <Link
                                key={video.id}
                                to={`/video/${video.id}`}
                                className="block border border-black bg-black px-3 py-2 text-xs font-black leading-relaxed text-white transition hover:border-p5-red hover:bg-p5-red"
                              >
                                {video.title || video.bv_number}
                              </Link>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 bg-gray-100 px-3 py-2 text-xs font-bold text-gray-500">
                            <MapPin className="h-4 w-4" />
                            暂未匹配到已关联复赛视频
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
