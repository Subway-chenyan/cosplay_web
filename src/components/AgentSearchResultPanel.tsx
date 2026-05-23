import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Award, Medal, Play, Sparkles, Trophy, Users } from 'lucide-react'
import DOMPurify from 'dompurify'
import VideoCard from './VideoCard'
import ClubCard from './ClubCard'
import type {
  AgentLeaderboardItem,
  AgentSearchResponse,
  AgentVideoGridItem,
  GroupDetailItem,
} from '../services/agentService'

interface AgentSearchResultPanelProps {
  result: AgentSearchResponse
}

function uniqueById<T extends { id?: string }>(items: Array<T | null | undefined>): T[] {
  const seen = new Set<string>()
  const output: T[] = []
  items.forEach((item) => {
    if (!item?.id || seen.has(item.id)) return
    seen.add(item.id)
    output.push(item)
  })
  return output
}

function isLeaderboardItem(item: AgentVideoGridItem | AgentLeaderboardItem): item is AgentLeaderboardItem {
  return Boolean((item as AgentLeaderboardItem).metrics && (item as AgentLeaderboardItem).group)
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderInlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
}

function markdownToHtml(markdown: string) {
  const lines = markdown.replace(/\r\n/g, '\n').split('\n')
  const html: string[] = []
  let listType: 'ul' | 'ol' | null = null

  const closeList = () => {
    if (listType) {
      html.push(`</${listType}>`)
      listType = null
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim()
    if (!line) {
      closeList()
      continue
    }
    if (/^-{3,}$/.test(line)) {
      closeList()
      html.push('<hr />')
      continue
    }
    const heading = /^(#{1,3})\s+(.+)$/.exec(line)
    if (heading) {
      closeList()
      const level = heading[1].length
      html.push(`<h${level}>${renderInlineMarkdown(heading[2])}</h${level}>`)
      continue
    }
    const bullet = /^[-*]\s+(.+)$/.exec(line)
    if (bullet) {
      if (listType !== 'ul') {
        closeList()
        html.push('<ul>')
        listType = 'ul'
      }
      html.push(`<li>${renderInlineMarkdown(bullet[1])}</li>`)
      continue
    }
    const ordered = /^\d+[.)]\s+(.+)$/.exec(line)
    if (ordered) {
      if (listType !== 'ol') {
        closeList()
        html.push('<ol>')
        listType = 'ol'
      }
      html.push(`<li>${renderInlineMarkdown(ordered[1])}</li>`)
      continue
    }
    closeList()
    html.push(`<p>${renderInlineMarkdown(line)}</p>`)
  }

  closeList()
  return DOMPurify.sanitize(html.join(''))
}

function AgentSearchResultPanel({ result }: AgentSearchResultPanelProps) {
  const navigate = useNavigate()
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null)

  const leaderboardItems = useMemo(
    () => result.data.filter(isLeaderboardItem),
    [result.data]
  )

  const gridItems = useMemo(
    () => result.data.filter((item): item is AgentVideoGridItem => !isLeaderboardItem(item)),
    [result.data]
  )

  const activeLeaderboardItem = useMemo(() => {
    if (!leaderboardItems.length) return null
    return leaderboardItems.find((item) => item.group.id === activeGroupId) || leaderboardItems[0]
  }, [activeGroupId, leaderboardItems])

  const videos = useMemo(() => {
    if (result.ui_type === 'award_leaderboard' && activeLeaderboardItem) {
      return uniqueById(activeLeaderboardItem.videos)
    }
    return uniqueById(gridItems.map((item) => item.video))
  }, [activeLeaderboardItem, gridItems, result.ui_type])

  const groups = useMemo(() => {
    if (result.ui_type === 'award_leaderboard') {
      return leaderboardItems.map((item) => item.group)
    }
    return uniqueById(gridItems.map((item) => item.group))
  }, [gridItems, leaderboardItems, result.ui_type])

  const awardRows = useMemo(() => {
    if (result.ui_type === 'award_leaderboard' && activeLeaderboardItem) {
      return activeLeaderboardItem.award_records
    }
    return gridItems.map((item) => item.award_record).filter(Boolean)
  }, [activeLeaderboardItem, gridItems, result.ui_type])

  const isGroupDetail = result.ui_type === 'group_detail'

  const groupDetailItems = useMemo(
    () => (isGroupDetail ? (result.data as GroupDetailItem[]) : []),
    [result.data, isGroupDetail],
  )

  const groupStats = useMemo(() => ({
    groupCount: groupDetailItems.length,
    videoCount: groupDetailItems.reduce((sum, item) => sum + item.videos.length, 0),
    awardCount: groupDetailItems.reduce((sum, item) => sum + item.award_records.length, 0),
  }), [groupDetailItems])

  const summaryHtml = useMemo(
    () => markdownToHtml(result.summary || result.text || ''),
    [result.summary, result.text]
  )

  return (
    <section className="relative mt-10">
      <div className="absolute inset-0 bg-black translate-x-2 translate-y-2 z-0"></div>
      <div className="relative z-10 bg-white border-4 border-black p-5 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-6">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 bg-black text-white px-3 py-1 border-2 border-p5-red font-black text-xs mb-3">
              <Sparkles className="w-4 h-4 text-p5-red" />
              <span>智能检索</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-black text-black leading-tight border-b-8 border-p5-red inline-block">
              {result.title}
            </h2>
            {summaryHtml && (
              <div
                className="agent-markdown mt-4 max-w-4xl text-sm md:text-base font-bold text-gray-700"
                dangerouslySetInnerHTML={{ __html: summaryHtml }}
              />
            )}
          </div>

          <div className="grid grid-cols-3 gap-2 text-center min-w-60">
            <div className="bg-black text-white border-2 border-p5-red px-3 py-2">
              <div className="text-2xl font-black">{isGroupDetail ? groupStats.groupCount : groups.length}</div>
              <div className="text-xs font-black text-gray-300">团队</div>
            </div>
            <div className="bg-p5-red text-white border-2 border-black px-3 py-2">
              <div className="text-2xl font-black">{isGroupDetail ? groupStats.videoCount : videos.length}</div>
              <div className="text-xs font-black">视频</div>
            </div>
            <div className="bg-white text-black border-2 border-black px-3 py-2">
              <div className="text-2xl font-black">{isGroupDetail ? groupStats.awardCount : awardRows.length}</div>
              <div className="text-xs font-black">获奖</div>
            </div>
          </div>
        </div>

        {result.ui_type === 'award_leaderboard' && leaderboardItems.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="w-7 h-7 text-p5-red" />
              <h3 className="text-xl md:text-2xl font-black text-black">荣誉榜单</h3>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {leaderboardItems.map((item, index) => {
                const isActive = item.group.id === activeLeaderboardItem?.group.id
                return (
                  <button
                    key={item.group.id}
                    type="button"
                    onClick={() => setActiveGroupId(item.group.id)}
                    className={`text-left border-4 p-4 transition-all ${
                      isActive
                        ? 'bg-black text-white border-p5-red shadow-[6px_6px_0_0_#d90614]'
                        : 'bg-white text-black border-black hover:border-p5-red'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 bg-p5-red text-white border-2 border-white flex items-center justify-center font-black">
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-lg truncate">{item.group.name}</div>
                          <div className={`text-xs font-bold ${isActive ? 'text-gray-300' : 'text-gray-600'}`}>
                            {item.group.location || item.group.province || '未知地区'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-3xl font-black text-p5-red">
                          {item.metrics.gold_award_count || 0}
                        </div>
                        <div className="text-xs font-black">金奖</div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {isGroupDetail && groupDetailItems.length > 0 && (
          <div className="space-y-10">
            {groupDetailItems.map((item) => (
              <div key={item.group.id} className="border-4 border-black p-4 md:p-6 bg-gray-50">
                {/* Group card */}
                <div className="mb-6 max-w-sm">
                  <ClubCard
                    club={item.group}
                    onClick={() => navigate(`/group/${item.group.id}`)}
                  />
                </div>

                {/* Award-winning videos */}
                {item.videos.length > 0 && (
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Play className="w-6 h-6 text-p5-red" />
                      <h3 className="text-xl font-black text-black">获奖视频</h3>
                      <span className="text-sm font-bold text-gray-500">（{item.videos.length} 个）</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {item.videos.map((video) => (
                        <VideoCard
                          key={video.id}
                          video={video}
                          onClick={() => navigate(`/video/${video.id}`)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Award records */}
                {item.award_records.length > 0 && (
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <Medal className="w-6 h-6 text-p5-red" />
                      <h3 className="text-xl font-black text-black">获奖记录</h3>
                      <span className="text-sm font-bold text-gray-500">（{item.award_records.length} 条）</span>
                    </div>
                    <div className="overflow-x-auto border-2 border-black">
                      <table className="min-w-full bg-white text-sm">
                        <thead className="bg-black text-white">
                          <tr>
                            <th className="px-4 py-3 text-left font-black">奖项</th>
                            <th className="px-4 py-3 text-left font-black">赛事</th>
                            <th className="px-4 py-3 text-left font-black">年份</th>
                            <th className="px-4 py-3 text-left font-black">剧目</th>
                          </tr>
                        </thead>
                        <tbody>
                          {item.award_records.map((record, index) => (
                            <tr key={record.id || index} className="border-t-2 border-black odd:bg-gray-50">
                              <td className="px-4 py-3 font-black text-p5-red">
                                <span className="inline-flex items-center gap-2">
                                  <Award className="w-4 h-4" />
                                  {record.award_name || '未知奖项'}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-bold">{record.competition_name || '未知赛事'}</td>
                              <td className="px-4 py-3 font-bold">{record.competition_year || '-'}</td>
                              <td className="px-4 py-3 font-bold">{record.drama_name || record.video_title || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {groups.length > 0 && result.ui_type !== 'video_grid' && !isGroupDetail && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-7 h-7 text-p5-red" />
              <h3 className="text-xl md:text-2xl font-black text-black">相关团队</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {groups.map((group) => (
                <ClubCard
                  key={group.id}
                  club={group}
                  onClick={() => navigate(`/group/${group.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {videos.length > 0 && !isGroupDetail && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Play className="w-7 h-7 text-p5-red" />
              <h3 className="text-xl md:text-2xl font-black text-black">相关视频</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onClick={() => navigate(`/video/${video.id}`)}
                />
              ))}
            </div>
          </div>
        )}

        {awardRows.length > 0 && !isGroupDetail && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Medal className="w-7 h-7 text-p5-red" />
              <h3 className="text-xl md:text-2xl font-black text-black">获奖记录</h3>
            </div>
            <div className="overflow-x-auto border-2 border-black">
              <table className="min-w-full bg-white text-sm">
                <thead className="bg-black text-white">
                  <tr>
                    <th className="px-4 py-3 text-left font-black">奖项</th>
                    <th className="px-4 py-3 text-left font-black">团队</th>
                    <th className="px-4 py-3 text-left font-black">赛事</th>
                    <th className="px-4 py-3 text-left font-black">年份</th>
                    <th className="px-4 py-3 text-left font-black">剧目</th>
                  </tr>
                </thead>
                <tbody>
                  {awardRows.map((record, index) => (
                    <tr key={record?.id || index} className="border-t-2 border-black odd:bg-gray-50">
                      <td className="px-4 py-3 font-black text-p5-red">
                        <span className="inline-flex items-center gap-2">
                          <Award className="w-4 h-4" />
                          {record?.award_name || '未知奖项'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-bold">{record?.group_name || '未知团队'}</td>
                      <td className="px-4 py-3 font-bold">{record?.competition_name || '未知赛事'}</td>
                      <td className="px-4 py-3 font-bold">{record?.competition_year || '-'}</td>
                      <td className="px-4 py-3 font-bold">{record?.drama_name || record?.video_title || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {isGroupDetail && groupDetailItems.length === 0 && (
          <div className="bg-black text-white border-4 border-p5-red p-8 text-center font-black">
            {result.summary || '没有找到可以展示的结构化结果'}
          </div>
        )}
        {!isGroupDetail && !videos.length && !groups.length && !awardRows.length && (
          <div className="bg-black text-white border-4 border-p5-red p-8 text-center font-black">
            {result.summary || '没有找到可以展示的结构化结果'}
          </div>
        )}
      </div>
    </section>
  )
}

export default AgentSearchResultPanel
