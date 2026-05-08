import { FormEvent, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { AppDispatch, RootState } from '../../store/store'
import { fetchCategories, fetchPosts, setFilters } from '../../store/slices/forumSlice'
import { MessageSquare, Eye, Plus, User, Pin, Lock, Star, Search, X } from 'lucide-react'

const ForumHome = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { categories, posts, loading, filters } = useSelector((state: RootState) => state.forum)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [searchInput, setSearchInput] = useState(filters.search || '')

  useEffect(() => {
    dispatch(fetchCategories())
    fetchCurrentUser()
  }, [dispatch])

  useEffect(() => {
    dispatch(fetchPosts(filters))
  }, [dispatch, filters])

  const fetchCurrentUser = async () => {
    const token = localStorage.getItem('access_token')
    if (!token) return
    try {
      const response = await fetch('/api/users/me/', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setCurrentUser(data)
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
    }
  }

  const handleCategoryClick = (categoryId?: number) => {
    dispatch(setFilters({ category: categoryId, author: undefined }))
  }

  const handleMyPostsClick = () => {
    if (!currentUser) return
    dispatch(setFilters({ category: undefined, author: currentUser.id }))
  }

  const handleSearch = (e?: FormEvent) => {
    e?.preventDefault()
    dispatch(setFilters({ search: searchInput.trim() || undefined }))
  }

  const clearSearch = () => {
    setSearchInput('')
    dispatch(setFilters({ search: undefined }))
  }

  return (
    <div className="container mx-auto px-4 py-6 lg:py-10">
      <section className="mx-auto max-w-6xl">
        <div className="mb-5 rounded-2xl border border-white/15 bg-black/55 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.24)] backdrop-blur md:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="relative flex-1">
                  <span className="sr-only">搜索帖子</span>
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="search"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder="搜索标题、正文或作者..."
                    className="h-12 w-full rounded-xl border border-white/10 bg-white px-12 text-base font-bold text-zinc-950 shadow-inner outline-none transition focus:border-p5-red focus:ring-4 focus:ring-p5-red/20"
                  />
                  {searchInput && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-p5-red focus:outline-none focus:ring-2 focus:ring-p5-red"
                      aria-label="清空搜索"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </label>
                <button
                  type="submit"
                  className="h-12 rounded-xl bg-white px-6 font-black text-zinc-950 transition hover:bg-p5-red hover:text-white focus:outline-none focus:ring-4 focus:ring-p5-red/30"
                >
                  检索
                </button>
              </div>
            </form>

            <Link
              to="/forum/new"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-p5-red px-6 font-black text-white shadow-[0_12px_30px_rgba(217,6,20,0.28)] transition hover:-translate-y-0.5 hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-p5-red/30"
            >
              <Plus className="h-5 w-5" />
              发布帖子
            </Link>
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => handleCategoryClick(undefined)}
              className={`h-10 shrink-0 rounded-full px-4 text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-p5-red ${
                !filters.category && !filters.author
                  ? 'bg-white text-zinc-950'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              全部
            </button>

            {currentUser && (
              <button
                onClick={handleMyPostsClick}
                className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-p5-red ${
                  filters.author
                    ? 'bg-white text-zinc-950'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <User className="h-4 w-4" />
                我的帖子
              </button>
            )}

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`h-10 shrink-0 rounded-full px-4 text-sm font-black transition focus:outline-none focus:ring-2 focus:ring-p5-red ${
                  filters.category === cat.id
                    ? 'bg-white text-zinc-950'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/25 border-t-p5-red"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {posts.length === 0 ? (
                <div className="rounded-2xl border border-white/20 bg-white p-12 text-center shadow-[0_18px_45px_rgba(0,0,0,0.16)]">
                  <p className="text-xl font-black text-zinc-950">还没有帖子，来开第一局吧。</p>
                </div>
              ) : (
                posts.map((post) => (
                  <Link
                    key={post.id}
                    to={`/forum/post/${post.id}`}
                    className="group block rounded-2xl border border-white/70 bg-white/95 p-5 shadow-[0_14px_36px_rgba(0,0,0,0.14)] transition hover:-translate-y-0.5 hover:border-p5-red hover:shadow-[0_18px_48px_rgba(0,0,0,0.2)] focus:outline-none focus:ring-4 focus:ring-p5-red/25"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-p5-red/10 px-3 py-1 text-xs font-black text-p5-red">
                            {post.category_name}
                          </span>
                          {post.is_pinned && <Pin className="h-4 w-4 text-p5-red" aria-label="置顶" />}
                          {post.is_featured && <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" aria-label="精选" />}
                          {post.is_locked && <Lock className="h-4 w-4 text-zinc-500" aria-label="锁定" />}
                          <span className="text-xs font-bold text-zinc-500">
                            @{post.author_name} · {new Date(post.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <h2 className="line-clamp-2 text-xl font-black leading-snug text-zinc-950 transition group-hover:text-p5-red">
                          {post.title}
                        </h2>
                        {post.tags?.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {post.tags.slice(0, 3).map((tag) => (
                              <span key={tag.id} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-bold text-zinc-600">
                                #{tag.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-4 text-zinc-500 md:pt-1">
                        <div className="inline-flex items-center gap-1.5">
                          <Eye className="h-4 w-4" />
                          <span className="text-sm font-black">{post.view_count}</span>
                        </div>
                        <div className="inline-flex items-center gap-1.5">
                          <MessageSquare className="h-4 w-4" />
                          <span className="text-sm font-black">{post.reply_count}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

export default ForumHome
