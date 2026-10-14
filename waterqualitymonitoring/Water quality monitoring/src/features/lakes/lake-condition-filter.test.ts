import { describe, expect, it } from 'vitest'
import { searchLakes } from '@/features/lakes/lake-search'
import {
  countLakesByCondition,
  filterLakesByCondition,
  filterLakesForSidebar,
  lakeConditionBucket,
  lakeConditionDotClass,
  lakeSidebarEmptyMessage,
} from '@/features/lakes/lake-condition-filter'

interface SampleLake {
  id: string
  name: string
  province: string
  district: string
  statusLabel: string | null
  status?: string
}

function lake(
  id: string,
  name: string,
  statusLabel: string | null,
  province = 'Eastern Province',
  district = 'Rwamagana',
  status?: string,
): SampleLake {
  return { id, name, province, district, statusLabel, status }
}

const lakes: SampleLake[] = [
  lake('good-1', 'Lake Mugesera', 'Good'),
  lake('good-kivu', 'Lake Kivu', 'Good', 'Western Province', 'Rubavu'),
  lake('fair-1', 'Lake Muhazi', 'Fair'),
  lake('fair-kivu', 'Lake Kivu Shore', 'Fair', 'Western Province', 'Karongi'),
  lake('poor-1', 'Lake Cyohoha', 'Poor'),
  lake('stale-1', 'Lake Hago', 'No recent data'),
  lake('pending-1', 'Lake Ihema', 'Pending'),
  lake('unknown-label', 'Lake Mystery', 'Moderate'),
  lake('blank-label', 'Lake Blank', null, 'Northern Province', 'Burera', 'good'),
]

describe('lake condition filter', () => {
  it('shows every loaded lake on All, including unknown labels', () => {
    expect(filterLakesByCondition(lakes, 'all').map((item) => item.id)).toEqual(
      lakes.map((item) => item.id),
    )
  })

  it('keeps only stored Good', () => {
    expect(filterLakesByCondition(lakes, 'good').map((item) => item.id)).toEqual([
      'good-1',
      'good-kivu',
    ])
  })

  it('keeps only stored Fair', () => {
    expect(filterLakesByCondition(lakes, 'fair').map((item) => item.id)).toEqual([
      'fair-1',
      'fair-kivu',
    ])
  })

  it('keeps only stored Poor', () => {
    expect(filterLakesByCondition(lakes, 'poor').map((item) => item.id)).toEqual(['poor-1'])
  })

  it('groups No recent data and Pending as No data', () => {
    expect(filterLakesByCondition(lakes, 'no_data').map((item) => item.id)).toEqual([
      'stale-1',
      'pending-1',
    ])
  })

  it('counts each loaded lake once from stored status, before search', () => {
    expect(countLakesByCondition(lakes)).toEqual({
      all: 9,
      good: 2,
      fair: 2,
      poor: 1,
      no_data: 2,
    })
    const searched = filterLakesForSidebar(lakes, 'all', 'Kivu')
    expect(searched).toHaveLength(2)
    expect(countLakesByCondition(lakes).all).toBe(lakes.length)
  })

  it('matches the stored label even when the domain status color would differ', () => {
    const fairLabeledGood = lake('mixed', 'Lake Mixed', 'Fair', 'Eastern Province', 'Kayonza', 'good')
    expect(lakeConditionBucket(fairLabeledGood.statusLabel)).toBe('fair')
    expect(lakeConditionDotClass(fairLabeledGood.statusLabel)).toBe('bg-[var(--color-status-moderate)]')
    expect(lakeConditionDotClass('Poor')).toBe('bg-[var(--color-status-critical)]')
    expect(lakeConditionDotClass('No recent data')).toBe('bg-[var(--color-status-unknown)]')
    expect(lakeConditionBucket('FAIR')).toBe('fair')
    expect(lakeConditionBucket('no recent data')).toBe('no_data')
    expect(filterLakesByCondition([fairLabeledGood], 'good')).toEqual([])
    expect(filterLakesByCondition([fairLabeledGood], 'fair')).toHaveLength(1)
  })

  it('does not treat a domain status or other label as Good, Fair, Poor, or No data', () => {
    const fairStoredAsGoodDomain = lake('mixed', 'Lake Mixed', 'Fair', 'Eastern Province', 'Kayonza', 'good')
    expect(filterLakesByCondition([fairStoredAsGoodDomain], 'good')).toEqual([])
    expect(filterLakesByCondition([fairStoredAsGoodDomain], 'fair').map((item) => item.id)).toEqual([
      'mixed',
    ])
    expect(filterLakesByCondition(lakes, 'good').map((item) => item.id)).not.toContain('blank-label')
    expect(filterLakesByCondition(lakes, 'fair').map((item) => item.id)).not.toContain('unknown-label')
    expect(filterLakesByCondition(lakes, 'no_data').map((item) => item.id)).not.toContain('unknown-label')
    expect(filterLakesByCondition(lakes, 'all').map((item) => item.id)).toEqual(
      expect.arrayContaining(['unknown-label', 'blank-label']),
    )
  })

  it('applies search after the condition filter', () => {
    expect(filterLakesForSidebar(lakes, 'fair', 'Kivu').map((item) => item.id)).toEqual([
      'fair-kivu',
    ])
    expect(filterLakesForSidebar(lakes, 'good', 'kivu').map((item) => item.id)).toEqual([
      'good-kivu',
    ])
    expect(filterLakesForSidebar(lakes, 'poor', 'Kivu')).toEqual([])
    expect(filterLakesForSidebar(lakes, 'all', 'Western').map((item) => item.id)).toEqual([
      'good-kivu',
      'fair-kivu',
    ])
  })

  it('returns every lake again when the filter is cleared to All', () => {
    expect(filterLakesForSidebar(lakes, 'all', '').map((item) => item.id)).toEqual(
      lakes.map((item) => item.id),
    )
    expect(filterLakesForSidebar(lakes, 'all', '   ').map((item) => item.id)).toEqual(
      lakes.map((item) => item.id),
    )
  })

  it('reuses search matching without the menu result cap', () => {
    const many = Array.from({ length: 12 }, (_, index) =>
      lake(`fair-${index}`, `Lake Kivu ${index}`, 'Fair', 'Western Province', 'Rubavu'),
    )
    expect(searchLakes(many, 'kivu')).toHaveLength(8)
    expect(filterLakesForSidebar(many, 'fair', 'kivu')).toHaveLength(12)
  })

  it('does not return a route when the open lake is filtered out', () => {
    const openLakeId = 'fair-kivu'
    const visible = filterLakesForSidebar(lakes, 'good', '')
    expect(visible.map((item) => item.id)).not.toContain(openLakeId)
    expect(Array.isArray(visible)).toBe(true)
    expect(visible).not.toHaveProperty('route')
    expect(visible.some((item) => 'route' in item)).toBe(false)
  })

  it('uses the search empty message only when a query is active', () => {
    expect(lakeSidebarEmptyMessage('')).toBe('No lakes match this filter.')
    expect(lakeSidebarEmptyMessage('   ')).toBe('No lakes match this filter.')
    expect(lakeSidebarEmptyMessage('Kivu')).toBe('No matching lakes found.')
  })
})
