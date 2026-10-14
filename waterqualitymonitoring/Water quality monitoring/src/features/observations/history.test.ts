import { describe, expect, it } from 'vitest'
import { interpretLakeCondition } from '@/domain/intelligence/lake-condition'
import { makeObservation, makeWaterBody } from '@/domain/intelligence/__fixtures__/lakes'
import {
  buildObservationComparison,
  clearComparisonSelection,
  formatHistoryNumber,
  formatHistoryPercent,
  formatHistorySummary,
  historyMeasurements,
  observationForCurrentCondition,
  selectObservation,
  sortObservationsNewestFirst,
  toggleComparisonSelection,
} from '@/features/observations/history'

describe('observation history — WATER-HISTORY-04A', () => {
  it('sorts observations newest to oldest', () => {
    const sorted = sortObservationsNewestFirst([
      makeObservation({ id: 'aug-21', date: '2026-08-21', acquiredAt: '2026-08-21T08:00:00Z' }),
      makeObservation({ id: 'sep-03', date: '2026-09-03', acquiredAt: '2026-09-03T10:00:00Z' }),
      makeObservation({ id: 'aug-31', date: '2026-08-31', acquiredAt: '2026-08-31T09:00:00Z' }),
      makeObservation({ id: 'sep-03-later', date: '2026-09-03', acquiredAt: '2026-09-03T18:00:00Z' }),
    ])

    expect(sorted.map((observation) => observation.id)).toEqual([
      'sep-03-later',
      'sep-03',
      'aug-31',
      'aug-21',
    ])
  })

  it('keeps null metrics null', () => {
    const observation = makeObservation({
      qualityLabel: 'Hazy or glint',
      turbidity: null,
      ndci: null,
      floatingVegetation: null,
      usablePixelPercentage: 89,
      cloudCover: null,
    })
    const metrics = historyMeasurements(observation)

    expect(metrics.turbidity).toBeNull()
    expect(metrics.ndci).toBeNull()
    expect(metrics.floatingVegetationPercent).toBeNull()
    expect(metrics.cloudPercent).toBeNull()
    expect(metrics.clearPercent).toBe(89)
    expect(formatHistoryNumber(null)).toBe('—')
    expect(formatHistoryNumber(0)).toBe('0')
    expect(formatHistorySummary(observation)).toContain('Turbidity —')
    expect(formatHistorySummary(observation)).toContain('NDCI —')
    expect(formatHistorySummary(observation)).not.toContain('Turbidity 0')
    expect(formatHistorySummary(observation)).not.toContain('NDCI 0')
  })

  it('passes the stored floating vegetation percent through unchanged', () => {
    const metrics = historyMeasurements(makeObservation({ floatingVegetation: 4.2 }))

    expect(metrics.floatingVegetationPercent).toBe(4.2)
    expect(formatHistoryPercent(metrics.floatingVegetationPercent)).toBe(formatHistoryPercent(4.2))
  })

  it('selects an observation by id', () => {
    const observations = [
      makeObservation({ id: 'latest', date: '2026-09-03' }),
      makeObservation({ id: 'older', date: '2026-08-21' }),
    ]

    expect(selectObservation(observations, 'older')?.date).toBe('2026-08-21')
    expect(selectObservation(observations, 'missing')).toBeNull()
    expect(selectObservation(observations, null)).toBeNull()
  })

  it('keeps current condition on the latest observation', () => {
    const waterBody = makeWaterBody({
      status: 'moderate',
      statusLabel: 'Fair',
      metrics: {
        turbidityLevel: 'Low',
        chlorophyllLevel: 'Moderate',
        bloomRisk: 'low',
      },
    })
    const latest = makeObservation({
      id: 'latest',
      date: '2026-09-03',
      qualityLabel: 'Valid',
      turbidity: 1.7,
      ndci: 0.052,
    })
    const historical = makeObservation({
      id: 'older',
      date: '2026-08-21',
      qualityLabel: 'Cloudy',
      turbidity: null,
      ndci: null,
      usablePixelPercentage: null,
      cloudCover: 80,
    })
    const selected = selectObservation([latest, historical], 'older')

    const current = interpretLakeCondition({
      waterBody,
      latestObservation: observationForCurrentCondition(latest),
    })
    const ifHistoryReplacedLatest = interpretLakeCondition({
      waterBody,
      latestObservation: selected,
    })

    expect(selected?.qualityLabel).toBe('Cloudy')
    expect(current.condition.status).toBe('Fair')
    expect(current.observationQuality.qualityLabel).toBe('Valid')
    expect(current.signals.find((signal) => signal.id === 'signal-turbidity')?.detail).toBe('Low')
    expect(ifHistoryReplacedLatest.observationQuality.qualityLabel).toBe('Cloudy')
    expect(current.observationQuality.qualityLabel).not.toBe(
      ifHistoryReplacedLatest.observationQuality.qualityLabel,
    )
  })
})

