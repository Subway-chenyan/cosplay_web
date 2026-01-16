import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../../store/store'
import { fetchCategories } from '../../store/slices/forumSlice'
import { forumService } from '../../services/forumService'
import P5Editor from '../../components/Forum/Editor/P5Editor'
import { Send, X, AlertCircle, Trash2 } from 'lucide-react'

const EditPost = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const { categories } = useSelector((state: RootState) => state.forum)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    dispatch(fetchCategories())
    if (id) {
      fetchPost(parseInt(id))
    }
  }, [dispatch, id])

  const fetchPost = async (postId: number) => {
    try {
      const post = await forumService.getPost(postId)
      setTitle(post.title)
      setContent(post.content)
      setCategoryId(post.category)
    } catch (err) {
      setError('获取帖子详情失败')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!id || !title || !content || !categoryId) {
      setError('请填写完整信息')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await forumService.updatePost(parseInt(id), {
        title,
        content,
        category: categoryId as number
      })
      navigate(`/forum/post/${id}`)
    } catch (err: any) {
      setError(err.response?.data?.detail || '更新失败，请检查是否已登录')
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!id || !window.confirm('确定要删除这篇帖子吗？此操作不可撤销。')) return

    try {
      await forumService.deletePost(parseInt(id))
      navigate('/forum')
    } catch (err) {
      alert('删除失败')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="w-16 h-16 border-4 border-p5-red border-t-white rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex justify-between items-center mb-12">
          <div className="relative">
            <div className="absolute -inset-2 bg-p5-red transform -skew-x-12"></div>
            <h1 className="relative text-3xl font-black italic uppercase tracking-tighter bg-white text-black px-4 py-1 transform -skew-x-12">
              Edit Post / 编辑帖子
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleDelete}
              className="p-2 border-2 border-p5-red text-p5-red hover:bg-p5-red hover:text-white transition-all transform -rotate-3"
              title="删除帖子"
            >
              <Trash2 className="w-6 h-6" />
            </button>
            <button
              onClick={() => navigate(`/forum/post/${id}`)}
              className="p-2 border-2 border-white hover:bg-white hover:text-black transition-all transform rotate-3"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-8 bg-p5-red p-4 border-2 border-white flex items-center gap-3 animate-bounce">
            <AlertCircle className="w-6 h-6" />
            <span className="font-bold italic uppercase">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="relative">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="在这里输入标题... (Title goes here...)"
              className="w-full bg-transparent border-b-4 border-white p-4 text-3xl font-black italic uppercase placeholder:opacity-30 focus:outline-none focus:border-p5-red transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <label
                key={cat.id}
                className={`cursor-pointer p-4 border-2 transform transition-all ${
                  categoryId === cat.id
                    ? 'bg-p5-red border-white -translate-y-1'
                    : 'border-white/30 hover:border-white'
                }`}
              >
                <input
                  type="radio"
                  name="category"
                  value={cat.id}
                  checked={categoryId === cat.id}
                  onChange={() => setCategoryId(cat.id)}
                  className="hidden"
                />
                <span className="font-black italic uppercase block">{cat.name}</span>
                <span className="text-[10px] opacity-50 uppercase italic">{cat.slug}</span>
              </label>
            ))}
          </div>

          <div className="mt-12">
            <P5Editor
              content={content}
              onChange={setContent}
              placeholder="修改你的内容... (Update your content...)"
            />
          </div>

          <div className="flex justify-end pt-12">
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative px-12 py-4 bg-white text-black font-black italic uppercase text-xl hover:bg-p5-red hover:text-white transition-all shadow-[8px_8px_0_0_#d90614]"
            >
              <div className="flex items-center gap-2">
                {isSubmitting ? (
                  <div className="w-6 h-6 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Send className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    保存修改 / SAVE CHANGES
                  </>
                )}
              </div>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditPost
