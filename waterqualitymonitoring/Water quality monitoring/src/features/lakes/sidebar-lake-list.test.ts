import { describe, expect, it } from 'vitest'
import { filterLakesForSidebar } from '@/features/lakes/lake-condition-filter'
import {
  previewSidebarLakes,
  SIDEBAR_INITIAL_LAKE_COUNT,
  SIDEBAR_LAKE_PAGE_SIZE,
} from '@/features/lakes/sidebar-lake-list'

interface SampleLake {
  id: string
  name: string
  province: string
  district: string
  statusLabel: string
}

function lake(index: number, statusLabel = 'Good', name?: string): SampleLake {
  return {
    id: `lake-${index}`,
    name: name ?? `Lake ${index}`,
    province: 'Eastern Province',
    district: 'Rwamagana',
    statusLabel,
  }
}

const many = Array.from({ length: 24 }, (_, index) => lake(index + 1))

describe('sidebar lake preview', () => {
  it('shows about the first 10 matching lakes before expand', () => {
    const preview = previewSidebarLakes(many, { selectedLakeId: 'lake-1' })
    expect(SIDEBAR_INITIAL_LAKE_COUNT).toBe(10)
    expect(preview.lakes.map((item) => item.id)).toEqual(
      many.slice(0, 10).map((item) => item.id),
    )
    expect(preview.hiddenCount).toBe(14)
  })

  it('reveals 10 more lakes on each view more step', () => {
    expect(SIDEBAR_LAKE_PAGE_SIZE).toBe(10)
    const once = previewSidebarLakes(many, {
      visibleCount: SIDEBAR_INITIAL_LAKE_COUNT + SIDEBAR_LAKE_PAGE_SIZE,
      selectedLakeId: 'lake-20',
    })
    expect(once.lakes).toHaveLength(20)
    expect(once.lakes.map((item) => item.id)).toEqual(many.slice(0, 20).map((item) => item.id))
    expect(once.hiddenCount).toBe(4)

    const twice = previewSidebarLakes(many, {
      visibleCount: SIDEBAR_INITIAL_LAKE_COUNT + SIDEBAR_LAKE_PAGE_SIZE * 2,
      selectedLakeId: 'lake-20',
    })
    expect(twice.lakes.map((item) => item.id)).toEqual(many.map((item) => item.id))
    expect(twice.hiddenCount).toBe(0)
  })

  it('skips the limit when there are 10 or fewer matches', () => {
    const few = many.slice(0, 10)
    expect(previewSidebarLakes(few, {}).hiddenCount).toBe(0)
    expect(previewSidebarLakes(few, {}).lakes).toHaveLength(10)
    expect(previewSidebarLakes(many.slice(0, 3), {}).lakes).toHaveLength(3)
  })

  it('limits only after condition and search have been applied', () => {
    const mixed = [
      ...Array.from({ length: 12 }, (_, index) => lake(index + 1, 'Fair', `Lake Kivu ${index}`)),
      lake(99, 'Good', 'Lake Kivu Other'),
      lake(100, 'Poor', 'Lake Other'),
    ]
    const matching = filterLakesForSidebar(mixed, 'fair', 'Kivu')
    expect(matching).toHaveLength(12)
    const preview = previewSidebarLakes(matching, { selectedLakeId: 'lake-1' })
    expect(preview.lakes).toHaveLength(10)
    expect(preview.lakes.every((item) => item.statusLabel === 'Fair')).toBe(true)
    expect(preview.lakes.map((item) => item.id)).not.toContain('lake-99')
    expect(preview.hiddenCount).toBe(2)
  })

  it('keeps the current lake visible when it sits past the first 10', () => {
    const preview = previewSidebarLakes(many, { selectedLakeId: 'lake-18' })
    expect(preview.lakes).toHaveLength(11)
    expect(preview.lakes.slice(0, 10).map((item) => item.id)).toEqual(
      many.slice(0, 10).map((item) => item.id),
    )
    expect(preview.lakes.at(-1)?.id).toBe('lake-18')
    expect(preview.hiddenCount).toBe(13)
  })

  it('does not duplicate the current lake when it is already in the first 10', () => {
    const preview = previewSidebarLakes(many, { selectedLakeId: 'lake-4' })
    expect(preview.lakes.filter((item) => item.id === 'lake-4')).toHaveLength(1)
    expect(preview.lakes).toHaveLength(10)
  })

  it('does not pull in a current lake that the filter already excluded', () => {
    const matching = many.filter((item) => item.id !== 'lake-18')
    const preview = previewSidebarLakes(matching, {
      selectedLakeId: 'lake-18',
    })
    expect(preview.lakes.map((item) => item.id)).not.toContain('lake-18')
    expect(preview.lakes).toHaveLength(10)
  })

  it('does not attach a route or replace the open lake', () => {
    const preview = previewSidebarLakes(many, { selectedLakeId: 'lake-18' })
    expect(preview).not.toHaveProperty('route')
    expect(preview.lakes.some((item) => 'route' in item)).toBe(false)
    expect(preview.lakes.at(-1)?.id).toBe('lake-18')
  })
})
