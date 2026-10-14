import { assessLakeAttention } from '@/domain/intelligence/attention'
import { interpretBloomRisk } from '@/domain/intelligence/bloom-risk'
import { interpretChlorophyll } from '@/domain/intelligence/chlorophyll'
import {
  authoritativeStatusLabel,
  toneFromStatus,
} from '@/domain/intelligence/helpers'
import { interpretObservationQuality } from '@/domain/intelligence/observation-confidence'
import { interpretTurbidity } from '@/domain/intelligence/turbidity'
import type {
  InterpretLakeConditionInput,
  InterpretationStatement,
  InterpretationTone,
  LakeConditionInterpretation,
} from '@/domain/intelligence/types'
import { interpretVegetation } from '@/domain/intelligence/vegetation'
import type { WaterQualityStatus } from '@/domain/water-quality/types'

function capitalize(value: string): string {
  if (!value) return value
  return value.charAt(0).toUpperCase() + value.slice(1)
}

function ensureSentence(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  const capped = capitalize(trimmed)
  return /[.!?]$/.test(capped) ? capped : `${capped}.`
}

function dedupeFields(fields: string[]): string[] {
  return [...new Set(fields)]
}

function buildSummary(parts: {
  statusSentence: string | null
  turbidityClause: string | null
  chlorophyllClause: string | null
  bloomClause: string | null
  limitationClause: string | null
}): string {
  const sentences: string[] = []

  if (parts.statusSentence) {
    sentences.push(ensureSentence(parts.statusSentence))
  }

  if (parts.turbidityClause && parts.chlorophyllClause) {
    sentences.push(
      ensureSentence(`${parts.turbidityClause}, while ${parts.chlorophyllClause}`),
    )
  } else if (parts.turbidityClause) {
    sentences.push(ensureSentence(parts.turbidityClause))
  } else if (parts.chlorophyllClause) {
    sentences.push(ensureSentence(parts.chlorophyllClause))
  }

  if (parts.bloomClause) {
    sentences.push(ensureSentence(parts.bloomClause))
  }

  if (parts.limitationClause) {
    sentences.push(ensureSentence(parts.limitationClause))
  }

  if (sentences.length === 0) {
    return 'Insufficient authoritative metrics are available to interpret current lake condition.'
  }

  return sentences.slice(0, 4).join(' ')
}

/**
 * Deterministic lake condition interpretation.
 *
 * Pipeline owns classifications. Frontend presents, explains, compares, and traces.
 * See types.ts authority boundary.
 */
export function interpretLakeCondition(
  input: InterpretLakeConditionInput,
): LakeConditionInterpretation {
  const { waterBody, latestObservation = null } = input
  const statusLabel = authoritativeStatusLabel(waterBody.statusLabel, waterBody.status)
  const trackedFields: string[] = []

  if (waterBody.statusLabel) trackedFields.push('statusLabel')
  else trackedFields.push('status')
  if (waterBody.statusNote) trackedFields.push('statusNote')

  const turbidity = interpretTurbidity(waterBody)
  const chlorophyll = interpretChlorophyll(waterBody)
  const bloom = interpretBloomRisk(waterBody)
  const vegetation = interpretVegetation(waterBody)
  const quality = interpretObservationQuality(waterBody, latestObservation)

  trackedFields.push(
    ...turbidity.fields,
    ...chlorophyll.fields,
    ...bloom.fields,
    ...vegetation.fields,
    ...quality.fields,
  )

  const signals: InterpretationStatement[] = [
    turbidity.signal,
    chlorophyll.signal,
    bloom.signal,
    vegetation.signal,
  ].filter((statement): statement is InterpretationStatement => statement != null)

  const changes: InterpretationStatement[] = [
    ...turbidity.changes,
    ...chlorophyll.changes,
  ]

  const lakeName = waterBody.name?.trim() || 'This water body'
  const statusSentence = statusLabel
    ? `Current monitoring status for ${lakeName} is ${statusLabel}`
    : null

  const note = waterBody.statusNote?.trim() || null

  const summary = buildSummary({
    statusSentence,
    turbidityClause: turbidity.summaryClause,
    chlorophyllClause: chlorophyll.summaryClause,
    bloomClause: bloom.summaryClause,
    limitationClause: quality.limitationClause,
  })

  const latestObservationDate =
    latestObservation?.date ??
    (waterBody.lastObservationAt ? waterBody.lastObservationAt.slice(0, 10) : null)

  const attention = assessLakeAttention({ waterBody, latestObservation })
  if (attention.signals.length > 0) {
    trackedFields.push('attention.signals')
  }

  return {
    condition: {
      status: statusLabel,
      summary,
      note,
    },
    signals,
    changes,
    observationQuality: quality.block,
    attention,
    generatedFrom: {
      latestObservationDate,
      fields: dedupeFields(trackedFields),
    },
  }
}

export function conditionTone(
  status: string | null,
  waterBodyStatus: WaterQualityStatus,
): InterpretationTone {
  if (!status) return toneFromStatus(waterBodyStatus)
  const normalized = status.toLowerCase()
  if (normalized.includes('good')) return 'positive'
  if (normalized.includes('fair') || normalized.includes('moderate')) return 'watch'
  if (normalized.includes('poor') || normalized.includes('critical')) return 'concern'
  if (normalized.includes('no recent') || normalized.includes('pending')) return 'unknown'
  return toneFromStatus(waterBodyStatus)
}
