import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store/store'
import { fetchGroupVideos } from '../store/slices/videosSlice'
import { fetchAwardRecords } from '../store/slices/awardsSlice'
import { groupService } from '../services/groupService'
import VideoCard from '../components/VideoCard'
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  ExternalLink, 
  Users,
  Trophy,
  Award,
  Globe
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
    }
    if (awardRecords.length === 0) {
      dispatch(fetchAwardRecords() as any)
    }
  }, [dispatch, id, awardRecords.length])

  const group = currentGroup
  
  // 获取该社团的所有视频（使用API直接获取的数据）
  // 由于我们使用了fetchGroupVideos，这些视频已经是该社团的了
  const groupVideos = videos

  // 调试信息
  console.log('社团ID:', id)
  console.log('社团视频数量:', groupVideos.length)
  console.log('社团视频:', groupVideos.map(v => ({ id: v.id, title: v.title, group: v.group, group_name: v.group_name })))

  // 获取该社团获得的奖项
  const groupAwards = awardRecords.filter(awardRecord => 
    awardRecord.group === id
  )

  // 获取获奖视频
  const awardedVideos = groupVideos.filter(video => 
    groupAwards.some(awardRecord => awardRecord.video === video.id)
  )

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
      <div className="text-center py-12">
        <div className="bg-gray-50 rounded-lg p-8 max-w-md mx-auto">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">社团未找到</h3>
          <p className="text-gray-600 mb-4">请检查社团链接是否正确</p>
          <Link to="/groups" className="btn-primary">
            返回社团列表
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
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回社团列表</span>
        </Link>
      </div>

      {/* 社团头部信息 */}
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="flex items-start space-x-6">
          {/* 社团Logo */}
          <div className="w-24 h-24 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
            {group.logo ? (
              <img
                src={group.logo}
                alt={group.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center">
                <span className="text-white font-bold text-3xl">
                  {group.name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* 社团名称 */}
          <div className="text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              {group.name}
            </h1>
          </div>

          {/* 社团基本信息 */}
          <div className="flex-1 min-w-0">
            {group.location && (
              <div className="flex items-center text-gray-600 mb-3">
                <MapPin className="w-5 h-5 mr-2" />
                <span className="text-lg">{group.location}</span>
              </div>
            )}

            <p className="text-gray-700 text-lg leading-relaxed mb-4">
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
                <span>成立于 {new Date(group.founded_date).getFullYear()}年</span>
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
      {awardedVideos.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-bold text-gray-900">获奖作品</h2>
          </div>

          <div className="space-y-6">
            {groupAwards.map((awardRecord) => {
              const awardVideo = awardedVideos.find(v => v.id === awardRecord.video)
              if (!awardVideo) return null

              return (
                <div key={awardRecord.id} className="border border-yellow-200 rounded-lg p-4 bg-yellow-50">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center">
                        <Award className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-yellow-800">{awardRecord.award_name || '获奖记录'}</h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          {awardRecord.competition_name || ''}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {awardRecord.competition_year_detail?.year || '未知年份'}年
                        </span>
                      </div>
                      
                      {awardRecord.description && (
                        <p className="text-yellow-700 text-sm mb-3">{awardRecord.description}</p>
                      )}
                      
                      <div className="bg-white rounded-lg p-3 border border-yellow-200">
                        <h4 className="font-medium text-gray-900 mb-2">获奖视频</h4>
                        <div className="max-w-sm">
                          <VideoCard
                            video={awardVideo}
                            onClick={() => handleVideoClick(awardVideo.id)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 所有舞台剧视频 */}
      {groupVideos.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              舞台剧视频 ({groupVideos.length})
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {groupVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onClick={() => handleVideoClick(video.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* 空状态 */}
      {groupVideos.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无视频作品</h3>
            <p className="text-gray-600">该社团还没有发布任何舞台剧视频</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default GroupDetailPage