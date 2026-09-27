import { useLayoutEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

const storageKey = 'browse-scroll-v1'
const positions = new Map<string, number>()
try {
  const saved = JSON.parse(sessionStorage.getItem(storageKey) || '[]')
  if (Array.isArray(saved)) saved.forEach(([key, y]) => {
    if (typeof key === 'string' && Number.isFinite(y) && y >= 0) positions.set(key, y)
  })
} catch { /* Storage is optional. */ }

/** Save positions per history entry, including entries with identical URLs. */
export default function RouteScrollManager() {
  const location = useLocation()
  const navigationType = useNavigationType()
  useLayoutEffect(() => {
    const previous = history.scrollRestoration
    history.scrollRestoration = 'manual'
    return () => { history.scrollRestoration = previous }
  }, [])
  useLayoutEffect(() => {
    const key = `${location.key}:${location.pathname}${location.search}${location.hash}`
    const saved = navigationType === 'POP' ? positions.get(key) : undefined
    let cancelled = false
    let frame = 0
    let lastY = saved ?? window.scrollY
    let restoring = true
    const persist = () => {
      positions.delete(key)
      positions.set(key, lastY)
      while (positions.size > 100) positions.delete(positions.keys().next().value!)
      try { sessionStorage.setItem(storageKey, JSON.stringify([...positions])) } catch { /* optional */ }
    }
    const cancel = () => { cancelled = true; restoring = false; lastY = window.scrollY }
    const onKey = (event: KeyboardEvent) => {
      if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) cancel()
    }
    const onScroll = () => { if (!restoring) lastY = window.scrollY }
    const restore = () => {
      if (cancelled || document.querySelector('[data-route-loading="true"]')) return
      let anchor: string | undefined
      try { anchor = location.hash ? decodeURIComponent(location.hash.slice(1)) : undefined } catch { /* invalid hash */ }
      if (saved === undefined && navigationType !== 'POP') anchor = location.state?.scrollTarget || anchor
      const element = anchor ? document.getElementById(anchor) : null
      if (anchor && !element && saved === undefined) return
      const top = saved ?? (element ? Math.max(0, element.getBoundingClientRect().top + window.scrollY - 108) : 0)
      window.scrollTo({ top, behavior: 'instant' as ScrollBehavior })
      lastY = window.scrollY
      if (Math.abs(window.scrollY - top) <= 2) { restoring = false; cancelled = true }
    }
    const schedule = () => { if (!cancelled) { cancelAnimationFrame(frame); frame = requestAnimationFrame(restore) } }
    const observer = new MutationObserver(schedule)
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-route-loading'] })
    const resize = new ResizeObserver(schedule)
    resize.observe(document.body)
    schedule()
    const timeout = window.setTimeout(cancel, 15000)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('wheel', cancel, { passive: true })
    window.addEventListener('touchstart', cancel, { passive: true })
    window.addEventListener('keydown', onKey)
    window.addEventListener('pagehide', persist)
    return () => {
      persist()
      observer.disconnect()
      resize.disconnect()
      cancelAnimationFrame(frame)
      clearTimeout(timeout)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('wheel', cancel)
      window.removeEventListener('touchstart', cancel)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pagehide', persist)
    }
  }, [location.key, location.pathname, location.search, location.hash, location.state, navigationType])
  return null
}
