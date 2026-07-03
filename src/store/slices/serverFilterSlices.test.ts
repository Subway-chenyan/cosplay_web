import { describe, expect, it } from 'vitest'

import type { CompetitionEntry, HomeFilterState, Video } from '../../types'
import competitionEntriesReducer, {
  fetchCompetitionEntries,
  loadMoreCompetitionEntries,
} from './competitionEntriesSlice'
import homeVideosReducer, { fetchHomeVideos } from './homeVideosSlice'


const homeFilters: HomeFilterState = {
  query: '',
  competitionIds: [],
  groupIds: [],
  page: 1,
}

const video = (id: string): Video => ({
  id,
  bv_number: `BV-${id}`,
  title: id,
  description: '',
  url: '',
  thumbnail: '',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
  tags: [],
})

const entry = (id: string): CompetitionEntry => ({
  entry_id: id,
  kind: 'unawarded_video',
  award: null,
  award_record: null,
  video: video(id),
})


describe('homeVideosSlice request races', () => {
  it('ignores a fulfilled response from an older request', () => {
    let state = homeVideosReducer(
      undefined,
      fetchHomeVideos.pending('current-request', homeFilters),
    )

    state = homeVideosReducer(
      state,
      fetchHomeVideos.fulfilled({
        count: 1,
        next: null,
        previous: null,
        results: [video('old')],
      }, 'old-request', homeFilters),
    )

    expect(state.videos).toEqual([])
    expect(state.loading).toBe(true)

    state = homeVideosReducer(
      state,
      fetchHomeVideos.fulfilled({
        count: 1,
        next: null,
        previous: null,
        results: [video('new')],
      }, 'current-request', homeFilters),
    )
    expect(state.videos.map((item) => item.id)).toEqual(['new'])
    expect(state.loading).toBe(false)
  })
})


describe('competitionEntriesSlice load more', () => {
  it('retains entries after failure and de-duplicates a successful retry', () => {
    const initialArgs = { competitionId: 'competition', filters: {} }
    let state = competitionEntriesReducer(
      undefined,
      fetchCompetitionEntries.pending('initial', initialArgs),
    )
    state = competitionEntriesReducer(
      state,
      fetchCompetitionEntries.fulfilled({
        count: 2,
        next: '/next',
        previous: null,
        results: [entry('one')],
      }, 'initial', initialArgs),
    )

    state = competitionEntriesReducer(
      state,
      loadMoreCompetitionEntries.pending('more', undefined),
    )
    state = competitionEntriesReducer(
      state,
      loadMoreCompetitionEntries.rejected(
        new Error('network'),
        'more',
        undefined,
      ),
    )
    expect(state.entries.map((item) => item.entry_id)).toEqual(['one'])
    expect(state.next).toBe('/next')
    expect(state.loadMoreError).toBeTruthy()

    state = competitionEntriesReducer(
      state,
      loadMoreCompetitionEntries.pending('retry', undefined),
    )
    state = competitionEntriesReducer(
      state,
      loadMoreCompetitionEntries.fulfilled({
        count: 2,
        next: null,
        previous: '/previous',
        results: [entry('one'), entry('two')],
      }, 'retry', undefined),
    )
    expect(state.entries.map((item) => item.entry_id)).toEqual(['one', 'two'])
    expect(state.next).toBeNull()
    expect(state.loadMoreError).toBeNull()
  })
})
