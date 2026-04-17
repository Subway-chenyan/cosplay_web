import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Header from '../components/Header'
import { authService } from '../services/authService'

function QQLoginCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const accessToken = searchParams.get('access')
  const refreshToken = searchParams.get('refresh')
  const error = searchParams.get('error')
  const detail = searchParams.get('detail')

  const errorMessage = useMemo(() => {
    if (!error) {
      return ''
    }
    return detail || 'QQ 登录失败，请稍后重试'
  }, [detail, error])

  useEffect(() => {
    if (accessToken && refreshToken) {
      authService.storeTokens(accessToken, refreshToken)
      navigate('/user-center', { replace: true })
    }
  }, [accessToken, refreshToken, navigate])

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="relative group mb-8">
            <div className="absolute inset-0 bg-p5-red translate-x-3 translate-y-3 z-0"></div>
            <div className="relative z-10 bg-white border-4 border-black p-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-black text-black mb-2">
                  QQ 登录
                </h1>
                <p className="text-gray-600 font-bold">
                  正在处理第三方登录结果
                </p>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-black translate-x-2 translate-y-2 z-0"></div>
            <div className="relative z-10 bg-white border-4 border-black p-8">
              {errorMessage ? (
                <div className="space-y-6">
                  <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4">
                    <p className="text-red-800 font-bold">{errorMessage}</p>
                  </div>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center border-3 border-black bg-white px-6 py-3 font-black hover:bg-gray-100"
                  >
                    返回登录页
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-lg font-black text-black">正在登录，请稍候...</p>
                  <p className="text-sm text-gray-600">
                    如果长时间没有跳转，请返回登录页重新尝试。
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default QQLoginCallbackPage
