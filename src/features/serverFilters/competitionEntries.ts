import type { CompetitionEntry } from '../../types'


export interface CompetitionAwardGroup {
  award: NonNullable<CompetitionEntry['award']>
  entries: CompetitionEntry[]
}

export interface GroupedCompetitionEntries {
  awardGroups: CompetitionAwardGroup[]
  participants: CompetitionEntry[]
}

export const groupCompetitionEntries = (
  entries: CompetitionEntry[],
): GroupedCompetitionEntries => {
  const groupMap = new Map<string, CompetitionAwardGroup>()
  const participants: CompetitionEntry[] = []

  entries.forEach((entry) => {
    if (!entry.award) {
      participants.push(entry)
      return
    }
    const existing = groupMap.get(entry.award.id)
    if (existing) {
      existing.entries.push(entry)
    } else {
      groupMap.set(entry.award.id, {
        award: entry.award,
        entries: [entry],
      })
    }
  })

  return {
    awardGroups: [...groupMap.values()],
    participants,
  }
}
