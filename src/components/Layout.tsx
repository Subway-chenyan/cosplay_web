import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import ScrollToTopButton from './ScrollToTopButton'

function Layout() {
  const location = useLocation()
  const isChoreoPage = location.pathname === '/choreo'
  const isHomePage = location.pathname === '/'

  return (
    <div className={`min-h-screen text-white flex flex-col ${isHomePage || isChoreoPage ? 'bg-black' : 'bg-transparent'}`}>
      <Header />
      <main className={`relative flex-grow ${!isHomePage ? 'mx-auto w-full max-w-[1500px] px-4 py-10' : ''}`}>
        <Outlet />
      </main>
      {!isChoreoPage && <Footer />}
      {!isChoreoPage && <ScrollToTopButton />}
    </div>
  )
}

export default Layout 