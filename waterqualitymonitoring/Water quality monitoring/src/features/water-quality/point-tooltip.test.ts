import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { mapObservationsToTimeSeries } from '@/data/arcgis/mappers/observation.mapper'
import { muhaziNdciSeries, muhaziTurbiditySeries } from '@/data/mock/timeseries'
import { formatSignedPercent, percentDifference } from '@/domain/intelligence/helpers'
import { makeObservation } from '@/domain/intelligence/__fixtures__/lakes'
import type { TimeSeriesPoint } from '@/domain/observation/types'
import { selectFromChartPoint } from '@/features/observations/temporal-selection'
import { screeningFill } from '@/features/observations/history-screening'
import {
  ChartGapNote,
  ParameterTrendChart,
  presentLongTermTrend,
  ScientificTooltip,
} from '@/features/water-quality/components/ParameterTrendChart'
import type { TrendParameterTab } from '@/stores/ui-store'

function tooltipMarkup(input: {
  parameter: TrendParameterTab
  date: string
  value: number | null
  unit: string
  classification?: string | null
  qualityLabel?: string | null
  baselineMean?: number | null
  observationId?: string
}): string {
  const point: TimeSeriesPoint = {
    date: input.date,
    value: input.value,
    quality: 'excellent',
    observationId: input.observationId ?? 'obs-1',
    qualityLabel: input.qualityLabel ?? null,
    classification: input.classification ?? null,
  }
  return renderToStaticMarkup(
    createElement(ScientificTooltip, {
      active: true,
      label: input.date,
      unit: input.unit,
      parameter: input.parameter,
      baselineMean: input.baselineMean ?? null,
      payload: [{ value: input.value, payload: point }],
    }),
  )
}

function rowValue(html: string, label: string): string {
  const marker = `>${label}</dt>`
  const start = html.indexOf(marker)
  if (start < 0) return ''
  const match = html.slice(start + marker.length).match(/<dd[^>]*>([^<]*)<\/dd>/)
  return match?.[1] ?? ''
}

