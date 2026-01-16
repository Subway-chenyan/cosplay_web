import { Link, useLocation } from 'react-router-dom'
import { Menu, X, User } from 'lucide-react'
import { useState, useEffect } from 'react'

function Header() {
  const location = useLocation()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    // 检查用户是否登录
    const token = localStorage.getItem('access_token')
    setIsLoggedIn(!!token)
  }, [location])

  const navigation = [
    { name: '主页', href: '/' },
    { name: '社团', href: '/groups' },
    { name: '比赛', href: '/competitions' },
    { name: '论坛', href: '/forum' },
    { name: '队形编排', href: '/choreo' },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <header className="bg-black border-b-4 border-p5-red sticky top-0 z-50 shadow-[0_4px_0_0_rgba(0,0,0,1)]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center group">
              <div className="w-10 h-10 bg-p5-red transform rotate-12 flex items-center justify-center border-2 border-white shadow-[2px_2px_0_0_white] group-hover:rotate-0 transition-transform overflow-hidden">
                <img src="/assets/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
              </div>
              <div className="ml-4 bg-white px-2 py-1 transform -skew-x-12 border-2 border-black">
                <span className="text-xl font-black text-black uppercase tracking-tighter">Cosplay舞台剧</span>
              </div>
            </Link>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigation.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`relative px-6 py-2 transition-all duration-200 group overflow-hidden ${active ? 'z-10' : ''
                    }`}
                >
                  {/* Skewed background for active/hover */}
                  <div className={`absolute inset-0 transform -skew-x-12 transition-all duration-200 ${active ? 'bg-p5-red translate-x-0' : 'bg-white -translate-x-full group-hover:translate-x-0'
                    }`}></div>

                  {/* Text */}
                  <span className={`relative z-10 text-sm font-black uppercase italic transform skew-x-12 inline-block transition-colors ${active ? 'text-white' : 'text-white group-hover:text-black'
                    }`}>
                    {item.name}
                  </span>

                  {/* Decorative dot for active */}
                  {active && (
                    <div className="absolute bottom-1 right-2 w-1.5 h-1.5 bg-white rounded-full"></div>
                  )}
                </Link>
              )
            })}

            {/* 用户相关链接 */}
            <div className="ml-4 flex items-center space-x-2">
              {isLoggedIn ? (
                <Link
                  to="/user-center"
                  className={`relative px-4 py-2 transition-all duration-200 group overflow-hidden ${isActive('/user-center') ? 'z-10' : ''}`}
                >
                  <div className={`absolute inset-0 transform -skew-x-12 transition-all duration-200 ${isActive('/user-center') ? 'bg-p5-red translate-x-0' : 'bg-white -translate-x-full group-hover:translate-x-0'
                    }`}></div>
                  <span className="relative z-10 text-sm font-black uppercase italic transform skew-x-12 inline-block flex items-center transition-colors text-white group-hover:text-black">
                    <User className="w-4 h-4 mr-1" />
                    用户中心
                  </span>
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="relative px-4 py-2 transition-all duration-200 group overflow-hidden"
                  >
                    <div className="absolute inset-0 transform -skew-x-12 bg-white -translate-x-full group-hover:translate-x-0 transition-all duration-200"></div>
                    <span className="relative z-10 text-sm font-black uppercase italic transform skew-x-12 inline-block transition-colors text-white group-hover:text-black">
                      登录
                    </span>
                  </Link>
                  <Link
                    to="/register"
                    className="relative px-4 py-2 transition-all duration-200 group overflow-hidden"
                  >
                    <div className="absolute inset-0 transform -skew-x-12 bg-p5-red -translate-x-full group-hover:translate-x-0 transition-all duration-200"></div>
                    <span className="relative z-10 text-sm font-black uppercase italic transform skew-x-12 inline-block transition-colors text-white">
                      注册
                    </span>
                  </Link>
                </>
              )}
            </div>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 bg-p5-red text-white border-2 border-white transform rotate-3"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 transform -rotate-3" />
              ) : (
                <Menu className="h-6 w-6 transform -rotate-3" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-6 bg-black border-t-2 border-p5-red">
            <nav className="flex flex-col space-y-3">
              {navigation.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`px-4 py-3 transform -skew-x-6 border-l-8 transition-all ${active ? 'bg-p5-red border-white text-white' : 'border-p5-red text-white hover:bg-gray-900'
                      }`}
                  >
                    <span className="text-lg font-black uppercase italic block transform skew-x-6">
                      {item.name}
                    </span>
                  </Link>
                )
              })}

              {/* 用户相关链接 - 移动端 */}
              <div className="border-t-2 border-p5-red pt-4 mt-4 space-y-2">
                {isLoggedIn ? (
                  <Link
                    to="/user-center"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-4 py-3 transform -skew-x-6 border-l-8 transition-all ${isActive('/user-center') ? 'bg-p5-red border-white text-white' : 'border-p5-red text-white hover:bg-gray-900'
                      }`}
                  >
                    <span className="text-lg font-black uppercase italic block transform skew-x-6 flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      用户中心
                    </span>
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-4 py-3 transform -skew-x-6 border-l-8 border-p5-red text-white hover:bg-gray-900 transition-all"
                    >
                      <span className="text-lg font-black uppercase italic block transform skew-x-6">
                        登录
                      </span>
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block px-4 py-3 transform -skew-x-6 border-l-8 border-p5-red text-white hover:bg-gray-900 transition-all"
                    >
                      <span className="text-lg font-black uppercase italic block transform skew-x-6">
                        注册
                      </span>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}

export default Header