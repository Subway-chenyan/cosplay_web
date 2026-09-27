// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom'
import Pagination from '../../components/Pagination'
import RouteScrollManager from './RouteScrollManager'
import { parsePage } from '../serverFilters/query'

let y = 0
beforeEach(() => {
  y = 0
  Object.defineProperty(window, 'scrollY', { configurable: true, get: () => y })
  vi.stubGlobal('scrollTo', vi.fn((options: ScrollToOptions) => { y = options.top || 0 }))
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} })
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => setTimeout(() => callback(0), 0))
  vi.stubGlobal('cancelAnimationFrame', (id: number) => clearTimeout(id))
})
afterEach(() => { cleanup(); vi.unstubAllGlobals() })

function RoutesFixture() {
  const navigate = useNavigate()
  const location = useLocation()
  return <><RouteScrollManager /><div data-route-loading={location.pathname === '/slow'} />
    <button onClick={() => navigate('/detail')}>detail</button>
    <button onClick={() => navigate('/slow')}>slow</button>
    <button onClick={() => navigate(-1)}>back</button></>
}

describe('browsing history', () => {
  it('opens details at top and restores the previous entry position', async () => {
    render(<MemoryRouter initialEntries={['/list']}><RoutesFixture /></MemoryRouter>)
    await waitFor(() => expect(window.scrollTo).toHaveBeenCalled())
    act(() => { y = 720; window.dispatchEvent(new Event('scroll')) })
    fireEvent.click(screen.getByText('detail'))
    await waitFor(() => expect(y).toBe(0))
    fireEvent.click(screen.getByText('back'))
    await waitFor(() => expect(y).toBe(720))
  })
  it('restores the same history entry after remounting on refresh', async () => {
    const entries = [{ pathname: '/refresh', key: 'refresh-entry' }]
    const view = render(<MemoryRouter initialEntries={entries}><RoutesFixture /></MemoryRouter>)
    await waitFor(() => expect(window.scrollTo).toHaveBeenCalled())
    act(() => { y = 460; window.dispatchEvent(new Event('scroll')); window.dispatchEvent(new Event('pagehide')) })
    view.unmount()
    y = 0
    render(<MemoryRouter initialEntries={entries}><RoutesFixture /></MemoryRouter>)
    await waitFor(() => expect(y).toBe(460))
  })
  it('waits for loading to finish before positioning a new route', async () => {
    render(<MemoryRouter initialEntries={['/waiting']}><RoutesFixture /></MemoryRouter>)
    await waitFor(() => expect(window.scrollTo).toHaveBeenCalled())
    act(() => { y = 290; window.dispatchEvent(new Event('scroll')) })
    fireEvent.click(screen.getByText('slow'))
    await new Promise(resolve => setTimeout(resolve, 20))
    expect(y).toBe(290)
    act(() => { document.querySelector('[data-route-loading]')?.setAttribute('data-route-loading', 'false') })
    await waitFor(() => expect(y).toBe(0))
  })
  it('waits for asynchronous content and stops if the user scrolls', async () => {
    render(<MemoryRouter initialEntries={['/other']}><RoutesFixture /></MemoryRouter>)
    await waitFor(() => expect(window.scrollTo).toHaveBeenCalled())
    fireEvent.click(screen.getByText('slow'))
    act(() => { y = 330; window.dispatchEvent(new Event('wheel')) })
    act(() => { document.querySelector('[data-route-loading]')?.setAttribute('data-route-loading', 'false') })
    await new Promise(resolve => setTimeout(resolve, 30))
    expect(y).toBe(330)
  })
})

it('renders both pagination gaps and prevents duplicate current-page navigation', () => {
  const change = vi.fn()
  render(<Pagination currentPage={10} totalCount={300} pageSize={12} onPageChange={change} />)
  expect(screen.getAllByText('...')).toHaveLength(2)
  fireEvent.click(screen.getByRole('button', { name: '第 10 页' }))
  expect(change).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: '下一页' }))
  expect(change).toHaveBeenCalledWith(11)
})

it('rejects malformed and unsafe page numbers', () => {
  for (const value of ['-1', '0', '1.2', 'Infinity', '999999999999999999999999', 'abc']) expect(parsePage(value)).toBe(1)
  expect(parsePage('12')).toBe(12)
})