describe('water quality over time point tooltip — WATER-UI-10', () => {
  it('separates classification, 14-month comparison, and observation quality', () => {
    const html = tooltipMarkup({
      parameter: 'ndci',
      date: '2026-08-21',
      value: 0.132,
      unit: '',
      classification: 'Moderate',
      qualityLabel: 'Valid',
      baselineMean: 0.1,
    })

    expect(html).toContain('21 Aug 2026')
    expect(rowValue(html, 'NDCI')).toBe('0.132')
    expect(rowValue(html, 'Classification')).toBe('Moderate')
    expect(rowValue(html, 'vs historical baseline')).toBe('+32%')
    expect(rowValue(html, 'Observation quality')).toBe('Valid')
    expect(html).not.toContain('>Quality<')
    expect(rowValue(html, 'Classification')).not.toBe('Valid')
  })

  it('shows turbidity with its stored class and a positive difference above the mean', () => {
    const html = tooltipMarkup({
      parameter: 'turbidity',
      date: '2026-08-21',
      value: 18.4,
      unit: 'FNU',
      classification: 'Moderate',
      qualityLabel: 'Valid',
      baselineMean: 100,
    })

    expect(rowValue(html, 'Turbidity')).toBe('18.4 FNU')
    expect(rowValue(html, 'Classification')).toBe('Moderate')
    expect(rowValue(html, 'Observation quality')).toBe('Valid')

    const above = tooltipMarkup({
      parameter: 'turbidity',
      date: '2026-08-21',
      value: 112,
      unit: 'FNU',
      classification: 'Moderate',
      qualityLabel: 'Valid',
      baselineMean: 100,
    })
    expect(rowValue(above, 'vs historical baseline')).toBe('+12%')
    expect(rowValue(above, 'vs historical baseline').startsWith('+')).toBe(true)
  })

  it('shows a negative percent below the 14-month mean using the existing minus sign', () => {
    const current = 0.086
    const baseline = 0.1
    const html = tooltipMarkup({
      parameter: 'ndci',
      date: '2026-08-21',
      value: current,
      unit: '',
      classification: 'Low',
      qualityLabel: 'Valid',
      baselineMean: baseline,
    })
    const expected = formatSignedPercent(percentDifference(current, baseline)!)

    expect(expected.startsWith('−')).toBe(true)
    expect(rowValue(html, 'vs historical baseline')).toBe(expected)
    expect(rowValue(html, 'vs historical baseline')).toBe('−14%')
    expect(rowValue(html, 'vs historical baseline')).not.toContain('-14%')
  })

  it('shows an em dash when the 14-month mean is missing or zero', () => {
    const missing = tooltipMarkup({
      parameter: 'ndci',
      date: '2026-08-21',
      value: 0.036,
      unit: '',
      classification: 'Moderate',
      qualityLabel: 'Valid',
      baselineMean: null,
    })
    const zero = tooltipMarkup({
      parameter: 'ndci',
      date: '2026-08-21',
      value: 0.036,
      unit: '',
      classification: 'Moderate',
      qualityLabel: 'Valid',
      baselineMean: 0,
    })

    expect(rowValue(missing, 'vs historical baseline')).toBe('—')
    expect(rowValue(zero, 'vs historical baseline')).toBe('—')
    expect(rowValue(missing, 'Classification')).toBe('Moderate')
    expect(rowValue(missing, 'Observation quality')).toBe('Valid')
  })

  it('shows an em dash when the observation has no stored classification', () => {
    const html = tooltipMarkup({
      parameter: 'ndci',
      date: '2026-08-21',
      value: 0.2,
      unit: '',
      classification: null,
      qualityLabel: 'Valid',
      baselineMean: 0.1,
    })

    expect(rowValue(html, 'Classification')).toBe('—')
    expect(rowValue(html, 'Classification')).not.toBe('Valid')
    expect(rowValue(html, 'Observation quality')).toBe('Valid')
    expect(rowValue(html, 'vs historical baseline')).toBe('+100%')
  })

  it('keeps invalid observations as gaps and still selects a plotted point by id', () => {
    const plotted = makeObservation({
      id: 'aug-21',
      date: '2026-08-21',
      qualityLabel: 'Valid',
      ndci: 0.036,
      turbidity: 18.4,
      chlorophyllLevel: 'Moderate',
      turbidityLevel: 'Low',
    })
    const cloudy = makeObservation({
      id: 'sep-13',
      date: '2026-09-13',
      quality: 'unusable',
      qualityLabel: 'Cloudy',
      ndci: null,
      turbidity: null,
      chlorophyllLevel: null,
      turbidityLevel: null,
    })
    const hazy = makeObservation({
      id: 'aug-31',
      date: '2026-08-31',
      quality: 'fair',
      qualityLabel: 'Hazy or glint',
      ndci: null,
      turbidity: null,
    })
    const observations = [plotted, cloudy, hazy]
    const ndci = mapObservationsToTimeSeries('lake-fixture', 'ndci', observations)
    const turbidity = mapObservationsToTimeSeries('lake-fixture', 'turbidity', observations)

    expect(ndci.points).toHaveLength(observations.length)
    expect(ndci.points.find((point) => point.observationId === 'aug-21')?.value).toBe(0.036)
    expect(ndci.points.find((point) => point.observationId === 'aug-21')?.classification).toBe(
      'Moderate',
    )
    expect(turbidity.points.find((point) => point.observationId === 'aug-21')?.classification).toBe(
      'Low',
    )
    expect(ndci.points.find((point) => point.observationId === 'sep-13')).toMatchObject({
      value: null,
      qualityLabel: 'Cloudy',
    })
    expect(ndci.points.find((point) => point.observationId === 'aug-31')?.value).toBeNull()
    expect(ndci.points.every((point) => point.value !== 0 || point.observationId === 'aug-21')).toBe(
      true,
    )

    const plottedPoint = ndci.points.find((point) => point.observationId === 'aug-21')!
    expect(selectFromChartPoint(observations, plottedPoint)).toBe('aug-21')
    for (const gap of ndci.points.filter((point) => point.value === null)) {
      expect(selectFromChartPoint(observations, gap)).toBeNull()
    }
  })

  it('does not invent a class from the numeric value when the level is blank', () => {
    const series = mapObservationsToTimeSeries('lake-fixture', 'ndci', [
      makeObservation({
        ndci: 0.2,
        chlorophyllLevel: '   ',
        turbidityLevel: 'High',
        qualityLabel: 'Valid',
      }),
    ])
    expect(series.points[0]?.classification).toBeNull()
    expect(series.points[0]?.value).toBe(0.2)
  })

  it('colors points from the stored class with the same tokens as history', () => {
    expect(screeningFill('Low')).toBe('var(--color-status-good)')
    expect(screeningFill('Moderate')).toBe('var(--color-status-moderate)')
    expect(screeningFill('High')).toBe('var(--color-status-poor)')
    expect(screeningFill('Very high')).toBe('var(--color-status-critical)')
    expect(screeningFill('High')).not.toBe(screeningFill('Very high'))
    expect(screeningFill(null)).toBeNull()
    expect(screeningFill('Valid')).toBeNull()
    expect(screeningFill('Cloudy')).toBeNull()
  })

  it('explains that the line skips missing measurements', () => {
    const html = renderToStaticMarkup(createElement(ChartGapNote))
    expect(html).toContain(
      'The line connects valid observations. Dates with no valid water-quality measurement are skipped.',
    )
    expect(html).not.toContain('Breaks in the line')
    expect(html).not.toContain('Dashed segments')
    expect(html).toContain(
      'Satellite observations may be excluded because of cloud, haze or glint, insufficient usable water pixels, or unavailable imagery.',
    )
    expect(html).not.toContain('Lines are not connected across these periods')
    expect(html).not.toContain('Gaps indicate unavailable or invalid observations.')
  })

  it('shows the stored pipeline trend as text and does not plot it', () => {
    expect(presentLongTermTrend('Increasing')).toBe('Increasing ↑')
    expect(presentLongTermTrend('Decreasing')).toBe('Decreasing ↓')
    expect(presentLongTermTrend('Stable')).toBe('Stable')
    expect(presentLongTermTrend('Not enough data')).toBe('Not enough data')
    expect(presentLongTermTrend('  ')).toBeNull()

    const html = renderToStaticMarkup(
      createElement(ParameterTrendChart, {
        series: {
          waterBodyId: 'lake-fixture',
          parameter: 'turbidity',
          points: [
            {
              date: '2026-08-24',
              value: 8,
              quality: 'excellent',
              observationId: 'a',
              classification: 'Low',
              qualityLabel: 'Valid',
            },
            {
              date: '2026-08-29',
              value: null,
              quality: 'unusable',
              observationId: 'b',
              classification: null,
              qualityLabel: 'Cloudy',
            },
          ],
          annotations: [],
        },
        parameter: 'turbidity',
        timeRange: '1Y',
        onParameterChange: () => undefined,
        onTimeRangeChange: () => undefined,
        baselineMean: 6,
        trendLabel: 'Increasing',
      }),
    )

    expect(html).toContain('Long-term trend')
    expect(html).toContain('Increasing ↑')
    expect(html).toContain('Historical baseline')
    expect(html).toContain('Average of valid monthly observations available within the 14-month historical window.')
    expect(html).not.toContain('Elevated turbidity')
    expect(html).not.toContain('Pipeline screening classification')
    expect(html).toContain('Very high')
    expect(html).not.toContain('Trend ·')
    expect(html).not.toContain('14M MEAN')
    expect(html).not.toContain('dataKey="trend"')
  })

  it('labels the NDCI reference line as a screening threshold and draws none for turbidity', () => {
    const ndci = mapObservationsToTimeSeries('lake-fixture', 'ndci', [])
    const turbidity = mapObservationsToTimeSeries('lake-fixture', 'turbidity', [])

    expect(ndci.threshold).toEqual({ value: 0.15, label: 'NDCI screening threshold' })
    expect(turbidity.threshold).toBeUndefined()
    expect(muhaziTurbiditySeries.threshold).toBeUndefined()
    expect(muhaziNdciSeries.threshold).toEqual({
      value: 0.15,
      label: 'NDCI screening threshold',
    })
  })

  it('switches between the chart and the observation table', () => {
    const base = {
      series: muhaziTurbiditySeries,
      parameter: 'turbidity' as const,
      timeRange: '1Y' as const,
      onParameterChange: () => undefined,
      onTimeRangeChange: () => undefined,
      onViewChange: () => undefined,
      table: createElement('p', null, 'Observation table body'),
    }

    const chart = renderToStaticMarkup(createElement(ParameterTrendChart, { ...base, view: 'chart' }))
    expect(chart).toContain('aria-label="View"')
    expect(chart).toContain('Turbidity')
    expect(chart).not.toContain('Observation table body')

    const table = renderToStaticMarkup(createElement(ParameterTrendChart, { ...base, view: 'table' }))
    expect(table).toContain('Observation table body')
    expect(table).not.toContain('role="tablist"')
    expect(table).not.toContain('aria-label="Time range"')
    expect(table).not.toContain('Pipeline screening classification')

    const noTable = renderToStaticMarkup(
      createElement(ParameterTrendChart, { ...base, table: undefined, view: 'table' }),
    )
    expect(noTable).not.toContain('aria-label="View"')
    expect(noTable).toContain('role="tablist"')
  })
})
