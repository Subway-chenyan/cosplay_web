import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { AppDispatch, RootState } from '../../store/store'
import { fetchCategories, fetchPosts, setFilters } from '../../store/slices/forumSlice'
import { MessageSquare, Eye, Plus, ChevronRight } from 'lucide-react'

const ForumHome = () => {
  const dispatch = useDispatch<AppDispatch>()
  const { categories, posts, loading, filters } = useSelector((state: RootState) => state.forum)

  useEffect(() => {
    dispatch(fetchCategories())
  }, [dispatch])

  useEffect(() => {
    dispatch(fetchPosts(filters))
  }, [dispatch, filters])

  const handleCategoryClick = (categoryId?: number) => {
    dispatch(setFilters({ category: categoryId }))
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 标题装饰 */}
      <div className="relative mb-12">
        <div className="absolute -inset-2 bg-p5-red transform -skew-x-12 -rotate-1 shadow-[4px_4px_0_0_black]"></div>
        <div className="relative bg-white p-4 transform -skew-x-12 border-2 border-black inline-block">
          <h1 className="text-4xl font-black text-black italic uppercase tracking-tighter">
            Forum / 交流论坛
          </h1>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* 侧边栏: 分区 */}
        <aside className="lg:w-1/4">
          <div className="sticky top-24 space-y-4">
            <button
              onClick={() => handleCategoryClick(undefined)}
              className={`w-full text-left px-6 py-4 transform -skew-x-12 border-2 border-black transition-all flex items-center justify-between group ${
                !filters.category ? 'bg-p5-red text-white' : 'bg-white text-black hover:bg-gray-100'
              }`}
            >
              <span className="font-black italic uppercase">全部 / ALL</span>
              <ChevronRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${!filters.category ? 'text-white' : 'text-black'}`} />
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                className={`w-full text-left px-6 py-4 transform -skew-x-12 border-2 border-black transition-all flex items-center justify-between group ${
                  filters.category === cat.id ? 'bg-p5-red text-white' : 'bg-white text-black hover:bg-gray-100'
                }`}
              >
                <div>
                  <span className="font-black italic uppercase block leading-none">{cat.name}</span>
                  <span className="text-xs opacity-70 italic uppercase">{cat.slug}</span>
                </div>
                <ChevronRight className={`w-5 h-5 transition-transform group-hover:translate-x-1 ${filters.category === cat.id ? 'text-white' : 'text-black'}`} />
              </button>
            ))}

            <Link
              to="/forum/new"
              className="mt-8 w-full block text-center px-6 py-4 bg-black text-white transform skew-x-12 border-2 border-p5-red hover:bg-p5-red transition-all shadow-[4px_4px_0_0_rgba(217,6,20,0.5)] group"
            >
              <div className="transform -skew-x-12 flex items-center justify-center font-black italic uppercase">
                <Plus className="w-5 h-5 mr-2 group-hover:rotate-90 transition-transform" />
                发帖 / NEW POST
              </div>
            </Link>
          </div>
        </aside>

        {/* 主内容: 帖子列表 */}
        <main className="lg:w-3/4">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-16 h-16 border-4 border-p5-red border-t-white rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {posts.length === 0 ? (
                <div className="bg-white border-2 border-black p-12 text-center transform -rotate-1">
                  <p className="text-2xl font-black text-black italic">还没有帖子... 快来抢沙发！</p>
                </div>
              ) : (
                posts.map((post) => (
                  <Link
                    key={post.id}
                    to={`/forum/post/${post.id}`}
                    className="block bg-white border-2 border-black hover:border-p5-red transition-all transform hover:-translate-y-1 hover:translate-x-1 shadow-[4px_4px_0_0_black] hover:shadow-[8px_8px_0_0_#d90614] group"
                  >
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-p5-red text-white text-[10px] px-2 py-0.5 transform -skew-x-12 font-bold italic">
                          {post.category_name}
                        </span>
                        <span className="text-gray-500 text-xs italic">
                          @{post.author_name} · {new Date(post.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h2 className="text-xl font-black text-black group-hover:text-p5-red transition-colors mb-4 italic uppercase">
                        {post.title}
                      </h2>
                      <div className="flex items-center gap-6 text-gray-600">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          <span className="text-xs font-bold">{post.view_count}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          <span className="text-xs font-bold">{post.comment_count}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default ForumHome
