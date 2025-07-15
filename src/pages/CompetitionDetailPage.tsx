import { useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '../store/store'
import { fetchCompetitions } from '../store/slices/competitionsSlice'
import { fetchVideos } from '../store/slices/videosSlice'
import { fetchAwards } from '../store/slices/awardsSlice'
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
  Star
} from 'lucide-react'

function CompetitionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { competitions } = useSelector((state: RootState) => state.competitions)
  const { videos } = useSelector((state: RootState) => state.videos)
  const { awards } = useSelector((state: RootState) => state.awards)
  const { groups } = useSelector((state: RootState) => state.groups)

  useEffect(() => {
    if (competitions.length === 0) {
      dispatch(fetchCompetitions() as any)
    }
    if (videos.length === 0) {
      dispatch(fetchVideos() as any)
    }
    if (awards.length === 0) {
      dispatch(fetchAwards() as any)
    }
    if (groups.length === 0) {
      dispatch(fetchGroups() as any)
    }
  }, [dispatch, competitions.length, videos.length, awards.length, groups.length])

  const competition = competitions.find(c => c.id === id)
  
  // 获取该比赛的所有奖项
  const competitionAwards = awards.filter(award => 
    award.competition === competition?.name
  )

  // 获取参与该比赛的所有视频
  const competitionVideos = videos.filter(video => 
    video.competitions.some(comp => comp.id === id)
  )

  // 获取获奖视频
  const awardedVideos = competitionVideos.filter(video => 
    competitionAwards.some(award => award.video_id === video.id)
  )

  // 获取未获奖但参与比赛的视频
  const participatingVideos = competitionVideos.filter(video => 
    !competitionAwards.some(award => award.video_id === video.id)
  )

  const handleVideoClick = (videoId: string) => {
    navigate(`/video/${videoId}`)
  }

  const getAwardLevelInfo = (level: string) => {
    switch (level) {
      case 'gold':
        return { 
          name: '金奖', 
          color: 'bg-yellow-500', 
          textColor: 'text-yellow-800',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          icon: <Trophy className="w-5 h-5 text-yellow-600" />
        }
      case 'silver':
        return { 
          name: '银奖', 
          color: 'bg-gray-400', 
          textColor: 'text-gray-800',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: <Medal className="w-5 h-5 text-gray-600" />
        }
      case 'bronze':
        return { 
          name: '铜奖', 
          color: 'bg-orange-600', 
          textColor: 'text-orange-800',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          icon: <Award className="w-5 h-5 text-orange-600" />
        }
      case 'special':
        return { 
          name: '特别奖', 
          color: 'bg-purple-500', 
          textColor: 'text-purple-800',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200',
          icon: <Star className="w-5 h-5 text-purple-600" />
        }
      default:
        return { 
          name: '参与奖', 
          color: 'bg-blue-500', 
          textColor: 'text-blue-800',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          icon: <Users className="w-5 h-5 text-blue-600" />
        }
    }
  }

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
    <div className="space-y-6">
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
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg text-white p-8">
        <div className="text-center">
          <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          
          <h1 className="text-4xl font-bold mb-2">{competition.name}</h1>
          <div className="flex items-center justify-center space-x-2 text-yellow-100 mb-4">
            <Calendar className="w-5 h-5" />
            <span className="text-xl">{competition.year}年</span>
          </div>
          
          <p className="text-xl text-yellow-100 max-w-2xl mx-auto leading-relaxed">
            {competition.description}
          </p>

          {/* 比赛统计 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <div className="text-3xl font-bold mb-1">{competitionAwards.length}</div>
              <div className="text-yellow-100">奖项设置</div>
            </div>
            <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <div className="text-3xl font-bold mb-1">{competitionVideos.length}</div>
              <div className="text-yellow-100">参赛作品</div>
            </div>
            {/* <div className="bg-white bg-opacity-10 rounded-lg p-4">
              <div className="text-3xl font-bold mb-1">{awardedVideos.length}</div>
              <div className="text-yellow-100">获奖作品</div>
            </div> */}
          </div>
        </div>
      </div>

      {/* 获奖作品展示 */}
      {competitionAwards.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Trophy className="w-6 h-6 text-yellow-500" />
            <h2 className="text-2xl font-bold text-gray-900">获奖作品</h2>
          </div>

          <div className="space-y-6">
            {competitionAwards.map((award) => {
              const awardVideo = awardedVideos.find(v => v.id === award.video_id)
              const awardGroup = groups.find(g => g.id === award.group_id)
              const levelInfo = getAwardLevelInfo(award.level)

              if (!awardVideo) return null

              return (
                <div 
                  key={award.id} 
                  className={`border rounded-lg p-6 ${levelInfo.bgColor} ${levelInfo.borderColor}`}
                >
                  <div className="flex items-start space-x-6">
                    {/* 奖项信息 */}
                    <div className="flex-shrink-0">
                      <div className={`w-16 h-16 ${levelInfo.color} rounded-lg flex items-center justify-center mb-3`}>
                        {levelInfo.icon}
                      </div>
                      <div className="text-center">
                        <div className={`text-sm font-bold ${levelInfo.textColor}`}>
                          {levelInfo.name}
                        </div>
                      </div>
                    </div>
                    
                    {/* 奖项详情和视频 */}
                    <div className="flex-1 min-w-0">
                      <div className="mb-4">
                        <h3 className={`text-xl font-bold ${levelInfo.textColor} mb-2`}>
                          {award.name}
                        </h3>
                        
                        {award.description && (
                          <p className={`${levelInfo.textColor} mb-3`}>
                            {award.description}
                          </p>
                        )}
                        
                        {awardGroup && (
                          <div className={`text-sm ${levelInfo.textColor}`}>
                            获奖社团: <span className="font-medium">{awardGroup.name}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* 获奖视频卡片 */}
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-3">获奖作品</h4>
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

      {/* 参赛作品展示 */}
      {participatingVideos.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Users className="w-6 h-6 text-blue-500" />
              <h2 className="text-2xl font-bold text-gray-900">
                参赛作品 ({participatingVideos.length})
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {participatingVideos.map((video) => (
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
      {competitionVideos.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center">
            <Play className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">暂无参赛作品</h3>
            <p className="text-gray-600">该比赛还没有任何参赛视频</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default CompetitionDetailPage 