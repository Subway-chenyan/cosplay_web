import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store/store'
import { fetchGroupVideos } from '../store/slices/videosSlice'
import { fetchAwardRecords } from '../store/slices/awardsSlice'
import { groupService } from '../services/groupService'
import VideoCard from '../components/VideoCard'
import NoVideoAwardCard from '../components/NoVideoAwardCard'
import {
  ArrowLeft,
  MapPin,
  Calendar,
  ExternalLink,
  Users,
  Trophy,
  Award,
  Globe,
  Medal,
  Star,
  // X
} from 'lucide-react'

function GroupDetailPage() {
  const { id } = useParams<{ id: string }>()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { groups } = useSelector((state: RootState) => state.groups)
  const { videos } = useSelector((state: RootState) => state.videos)
  const { awardRecords } = useSelector((state: RootState) => state.awards)

  const [currentGroup, setCurrentGroup] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadGroup = async () => {
      if (!id) return

      setLoading(true)

      // 首先尝试从已加载的社团中查找
      const existingGroup = groups.find(g => g.id === id)
      if (existingGroup) {
        setCurrentGroup(existingGroup)
      } else {
        // 如果找不到，则从API获取
        try {
          const groupData = await groupService.getGroupById(id)
          setCurrentGroup(groupData)
        } catch (error) {
          console.error('获取社团详情失败:', error)
        }
      }

      setLoading(false)
    }

    loadGroup()
  }, [id, groups])

  useEffect(() => {
    if (id) {
      dispatch(fetchGroupVideos({ groupId: id }) as any)
      dispatch(fetchAwardRecords({ group: id, page_size: 100 }) as any)
    }
  }, [dispatch, id])

  const group = currentGroup

  // 获取该社团的所有视频（使用API直接获取的数据）
  // 由于我们使用了fetchGroupVideos，这些视频已经是该社团的了
  const groupVideos = videos

  // 调试信息
  console.log('社团ID:', id)
  console.log('社团视频数量:', groupVideos.length)
  console.log('社团视频:', groupVideos.map(v => ({ id: v.id, title: v.title, group: v.group, group_name: v.group_name })))

  // 获取该社团获得的奖项，按年份从小到大排序
  const groupAwards = awardRecords
    .filter(awardRecord => awardRecord.group === id)
    .sort((a, b) => {
      const yearA = parseInt(String(a.competition_year || '0'), 10)
      const yearB = parseInt(String(b.competition_year || '0'), 10)
      return yearA - yearB
    })

  // 获取获奖视频
  const awardedVideos = groupVideos.filter(video =>
    groupAwards.some(awardRecord => awardRecord.video === video.id)
  )

  // 获取无视频的获奖记录（已排序）
  const awardRecordsWithoutVideo = groupAwards.filter(awardRecord =>
    !awardRecord.video
  )

  // 根据奖项名称创建奖项信息（动态生成）
  const createAwardInfo = (name: string) => {
    const lowerName = name.toLowerCase()

    // 根据奖项名称动态生成样式
    if (lowerName.includes('金') || lowerName.includes('gold') || lowerName.includes('一等奖')) {
      return {
        label: name,
        color: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        borderColor: 'border-yellow-200',
        icon: <Trophy className="w-5 h-5 text-yellow-600" />
      }
    } else if (lowerName.includes('银') || lowerName.includes('silver') || lowerName.includes('二等奖')) {
      return {
        label: name,
        color: 'bg-gray-100',
        textColor: 'text-gray-800',
        borderColor: 'border-gray-200',
        icon: <Medal className="w-5 h-5 text-gray-600" />
      }
    } else if (lowerName.includes('铜') || lowerName.includes('bronze') || lowerName.includes('三等奖')) {
      return {
        label: name,
        color: 'bg-orange-100',
        textColor: 'text-orange-800',
        borderColor: 'border-orange-200',
        icon: <Award className="w-5 h-5 text-orange-600" />
      }
    } else if (lowerName.includes('特别') || lowerName.includes('special') || lowerName.includes('优秀')) {
      return {
        label: name,
        color: 'bg-purple-100',
        textColor: 'text-purple-800',
        borderColor: 'border-purple-200',
        icon: <Star className="w-5 h-5 text-purple-600" />
      }
    } else if (lowerName.includes('最佳')) {
      return {
        label: name,
        color: 'bg-blue-100',
        textColor: 'text-blue-800',
        borderColor: 'border-blue-200',
        icon: <Trophy className="w-5 h-5 text-blue-600" />
      }
    } else {
      // 默认样式
      return {
        label: name,
        color: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-200',
        icon: <Award className="w-5 h-5 text-green-600" />
      }
    }
  }

  // 获取其他视频（非获奖视频）
  // const otherVideos = groupVideos.filter(video => 
  //   !groupAwards.some(awardRecord => awardRecord.video === video.id)
  // )

  // const formatDate = (dateString: string) => {
  //   return new Date(dateString).toLocaleDateString('zh-CN')
  // }

  const handleVideoClick = (videoId: string) => {
    navigate(`/video/${videoId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">正在加载社团信息...</p>
        </div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="relative p-20 text-center group/no-results overflow-hidden">
        <div className="absolute inset-0 bg-black transform -skew-y-1 z-0 border-y-8 border-p5-red shadow-2xl"></div>
        <div className="p5-halftone absolute inset-0 opacity-10 pointer-events-none"></div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="bg-white p-6 transform rotate-12 border-4 border-black shadow-[8px_8px_0_0_#d90614] mb-8">
            <Users className="w-20 h-20 text-black transform -rotate-12" />
          </div>
          <h3 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-4" style={{ textShadow: '4px 4px 0px #d90614' }}>
            目标失踪 / TARGET MISSING
          </h3>
          <p className="bg-p5-red text-white px-8 py-2 font-black uppercase italic transform -skew-x-12 border-2 border-white mb-8">
            数据库中不存在该社团 / DATA ERROR
          </p>
          <Link to="/groups" className="btn-secondary">
            返回列表 / BACK TO ALLIANCE
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 返回按钮 */}
      <div className="flex items-center">
        <Link
          to="/groups"
          className="group flex items-center bg-black text-white px-4 py-2 transform -skew-x-12 hover:bg-p5-red transition-all shadow-[4px_4px_0_0_rgba(0,0,0,0.2)]"
        >
          <span className="flex items-center transform skew-x-12">
            <ArrowLeft className="w-5 h-5 mr-2" />
            <span className="font-black uppercase italic">返回列表 / BACK TO ALLIANCE</span>
          </span>
        </Link>
      </div>

      {/* 社团头部信息 */}
      <div className="bg-white border-4 border-black p-6 md:p-10 shadow-[8px_8px_0_0_black] relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 p5-halftone opacity-10 -rotate-12 translate-x-16 -translate-y-16"></div>

        <div className="flex flex-col md:flex-row md:items-start space-y-6 md:space-y-0 md:space-x-10 relative z-10">
          {/* 社团Logo和名称 - 移动端水平布局 */}
          <div className="flex items-center space-x-6 md:flex-col md:space-x-0 md:space-y-4">
            <div className="w-20 h-20 md:w-32 md:h-32 bg-p5-red transform rotate-6 border-4 border-black shadow-[4px_4px_0_0_black] overflow-hidden flex-shrink-0">
              {group.logo ? (
                <img
                  src={group.logo}
                  alt={group.name}
                  className="w-full h-full object-cover transform -rotate-6 scale-125"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center transform -rotate-6">
                  <span className="text-white font-black text-4xl md:text-6xl uppercase italic">
                    {group.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 md:text-center">
              <h1 className="text-3xl md:text-5xl font-black text-black uppercase italic leading-none transform -skew-x-6 mb-2" style={{ textShadow: '3px 3px 0px #d90614' }}>
                {group.name}
              </h1>
            </div>
          </div>

          {/* 社团基本信息 */}
          <div className="flex-1 min-w-0">
            {group.location && (
              <div className="flex items-center text-gray-600 mb-3">
                <MapPin className="w-5 h-5 mr-2" />
                <span className="text-base md:text-lg">{group.location}</span>
              </div>
            )}

            <p className="text-gray-700 text-base md:text-lg leading-relaxed mb-4">
              {group.description}
            </p>

            {/* 社团统计 */}
            {/* <div className="grid grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">{group.member_count}</div>
                <div className="text-gray-600">成员</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary-600">{groupVideos.length}</div>
                <div className="text-gray-600">视频</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{groupAwards.length}</div>
                <div className="text-gray-600">获奖</div>
              </div>
            </div> */}

            {/* 成立时间 */}
            {group.founded_date && (
              <div className="flex items-center text-gray-600 mb-4">
                <Calendar className="w-5 h-5 mr-2" />
                <span>始建于 {new Date(group.founded_date).getFullYear()}年 / ESTABLISHED</span>
              </div>
            )}

            {/* 社交媒体链接 */}
            <div className="flex items-center space-x-4">
              {group.website && (
                <a
                  href={group.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  <span>官方网站</span>
                </a>
              )}

              {group.bilibili && (
                <a
                  href={group.bilibili}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <div className="w-4 h-4 bg-white rounded text-pink-500 text-xs font-bold flex items-center justify-center">
                    B
                  </div>
                  <span>哔哩哔哩</span>
                </a>
              )}

              {group.weibo && (
                <a
                  href={group.weibo}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>微博</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 获奖作品 */}
      {(awardedVideos.length > 0 || awardRecordsWithoutVideo.length > 0) && (
        <div className="relative group">
          <div className="absolute inset-0 bg-black transform translate-x-2 translate-y-2 -skew-x-1 z-0"></div>
          <div className="relative z-10 bg-white border-4 border-black p-6 md:p-10 transform -skew-x-1">
            <div className="flex items-center space-x-4 mb-8 transform skew-x-1">
              <div className="bg-p5-red p-3 transform rotate-12 border-2 border-black shadow-[4px_4px_0_0_black]">
                <Trophy className="w-8 h-8 text-white transform -rotate-12" />
              </div>
              <h2 className="text-3xl font-black text-black uppercase italic border-b-8 border-p5-red">
                历战功绩 / ACCOMPLISHMENTS
              </h2>
            </div>

            <div className="space-y-10 transform skew-x-1">
              {/* 有视频的获奖记录 */}
              {groupAwards.filter(awardRecord => awardRecord.video).map((awardRecord) => {
                const awardVideo = awardedVideos.find(v => v.id === awardRecord.video)
                if (!awardVideo) return null

                const awardInfo = createAwardInfo(awardRecord.award_name || '获奖记录')

                return (
                  <div key={awardRecord.id} className="relative group/award">
                    <div className="absolute inset-0 bg-black opacity-5 transform translate-x-1 translate-y-1 -skew-x-2 z-0"></div>
                    <div className={`relative z-10 border-l-8 ${awardInfo.borderColor.replace('border-', 'border-')} p-6 bg-gray-50 transform -skew-x-2`}>
                      <div className="flex flex-col md:flex-row items-start md:space-x-8 transform skew-x-2">
                        <div className="flex-1 min-w-0 mb-6 md:mb-0">
                          <div className="mb-4">
                            <h3 className={`text-2xl font-black uppercase italic mb-2`} style={{ color: '#d90614' }}>
                              {awardRecord.award_name || 'AWARD SECURED'}
                            </h3>
                            <div className="flex flex-wrap gap-3">
                              <span className={`inline-flex items-center px-3 py-1 bg-black text-white font-black text-xs uppercase italic transform -skew-x-12`}>
                                <span className="transform skew-x-12">{awardRecord.competition_name || ''}</span>
                              </span>
                              <span className="inline-flex items-center px-3 py-1 border-2 border-black font-black text-xs uppercase italic transform -skew-x-12">
                                <span className="transform skew-x-12">{awardRecord.competition_year || 'YEAR'}年</span>
                              </span>
                            </div>
                          </div>

                          {awardRecord.description && (
                            <p className="text-black font-bold italic border-l-4 border-gray-300 pl-4 mb-4">{awardRecord.description}</p>
                          )}
                        </div>

                        <div className="w-full md:w-80 flex-shrink-0">
                          <div className="relative group/video">
                            <div className="absolute inset-0 bg-black transform translate-x-2 translate-y-2 z-0"></div>
                            <div className="relative z-10">
                              <VideoCard
                                video={awardVideo}
                                onClick={() => handleVideoClick(awardVideo.id)}
                              />
                            </div>
                            {/* 奖项标识 */}
                            <div className={`absolute top-0 right-0 z-20 bg-p5-red text-white p-2 transform rotate-12 border-2 border-black shadow-[2px_2px_0_0_black]`}>
                              {awardInfo.icon}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}

              {/* 无视频的获奖记录 */}
              {awardRecordsWithoutVideo.map((awardRecord) => {
                const awardInfo = createAwardInfo(awardRecord.award_name || '获奖记录')

                return (
                  <div key={awardRecord.id} className="relative group/award">
                    <div className="absolute inset-0 bg-black opacity-5 transform translate-x-1 translate-y-1 -skew-x-2 z-0"></div>
                    <div className={`relative z-10 border-l-8 border-gray-400 p-6 bg-gray-50 transform -skew-x-2`}>
                      <div className="transform skew-x-2">
                        <h3 className="text-xl font-black text-black uppercase italic mb-3">
                          {awardRecord.award_name || 'OFF-SCREEN AWARD'}
                        </h3>
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="bg-black text-white px-2 py-1 text-xs font-black uppercase italic transform -skew-x-12">
                            <span className="transform skew-x-12">{awardRecord.competition_name || ''}</span>
                          </span>
                          <span className="border-2 border-black px-2 py-1 text-xs font-black italic transform -skew-x-12">
                            <span className="transform skew-x-12">{awardRecord.competition_year || 'YEAR'}年</span>
                          </span>
                        </div>
                        <div className="bg-white border-2 border-black p-4 italic font-bold">
                          <NoVideoAwardCard
                            awardRecord={awardRecord}
                            awardInfo={awardInfo}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* 所有舞台剧视频 */}
      {groupVideos.length > 0 && (
        <div className="relative group mt-12">
          <div className="absolute inset-0 bg-p5-red opacity-10 transform translate-x-2 translate-y-2 -skew-x-1 z-0"></div>
          <div className="relative z-10 bg-white border-4 border-black p-8 shadow-[8px_8px_0_0_black]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-black text-black uppercase italic border-b-8 border-black">
                行动记录 / FIELD LOGS ({groupVideos.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {groupVideos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  onClick={() => handleVideoClick(video.id)}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 空状态 */}
      {groupVideos.length === 0 && (
        <div className="relative p-20 text-center group/no-results overflow-hidden mt-12">
          <div className="absolute inset-0 bg-white transform -skew-y-1 z-0 border-y-8 border-p5-red shadow-lg"></div>
          <div className="p5-halftone absolute inset-0 opacity-10 pointer-events-none"></div>

          <div className="relative z-10 flex flex-col items-center">
            <h3 className="text-4xl font-black text-black uppercase italic tracking-tighter mb-4" style={{ textShadow: '4px 4px 0px #d90614' }}>
              尚无行动记录 / NO DATA CAPTURED
            </h3>
            <p className="bg-black text-white px-8 py-2 font-black uppercase italic transform -skew-x-12 border-2 border-p5-red">
              该社团暂无视频存档 / DATABASE CLEAR
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default GroupDetailPage