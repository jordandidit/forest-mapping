import { describe, expect, it } from 'vitest'
import { assessLakeAttention } from '@/domain/intelligence/attention'
import { interpretLakeCondition } from '@/domain/intelligence/lake-condition'
import { makeWaterBody } from '@/domain/intelligence/__fixtures__/lakes'

const PROHIBITED = /\b(polluted|unsafe|toxic|dangerous|harmful algal bloom detected)\b/i

function attentionText(result: ReturnType<typeof assessLakeAttention>): string {
  return result.signals
    .flatMap((signal) => [
      signal.summary,
      ...signal.evidence.map((item) => String(item.value ?? '')),
    ])
    .concat(result.emptyStateMessage ?? '')
    .join(' ')
}

describe('assessLakeAttention — WATER-INTEL-03B', () => {
  it('keeps a Muhazi-like Fair/Moderate case informational', () => {
    const waterBody = makeWaterBody({
      id: 'lake-muhazi',
      name: 'Lake Muhazi',
      status: 'moderate',
      statusLabel: 'Fair',
      turbidityTrendLabel: 'Stable',
      chlorophyllTrendLabel: 'Stable',
      metrics: {
        turbidity: 99,
        turbidityLevel: 'Low',
        ndci: 0.01,
        chlorophyll: 0.2,
        chlorophyllLevel: 'Moderate',
        bloomRisk: 'low',
        floatingVegetationPct: 2,
        floatingVegetationFlag: false,
      },
      baseline: {
        turbidityPercentileRank: 95,
        ndciPercentileRank: 95,
      },
    })

    const interpretation = interpretLakeCondition({ waterBody })
    const result = interpretation.attention

    expect(interpretation.condition.status).toBe('Fair')
    expect(result.signals.map((signal) => signal.kind)).toEqual(['chlorophyll'])
    expect(result.signals[0]?.level).toBe('info')
    expect(result.signals[0]?.summary).toBe(
      'Chlorophyll conditions are currently classified as Moderate.',
    )
    expect(result.signals[0]?.evidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'NDCI',
          value: '0.01',
          sourceField: 'metrics.ndci',
        }),
        expect.objectContaining({
          label: 'Moderate',
          value: '0.02–0.08',
          sourceField: 'metrics.chlorophyllLevel',
        }),
      ]),
    )
    expect(attentionText(result)).not.toMatch(PROHIBITED)
  })

  it('passes through a High turbidity classification', () => {
    const result = assessLakeAttention({
      waterBody: makeWaterBody({
        statusLabel: 'Fair',
        metrics: {
          turbidity: 0.4,
          turbidityLevel: 'High',
          chlorophyllLevel: 'Low',
          bloomRisk: 'low',
          floatingVegetationFlag: false,
        },
        turbidityTrendLabel: 'Stable',
        chlorophyllTrendLabel: 'Stable',
      }),
    })

    const turbidity = result.signals.find((signal) => signal.kind === 'turbidity')
    expect(turbidity?.summary).toBe('Turbidity is currently classified as High.')
    expect(turbidity?.relatedMapLayer).toBe('turbidity')
    expect(turbidity?.evidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Turbidity',
          value: '0.4',
          unit: 'FNU',
          sourceField: 'metrics.turbidity',
        }),
        expect.objectContaining({
          label: 'High',
          value: '25–60 FNU',
          sourceField: 'metrics.turbidityLevel',
        }),
      ]),
    )
  })

  it('passes through a High bloom-risk classification', () => {
    const result = assessLakeAttention({
      waterBody: makeWaterBody({
        statusLabel: 'Fair',
        metrics: {
          turbidityLevel: 'Low',
          chlorophyllLevel: 'Low',
          bloomRisk: 'high',
          floatingVegetationFlag: false,
        },
      }),
    })

    const bloom = result.signals.find((signal) => signal.kind === 'bloom')
    expect(bloom?.summary).toBe('Bloom risk is currently High.')
    expect(bloom?.evidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Bloom risk',
          value: 'High',
          sourceField: 'metrics.bloomRisk',
        }),
        expect.objectContaining({
          label: 'FAI',
          value: null,
          sourceField: 'fai',
        }),
        expect.objectContaining({
          label: 'Screening rule',
          value: 'ndci >= 0.15',
          sourceField: 'methodology:bloom-risk',
        }),
      ]),
    )
    expect(result.signals.some((signal) => signal.kind === 'chlorophyll')).toBe(false)
    expect(result.signals.some((signal) => signal.kind === 'turbidity')).toBe(false)
    expect(attentionText(result)).not.toMatch(PROHIBITED)
  })

  it('reports no recent data from statusLabel', () => {
    const result = assessLakeAttention({
      waterBody: makeWaterBody({
        status: 'unknown',
        statusLabel: 'No recent data',
        lastObservationAt: '',
        metrics: {
          turbidityLevel: 'High',
          chlorophyllLevel: 'High',
          bloomRisk: 'high',
          floatingVegetationFlag: true,
        },
        turbidityTrendLabel: 'Increasing',
        chlorophyllTrendLabel: 'Increasing',
      }),
    })

    expect(result.signals).toHaveLength(1)
    expect(result.signals[0]?.kind).toBe('recency')
    expect(result.signals[0]?.summary).toBe(
      'No recent valid water-quality observation is available.',
    )
    expect(result.signals[0]?.evidence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Last valid observation',
          value: null,
          sourceField: 'lastObservationAt',
        }),
        expect.objectContaining({
          label: 'Days since observation',
          value: 5,
          sourceField: 'daysSinceObservation',
        }),
        expect.objectContaining({
          label: 'Freshness rule',
          value: 'no last_obs_date while last_check_date is set, or days_since_obs > 45',
          sourceField: 'methodology:lake-condition',
        }),
      ]),
    )
  })

  it('shows the empty state when no attention signal exists', () => {
    const result = assessLakeAttention({
      waterBody: makeWaterBody({
        status: 'good',
        statusLabel: 'Good',
        turbidityTrendLabel: 'Stable',
        chlorophyllTrendLabel: 'Stable',
        metrics: {
          turbidityLevel: 'Low',
          chlorophyllLevel: 'Low',
          bloomRisk: 'low',
          floatingVegetationFlag: false,
          floatingVegetationPct: 2,
        },
        baseline: {
          turbidityPercentileRank: 99,
          ndciPercentileRank: 99,
        },
      }),
    })

    expect(result.signals).toHaveLength(0)
    expect(result.hasAttentionSignals).toBe(false)
    expect(result.emptyStateMessage).toBe('No additional attention signals identified.')
    expect(attentionText(result)).not.toMatch(PROHIBITED)
  })
})
