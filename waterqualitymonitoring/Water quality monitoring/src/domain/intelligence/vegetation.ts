import type { InterpretationStatement } from '@/domain/intelligence/types'
import { evidence, isFiniteNumber } from '@/domain/intelligence/helpers'
import type { WaterBody } from '@/domain/water-body/types'

export function interpretVegetation(waterBody: WaterBody): {
  signal: InterpretationStatement | null
  fields: string[]
  summaryClause: string | null
} {
  const pct = waterBody.metrics?.floatingVegetationPct ?? null
  const flag = waterBody.metrics?.floatingVegetationFlag
  const fields: string[] = []
  if (isFiniteNumber(pct)) fields.push('metrics.floatingVegetationPct')
  if (flag !== null && flag !== undefined) fields.push('metrics.floatingVegetationFlag')

  if (!isFiniteNumber(pct) && flag == null) {
    return { signal: null, fields, summaryClause: null }
  }

  const evidenceItems = [
    ...(isFiniteNumber(pct)
      ? [
          evidence('veg-pct', 'Floating vegetation', pct, 'metrics.floatingVegetationPct', {
            unit: '%',
            observationDate: waterBody.lastObservationAt?.slice(0, 10) || null,
            category: 'measurement',
          }),
        ]
      : []),
    ...(flag !== null && flag !== undefined
      ? [
          evidence(
            'veg-flag',
            'Floating vegetation flag',
            flag ? 'Detected' : 'Not flagged',
            'metrics.floatingVegetationFlag',
            { category: 'pipeline_classification' },
          ),
        ]
      : []),
  ]

  const detail = isFiniteNumber(pct)
    ? `${pct}%`
    : flag
      ? 'Flagged'
      : 'Not flagged'

  const summaryClause = isFiniteNumber(pct)
    ? `floating vegetation covers approximately ${pct}% of observed water pixels`
    : null

  return {
    signal: {
      id: 'signal-floating-vegetation',
      title: 'Floating vegetation',
      detail,
      tone: 'neutral',
      evidence: evidenceItems,
    },
    fields,
    summaryClause,
  }
}
