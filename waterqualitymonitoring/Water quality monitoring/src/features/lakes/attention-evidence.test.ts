import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { assessLakeAttention } from '@/domain/intelligence/attention'
import { makeObservation, makeWaterBody } from '@/domain/intelligence/__fixtures__/lakes'
import { AttentionEvidence } from '@/features/lakes/components/AttentionEvidence'
import { LakeConditionPanel } from '@/features/lakes/components/LakeConditionPanel'

function evidenceMarkup(kind: 'chlorophyll' | 'turbidity' | 'trend') {
  const waterBody = makeWaterBody({
    statusLabel: 'Fair',
    turbidityTrendLabel: kind === 'trend' ? 'Increasing' : 'Stable',
    chlorophyllTrendLabel: 'Stable',
    metrics: {
      turbidity: kind === 'turbidity' ? null : 31.4,
      turbidityLevel: kind === 'turbidity' ? 'High' : 'Low',
      ndci: 0.052,
      chlorophyllLevel: 'Moderate',
      bloomRisk: 'low',
      floatingVegetationFlag: false,
    },
    baseline: {
      turbidity14MonthMean: kind === 'turbidity' ? null : 18.2,
      ndci14MonthMean: 0.056,
    },
    trends: {
      turbiditySlopePerYear: 1.2,
      turbidityTrendP: 0.04,
    },
  })
  const result = assessLakeAttention({
    waterBody,
    latestObservation: makeObservation({ qualityLabel: 'Valid', date: '2026-09-03' }),
  })
  const signal = result.signals.find((item) => item.kind === kind)
  if (!signal) throw new Error(`missing ${kind}`)
  return renderToStaticMarkup(
    createElement(AttentionEvidence, {
      title: signal.title,
      items: signal.evidence,
      onOpenMethodology: () => undefined,
    }),
  )
}

describe('attention evidence — WATER-INTEL-03C', () => {
  it('shows chlorophyll measurement, inventory range, observation, and baseline', () => {
    const html = evidenceMarkup('chlorophyll')
    expect(html).toContain('Measurement')
    expect(html).toContain('NDCI')
    expect(html).toContain('0.052')
    expect(html).toContain('Pipeline classification')
    expect(html).toContain('Moderate')
    expect(html).toContain('0.02–0.08')
    expect(html).toContain('Observation')
    expect(html).toContain('03 Sep 2026')
    expect(html).toContain('Valid')
    expect(html).toContain('Historical context')
    expect(html).toContain('0.056')
    expect(html).toContain('7% below mean')
    expect(html).toContain('How is this determined?')
  })

  it('keeps a missing turbidity measurement as an em dash', () => {
    const html = evidenceMarkup('turbidity')
    expect(html).toContain('Turbidity')
    expect(html).toContain('—')
    expect(html).toContain('25–60 FNU')
    expect(html).not.toContain('significant')
  })

  it('shows a mapped trend p-value without interpreting it', () => {
    const html = evidenceMarkup('trend')
    expect(html).toContain('Increasing')
    expect(html).toContain('1.2')
    expect(html).toContain('0.04')
    expect(html).not.toContain('significant')
  })

  it('keeps view evidence and view on map on the attention item', () => {
    const html = renderToStaticMarkup(
      createElement(LakeConditionPanel, {
        lake: makeWaterBody({
          metrics: {
            turbidityLevel: 'High',
            chlorophyllLevel: 'Moderate',
            bloomRisk: 'low',
            floatingVegetationFlag: false,
          },
        }),
        observation: makeObservation(),
      }),
    )
    expect(html).toContain('Chlorophyll conditions are currently classified as Moderate.')
    expect(html).toContain('Turbidity is currently classified as High.')
    expect(html).toContain('View evidence')
    expect(html).toContain('View on map')
    expect(html).toContain('How is this determined?')
    expect(html).toContain('aria-expanded="false">View evidence')
  })
})
