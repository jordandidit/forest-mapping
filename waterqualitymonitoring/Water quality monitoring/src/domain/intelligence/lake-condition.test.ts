import { describe, expect, it } from 'vitest'
import { interpretLakeCondition } from '@/domain/intelligence/lake-condition'
import {
  formatAbsoluteDifference,
  percentDifference,
  surfaceTrendLabel,
} from '@/domain/intelligence/helpers'
import { makeObservation, makeWaterBody } from '@/domain/intelligence/__fixtures__/lakes'

describe('interpretLakeCondition — pipeline authority', () => {
  it('passes through authoritative classifications without inventing conclusions', () => {
    const waterBody = makeWaterBody({
      id: 'lake-muhazi',
      name: 'Lake Muhazi',
      status: 'moderate',
      statusLabel: 'Fair',
      statusNote: 'Monitoring note from production.',
      turbidityTrendLabel: 'Stable',
      chlorophyllTrendLabel: 'Stable',
    })
    const observation = makeObservation({ qualityLabel: 'Valid', usablePixelPercentage: 71 })

    const result = interpretLakeCondition({ waterBody, latestObservation: observation })

    expect(result.condition.status).toBe('Fair')
    expect(result.condition.note).toBe('Monitoring note from production.')
    expect(result.condition.summary).toContain('Current monitoring status for Lake Muhazi is Fair')
    expect(result.condition.summary).toMatch(/Turbidity is classified as Low/i)
    expect(result.condition.summary).toMatch(/14-month mean/i)
    expect(result.condition.summary.toLowerCase()).not.toContain('polluted')
    expect(result.condition.summary.toLowerCase()).not.toContain('harmful algal bloom')

    expect(result.signals.find((s) => s.id === 'signal-turbidity')?.detail).toBe('Low')
    expect(result.signals.find((s) => s.id === 'signal-chlorophyll')?.detail).toBe('Moderate')
    expect(result.signals.find((s) => s.id === 'signal-bloom-risk')?.detail).toBe('Low')

    const turbChange = result.changes.find((s) => s.id === 'change-turbidity-baseline')
    expect(turbChange?.detail).toMatch(/−43%/)

    expect(result.observationQuality.qualityLabel).toBe('Valid')
    expect(result.observationQuality.qualityExplanation).toContain('classified as Valid')
    expect(result.observationQuality.qualityExplanation.toLowerCase()).not.toContain('confidence')
    // @ts-expect-error — confidence level must not exist on the model
    expect(result.observationConfidence).toBeUndefined()
    expect('level' in result.observationQuality).toBe(false)
  })

  it('preserves Fair even when metric levels look “Good”', () => {
    const result = interpretLakeCondition({
      waterBody: makeWaterBody({
        status: 'good',
        statusLabel: 'Fair',
        metrics: {
          turbidityLevel: 'Low',
          chlorophyllLevel: 'Low',
          bloomRisk: 'low',
        },
      }),
    })

    expect(result.condition.status).toBe('Fair')
    expect(result.condition.summary).toContain('is Fair')
    expect(result.condition.summary).not.toContain('is Good')
    expect(result.signals.find((s) => s.id === 'signal-chlorophyll')?.detail).toBe('Low')
  })

  it('does not reclassify lake status from domain status alone when statusLabel is Fair', () => {
    const result = interpretLakeCondition({
      waterBody: makeWaterBody({
        status: 'moderate',
        statusLabel: 'Fair',
      }),
    })
    expect(result.condition.status).toBe('Fair')
  })

  it('preserves Good / Poor statusLabel pass-through', () => {
    expect(
      interpretLakeCondition({
        waterBody: makeWaterBody({ status: 'good', statusLabel: 'Good' }),
      }).condition.status,
    ).toBe('Good')

    expect(
      interpretLakeCondition({
        waterBody: makeWaterBody({
          status: 'poor',
          statusLabel: 'Poor',
          metrics: { bloomRisk: 'elevated', turbidityLevel: 'High', chlorophyllLevel: 'High' },
        }),
      }).condition.status,
    ).toBe('Poor')
  })

  it('does not invent Fair when only domain moderate status exists', () => {
    const result = interpretLakeCondition({
      waterBody: makeWaterBody({
        status: 'moderate',
        statusLabel: null,
      }),
    })
    expect(result.condition.status).toBe('Moderate')
    expect(result.condition.status).not.toBe('Fair')
  })

  it('respects No recent data authoritative status', () => {
    const result = interpretLakeCondition({
      waterBody: makeWaterBody({
        status: 'unknown',
        statusLabel: 'No recent data',
        lastObservationAt: '',
        daysSinceObservation: null,
        metrics: null,
        baseline: null,
        trends: null,
        previousObservation: null,
      }),
      latestObservation: null,
    })

    expect(result.condition.status).toBe('No recent data')
    expect(result.signals).toHaveLength(0)
    expect(result.observationQuality.qualityLabel).toBeNull()
  })

  it('does not invent observation confidence categories', () => {
    const cloudy = interpretLakeCondition({
      waterBody: makeWaterBody(),
      latestObservation: makeObservation({
        quality: 'unusable',
        qualityLabel: 'Cloudy',
        usablePixelPercentage: 22,
      }),
    })
    expect(cloudy.observationQuality.qualityLabel).toBe('Cloudy')
    expect(cloudy.observationQuality.qualityExplanation).toContain('classified as Cloudy')
    expect(cloudy.observationQuality.qualityFacts.clearPct).toBe(22)
    expect(cloudy.observationQuality.qualityExplanation.toLowerCase()).not.toMatch(
      /high confidence|moderate confidence|limited confidence/,
    )

    const hazy = interpretLakeCondition({
      waterBody: makeWaterBody(),
      latestObservation: makeObservation({
        quality: 'fair',
        qualityLabel: 'Hazy or glint',
      }),
    })
    expect(hazy.observationQuality.qualityLabel).toBe('Hazy or glint')
    expect(hazy.observationQuality.qualityExplanation).toContain('Hazy or glint')
  })

  it('does not derive bloom risk or chlorophyll level', () => {
    const result = interpretLakeCondition({
      waterBody: makeWaterBody({
        metrics: {
          ndci: 0.2,
          chlorophyll: null,
          chlorophyllLevel: null,
          bloomRisk: null,
          turbidity: 1.7,
          turbidityLevel: 'Low',
        },
      }),
    })

    expect(result.signals.find((s) => s.id === 'signal-bloom-risk')).toBeUndefined()
    expect(result.signals.find((s) => s.id === 'signal-chlorophyll')?.detail).toBe('NDCI 0.2')
    expect(result.condition.summary.toLowerCase()).not.toContain('bloom risk')
  })

  it('keeps NDCI distinct from chlorophyll-a concentration', () => {
    const result = interpretLakeCondition({
      waterBody: makeWaterBody({
        metrics: {
          ndci: 0.052,
          chlorophyll: 4.2,
          chlorophyllLevel: 'Moderate',
        },
      }),
    })

    const signal = result.signals.find((s) => s.id === 'signal-chlorophyll')
    expect(signal?.evidence.some((e) => e.label === 'NDCI' && e.value === 0.052)).toBe(true)
    expect(
      signal?.evidence.some(
        (e) => e.label === 'Indicative chlorophyll-a' && e.unit === 'mg/m³' && e.value === 4.2,
      ),
    ).toBe(true)
    expect(result.condition.summary).not.toMatch(/NDCI .*mg\/m³/i)
  })

  it('allows arithmetic baseline comparison when baselines are present', () => {
    const result = interpretLakeCondition({
      waterBody: makeWaterBody({
        metrics: { turbidity: 1.7, turbidityLevel: 'Low' },
        baseline: { turbidity14MonthMean: 3.0, ndci14MonthMean: 0.056 },
      }),
    })
    expect(result.changes.some((c) => c.id === 'change-turbidity-baseline')).toBe(true)
    expect(result.condition.summary).toMatch(/14-month mean/i)
  })

  it('omits baseline comparison when baselines are missing or zero', () => {
    expect(percentDifference(1.7, 0)).toBeNull()

    expect(
      interpretLakeCondition({
        waterBody: makeWaterBody({
          baseline: null,
          previousObservation: null,
          trends: null,
        }),
      }).changes.some((c) => c.id === 'change-turbidity-baseline'),
    ).toBe(false)

    expect(
      interpretLakeCondition({
        waterBody: makeWaterBody({
          baseline: { turbidity14MonthMean: 0, ndci14MonthMean: 0 },
          previousObservation: null,
        }),
      }).changes.some((c) => c.id === 'change-turbidity-baseline'),
    ).toBe(false)
  })

  it('describes previous observation change without claiming a trend', () => {
    const result = interpretLakeCondition({
      waterBody: makeWaterBody({
        baseline: null,
        turbidityTrendLabel: null,
        chlorophyllTrendLabel: null,
        trends: null,
        previousObservation: {
          observedAt: '2026-08-20',
          turbidity: 2.1,
          ndci: 0.06,
        },
        metrics: { turbidity: 1.7, turbidityLevel: 'Low' },
      }),
    })

    const prev = result.changes.find((c) => c.id === 'change-turbidity-previous')
    expect(prev?.title).toBe('Turbidity vs previous clear observation')
    expect(prev?.detail).toBe('−0.4 FNU')
    expect(prev?.detail.toLowerCase()).not.toContain('improving')

    const ndciPrev = result.changes.find((c) => c.id === 'change-ndci-previous')
    expect(ndciPrev?.title).toBe('NDCI vs previous clear observation')
    expect(ndciPrev?.detail).not.toContain('previous')
  })

  it('formats a previous-observation change as a signed number only', () => {
    expect(formatAbsoluteDifference(2.5, 2.1, 'FNU', 1)).toBe('+0.4 FNU')
    expect(formatAbsoluteDifference(1.7, 2.1, 'FNU', 1)).toBe('−0.4 FNU')
    expect(formatAbsoluteDifference(0.07, 0.055, '', 3)).toBe('+0.015')
    expect(formatAbsoluteDifference(2.1, 2.1, 'FNU', 1)).toBe('No change')
    expect(formatAbsoluteDifference(2.12, 2.1, 'FNU', 1)).toBe('No change')
  })

  it('surfaces authoritative trend labels only — does not derive from TrendDirection', () => {
    expect(surfaceTrendLabel(undefined)).toBeNull()
    expect(surfaceTrendLabel('Increasing')).toBe('Increasing')

    const withoutLabel = interpretLakeCondition({
      waterBody: makeWaterBody({
        turbidityTrendLabel: null,
        chlorophyllTrendLabel: null,
        trends: {
          turbidityTrend: 'deteriorating',
          turbiditySlopePerYear: 0.4,
          chlorophyllTrend: 'improving',
          ndciSlopePerYear: -0.01,
        },
      }),
    })
    expect(withoutLabel.changes.some((c) => c.id === 'change-turbidity-trend')).toBe(false)

    const withLabel = interpretLakeCondition({
      waterBody: makeWaterBody({
        turbidityTrendLabel: 'Increasing',
        chlorophyllTrendLabel: 'Decreasing',
        trends: {
          turbidityTrend: 'deteriorating',
          turbiditySlopePerYear: 0.4,
          chlorophyllTrend: 'improving',
          ndciSlopePerYear: -0.01,
        },
      }),
    })
    expect(withLabel.changes.find((c) => c.id === 'change-turbidity-trend')?.detail).toBe(
      'Increasing',
    )
    expect(withLabel.changes.find((c) => c.id === 'change-chlorophyll-trend')?.detail).toBe(
      'Decreasing',
    )
  })

  it('omits null metric clauses from the summary', () => {
    const result = interpretLakeCondition({
      waterBody: makeWaterBody({
        statusLabel: 'Fair',
        metrics: {
          turbidity: null,
          turbidityLevel: null,
          ndci: null,
          chlorophyll: null,
          chlorophyllLevel: null,
          bloomRisk: null,
          floatingVegetationPct: null,
          floatingVegetationFlag: null,
        },
        baseline: null,
        previousObservation: null,
        turbidityTrendLabel: null,
        chlorophyllTrendLabel: null,
        trends: null,
      }),
    })

    expect(result.signals).toHaveLength(0)
    expect(result.condition.summary).toContain('Fair')
    expect(result.condition.summary).not.toContain('Turbidity')
    expect(result.condition.summary).not.toContain('undefined')
  })
})
