import type { TimeSeriesPoint, WaterQualityObservation } from '@/domain/observation/types'
import {
  returnToLatestSelection,
  selectExistingObservation,
} from '@/features/observations/observation-explorer'

export const NO_OBSERVATION_FOR_DATE = 'No observation available for this date.'

/**
 * Date filter, chart points, and history rows all resolve to one observation id.
 * A missing date does not select a different observation.
 */
export function selectSharedObservation(
  observations: readonly WaterQualityObservation[],
  observationId: string,
): string | null {
  return selectExistingObservation(observations, observationId)
}

/**
 * Calendar pick. An empty value returns to Latest.
 * A date with no observation keeps the current id and explains why.
 */
export function datePickerSelection(
  observations: readonly WaterQualityObservation[],
  date: string,
  currentId: string | null,
): { selectedObservationId: string | null; message: string | null } {
  if (!date) return { selectedObservationId: null, message: null }
  const result = selectFromDate(observations, date)
  if ('message' in result) {
    return { selectedObservationId: currentId, message: result.message }
  }
  return { selectedObservationId: result.observationId, message: null }
}

export function selectFromDate(
  observations: readonly WaterQualityObservation[],
  date: string,
): { observationId: string } | { observationId: null; message: string } {
  const match = observations.find((observation) => observation.date === date)
  if (!match) {
    return { observationId: null, message: NO_OBSERVATION_FOR_DATE }
  }
  return { observationId: match.id }
}

/** A null metric is a gap. It is not a clickable point and does not select another date. */
export function selectFromChartPoint(
  observations: readonly WaterQualityObservation[],
  point: Pick<TimeSeriesPoint, 'value' | 'observationId'>,
): string | null {
  if (point.value === null || !point.observationId) return null
  return selectSharedObservation(observations, point.observationId)
}

export function temporalSelection(observationId: string | null): {
  selectedObservationId: string | null
  filter: 'latest' | 'observation'
  chartSelection: string | null
  historySelection: string | null
} {
  return {
    selectedObservationId: observationId,
    filter: observationId ? 'observation' : 'latest',
    chartSelection: observationId,
    historySelection: observationId,
  }
}

export function clearTemporalSelection(): null {
  return returnToLatestSelection()
}
