import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../../store/store'
import { fetchPostDetail, clearCurrentPost } from '../../store/slices/forumSlice'
import { forumService } from '../../services/forumService'
import { MessageSquare, User, Calendar, CornerDownRight, Send } from 'lucide-react'

const ForumPostDetail = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const { currentPost, loading } = useSelector((state: RootState) => state.forum)
  const [commentContent, setCommentContent] = useState('')
  const [replyTo, setReplyTo] = useState<{ id: number; name: string } | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (id) {
      dispatch(fetchPostDetail(parseInt(id)))
    }
    return () => {
      dispatch(clearCurrentPost())
    }
  }, [dispatch, id])

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
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => setReplyTo({ id: comment.id, name: comment.author_name })}
                  className="text-[10px] font-black italic uppercase hover:text-p5-red flex items-center gap-1"
                >
                  <CornerDownRight className="w-3 h-3" />
                  回复 / REPLY
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
          <button
            onClick={() => navigate('/forum')}
            className="mb-6 text-p5-red font-black italic uppercase hover:translate-x-1 transition-transform inline-block"
          >
            ← 返回 / BACK TO FORUM
          </button>
          <div className="bg-p5-red inline-block px-3 py-1 transform -skew-x-12 mb-4">
            <span className="text-xs font-black italic uppercase">{currentPost.category_name}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter leading-none mb-6">
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
              {currentPost.comments.length}
            </div>
          </div>
        </div>
      </div>

      {/* 文章正文 */}
      <div className="container mx-auto max-w-4xl px-4 -mt-8 relative z-20">
        <div className="bg-white border-4 border-black p-8 md:p-12 shadow-[12px_12px_0_0_rgba(0,0,0,1)] min-h-[400px]">
          <div
            className="prose prose-lg max-w-none prose-p:leading-relaxed prose-headings:font-black prose-headings:italic prose-headings:uppercase prose-img:border-4 prose-img:border-black"
            dangerouslySetInnerHTML={{ __html: currentPost.content }}
          />
        </div>

        {/* 评论区 */}
        <section className="mt-20">
          <div className="relative mb-12">
            <div className="absolute -inset-1 bg-p5-red transform skew-x-12"></div>
            <div className="relative bg-black px-4 py-2 transform skew-x-12 inline-block">
              <h2 className="text-xl font-black text-white italic uppercase transform -skew-x-12">
                Comments / 讨论区
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
            <textarea
              value={commentContent}
              onChange={(e) => setCommentContent(e.target.value)}
              placeholder="说点什么吧... (Say something...)"
              className="w-full bg-white border-2 border-black p-4 focus:outline-none focus:border-p5-red min-h-[120px]"
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSubmitComment}
                disabled={isSubmitting}
                className="bg-p5-red text-white px-8 py-3 font-black italic uppercase flex items-center gap-2 hover:bg-black transition-colors shadow-[4px_4px_0_0_black]"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
                发送 / POST
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
    </div>
  )
}

export default ForumPostDetail
