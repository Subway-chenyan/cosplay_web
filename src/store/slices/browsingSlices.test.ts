import { describe, expect, it, vi } from 'vitest'
import { configureStore } from '@reduxjs/toolkit'
import groups, { fetchGroups } from './groupsSlice'
import competitions, { fetchCompetitions } from './competitionsSlice'
import { groupService } from '../../services/groupService'
import { competitionService } from '../../services/competitionService'

vi.mock('../../services/groupService', () => ({ groupService: { getGroups: vi.fn() } }))
vi.mock('../../services/competitionService', () => ({ competitionService: { getCompetitions: vi.fn() } }))

describe('paginated lists', () => {
  it('retains search and province across page requests', async () => {
    vi.mocked(groupService.getGroups).mockResolvedValue({ count: 30, results: [] })
    const store = configureStore({ reducer: { groups } })
    await store.dispatch(fetchGroups({ page: 2, search: '舞台', province: '广东省' }))
    expect(groupService.getGroups).toHaveBeenCalledWith(expect.objectContaining({ page: 2, page_size: 12, search: '舞台', province: '广东省' }), expect.any(AbortSignal))
    expect(store.getState().groups.currentPage).toBe(2)
  })
  it('replaces competition pages instead of accumulating previous results', async () => {
    vi.mocked(competitionService.getCompetitions).mockResolvedValueOnce({ count: 24, results: [{ id: 'first' }] } as any)
      .mockResolvedValueOnce({ count: 24, results: [{ id: 'second' }] } as any)
    const store = configureStore({ reducer: { competitions } })
    await store.dispatch(fetchCompetitions({ page: 1, page_size: 12 }))
    await store.dispatch(fetchCompetitions({ page: 2, page_size: 12 }))
    expect(store.getState().competitions.competitions.map(item => item.id)).toEqual(['second'])
    expect(store.getState().competitions.currentPage).toBe(2)
  })
  it('ignores a stale response arriving after a newer page', () => {
    let state = groups(undefined, fetchGroups.pending('old', { page: 1 }))
    state = groups(state, fetchGroups.pending('new', { page: 2 }))
    state = groups(state, fetchGroups.fulfilled({ results: [], count: 24, page: 2, append: false }, 'new', { page: 2 }))
    state = groups(state, fetchGroups.fulfilled({ results: [], count: 999, page: 1, append: false }, 'old', { page: 1 }))
    expect(state.currentPage).toBe(2)
    expect(state.pagination.count).toBe(24)
  })
})
