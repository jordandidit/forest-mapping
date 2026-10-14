import type { WaterQualityObservation } from '@/domain/observation/types'
import { formatNumber, formatPercent } from '@/lib/format'

/** Newest first. Date order only — no quality scoring. */
export function sortObservationsNewestFirst(
  observations: readonly WaterQualityObservation[],
): WaterQualityObservation[] {
  return [...observations].sort((a, b) => {
    const byDate = b.date.localeCompare(a.date)
    if (byDate !== 0) return byDate
    return b.acquiredAt.localeCompare(a.acquiredAt)
  })
}

export function selectObservation(
  observations: readonly WaterQualityObservation[],
  observationId: string | null | undefined,
): WaterQualityObservation | null {
  if (!observationId) return null
  return observations.find((observation) => observation.id === observationId) ?? null
}

/** Newest observation whose pipeline quality label is Valid. */
export function latestValidObservation(
  observations: readonly WaterQualityObservation[],
): WaterQualityObservation | null {
  return (
    sortObservationsNewestFirst(observations).find(
      (observation) => observation.qualityLabel?.trim().toLowerCase() === 'valid',
    ) ?? null
  )
}

/** Pipeline quality label, unchanged. Null when the pipeline did not supply one. */
export function observationQualityLabel(observation: WaterQualityObservation): string | null {
  const label = observation.qualityLabel?.trim()
  return label || null
}

/**
 * Measurements copied from the observation.
 * Null stays null and is never replaced with zero.
 */
export function historyMeasurements(observation: WaterQualityObservation): {
  turbidity: number | null
  ndci: number | null
  floatingVegetationPercent: number | null
  clearPercent: number | null
  cloudPercent: number | null
} {
  return {
    turbidity: observation.turbidity,
    ndci: observation.ndci,
    floatingVegetationPercent: observation.floatingVegetation,
    clearPercent: observation.usablePixelPercentage,
    cloudPercent: observation.cloudCover,
  }
}

export function formatHistoryNumber(value: number | null): string {
  if (value === null) return '—'
  return formatNumber(value)
}

export function formatHistoryPercent(value: number | null): string {
  if (value === null) return '—'
  const digits = Number.isInteger(value) ? 0 : 1
  return formatPercent(value, digits)
}

export function formatHistorySummary(observation: WaterQualityObservation): string {
  const metrics = historyMeasurements(observation)
  const turbidity =
    metrics.turbidity === null ? '—' : `${formatHistoryNumber(metrics.turbidity)} FNU`
  const ndci = formatHistoryNumber(metrics.ndci)
  const clear = formatHistoryPercent(metrics.clearPercent)
  const cloud = formatHistoryPercent(metrics.cloudPercent)
  return `Turbidity ${turbidity} · NDCI ${ndci} · Clear ${clear} · Cloud ${cloud}`
}

/**
 * Lake Condition stays on the latest observation from the production summary path.
 * The history selection is not substituted in.
 */
export function observationForCurrentCondition(
  latest: WaterQualityObservation | null | undefined,
): WaterQualityObservation | null {
  return latest ?? null
}

export interface ObservationComparisonRow {
  label: string
  left: string
  right: string
  change: string
}

/** Descriptive difference only. Left is the newer observation. */
export interface ObservationComparison {
  leftId: string
  rightId: string
  leftDate: string
  rightDate: string
  rows: ObservationComparisonRow[]
}

/** Add, remove, or replace the second id. At most two observations. */
export function toggleComparisonSelection(
  selectedIds: readonly string[],
  observationId: string,
): string[] {
  if (selectedIds.includes(observationId)) {
    return selectedIds.filter((id) => id !== observationId)
  }
  if (selectedIds.length >= 2) {
    return [selectedIds[0] ?? observationId, observationId]
  }
  return [...selectedIds, observationId]
}

export function clearComparisonSelection(): string[] {
  return []
}

/**
 * Newer observation on the left, earlier on the right.
 * Change is left minus right. Null stays null. Zero is 0, not a dash.
 * The sign is a numeric difference, not an assessment of the lake.
 */
export function buildObservationComparison(
  observations: readonly WaterQualityObservation[],
  observationIds: readonly string[],
): ObservationComparison | null {
  const pair = observationIds
    .map((id) => selectObservation(observations, id))
    .filter((observation): observation is WaterQualityObservation => observation !== null)

  const unique = pair.filter(
    (observation, index) => pair.findIndex((item) => item.id === observation.id) === index,
  )
  if (unique.length < 2) return null

  const [left, right] = [...unique].sort((a, b) => {
    const byDate = b.date.localeCompare(a.date)
    if (byDate !== 0) return byDate
    return b.acquiredAt.localeCompare(a.acquiredAt)
  })
  if (!left || !right) return null

  const leftMetrics = historyMeasurements(left)
  const rightMetrics = historyMeasurements(right)

  return {
    leftId: left.id,
    rightId: right.id,
    leftDate: left.date,
    rightDate: right.date,
    rows: [
      {
        label: 'Turbidity',
        left: leftMetrics.turbidity === null ? '—' : `${formatHistoryNumber(leftMetrics.turbidity)} FNU`,
        right:
          rightMetrics.turbidity === null ? '—' : `${formatHistoryNumber(rightMetrics.turbidity)} FNU`,
        change: formatNumericChange(leftMetrics.turbidity, rightMetrics.turbidity),
      },
      {
        label: 'NDCI',
        left: formatHistoryNumber(leftMetrics.ndci),
        right: formatHistoryNumber(rightMetrics.ndci),
        change: formatNumericChange(leftMetrics.ndci, rightMetrics.ndci),
      },
      {
        label: 'Clear pixels',
        left: formatHistoryPercent(leftMetrics.clearPercent),
        right: formatHistoryPercent(rightMetrics.clearPercent),
        change: formatNumericChange(leftMetrics.clearPercent, rightMetrics.clearPercent),
      },
      {
        label: 'Quality',
        left: observationQualityLabel(left) ?? '—',
        right: observationQualityLabel(right) ?? '—',
        change: '—',
      },
    ],
  }
}

function formatNumericChange(left: number | null, right: number | null): string {
  if (left === null || right === null) return '—'
  const difference = Math.round((left - right) * 1000) / 1000
  if (difference === 0) return '0'
  const body = formatNumber(Math.abs(difference))
  return difference > 0 ? `+${body}` : `-${body}`
}
