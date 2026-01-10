import { useMemo, useState } from 'react'

const CHOREOMASTER_SRC = '/choreomaster/ChoreoMaster/dist/index.html'

function ChoreoMasterPage() {
  const [loaded, setLoaded] = useState(false)

  const containerStyle = useMemo(() => ({ top: '80px' }), [])

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