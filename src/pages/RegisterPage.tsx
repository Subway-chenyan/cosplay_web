import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { User, Mail, Lock, AlertCircle } from 'lucide-react'
import Header from '../components/Header'

function RegisterPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password2: '',
    nickname: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

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

    if (!formData.username || !formData.email || !formData.password || !formData.password2) {
      setError('请填写所有必填字段')
      return
    }

    if (formData.password !== formData.password2) {
      setError('两次输入的密码不一致')
      return
    }

    if (formData.password.length < 8) {
      setError('密码长度至少为 8 个字符')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/users/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        navigate('/login', { state: { message: '注册成功！请登录' } })
      } else {
        if (typeof data === 'string') {
          setError(data)
        } else if (data.detail) {
          setError(data.detail)
        } else if (data.username) {
          setError(data.username.join(', '))
        } else if (data.email) {
          setError(data.email.join(', '))
        } else {
          setError('注册失败，请稍后重试')
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
                用户注册 / SIGN UP
              </h1>
              <p className="text-gray-600 font-bold">加入 Cosplay 舞台剧视频数据库</p>
            </div>
          </div>
        </div>

        {/* 注册表单 */}
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

              {/* 用户名 */}
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
                    placeholder="请输入用户名"
                    required
                  />
                </div>
              </div>

              {/* 邮箱 */}
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2 uppercase italic">
                  邮箱 / EMAIL *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border-2 border-black focus:border-p5-red focus:ring-p5-red font-bold"
                    placeholder="请输入邮箱"
                    required
                  />
                </div>
              </div>

              {/* 昵称 */}
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2 uppercase italic">
                  昵称 / NICKNAME
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="nickname"
                    value={formData.nickname}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border-2 border-black focus:border-p5-red focus:ring-p5-red font-bold"
                    placeholder="请输入昵称（可选）"
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
                    placeholder="请输入密码（至少 8 位）"
                    required
                  />
                </div>
              </div>

              {/* 确认密码 */}
              <div>
                <label className="block text-sm font-black text-gray-700 mb-2 uppercase italic">
                  确认密码 / CONFIRM PASSWORD *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    name="password2"
                    value={formData.password2}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border-2 border-black focus:border-p5-red focus:ring-p5-red font-bold"
                    placeholder="请再次输入密码"
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
                    {loading ? '注册中...' : '立即注册 / SIGN UP NOW'}
                  </span>
                </div>
              </button>

              {/* 登录链接 */}
              <div className="text-center pt-4 border-t-2 border-black">
                <p className="text-gray-600 font-bold">
                  已有账号？
                  <Link to="/login" className="text-p5-red hover:text-red-700 font-black underline ml-1">
                    立即登录
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* 底部提示 */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            注册即表示您同意我们的服务条款和隐私政策
          </p>
        </div>
      </div>
    </div>
    </>
  )
}

export default RegisterPage
