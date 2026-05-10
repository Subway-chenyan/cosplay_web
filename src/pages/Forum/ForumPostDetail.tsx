import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../../store/store'
import { fetchPostDetail, clearCurrentPost } from '../../store/slices/forumSlice'
import { forumService } from '../../services/forumService'
import { ModerationPayload } from '../../types/forum'
import { MessageSquare, User, Calendar, CornerDownRight, Send, Edit3, Lock, Pin, Star, Heart, Flag, EyeOff, X } from 'lucide-react'
import DOMPurify from 'dompurify'

const ForumPostDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const { currentPost, loading } = useSelector((state: RootState) => state.forum)
  const [commentContent, setCommentContent] = useState('')
  const [replyTo, setReplyTo] = useState<{ id: number; name: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isModerating, setIsModerating] = useState(false)
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null)

  useEffect(() => {
    if (id) {
      dispatch(fetchPostDetail(parseInt(id)))
    }
    return () => {
      dispatch(clearCurrentPost())
    }
  }, [dispatch, id])

  useEffect(() => {
    if (!previewImage) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPreviewImage(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [previewImage])

  const handleContentClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target
    if (!(target instanceof HTMLImageElement)) return

    setPreviewImage({
      src: target.currentSrc || target.src,
      alt: target.alt || '帖子图片',
    })
  }

  const handleSubmitComment = async () => {
    if (!id || !commentContent.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await forumService.createComment({
        post: parseInt(id),
        content: commentContent,
        parent: replyTo?.id || null
      })
      setCommentContent('')
      setReplyTo(null)
      dispatch(fetchPostDetail(parseInt(id)))
    } catch (error) {
      console.error('Failed to submit comment:', error)
      alert('评论发送失败，请检查是否已登录')
    } finally {
      setIsSubmitting(false)
    }
  }

  const refreshPost = () => {
    if (id) dispatch(fetchPostDetail(parseInt(id)))
  }

  const handleModerate = async (payload: ModerationPayload) => {
    if (!id || isModerating) return
    setIsModerating(true)
    try {
      await forumService.moderatePost(parseInt(id), payload)
      refreshPost()
    } catch (error) {
      console.error('Failed to moderate post:', error)
      alert('管理操作失败')
    } finally {
      setIsModerating(false)
    }
  }

  const handleReactPost = async () => {
    if (!id) return
    try {
      await forumService.reactToPost(parseInt(id))
      refreshPost()
    } catch (error) {
      alert('点赞失败，请检查是否已登录')
    }
  }

  const handleReportPost = async () => {
    if (!id) return
    try {
      await forumService.report({ post: parseInt(id), reason: 'other', description: '用户从帖子详情页提交举报' })
      alert('举报已提交，管理员会尽快处理')
    } catch (error) {
      alert('举报失败，请检查是否已登录')
    }
  }

  const handleHideComment = async (commentId: number) => {
    try {
      await forumService.hideComment(commentId)
      refreshPost()
    } catch (error) {
      alert('隐藏评论失败')
    }
  }

  if (loading || !currentPost) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="w-16 h-16 border-4 border-p5-red border-t-white rounded-full animate-spin"></div>
      </div>
    )
  }

  const renderComments = (comments: any[], isReply = false) => {
    return comments.map((comment) => (
      <div key={comment.id} className={`${isReply ? 'ml-8 mt-4' : 'mt-8'}`}>
        <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0_0_black] transform transition-transform hover:-translate-y-1">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-black flex items-center justify-center border-2 border-p5-red transform rotate-3 overflow-hidden">
              {comment.author_avatar ? (
                <img src={comment.author_avatar} alt={comment.author_name} className="w-full h-full object-cover" />
              ) : (
                <User className="text-white w-6 h-6" />
              )}
            </div>
            <div className="flex-grow">
              <div className="flex items-center justify-between mb-2">
                <span className="font-black italic text-p5-red">@{comment.author_name}</span>
                <span className="text-[10px] text-gray-500 italic">{new Date(comment.created_at).toLocaleString()}</span>
              </div>
              <p className="text-gray-800 text-sm leading-relaxed">{comment.content}</p>
              <div className="mt-4 flex justify-end gap-3">
                {comment.can_moderate && (
                  <button
                    onClick={() => handleHideComment(comment.id)}
                    className="text-[10px] font-black italic hover:text-p5-red flex items-center gap-1"
                  >
                    <EyeOff className="w-3 h-3" />
                    隐藏
                  </button>
                )}
                <button
                  onClick={() => setReplyTo({ id: comment.id, name: comment.author_name })}
                  disabled={currentPost.is_locked}
                  className="text-[10px] font-black italic hover:text-p5-red flex items-center gap-1"
                >
                  <CornerDownRight className="w-3 h-3" />
                  回复
                </button>
              </div>
            </div>
          </div>
        </div>
        {comment.replies && comment.replies.length > 0 && renderComments(comment.replies, true)}
      </div>
    ))
  }

  return (
    <div className="min-h-screen bg-white text-black pb-20">
      {/* 顶部标题栏 */}
      <div className="bg-black text-white py-12 px-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none bg-[radial-gradient(#d90614_1px,transparent_1px)] [background-size:20px_20px]"></div>
        <div className="container mx-auto max-w-4xl relative z-10">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/forum')}
              className="text-p5-red font-black italic hover:translate-x-1 transition-transform inline-block"
            >
              ← 返回论坛
            </button>
            <div className="flex items-center gap-2">
            {currentPost.can_moderate && (
              <>
                <button
                  onClick={() => handleModerate({ is_pinned: !currentPost.is_pinned })}
                  disabled={isModerating}
                  className="bg-white text-black px-3 py-1 font-black italic text-xs border-2 border-p5-red hover:bg-p5-red hover:text-white transition-all transform skew-x-12"
                >
                  <span className="flex items-center gap-1 transform -skew-x-12">
                    <Pin className="w-3 h-3" />
                    {currentPost.is_pinned ? '取消置顶' : '置顶'}
                  </span>
                </button>
                <button
                  onClick={() => handleModerate({ is_featured: !currentPost.is_featured })}
                  disabled={isModerating}
                  className="bg-white text-black px-3 py-1 font-black italic text-xs border-2 border-p5-red hover:bg-p5-red hover:text-white transition-all transform skew-x-12"
                >
                  <span className="flex items-center gap-1 transform -skew-x-12">
                    <Star className="w-3 h-3" />
                    {currentPost.is_featured ? '取消精华' : '精华'}
                  </span>
                </button>
                <button
                  onClick={() => handleModerate({ is_locked: !currentPost.is_locked })}
                  disabled={isModerating}
                  className="bg-white text-black px-3 py-1 font-black italic text-xs border-2 border-p5-red hover:bg-p5-red hover:text-white transition-all transform skew-x-12"
                >
                  <span className="flex items-center gap-1 transform -skew-x-12">
                    <Lock className="w-3 h-3" />
                    {currentPost.is_locked ? '解锁' : '锁定'}
                  </span>
                </button>
              </>
            )}
            {currentPost.can_edit && (
              <button
                onClick={() => navigate(`/forum/edit/${id}`)}
                className="bg-white text-black px-4 py-1 font-black italic text-xs border-2 border-p5-red hover:bg-p5-red hover:text-white transition-all transform skew-x-12"
              >
                <div className="flex items-center gap-1 transform -skew-x-12">
                  <Edit3 className="w-3 h-3" />
                  编辑帖子
                </div>
              </button>
            )}
            </div>
          </div>
          <div className="bg-p5-red inline-block px-3 py-1 transform -skew-x-12 mb-4">
            <span className="text-xs font-black italic">{currentPost.category_name}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter leading-none mb-6">
            {currentPost.title}
          </h1>
          <div className="flex items-center gap-6 text-xs font-bold italic opacity-70">
            <div className="flex items-center gap-2">
              <User className="w-3 h-3 text-p5-red" />
              {currentPost.author_name}
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-3 h-3 text-p5-red" />
              {new Date(currentPost.created_at).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-3 h-3 text-p5-red" />
              {currentPost.reply_count}
            </div>
            {currentPost.is_locked && (
              <div className="flex items-center gap-2">
                <Lock className="w-3 h-3 text-p5-red" />
                已锁定
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 文章正文 */}
      <div className="container mx-auto max-w-4xl px-4 -mt-8 relative z-20">
        <div className="bg-white border-4 border-black p-8 md:p-12 shadow-[12px_12px_0_0_rgba(0,0,0,1)] min-h-[400px]">
          <div
            className="p5-rendered-content max-w-none"
            onClick={handleContentClick}
            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(currentPost.content) }}
          />
          <div className="mt-10 flex flex-wrap items-center gap-3 border-t-2 border-black pt-6">
            <button
              onClick={handleReactPost}
              className="inline-flex items-center gap-2 bg-black text-white px-4 py-2 font-black italic hover:bg-p5-red transition-colors"
            >
              <Heart className="w-4 h-4" />
              {currentPost.like_count}
            </button>
            <button
              onClick={handleReportPost}
              className="inline-flex items-center gap-2 border-2 border-black px-4 py-2 font-black italic hover:border-p5-red hover:text-p5-red transition-colors"
            >
              <Flag className="w-4 h-4" />
              举报
            </button>
            {currentPost.tags?.map((tag) => (
              <span key={tag.id} className="px-3 py-1 text-xs font-black italic border-2 border-black" style={{ color: tag.color }}>
                #{tag.name}
              </span>
            ))}
          </div>
        </div>

        {/* 评论区 */}
        <section className="mt-20">
          <div className="relative mb-12">
            <div className="absolute -inset-1 bg-p5-red transform skew-x-12"></div>
            <div className="relative bg-black px-4 py-2 transform skew-x-12 inline-block">
              <h2 className="text-xl font-black text-white italic transform -skew-x-12">
                讨论区
              </h2>
            </div>
          </div>

          {/* 发表评论框 */}
          <div className="mb-12 bg-gray-100 border-2 border-black p-6 relative">
            {replyTo && (
              <div className="mb-4 bg-p5-red text-white p-2 text-xs font-bold italic flex justify-between items-center">
                <span>正在回复 @{replyTo.name}</span>
                <button onClick={() => setReplyTo(null)}>取消</button>
              </div>
            )}
            {currentPost.is_locked ? (
              <div className="bg-white border-2 border-black p-4 font-black italic text-gray-500 flex items-center gap-2">
                <Lock className="w-4 h-4" />
                该帖子已锁定
              </div>
            ) : (
              <textarea
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="说点什么吧..."
                className="w-full bg-white border-2 border-black p-4 focus:outline-none focus:border-p5-red min-h-[120px]"
              />
            )}
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSubmitComment}
                disabled={isSubmitting || currentPost.is_locked}
                className="bg-p5-red text-white px-8 py-3 font-black italic flex items-center gap-2 hover:bg-black transition-colors shadow-[4px_4px_0_0_black]"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
                发送评论
              </button>
            </div>
          </div>

          <div className="space-y-8">
            {currentPost.comments.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300">
                <p className="text-gray-400 font-bold italic">暂无评论</p>
              </div>
            ) : (
              renderComments(currentPost.comments)
            )}
          </div>
        </section>
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label="图片预览"
          onClick={() => setPreviewImage(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewImage(null)}
            className="absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full bg-white text-black transition hover:bg-p5-red hover:text-white focus:outline-none focus:ring-4 focus:ring-p5-red/40"
            aria-label="关闭图片预览"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={previewImage.src}
            alt={previewImage.alt}
            className="max-h-[88vh] max-w-[92vw] rounded-lg border-2 border-white object-contain shadow-[0_24px_80px_rgba(0,0,0,0.55)]"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}

export default ForumPostDetail
