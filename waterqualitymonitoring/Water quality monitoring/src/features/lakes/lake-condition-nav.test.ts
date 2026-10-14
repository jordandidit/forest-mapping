import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { TopNavigation } from '@/components/layout/TopNavigation'
import { useUiStore } from '@/stores/ui-store'

const { lakes } = vi.hoisted(() => ({
  lakes: [
    { id: 'g1', name: 'Lake Mugesera', province: 'Eastern Province', district: 'Rwamagana', statusLabel: 'Good' },
    { id: 'g2', name: 'Lake Kivu', province: 'Western Province', district: 'Rubavu', statusLabel: 'Good' },
    { id: 'f1', name: 'Lake Muhazi', province: 'Eastern Province', district: 'Kayonza', statusLabel: 'Fair' },
    { id: 'p1', name: 'Lake Cyohoha', province: 'Eastern Province', district: 'Bugesera', statusLabel: 'Poor' },
    { id: 'n1', name: 'Lake Hago', province: 'Eastern Province', district: 'Kirehe', statusLabel: 'No recent data' },
    { id: 'n2', name: 'Lake Ihema', province: 'Eastern Province', district: 'Kayonza', statusLabel: 'Pending' },
    { id: 'u1', name: 'Lake Mystery', province: 'Northern Province', district: 'Burera', statusLabel: 'Moderate' },
  ],
}))

vi.mock('@/features/auth/hooks/useArcGISAuth', () => ({
  useArcGISAuth: () => ({
    user: null,
    isArcGisMode: false,
    signOut: async () => {},
    status: 'unauthenticated',
  }),
}))

vi.mock('@/features/lakes/hooks/use-water-bodies', () => ({
  useWaterBodies: () => ({ data: lakes, isLoading: false, error: null }),
  useWaterBody: () => ({ data: null, isLoading: false, error: null, isFetched: true }),
}))

vi.mock('@/features/water-quality/hooks/use-observations', () => ({
  useObservations: () => ({ data: [], isLoading: false, error: null }),
}))

function chipMarkup(html: string, id: string): string {
  const match = html.match(
    new RegExp(`<button\\b[^>]*data-condition-filter="${id}"[\\s\\S]*?</button>`),
  )
  expect(match, id).not.toBeNull()
  return match![0]
}

function chipText(html: string, id: string): string {
  return chipMarkup(html, id)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

describe('condition filter in the top bar', () => {
  beforeEach(() => {
    useUiStore.setState({ lakeConditionFilter: 'all', lakeSearchQuery: '' })
  })

  it('renders All, Good, Fair, Poor, and No data between the title and search, with loaded counts', () => {
    const html = renderToStaticMarkup(
      createElement(MemoryRouter, null, createElement(TopNavigation)),
    )
    const headerStart = html.indexOf('<header')
    const headerEnd = html.lastIndexOf('</header>')
    const header = html.slice(headerStart, headerEnd)

    expect(headerStart).toBeGreaterThan(-1)
    expect(header).toContain('aria-label="Filter lakes by condition"')
    expect(header).toContain('Search lakes')
    expect(header).toContain('aria-label="User"')
    expect(header.indexOf('Filter lakes by condition')).toBeGreaterThan(
      header.indexOf('Water Resources Quality Monitoring'),
    )
    expect(header.indexOf('Filter lakes by condition')).toBeLessThan(header.indexOf('Search lakes'))

    expect(chipText(header, 'all')).toBe('All 7')
    expect(chipText(header, 'good')).toBe('Good 2')
    expect(chipText(header, 'fair')).toBe('Fair 1')
    expect(chipText(header, 'poor')).toBe('Poor 1')
    expect(chipText(header, 'no_data')).toBe('No data 2')

    expect(header).toContain('bg-[var(--color-status-good)]')
    expect(header).toContain('bg-[var(--color-status-moderate)]')
    expect(header).toContain('bg-[var(--color-status-critical)]')
    expect(header).toContain('bg-[var(--color-status-unknown)]')

    for (const id of ['all', 'good', 'fair', 'poor', 'no_data']) {
      const button = chipMarkup(header, id)
      expect(button).toContain('type="button"')
      expect(button).not.toContain('href=')
    }

    expect(header).not.toContain('>Overview<')
    expect(header).not.toContain('>Lakes<')
    expect(header).not.toContain('RWANDA')
  })

  it('keeps title, filters, search, and user in a single header row in that order', () => {
    const html = renderToStaticMarkup(
      createElement(MemoryRouter, null, createElement(TopNavigation)),
    )
    const header = html.slice(html.indexOf('<header'), html.lastIndexOf('</header>'))

    expect(header).not.toContain('data-header-row')
    const title = header.indexOf('Water Resources Quality Monitoring')
    const filters = header.indexOf('Filter lakes by condition')
    const search = header.indexOf('Search lakes')
    const user = header.indexOf('aria-label="User"')
    expect(title).toBeGreaterThan(-1)
    expect(filters).toBeGreaterThan(title)
    expect(search).toBeGreaterThan(filters)
    expect(user).toBeGreaterThan(search)
  })
})
