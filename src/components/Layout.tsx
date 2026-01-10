import { Outlet } from 'react-router-dom'
import Header from './Header'

function Layout() {
  return (
    <div className="min-h-screen bg-black" style={{ backgroundImage: 'url("/src/assets/p5-bg.png")', backgroundSize: 'cover', backgroundAttachment: 'fixed', backgroundPosition: 'center' }}>
      <Header />
      <main className="container mx-auto px-4 py-12 relative min-h-screen">
        {/* Dynamic page decoration - More aggressive P5 shards */}
        <div className="fixed top-0 right-0 w-[500px] h-full bg-p5-red opacity-10 transform skew-x-[-20deg] translate-x-32 pointer-events-none z-0"></div>
        <div className="fixed bottom-0 left-0 w-[300px] h-full bg-black opacity-20 transform skew-x-[-15deg] -translate-x-16 pointer-events-none z-0"></div>
        <div className="fixed top-1/4 left-0 w-64 h-64 p5-halftone opacity-20 transform -rotate-45 -translate-x-32 pointer-events-none z-0"></div>

        <div className="relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

export default Layout 