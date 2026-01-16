import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch, RootState } from '../../store/store'
import { fetchCategories } from '../../store/slices/forumSlice'
import { forumService } from '../../services/forumService'
import P5Editor from '../../components/Forum/Editor/P5Editor'
import { Send, X, AlertCircle } from 'lucide-react'

const NewPost = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch<AppDispatch>()
  const { categories } = useSelector((state: RootState) => state.forum)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    dispatch(fetchCategories())
  }, [dispatch])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !content || !categoryId) {
      setError('请填写完整信息')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await forumService.createPost({
        title,
        content,
        category: categoryId as number
      })
      navigate(`/forum/post/${result.id}`)
    } catch (err: any) {
      setError(err.response?.data?.detail || '发布失败，请检查是否已登录')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex justify-between items-center mb-12">
          <div className="relative">
            <div className="absolute -inset-2 bg-p5-red transform -skew-x-12"></div>
            <h1 className="relative text-3xl font-black italic uppercase tracking-tighter bg-white text-black px-4 py-1 transform -skew-x-12">
              New Post / 发布新帖
            </h1>
          </div>
          <button
            onClick={() => navigate('/forum')}
            className="p-2 border-2 border-white hover:bg-white hover:text-black transition-all transform rotate-3"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-8 bg-p5-red p-4 border-2 border-white flex items-center gap-3 animate-bounce">
            <AlertCircle className="w-6 h-6" />
            <span className="font-bold italic uppercase">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 标题输入 */}
          <div className="relative">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="在这里输入标题... (Title goes here...)"
              className="w-full bg-transparent border-b-4 border-white p-4 text-3xl font-black italic uppercase placeholder:opacity-30 focus:outline-none focus:border-p5-red transition-colors"
            />
          </div>

          {/* 分区选择 */}
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

          {/* 编辑器 */}
          <div className="mt-12">
            <P5Editor
              content={content}
              onChange={setContent}
              placeholder="开始你的创作... (Start your creation...)"
            />
          </div>

          {/* 提交按钮 */}
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
                    发布帖子 / SEND IT!
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

export default NewPost
