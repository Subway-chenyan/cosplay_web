import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AlertCircle, CheckCircle, Edit3, EyeOff, FolderPlus, Lock, MessageSquare, Pin, Save, Search, Star, Trash2, X } from 'lucide-react'
import { authService } from '../../services/authService'
import { forumService } from '../../services/forumService'
import { Comment, ForumCategory, ModerationPayload, Post } from '../../types/forum'

type AdminTab = 'posts' | 'comments' | 'categories'

const emptyCategory = {
  name: '',
  slug: '',
  description: '',
  icon: 'message-square',
  order: 0,
  is_active: true,
  allowed_roles: [] as string[],
}

const ForumAdmin = () => {
  const navigate = useNavigate()
  const [tab, setTab] = useState<AdminTab>('posts')
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [posts, setPosts] = useState<Post[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [categories, setCategories] = useState<ForumCategory[]>([])
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null)
  const [categoryForm, setCategoryForm] = useState(emptyCategory)

  useEffect(() => {
    const init = async () => {
      try {
        const user = await authService.getCurrentUser() as any
        if (user.role !== 'admin') {
          setIsAdmin(false)
          return
        }
        setIsAdmin(true)
        await Promise.all([loadPosts(), loadComments(), loadCategories()])
      } catch (err) {
        setError('请先以管理员身份登录')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  const showMessage = (text: string) => {
    setMessage(text)
    setError(null)
    window.setTimeout(() => setMessage(null), 2200)
  }

  const loadPosts = async () => {
    const response = await forumService.getPosts({
      search: search || undefined,
      ordering: '-created_at',
      status: undefined,
    })
    setPosts(response.results)
  }

  const loadComments = async () => {
    const response = await forumService.getComments({ ordering: '-created_at' })
    setComments(response.results)
  }

  const loadCategories = async () => {
    const data = await forumService.getCategories()
    setCategories(data)
  }

  const refreshCurrent = async () => {
    if (tab === 'posts') await loadPosts()
    if (tab === 'comments') await loadComments()
    if (tab === 'categories') await loadCategories()
  }

  const moderatePost = async (post: Post, payload: ModerationPayload, successText: string) => {
    await forumService.moderatePost(post.id, payload)
    await loadPosts()
    showMessage(successText)
  }

  const deletePost = async (post: Post) => {
    if (!window.confirm(`确定删除帖子「${post.title}」吗？`)) return
    await forumService.deletePost(post.id)
    await loadPosts()
    showMessage('帖子已删除')
  }

  const deleteComment = async (comment: Comment) => {
    if (!window.confirm('确定删除这条评论吗？')) return
    await forumService.deleteComment(comment.id)
    await loadComments()
    showMessage('评论已删除')
  }

  const editCategory = (category: ForumCategory) => {
    setEditingCategoryId(category.id)
    setCategoryForm({
      name: category.name,
      slug: category.slug,
      description: category.description,
      icon: category.icon || 'message-square',
      order: category.order,
      is_active: category.is_active,
      allowed_roles: category.allowed_roles || [],
    })
  }

  const resetCategoryForm = () => {
    setEditingCategoryId(null)
    setCategoryForm(emptyCategory)
  }

  const saveCategory = async () => {
    if (!categoryForm.name.trim() || !categoryForm.slug.trim()) {
      setError('分类名称和 slug 不能为空')
      return
    }
    if (editingCategoryId) {
      await forumService.updateCategory(editingCategoryId, categoryForm)
      showMessage('分类已更新')
    } else {
      await forumService.createCategory(categoryForm)
      showMessage('分类已创建')
    }
    resetCategoryForm()
    await loadCategories()
  }

  const deleteCategory = async (category: ForumCategory) => {
    if (!window.confirm(`确定删除分类「${category.name}」吗？已有帖子会保留分类关联。`)) return
    await forumService.deleteCategory(category.id)
    await loadCategories()
    showMessage('分类已删除')
  }

  if (loading) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center font-black">LOADING...</div>
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
        <div className="bg-white text-black border-4 border-p5-red p-8 max-w-md">
          <AlertCircle className="w-10 h-10 text-p5-red mb-4" />
          <h1 className="text-2xl font-black mb-3">需要管理员权限</h1>
          <button onClick={() => navigate('/login')} className="bg-p5-red text-white px-6 py-3 font-black">前往登录</button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white px-4 py-10">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <Link to="/forum" className="text-p5-red font-black italic">← 返回论坛</Link>
            <h1 className="mt-4 text-4xl font-black italic">论坛管理</h1>
          </div>
          <div className="flex flex-wrap gap-2">
            {(['posts', 'comments', 'categories'] as AdminTab[]).map((item) => (
              <button
                key={item}
                onClick={() => setTab(item)}
                className={`border-2 border-white px-4 py-2 font-black italic ${tab === item ? 'bg-p5-red text-white' : 'bg-white text-black'}`}
              >
                {item === 'posts' ? '帖子' : item === 'comments' ? '评论' : '分类'}
              </button>
            ))}
          </div>
        </div>

        {message && (
          <div className="mb-4 flex items-center gap-2 border-2 border-white bg-green-600 px-4 py-3 font-black">
            <CheckCircle className="w-5 h-5" />
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 flex items-center gap-2 border-2 border-white bg-p5-red px-4 py-3 font-black">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {tab === 'posts' && (
          <section className="bg-white text-black border-4 border-black p-5 shadow-[8px_8px_0_0_#d90614]">
            <div className="mb-5 flex flex-col gap-3 md:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && loadPosts()}
                  placeholder="搜索标题或正文"
                  className="w-full border-2 border-black py-3 pl-11 pr-4 font-bold focus:outline-none focus:border-p5-red"
                />
              </div>
              <button onClick={loadPosts} className="bg-black text-white px-6 py-3 font-black">
                检索
              </button>
            </div>
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="border-2 border-black p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-black text-gray-500">
                        <span>{post.category_name}</span>
                        <span>@{post.author_name}</span>
                        <span>{post.status}</span>
                        {post.is_pinned && <span className="text-p5-red">置顶</span>}
                        {post.is_featured && <span className="text-p5-red">精华</span>}
                        {post.is_locked && <span className="text-p5-red">锁定</span>}
                      </div>
                      <Link to={`/forum/post/${post.id}`} className="text-lg font-black hover:text-p5-red">
                        {post.title}
                      </Link>
                      <div className="mt-2 text-xs font-bold text-gray-500">
                        回复 {post.reply_count} · 浏览 {post.view_count} · 举报 {post.report_count}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => navigate(`/forum/edit/${post.id}`)} className="border-2 border-black p-2" title="编辑">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => moderatePost(post, { is_pinned: !post.is_pinned }, post.is_pinned ? '已取消置顶' : '已置顶')} className="border-2 border-black p-2" title="置顶">
                        <Pin className="w-4 h-4" />
                      </button>
                      <button onClick={() => moderatePost(post, { is_featured: !post.is_featured }, post.is_featured ? '已取消精华' : '已设为精华')} className="border-2 border-black p-2" title="精华">
                        <Star className="w-4 h-4" />
                      </button>
                      <button onClick={() => moderatePost(post, { is_locked: !post.is_locked }, post.is_locked ? '已解锁' : '已锁定')} className="border-2 border-black p-2" title="锁定">
                        <Lock className="w-4 h-4" />
                      </button>
                      <button onClick={() => moderatePost(post, { status: post.status === 'hidden' ? 'published' : 'hidden' }, post.status === 'hidden' ? '已恢复' : '已隐藏')} className="border-2 border-black p-2" title="隐藏">
                        <EyeOff className="w-4 h-4" />
                      </button>
                      <button onClick={() => deletePost(post)} className="border-2 border-p5-red p-2 text-p5-red" title="删除">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === 'comments' && (
          <section className="bg-white text-black border-4 border-black p-5 shadow-[8px_8px_0_0_#d90614]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-black">评论管理</h2>
              <button onClick={refreshCurrent} className="bg-black text-white px-4 py-2 font-black">刷新</button>
            </div>
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="border-2 border-black p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:justify-between">
                    <div>
                      <div className="mb-2 flex items-center gap-2 text-xs font-black text-gray-500">
                        <MessageSquare className="w-4 h-4" />
                        <span>帖子 #{comment.post}</span>
                        <span>@{comment.author_name}</span>
                        <span>{comment.status}</span>
                      </div>
                      <p className="font-bold">{comment.content}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => forumService.updateComment(comment.id, { content: window.prompt('编辑评论内容', comment.content) || comment.content }).then(loadComments)} className="border-2 border-black p-2" title="编辑">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => forumService.hideComment(comment.id).then(loadComments)} className="border-2 border-black p-2" title="隐藏">
                        <EyeOff className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteComment(comment)} className="border-2 border-p5-red p-2 text-p5-red" title="删除">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {tab === 'categories' && (
          <section className="grid gap-5 lg:grid-cols-[360px_1fr]">
            <div className="bg-white text-black border-4 border-black p-5 shadow-[8px_8px_0_0_#d90614]">
              <h2 className="mb-5 flex items-center gap-2 text-2xl font-black">
                <FolderPlus className="w-6 h-6 text-p5-red" />
                {editingCategoryId ? '编辑分类' : '新增分类'}
              </h2>
              <div className="space-y-3">
                <input value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} placeholder="分类名称" className="w-full border-2 border-black p-3 font-bold" />
                <input value={categoryForm.slug} onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })} placeholder="slug，例如 general" className="w-full border-2 border-black p-3 font-bold" />
                <textarea value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} placeholder="分类描述" className="min-h-[120px] w-full border-2 border-black p-3 font-bold" />
                <input type="number" value={categoryForm.order} onChange={(e) => setCategoryForm({ ...categoryForm, order: Number(e.target.value) })} placeholder="排序" className="w-full border-2 border-black p-3 font-bold" />
                <label className="flex items-center gap-2 font-black">
                  <input type="checkbox" checked={categoryForm.is_active} onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })} />
                  启用分类
                </label>
                <div className="flex gap-2">
                  <button onClick={saveCategory} className="flex items-center gap-2 bg-p5-red text-white px-5 py-3 font-black">
                    <Save className="w-4 h-4" />
                    保存
                  </button>
                  {editingCategoryId && (
                    <button onClick={resetCategoryForm} className="flex items-center gap-2 border-2 border-black px-5 py-3 font-black">
                      <X className="w-4 h-4" />
                      取消
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-white text-black border-4 border-black p-5 shadow-[8px_8px_0_0_#d90614]">
              <h2 className="mb-5 text-2xl font-black">分类列表</h2>
              <div className="space-y-4">
                {categories.map((category) => (
                  <div key={category.id} className="flex flex-col gap-3 border-2 border-black p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="font-black">{category.name}</div>
                      <div className="text-xs font-bold text-gray-500">/{category.slug} · 排序 {category.order} · 帖子 {category.post_count} · 评论 {category.comment_count}</div>
                      <p className="mt-2 text-sm text-gray-700">{category.description}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => editCategory(category)} className="border-2 border-black p-2" title="编辑">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteCategory(category)} className="border-2 border-p5-red p-2 text-p5-red" title="删除">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

export default ForumAdmin