describe('observation comparison — WATER-HISTORY-04B', () => {
  const september = makeObservation({
    id: 'sep-03',
    date: '2026-09-03',
    acquiredAt: '2026-09-03T10:00:00Z',
    qualityLabel: 'Valid',
    turbidity: 1.7,
    ndci: 0.052,
    usablePixelPercentage: 98,
  })
  const august = makeObservation({
    id: 'aug-21',
    date: '2026-08-21',
    acquiredAt: '2026-08-21T08:00:00Z',
    qualityLabel: 'Valid',
    turbidity: 2.4,
    ndci: 0.061,
    usablePixelPercentage: 98,
  })

  it('selects two observations', () => {
    const ids = toggleComparisonSelection(
      toggleComparisonSelection([], september.id),
      august.id,
    )

    expect(ids).toEqual(['sep-03', 'aug-21'])

    const comparison = buildObservationComparison([september, august], ids)

    expect(comparison?.leftId).toBe('sep-03')
    expect(comparison?.rightId).toBe('aug-21')
    expect(comparison?.leftDate).toBe('2026-09-03')
    expect(comparison?.rightDate).toBe('2026-08-21')
    expect(toggleComparisonSelection(ids, august.id)).toEqual(['sep-03'])
  })

  it('reports numeric differences', () => {
    const comparison = buildObservationComparison([august, september], ['aug-21', 'sep-03'])
    const turbidity = comparison?.rows.find((row) => row.label === 'Turbidity')
    const ndci = comparison?.rows.find((row) => row.label === 'NDCI')
    const clear = comparison?.rows.find((row) => row.label === 'Clear pixels')
    const quality = comparison?.rows.find((row) => row.label === 'Quality')

    expect(turbidity).toMatchObject({ left: '1.7 FNU', right: '2.4 FNU', change: '-0.7' })
    expect(ndci).toMatchObject({ left: '0.052', right: '0.061', change: '-0.009' })
    expect(clear).toMatchObject({ left: '98%', right: '98%', change: '0' })
    expect(quality).toMatchObject({ left: 'Valid', right: 'Valid', change: '—' })
    expect(JSON.stringify(comparison)).not.toMatch(/improv|worsen|safer|pollut|recovery|deterior/i)

    const reversed = buildObservationComparison(
      [
        makeObservation({ id: 'low', date: '2026-09-03', turbidity: 1.7 }),
        makeObservation({ id: 'high', date: '2026-08-21', turbidity: 1.0 }),
      ],
      ['low', 'high'],
    )
    expect(reversed?.rows.find((row) => row.label === 'Turbidity')?.change).toBe('+0.7')
  })

  it('keeps null values as dashes', () => {
    const comparison = buildObservationComparison(
      [
        makeObservation({
          id: 'missing',
          date: '2026-09-03',
          qualityLabel: null,
          turbidity: null,
          ndci: null,
          usablePixelPercentage: null,
        }),
        august,
      ],
      ['missing', 'aug-21'],
    )
    const turbidity = comparison?.rows.find((row) => row.label === 'Turbidity')
    const ndci = comparison?.rows.find((row) => row.label === 'NDCI')
    const clear = comparison?.rows.find((row) => row.label === 'Clear pixels')
    const quality = comparison?.rows.find((row) => row.label === 'Quality')

    expect(turbidity).toMatchObject({ left: '—', right: '2.4 FNU', change: '—' })
    expect(ndci).toMatchObject({ left: '—', change: '—' })
    expect(clear).toMatchObject({ left: '—', change: '—' })
    expect(quality).toMatchObject({ left: '—', right: 'Valid', change: '—' })
    expect(turbidity?.left).not.toBe('0')
    expect(turbidity?.change).not.toBe('0')
  })

  it('clears the comparison', () => {
    const selected = toggleComparisonSelection(
      toggleComparisonSelection([], september.id),
      august.id,
    )

    expect(buildObservationComparison([september, august], selected)).not.toBeNull()
    expect(clearComparisonSelection()).toEqual([])
    expect(
      buildObservationComparison([september, august], clearComparisonSelection()),
    ).toBeNull()
    expect(buildObservationComparison([september, august], [september.id])).toBeNull()
  })

  it('keeps lake condition on the current observation', () => {
    const waterBody = makeWaterBody({
      status: 'moderate',
      statusLabel: 'Fair',
      metrics: {
        turbidityLevel: 'Low',
        chlorophyllLevel: 'Moderate',
        bloomRisk: 'low',
      },
    })
    const latest = makeObservation({
      id: 'latest',
      date: '2026-09-03',
      qualityLabel: 'Valid',
      turbidity: 1.7,
      ndci: 0.052,
    })
    const historical = makeObservation({
      id: 'older',
      date: '2026-08-21',
      qualityLabel: 'Cloudy',
      turbidity: null,
      ndci: null,
      usablePixelPercentage: null,
      cloudCover: 80,
    })
    const comparison = buildObservationComparison([latest, historical], ['latest', 'older'])

    const current = interpretLakeCondition({
      waterBody,
      latestObservation: observationForCurrentCondition(latest),
    })

    expect(comparison?.rows.find((row) => row.label === 'Quality')?.right).toBe('Cloudy')
    expect(current.condition.status).toBe('Fair')
    expect(current.observationQuality.qualityLabel).toBe('Valid')
    expect(current.signals.find((signal) => signal.id === 'signal-turbidity')?.detail).toBe('Low')
    expect(current.observationQuality.qualityLabel).not.toBe('Cloudy')
  })
})
