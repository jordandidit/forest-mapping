import type { WaterQualityStatus } from '@/domain/water-quality/types'

export const LAKE_SEARCH_RESULT_LIMIT = 8

export interface LakeSearchRecord {
  id: string
  name: string
  province: string
  district?: string | null
  status?: WaterQualityStatus | null
  statusLabel?: string | null
}

export type LakeSearchKeyAction =
  | { type: 'none' }
  | { type: 'close' }
  | { type: 'move'; index: number }
  | { type: 'navigate'; lakeId: string }

/** Case-insensitive match on name, province, and district. Does not fetch. */
export function searchLakes<T extends LakeSearchRecord>(
  lakes: readonly T[],
  query: string,
  limit = LAKE_SEARCH_RESULT_LIMIT,
): T[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return []
  return lakes
    .filter((lake) => lakeSearchText(lake).includes(needle))
    .slice(0, limit)
}

export function lakeRoute(lakeId: string): string {
  return `/lakes/${lakeId}`
}

/** Clicking or confirming a result opens that lake and clears the query. */
export function lakeSearchSelection(lakeId: string): {
  route: string
  close: true
  clearQuery: true
} {
  return { route: lakeRoute(lakeId), close: true, clearQuery: true }
}

export function lakePlaceLabel(lake: Pick<LakeSearchRecord, 'province' | 'district'>): string {
  const district = lake.district?.trim()
  return district ? `${lake.province} · ${district}` : lake.province
}

export function searchKeyAction(input: {
  key: string
  results: readonly { id: string }[]
  activeIndex: number
  open: boolean
}): LakeSearchKeyAction {
  const count = input.results.length
  if (input.key === 'Escape') return { type: 'close' }
  if (count === 0) return { type: 'none' }

  if (input.key === 'ArrowDown') {
    const index = input.open ? (input.activeIndex + 1) % count : 0
    return { type: 'move', index }
  }
  if (input.key === 'ArrowUp') {
    const index = input.open ? (input.activeIndex - 1 + count) % count : count - 1
    return { type: 'move', index }
  }
  if (input.key === 'Enter' && input.open) {
    const index = input.activeIndex >= 0 && input.activeIndex < count ? input.activeIndex : 0
    const lake = input.results[index]
    return lake ? { type: 'navigate', lakeId: lake.id } : { type: 'none' }
  }
  return { type: 'none' }
}

function lakeSearchText(lake: LakeSearchRecord): string {
  return [lake.name, lake.province, lake.district]
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(' ')
    .toLowerCase()
}
