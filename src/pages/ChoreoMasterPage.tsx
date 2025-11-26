import { useEffect, useMemo, useState } from 'react'

function ChoreoMasterPage() {
  const [loaded, setLoaded] = useState(false)
  const [src, setSrc] = useState('/choreomaster/dist/index.html')

  useEffect(() => {
    const t = setTimeout(() => {
      if (!loaded) setSrc('/choreomaster/ChoreoMaster/dist/index.html')
    }, 1500)
    return () => clearTimeout(t)
  }, [loaded])

  const containerStyle = useMemo(() => ({ top: '64px' }), [])

  return (
    <div className="fixed left-0 right-0 bottom-0" style={containerStyle}>
      {!loaded && (
        <div className="flex items-center justify-center h-full text-gray-600">加载中...</div>
      )}
      <iframe
        src={src}
        title="ChoreoMaster"
        className="w-full h-full border-0"
        onLoad={() => setLoaded(true)}
      />
    </div>
  )
}

export default ChoreoMasterPage