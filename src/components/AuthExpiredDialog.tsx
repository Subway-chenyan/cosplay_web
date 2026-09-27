import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { LogIn, AlertCircle } from 'lucide-react'
import { AUTH_EXPIRED_EVENT } from '../services/api'

// 登录态过期弹窗：api.ts 刷新 token 失败后派发 AUTH_EXPIRED_EVENT，这里监听并提醒重新登录
function AuthExpiredDialog() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handler = () => setOpen(true)
    window.addEventListener(AUTH_EXPIRED_EVENT, handler)
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handler)
  }, [])

  if (!open) return null

  // 已在登录/注册页时不再弹窗，避免遮挡表单
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      <div
        className="absolute inset-0 bg-black/80"
        onClick={() => setOpen(false)}
      />

      <div className="relative w-full max-w-md">
        <div className="absolute inset-0 bg-p5-red transform translate-x-2 translate-y-2 z-0" />
        <div className="relative z-10 bg-white border-4 border-black p-8">
          <div className="flex items-start space-x-3 mb-6">
            <AlertCircle className="w-7 h-7 text-p5-red flex-shrink-0 mt-0.5" />
            <div>
              <h2 className="text-2xl font-black text-black italic mb-1">
                登录已过期
              </h2>
              <p className="text-gray-600 font-bold text-sm">
                你的登录状态已失效，请重新登录后继续使用。
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-5 py-2.5 font-bold text-gray-600 hover:text-black transition-colors"
            >
              稍后再说
            </button>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="relative group"
            >
              <span className="absolute inset-0 bg-black transform translate-x-1 translate-y-1 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform z-0" />
              <span className="relative z-10 flex items-center space-x-2 bg-p5-red border-2 border-black px-6 py-2.5 font-black text-white italic">
                <LogIn className="w-4 h-4" />
                <span>重新登录</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthExpiredDialog
