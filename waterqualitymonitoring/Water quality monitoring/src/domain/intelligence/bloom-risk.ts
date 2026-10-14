import type { InterpretationStatement } from '@/domain/intelligence/types'
import {
  bloomRiskLabel,
  evidence,
  toneFromBloomRisk,
} from '@/domain/intelligence/helpers'
import type { WaterBody } from '@/domain/water-body/types'

export function interpretBloomRisk(waterBody: WaterBody): {
  signal: InterpretationStatement | null
  fields: string[]
  summaryClause: string | null
} {
  const risk = waterBody.metrics?.bloomRisk ?? null
  const label = bloomRiskLabel(risk)
  if (!label) {
    return { signal: null, fields: [], summaryClause: null }
  }

  return {
    signal: {
      id: 'signal-bloom-risk',
      title: 'Bloom risk',
      detail: label,
      tone: toneFromBloomRisk(risk),
      evidence: [
        evidence('bloom-risk', 'Bloom risk', label, 'metrics.bloomRisk', {
          observationDate: waterBody.lastObservationAt?.slice(0, 10) || null,
          category: 'pipeline_classification',
        }),
      ],
    },
    fields: ['metrics.bloomRisk'],
    summaryClause: `current bloom risk is ${label}`,
  }
}
