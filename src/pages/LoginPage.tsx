import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { User, Lock, AlertCircle } from 'lucide-react'
import Header from '../components/Header'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message)
      window.history.replaceState({}, document.title)
    }
  }, [location])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.username || !formData.password) {
      setError('请填写所有字段')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/token/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('access_token', data.access)
        localStorage.setItem('refresh_token', data.refresh)
        navigate('/user-center', { replace: true })
      } else {
        if (data.detail) {
          setError(data.detail)
        } else {
          setError('用户名或密码错误')
        }
      }
    } catch (err) {
      setError('网络错误，请检查连接后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* P5 风格标题 */}
        <div className="relative group mb-8">
          <div className="absolute inset-0 bg-p5-red transform translate-x-3 translate-y-3 -skew-x-3 z-0"></div>
          <div className="relative z-10 bg-white border-4 border-black p-6 transform -skew-x-3">
            <div className="transform skew-x-3">
              <h1 className="text-4xl md:text-5xl font-black text-black mb-2 uppercase italic">
                用户登录 / LOGIN
              </h1>
              <p className="text-gray-600 font-bold">欢迎回到 Cosplay 舞台剧视频数据库</p>
            </div>
          </div>
        </div>

        {/* 成功消息 */}
        {message && (
          <div className="bg-green-50 border-2 border-green-500 rounded-lg p-4 mb-6 flex items-center space-x-3">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-800 font-bold text-sm flex-1">{message}</p>
          </div>
        )}

        {/* 登录表单 */}
        <div className="relative">
          <div className="absolute inset-0 bg-black transform translate-x-2 translate-y-2 -skew-x-2 z-0"></div>
          <div className="relative z-10 bg-white border-4 border-black p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 错误提示 */}
              {error && (
                <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-red-800 font-bold text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* 用户名或邮箱 */}
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2 uppercase italic">
                  用户名 / USERNAME *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border-2 border-black focus:border-p5-red focus:ring-p5-red font-bold"
                    placeholder="请输入用户名或邮箱"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* 密码 */}
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2 uppercase italic">
                  密码 / PASSWORD *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border-2 border-black focus:border-p5-red focus:ring-p5-red font-bold"
                    placeholder="请输入密码"
                    required
                  />
                </div>
              </div>

              {/* 提交按钮 */}
              <button
                type="submit"
                disabled={loading}
                className="w-full relative group"
              >
                <div className="absolute inset-0 bg-p5-red transform translate-x-1.5 translate-y-1.5 -skew-x-6 group-hover:translate-x-1 group-hover:translate-y-1 transition-transform"></div>
                <div className="relative bg-white border-3 border-black px-6 py-4 transform -skew-x-6 group-hover:-skew-x-3 transition-transform">
                  <span className="block text-xl font-black uppercase italic transform skew-x-6 group-hover:skew-x-3 transition-transform">
                    {loading ? '登录中...' : '立即登录 / LOGIN NOW'}
                  </span>
                </div>
              </button>

              {/* 注册链接 */}
              <div className="text-center pt-4 border-t-2 border-black">
                <p className="text-gray-600 font-bold">
                  还没有账号？
                  <a href="/register" className="text-p5-red hover:text-red-700 font-black underline ml-1">
                    立即注册
                  </a>
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* 底部提示 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            忘记密码？请联系管理员重置
          </p>
        </div>
      </div>
    </div>
    </>
  )
}

export default LoginPage
