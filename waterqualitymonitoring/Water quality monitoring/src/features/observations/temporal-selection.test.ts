import { describe, expect, it, vi } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { makeObservation } from '@/domain/intelligence/__fixtures__/lakes'
import { TopNavigation } from '@/components/layout/TopNavigation'
import { mapObservationsToTimeSeries } from '@/data/arcgis/mappers/observation.mapper'
import {
  isHistoricalObservation,
  mapLayerWhileViewing,
} from '@/features/map/historical-sentinel'
import {
  clearTemporalSelection,
  NO_OBSERVATION_FOR_DATE,
  selectFromChartPoint,
  selectFromDate,
  selectSharedObservation,
  temporalSelection,
  datePickerSelection,
} from '@/features/observations/temporal-selection'

vi.mock('@/features/auth/hooks/useArcGISAuth', () => ({
  useArcGISAuth: () => ({
    user: null,
    isArcGisMode: false,
    signOut: async () => {},
    status: 'unauthenticated',
  }),
}))

vi.mock('@/features/lakes/hooks/use-water-bodies', () => ({
  useWaterBodies: () => ({ data: [], isLoading: false, error: null }),
  useWaterBody: () => ({ data: null, isLoading: false, error: null, isFetched: true }),
}))

vi.mock('@/features/water-quality/hooks/use-observations', () => ({
  useObservations: () => ({ data: [], isLoading: false, error: null }),
}))

const august = makeObservation({
  id: 'aug-29',
  date: '2026-08-29',
  acquisitionDay: '2026-08-29',
  qualityLabel: 'Valid',
  ndci: 0.04,
  turbidity: 2.1,
})

const september = makeObservation({
  id: 'sep-03',
  date: '2026-09-03',
  qualityLabel: 'Valid',
  ndci: 0.05,
  turbidity: 1.7,
})

const cloudy = makeObservation({
  id: 'sep-20',
  date: '2026-09-20',
  qualityLabel: 'Cloudy',
  ndci: null,
  turbidity: null,
  quality: 'unusable',
})

const observations = [august, september, cloudy]

describe('temporal controls — shared selectedObservationId', () => {
  it('date filter, chart point, and history row write the same observation id', () => {
    const fromDate = selectFromDate(observations, '2026-08-29')
    const fromHistory = selectSharedObservation(observations, 'aug-29')
    const series = mapObservationsToTimeSeries('lake-fixture', 'ndci', observations)
    const point = series.points.find((item) => item.date === '2026-08-29')
    const fromChart = selectFromChartPoint(observations, point!)

    expect(fromDate).toEqual({ observationId: 'aug-29' })
    expect(fromHistory).toBe('aug-29')
    expect(fromChart).toBe('aug-29')
    expect(fromChart).toBe(fromHistory)
    expect(fromDate.observationId).toBe(fromHistory)
  })

  it('keeps the filter, chart, and history on one selection', () => {
    const selectedObservationId = selectFromChartPoint(observations, {
      observationId: 'aug-29',
      value: 0.04,
    })
    const view = temporalSelection(selectedObservationId)
    expect(view.selectedObservationId).toBe('aug-29')
    expect(view.filter).toBe('observation')
    expect(view.chartSelection).toBe(view.historySelection)
    expect(view.historySelection).toBe(view.selectedObservationId)
    expect(isHistoricalObservation(august)).toBe(true)
    expect(mapLayerWhileViewing(true, 'turbidity')).toBe('true_colour')
  })

  it('clicking 29 Aug enters that observation, not another date', () => {
    const selectedObservationId = selectSharedObservation(observations, 'aug-29')
    expect(selectedObservationId).toBe('aug-29')
    expect(observations.find((item) => item.id === selectedObservationId)?.date).toBe('2026-08-29')
    expect(selectedObservationId).not.toBe('sep-03')
  })

  it('return to latest clears every temporal view together', () => {
    const selectedObservationId = clearTemporalSelection()
    const view = temporalSelection(selectedObservationId)
    expect(selectedObservationId).toBeNull()
    expect(view.filter).toBe('latest')
    expect(view.chartSelection).toBeNull()
    expect(view.historySelection).toBeNull()
    expect(mapLayerWhileViewing(false, 'turbidity')).toBe('turbidity')
  })

  it('does not invent a clickable point when the metric is null', () => {
    const series = mapObservationsToTimeSeries('lake-fixture', 'ndci', observations)
    const gap = series.points.find((item) => item.date === '2026-09-20')
    expect(gap?.value).toBeNull()
    expect(selectFromChartPoint(observations, gap!)).toBeNull()
    expect(selectFromDate(observations, '2026-09-20')).toEqual({ observationId: 'sep-20' })
  })

  it('does not substitute another date when none exists', () => {
    const missing = selectFromDate(observations, '2026-01-01')
    expect(missing).toEqual({
      observationId: null,
      message: NO_OBSERVATION_FOR_DATE,
    })
    expect(selectSharedObservation(observations, 'missing')).toBeNull()
  })

  it('keeps the current observation when the picked date has none', () => {
    expect(datePickerSelection(observations, '', 'aug-29')).toEqual({
      selectedObservationId: null,
      message: null,
    })
    expect(datePickerSelection(observations, '2026-08-29', null)).toEqual({
      selectedObservationId: 'aug-29',
      message: null,
    })
    expect(datePickerSelection(observations, '2026-01-01', 'aug-29')).toEqual({
      selectedObservationId: 'aug-29',
      message: NO_OBSERVATION_FOR_DATE,
    })
  })

  it('does not render a notification bell', () => {
    const html = renderToStaticMarkup(
      createElement(MemoryRouter, null, createElement(TopNavigation)),
    )
    expect(html).not.toContain('Notifications')
    expect(html).not.toContain('unread')
    expect(html).toContain('Search lakes')
    expect(html).not.toContain('>Overview<')
    expect(html).not.toContain('>Lakes<')
    expect(html).not.toContain('>Observations<')
    expect(html).not.toContain('>Alerts<')
    expect(html).not.toContain('>Reports<')
  })
})
