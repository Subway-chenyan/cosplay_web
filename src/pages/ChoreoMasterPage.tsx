import { useMemo, useState, useEffect } from 'react'

const CHOREOMASTER_SRC = '/choreomaster/ChoreoMaster/dist/index.html'

function ChoreoMasterPage() {
  const [loaded, setLoaded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // 检测是否为移动端
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const isMobileDevice = /android|webos|iphone|blackberry|iemobile|opera mini/i.test(userAgent)
      const isSmallScreen = window.innerWidth < 768
      setIsMobile(isMobileDevice || isSmallScreen)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const containerStyle = useMemo(() => ({ top: '80px' }), [])

  if (isMobile) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8">
        <div className="max-w-md text-center space-y-6">
          <div className="text-6xl">📱</div>
          <h1 className="text-3xl font-black italic uppercase text-p5-red">
            暂不支持移动端 / Mobile Not Supported
          </h1>
          <p className="text-lg text-gray-300">
            队形编排工具目前仅支持桌面端浏览器访问。<br />
            ChoreoMaster is currently only available on desktop browsers.
          </p>
          <p className="text-sm text-gray-400">
            请使用电脑访问此页面以获得最佳体验。<br />
            Please use a desktop for the best experience.
          </p>
          <a
            href="/"
            className="inline-block mt-8 px-8 py-3 bg-white text-black font-black italic uppercase hover:bg-p5-red hover:text-white transition-all transform hover:scale-105 border-2 border-black"
          >
            返回首页 / Back to Home
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed left-0 right-0 bottom-0" style={containerStyle}>
      {!loaded && (
        <div className="flex items-center justify-center h-full text-gray-600">加载中...</div>
      )}
      <iframe
        src={CHOREOMASTER_SRC}
        title="ChoreoMaster"
        className="w-full h-full border-0"
        onLoad={() => setLoaded(true)}
      />
    </div>
  )
}

export default ChoreoMasterPage