import { searchLakes, type LakeSearchRecord } from '@/features/lakes/lake-search'

/** UI chips. `no_data` groups stored "No recent data" and "Pending" only. */
export const LAKE_CONDITION_FILTERS = ['all', 'good', 'fair', 'poor', 'no_data'] as const

export type LakeConditionFilter = (typeof LAKE_CONDITION_FILTERS)[number]

export const LAKE_CONDITION_CHIPS: { id: LakeConditionFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'good', label: 'Good' },
  { id: 'fair', label: 'Fair' },
  { id: 'poor', label: 'Poor' },
  { id: 'no_data', label: 'No data' },
]

/** Pipeline WaterBodies status strings. Not a React classifier. */
const STORED_GOOD = 'Good'
const STORED_FAIR = 'Fair'
const STORED_POOR = 'Poor'
const STORED_NO_RECENT_DATA = 'No recent data'
const STORED_PENDING = 'Pending'

export interface LakeConditionRecord {
  statusLabel?: string | null
}

export interface LakeConditionCounts {
  all: number
  good: number
  fair: number
  poor: number
  no_data: number
}

function storedStatusLabel(statusLabel: string | null | undefined): string | null {
  const raw = statusLabel?.trim().replace(/\s+/g, ' ')
  return raw ? raw : null
}

function sameStoredLabel(label: string, expected: string): boolean {
  return label.localeCompare(expected, undefined, { sensitivity: 'accent' }) === 0
}

/** Bucket for one stored label. Unknown labels return null and stay in All only. */
export function lakeConditionBucket(
  statusLabel: string | null | undefined,
): Exclude<LakeConditionFilter, 'all'> | null {
  const label = storedStatusLabel(statusLabel)
  if (!label) return null
  if (sameStoredLabel(label, STORED_GOOD)) return 'good'
  if (sameStoredLabel(label, STORED_FAIR)) return 'fair'
  if (sameStoredLabel(label, STORED_POOR)) return 'poor'
  if (sameStoredLabel(label, STORED_NO_RECENT_DATA) || sameStoredLabel(label, STORED_PENDING)) {
    return 'no_data'
  }
  return null
}

/** Color for the same bucket the filter uses. Does not read the loose domain status. */
export function lakeConditionDotClass(
  statusLabel: string | null | undefined,
): string {
  switch (lakeConditionBucket(statusLabel)) {
    case 'good':
      return 'bg-[var(--color-status-good)]'
    case 'fair':
      return 'bg-[var(--color-status-moderate)]'
    case 'poor':
      return 'bg-[var(--color-status-critical)]'
    case 'no_data':
      return 'bg-[var(--color-status-unknown)]'
    default:
      return 'bg-[var(--color-status-unknown)]'
  }
}

export function lakeMatchesCondition(
  lake: LakeConditionRecord,
  filter: LakeConditionFilter,
): boolean {
  if (filter === 'all') return true
  return lakeConditionBucket(lake.statusLabel) === filter
}

export function filterLakesByCondition<T extends LakeConditionRecord>(
  lakes: readonly T[],
  filter: LakeConditionFilter,
): T[] {
  if (filter === 'all') return [...lakes]
  return lakes.filter((lake) => lakeMatchesCondition(lake, filter))
}

/** Counts of loaded lakes before search. Each lake is in All and at most one status chip. */
export function countLakesByCondition(lakes: readonly LakeConditionRecord[]): LakeConditionCounts {
  const counts: LakeConditionCounts = {
    all: lakes.length,
    good: 0,
    fair: 0,
    poor: 0,
    no_data: 0,
  }
  for (const lake of lakes) {
    const bucket = lakeConditionBucket(lake.statusLabel)
    if (bucket) counts[bucket] += 1
  }
  return counts
}

/**
 * Sidebar list: loaded lakes → condition → search.
 * Returns matching lakes only. Does not return a route or change the open lake.
 */
export function filterLakesForSidebar<T extends LakeSearchRecord>(
  lakes: readonly T[],
  filter: LakeConditionFilter,
  query: string,
): T[] {
  const byCondition = filterLakesByCondition(lakes, filter)
  if (!query.trim()) return byCondition
  return searchLakes(byCondition, query, byCondition.length)
}

export function lakeSidebarEmptyMessage(query: string): string {
  return query.trim() ? 'No matching lakes found.' : 'No lakes match this filter.'
}
