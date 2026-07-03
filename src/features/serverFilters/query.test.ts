import { describe, expect, it } from 'vitest'

import {
  parseCompetitionFilterParams,
  parseHomeFilterParams,
  serializeCompetitionFilterParams,
  serializeHomeFilterParams,
} from './query'


describe('home filter URL contract', () => {
  it('normalizes CSV IDs, year and invalid page', () => {
    const parsed = parseHomeFilterParams(new URLSearchParams(
      'q=%E5%8E%9F%E7%A5%9E&year=2025&competitions=b,a,a&groups=x,,x&page=0',
    ))

    expect(parsed).toEqual({
      query: '原神',
      year: 2025,
      competitionIds: ['a', 'b'],
      groupIds: ['x'],
      page: 1,
    })
    expect(serializeHomeFilterParams(parsed).toString()).toBe(
      'q=%E5%8E%9F%E7%A5%9E&year=2025&competitions=a%2Cb&groups=x',
    )
  })

  it('drops out-of-range years and preserves a valid page', () => {
    const parsed = parseHomeFilterParams(new URLSearchParams('year=99&page=3'))

    expect(parsed.year).toBeUndefined()
    expect(parsed.page).toBe(3)
    expect(serializeHomeFilterParams(parsed).toString()).toBe('page=3')
  })
})


describe('competition filter URL contract', () => {
  it('supports year and award together', () => {
    const parsed = parseCompetitionFilterParams(
      new URLSearchParams('year=2025&award=award-id'),
    )

    expect(parsed).toEqual({ year: 2025, awardId: 'award-id' })
    expect(serializeCompetitionFilterParams(parsed).toString()).toBe(
      'year=2025&award=award-id',
    )
  })

  it('omits empty and invalid values', () => {
    const parsed = parseCompetitionFilterParams(
      new URLSearchParams('year=invalid&award='),
    )

    expect(parsed).toEqual({})
    expect(serializeCompetitionFilterParams(parsed).toString()).toBe('')
  })
})
