import { describe, expect, it } from 'vitest'

import type { CompetitionEntry } from '../../types'
import { groupCompetitionEntries } from './competitionEntries'


const entry = (
  entryId: string,
  award: CompetitionEntry['award'],
  kind: CompetitionEntry['kind'],
): CompetitionEntry => ({
  entry_id: entryId,
  kind,
  year: 2025,
  award,
  award_record: kind === 'unawarded_video' ? null : ({ id: entryId } as CompetitionEntry['award_record']),
  video: kind === 'award_without_video' ? null : ({ id: entryId } as CompetitionEntry['video']),
})


describe('groupCompetitionEntries', () => {
  it('groups awarded records and keeps unawarded videos separate', () => {
    const award = { id: 'award-a', name: '一等奖' }
    const result = groupCompetitionEntries([
      entry('awarded', award, 'awarded_video'),
      entry('no-video', award, 'award_without_video'),
      entry('participant', null, 'unawarded_video'),
    ])

    expect(result.awardGroups).toEqual([
      { award, entries: expect.arrayContaining([
        expect.objectContaining({ entry_id: 'awarded' }),
        expect.objectContaining({ entry_id: 'no-video' }),
      ]) },
    ])
    expect(result.participants.map((item) => item.entry_id)).toEqual(['participant'])
  })
})
