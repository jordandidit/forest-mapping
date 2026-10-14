import type {
  EvidenceCategory,
  EvidenceItem,
  InterpretationTone,
} from '@/domain/intelligence/types'
import type { BloomRisk, WaterQualityStatus } from '@/domain/water-quality/types'

export function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

/** Arithmetic comparison only — not an environmental classification. */
export function percentDifference(current: number, baseline: number): number | null {
  if (!isFiniteNumber(current) || !isFiniteNumber(baseline) || baseline === 0) {
    return null
  }
  return ((current - baseline) / Math.abs(baseline)) * 100
}

export function formatSignedPercent(value: number, digits = 0): string {
  const rounded = Number(value.toFixed(digits))
  const magnitude = Math.abs(rounded)
  const formatted = magnitude.toLocaleString('en-US', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  })
  if (rounded > 0) return `+${formatted}%`
  if (rounded < 0) return `−${formatted}%`
  return `${formatted}%`
}

export function formatAbsoluteDifference(
  current: number,
  previous: number,
  unit: string,
  digits: number,
): string {
  const delta = current - previous
  const magnitude = Math.abs(delta).toLocaleString('en-US', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  })
  const suffix = unit ? ` ${unit}` : ''
  // The row title names the comparison; the detail is only the signed difference.
  if (Number(magnitude) === 0) return 'No change'
  if (delta > 0) return `+${magnitude}${suffix}`
  return `−${magnitude}${suffix}`
}

export function evidence(
  id: string,
  label: string,
  value: string | number | null | undefined,
  sourceField: string,
  options?: {
    unit?: string | null
    observationDate?: string | null
    category?: EvidenceCategory
  },
): EvidenceItem {
  return {
    id,
    label,
    value: value ?? null,
    unit: options?.unit ?? null,
    category: options?.category ?? 'measurement',
    sourceField,
    observationDate: options?.observationDate ?? null,
  }
}

/**
 * Pass through authoritative pipeline statusLabel only.
 * Does not remap domain status (e.g. moderate → Fair).
 */
export function authoritativeStatusLabel(
  statusLabel: string | null | undefined,
  status: WaterQualityStatus,
): string | null {
  const raw = statusLabel?.trim()
  if (raw) return raw
  // Fallback only when pipeline label is absent — display domain token, do not invent Fair.
  switch (status) {
    case 'good':
      return 'Good'
    case 'moderate':
      return 'Moderate'
    case 'poor':
      return 'Poor'
    case 'critical':
      return 'Critical'
    case 'unknown':
      return null
  }
}

/** Presentation tone from an already-authoritative level string — not a classifier. */
export function toneFromLevelLabel(level: string | null | undefined): InterpretationTone {
  const normalized = (level ?? '').toLowerCase()
  if (!normalized) return 'unknown'
  if (normalized.includes('low') || normalized.includes('good') || normalized.includes('clear')) {
    return 'positive'
  }
  if (normalized.includes('moderate') || normalized.includes('fair') || normalized.includes('medium')) {
    return 'watch'
  }
  if (
    normalized.includes('high') ||
    normalized.includes('elevat') ||
    normalized.includes('poor') ||
    normalized.includes('critical')
  ) {
    return 'concern'
  }
  return 'neutral'
}

export function toneFromBloomRisk(risk: BloomRisk | null | undefined): InterpretationTone {
  if (!risk) return 'unknown'
  if (risk === 'low') return 'positive'
  if (risk === 'moderate') return 'watch'
  return 'concern'
}

export function toneFromStatus(status: WaterQualityStatus): InterpretationTone {
  if (status === 'good') return 'positive'
  if (status === 'moderate') return 'watch'
  if (status === 'poor' || status === 'critical') return 'concern'
  return 'unknown'
}

export function toneFromQualityLabel(qualityLabel: string | null | undefined): InterpretationTone {
  const label = (qualityLabel ?? '').toLowerCase()
  if (!label) return 'unknown'
  if (label.includes('valid') || label.includes('excellent') || label === 'good') return 'positive'
  if (label.includes('hazy') || label.includes('glint') || label.includes('fair')) return 'watch'
  if (label.includes('cloud') || label.includes('unusable') || label.includes('too few')) {
    return 'concern'
  }
  return 'neutral'
}

/** Present domain bloom-risk enum as title case — value originates in the pipeline. */
export function bloomRiskLabel(risk: BloomRisk | null | undefined): string | null {
  if (!risk) return null
  return risk.charAt(0).toUpperCase() + risk.slice(1)
}

/**
 * Authoritative pipeline trend label only.
 * Does not derive Increasing/Stable/Decreasing from slopes or TrendDirection.
 */
export function surfaceTrendLabel(productionLabel: string | null | undefined): string | null {
  const raw = productionLabel?.trim()
  return raw || null
}

export function observationDateIso(
  lastObservationAt: string | null | undefined,
  observationDate?: string | null,
): string | null {
  if (observationDate) return observationDate.slice(0, 10)
  if (!lastObservationAt) return null
  return lastObservationAt.slice(0, 10) || null
}
