import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { makeObservation, makeWaterBody } from '@/domain/intelligence/__fixtures__/lakes'
import { LakeSearchMenu } from '@/components/layout/LakeSearchMenu'
import { ObservationDatePicker } from '@/features/observations/components/ObservationDatePicker'
import { LakeMapDateStack } from '@/features/map/components/MapDateContext'
import {
  LakeWorkspaceFrame,
  LakeWorkspaceHeader,
} from '@/features/lakes/components/LakeWorkspaceHeader'
import {
  lakeRoute,
  lakeSearchSelection,
  searchKeyAction,
  searchLakes,
} from '@/features/lakes/lake-search'
import {
  selectSharedObservation,
  temporalSelection,
} from '@/features/observations/temporal-selection'

const ruhondo = makeWaterBody({
  id: 'lake-ruhondo',
  name: 'Lake Ruhondo',
  province: 'Northern Province',
  district: 'Burera',
})
const muhazi = makeWaterBody({
  id: 'lake-muhazi',
  name: 'Lake Muhazi',
  province: 'Eastern Province',
  district: 'Rwamagana',
})
const lakes = [ruhondo, muhazi]

const august = makeObservation({
  id: 'aug-29',
  date: '2026-08-29',
  acquisitionDay: '2026-08-29',
  qualityLabel: 'Valid',
  ndci: 0.04,
})
const cloudy = makeObservation({
  id: 'sep-20',
  date: '2026-09-20',
  qualityLabel: 'Cloudy',
  ndci: null,
})
const observations = [august, cloudy]

const latestSelection = {
  observations,
  selectedObservationId: null as string | null,
  onSelectObservation: () => {},
  onReturnToLatest: () => {},
}

describe('lake workspace date filter', () => {
  it('overlays the lake name on the map and leaves the date picker out of that header', () => {
    const html = renderToStaticMarkup(
      createElement(LakeWorkspaceFrame, {
        header: createElement(LakeWorkspaceHeader, {
          lakeName: 'Lake Ruhondo',
          province: 'Northern Province',
        }),
        map: 'map body',
      }),
    )
    const mapAt = html.indexOf('data-region="lake-map"')
    const nameAt = html.indexOf('Ruhondo')
    expect(mapAt).toBeGreaterThan(-1)
    expect(nameAt).toBeGreaterThan(mapAt)
    expect(html).toContain('Northern Province')
    expect(html).not.toContain('type="date"')
    expect(html).not.toContain('Filter by date')
  })

  it('does not render a date selector in the map chrome', () => {
    const html = renderToStaticMarkup(
      createElement(LakeMapDateStack, {
        dateSelection: latestSelection,
        latestSceneDate: '2026-09-20',
        latestSceneQuality: 'Cloudy',
        latestSceneCloud: 40,
        latestValidDate: '2026-09-03',
      }),
    )
    expect(html).not.toContain('Filter by date')
    expect(html).toContain('Latest scene')
    expect(html).toContain('20 Sep 2026')
    expect(html).toContain('Cloudy')
    expect(html).toContain('Latest valid')
    expect(html).toContain('03 Sep 2026')
  })

  it('shows the selected historical date on the date picker', () => {
    const selectedObservationId = selectSharedObservation(observations, 'aug-29')
    const html = renderToStaticMarkup(
      createElement(ObservationDatePicker, {
        observations,
        selectedObservationId,
        onSelectObservation: () => {},
        onReturnToLatest: () => {},
      }),
    )
    const mapHtml = renderToStaticMarkup(
      createElement(LakeMapDateStack, {
        dateSelection: { ...latestSelection, selectedObservationId },
        latestSceneDate: '2026-09-20',
        latestSceneQuality: 'Cloudy',
        latestSceneCloud: null,
        latestValidDate: '2026-09-03',
      }),
    )
    const view = temporalSelection(selectedObservationId)
    expect(html).toContain('type="date"')
    expect(html).toContain('2026-08-29')
    expect(html).toContain('Valid')
    expect(html).toContain('Latest')
    expect(mapHtml).toContain('Sentinel scene')
    expect(mapHtml).toContain('29 Aug 2026')
    expect(mapHtml).not.toContain('Filter by date')
    expect(view.selectedObservationId).toBe('aug-29')
    expect(view.chartSelection).toBe(view.historySelection)
    expect(view.historySelection).toBe('aug-29')
  })
})

describe('lake search', () => {
  it('finds Ruhondo from ruh, ignoring case', () => {
    expect(searchLakes(lakes, 'ruh').map((lake) => lake.id)).toEqual(['lake-ruhondo'])
    expect(searchLakes(lakes, 'RUH').map((lake) => lake.id)).toEqual(['lake-ruhondo'])
  })

  it('matches province and district', () => {
    expect(searchLakes(lakes, 'eastern').map((lake) => lake.id)).toEqual(['lake-muhazi'])
    expect(searchLakes(lakes, 'burera').map((lake) => lake.id)).toEqual(['lake-ruhondo'])
  })

  it('navigates a clicked result to that lake and clears the search', () => {
    const selection = lakeSearchSelection('lake-muhazi')
    const html = renderToStaticMarkup(
      createElement(LakeSearchMenu, {
        query: 'muh',
        results: searchLakes(lakes, 'muh'),
        activeIndex: 0,
        onSelect: (lakeId: string) => lakeSearchSelection(lakeId),
      }),
    )
    expect(selection).toEqual({
      route: '/lakes/lake-muhazi',
      close: true,
      clearQuery: true,
    })
    expect(lakeRoute('lake-muhazi')).toBe('/lakes/lake-muhazi')
    expect(html).toContain('Lake Muhazi')
    expect(html).toContain('Eastern Province')
  })

  it('opens the highlighted result on Enter and closes on Escape', () => {
    const results = searchLakes(lakes, 'muh')
    expect(
      searchKeyAction({ key: 'Enter', results, activeIndex: 0, open: true }),
    ).toEqual({ type: 'navigate', lakeId: 'lake-muhazi' })
    expect(
      searchKeyAction({ key: 'Escape', results, activeIndex: 0, open: true }),
    ).toEqual({ type: 'close' })
  })

  it('says when nothing matches', () => {
    expect(searchLakes(lakes, 'no-such-lake')).toEqual([])
    const html = renderToStaticMarkup(
      createElement(LakeSearchMenu, {
        query: 'no-such-lake',
        results: [],
        activeIndex: 0,
        onSelect: () => {},
      }),
    )
    expect(html).toContain('No lakes found')
  })
})
