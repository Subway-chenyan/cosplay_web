import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store/store'
import { fetchCompetitions } from '../store/slices/competitionsSlice'
import { fetchCompetitionVideos } from '../store/slices/videosSlice'
import { fetchCompetitionAwards, fetchCompetitionAwardRecords } from '../store/slices/awardsSlice'
import { fetchGroups } from '../store/slices/groupsSlice'
import VideoCard from '../components/VideoCard'
import { 
  ArrowLeft, 
  Trophy, 
  Award,
  Calendar,
  Users,
  Play,
  Medal,
  Star,
  ChevronRight
} from 'lucide-react'

function CompetitionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { competitions } = useSelector((state: RootState) => state.competitions)
  const { videos } = useSelector((state: RootState) => state.videos)
  const { competitionAwards, awardRecords } = useSelector((state: RootState) => state.awards)
  const { groups } = useSelector((state: RootState) => state.groups)

  useEffect(() => {
    if (competitions.length === 0) {
      dispatch(fetchCompetitions() as any)
    }
    if (groups.length === 0) {
      dispatch(fetchGroups() as any)
    }
  }, [dispatch, competitions.length, groups.length])

  // 获取比赛数据
  useEffect(() => {
    if (id) {
      dispatch(fetchCompetitionVideos({ competitionId: id }) as any)
      dispatch(fetchCompetitionAwards(id) as any)
      dispatch(fetchCompetitionAwardRecords({ competitionId: id }) as any)
    }
  }, [dispatch, id])

  const competition = competitions.find(c => c.id === id)
  
  // 获取该比赛的所有视频（通过比赛ID筛选）
  const competitionVideos = videos.filter(video => 
    video.competition === competition?.id
  )

  const handleVideoClick = (videoId: string) => {
    navigate(`/video/${videoId}`)
  }

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

  // 获取获奖视频
  const getAwardedVideos = () => {
    const awardedVideos: { [awardId: string]: { award: any; videos: any[] } } = {}
    
    competitionAwards.forEach(award => {
      const videosForAward = competitionVideos.filter(video => {
        const awardRecord = awardRecords.find(record => 
          record.video === video.id && record.award === award.id
        )
        return awardRecord !== undefined
      })
      
      if (videosForAward.length > 0) {
        awardedVideos[award.id] = {
          award,
          videos: videosForAward
        }
      }
    })
    
    return awardedVideos
  }

  // 获取未获奖视频
  const getUnawardedVideos = () => {
    return competitionVideos.filter(video => {
      const hasAward = awardRecords.some(record => record.video === video.id)
      return !hasAward
    })
  }

  const awardedVideos = getAwardedVideos()
  const unawardedVideos = getUnawardedVideos()

  if (!competition) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-50 rounded-lg p-8 max-w-md mx-auto">
          <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">比赛未找到</h3>
          <p className="text-gray-600 mb-4">请检查比赛链接是否正确</p>
          <Link to="/competitions" className="btn-primary">
            返回比赛列表
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* 返回按钮 */}
      <div className="flex items-center">
        <Link
          to="/competitions"
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回比赛列表</span>
        </Link>
      </div>

      {/* 比赛头部信息 */}
      <div className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-2xl text-white p-8 shadow-xl">
        <div className="text-center">
          <div className="w-24 h-24 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-5xl font-bold mb-4">{competition.name}</h1>
          <div className="flex items-center justify-center space-x-3 text-yellow-100 mb-6">
            <Calendar className="w-6 h-6" />
            <span className="text-2xl font-semibold">{competition.year}年</span>
          </div>
          
          <p className="text-xl text-yellow-100 max-w-3xl mx-auto leading-relaxed mb-8">
            {competition.description}
          </p>

          {/* 比赛统计 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white bg-opacity-15 rounded-xl p-6 backdrop-blur-sm">
              <div className="text-4xl font-bold mb-2">{competitionAwards.length}</div>
              <div className="text-yellow-100 text-lg">设置奖项</div>
            </div>
            <div className="bg-white bg-opacity-15 rounded-xl p-6 backdrop-blur-sm">
              <div className="text-4xl font-bold mb-2">{competitionVideos.length}</div>
              <div className="text-yellow-100 text-lg">参赛作品</div>
            </div>
            <div className="bg-white bg-opacity-15 rounded-xl p-6 backdrop-blur-sm">
              <div className="text-4xl font-bold mb-2">{Object.keys(awardedVideos).length}</div>
              <div className="text-yellow-100 text-lg">获奖作品</div>
            </div>
            <div className="bg-white bg-opacity-15 rounded-xl p-6 backdrop-blur-sm">
              <div className="text-4xl font-bold mb-2">{unawardedVideos.length}</div>
              <div className="text-yellow-100 text-lg">参与作品</div>
            </div>
          </div>
        </div>
      </div>

      {/* 获奖作品展示 */}
      {Object.keys(awardedVideos).length > 0 && (
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <Trophy className="w-6 h-6 text-yellow-600" />
            <h2 className="text-2xl font-bold text-gray-900">获奖作品</h2>
          </div>
          
          {Object.entries(awardedVideos).map(([awardId, { award, videos }]) => {
            const awardInfo = createAwardInfo(award.name)
            return (
              <div key={awardId} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                {/* 奖项标题 */}
                <div className={`p-6 ${awardInfo.color} border-b ${awardInfo.borderColor}`}>
                  <div className="flex items-center space-x-3">
                    {awardInfo.icon}
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{awardInfo.label}</h3>
                      {award.description && (
                        <p className="text-gray-600 mt-1">{award.description}</p>
                      )}
                    </div>
                    <div className="ml-auto">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${awardInfo.color} ${awardInfo.textColor}`}>
                        {videos.length} 个作品
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* 视频网格 */}
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {videos.map((video) => (
                      <div key={video.id} className="relative">
                        <VideoCard
                          video={video}
                          onClick={() => handleVideoClick(video.id)}
                        />
                        {/* 奖项标识 */}
                        <div className={`absolute top-2 right-2 ${awardInfo.color} rounded-lg px-2 py-1 flex items-center space-x-1 shadow-sm backdrop-blur-sm`}>
                          {awardInfo.icon}
                          <span className={`text-xs font-medium ${awardInfo.textColor}`}>
                            {awardInfo.label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 参与作品展示 */}
      {unawardedVideos.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          {/* 标题 */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
            <div className="flex items-center space-x-3">
              <Users className="w-6 h-6 text-blue-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-900">参与作品</h2>
                <p className="text-gray-600">其他参赛的优秀作品</p>
              </div>
              <div className="ml-auto">
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {unawardedVideos.length} 个作品
                </span>
              </div>
            </div>
          </div>
          
          {/* 视频网格 */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {unawardedVideos.map((video) => (
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
      {competitionVideos.length === 0 && (
        <div className="text-center py-12">
          <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">暂无参赛作品</h3>
          <p className="text-gray-600">该比赛目前还没有参赛作品</p>
        </div>
      )}
    </div>
  )
}

export default CompetitionDetailPage 