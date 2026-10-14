import type { BloomRisk } from '@/domain/water-quality/types'
import type { WaterQualityObservation } from '@/domain/observation/types'
import {
  formatHistoryNumber,
  formatHistoryPercent,
  observationQualityLabel,
  selectObservation,
  sortObservationsNewestFirst,
} from '@/features/observations/history'
import { formatShortDisplayDate } from '@/lib/format'

export const NO_VALID_WATER_QUALITY_MEASUREMENT =
  'No valid water-quality measurement was produced for this observation.'

export interface ObservationDateOption {
  id: string
  date: string
  /** Pipeline quality label. Null when the pipeline did not supply one. */
  qualityLabel: string | null
}

/** Shared by the date selector and the history table. Null means Latest. */
export interface ObservationDateSelection {
  observations: readonly WaterQualityObservation[]
  selectedObservationId: string | null
  onSelectObservation: (observationId: string) => void
  onReturnToLatest: () => void
}

export interface ObservationMeasurementDisplay {
  date: string
  quality: string
  turbidityFnu: string
  ndci: string
  floatingVegetation: string
  clear: string
  cloud: string
  /** Null means the observation has no bloom risk value, so the row is omitted. */
  bloomRisk: string | null
}

export interface ObservationReadout {
  observationId: string
  date: string
  qualityLabel: string | null
  turbidity: number | null
  ndci: number | null
  floatingVegetation: number | null
  clearPercent: number | null
  cloudPercent: number | null
  bloomRisk: BloomRisk | null
  notice: string | null
  previousValidDate: string | null
  /** An observation row does not carry an overall Good/Fair/Poor lake status. */
  overallLakeStatus: null
  display: ObservationMeasurementDisplay
}

export interface ObservationExplorerModel {
  mode: 'latest' | 'observation'
  selectedObservationId: string | null
  options: ObservationDateOption[]
  readout: ObservationReadout | null
  currentConditionLabel: string | null
  map: {
    selectedObservation: string
    mapOverlay: string
  }
}

/** Null selection is Latest. No observation is inspected. */
export function defaultObservationSelection(): null {
  return null
}

/** Clears a historical inspection and returns to Latest. */
export function returnToLatestSelection(): null {
  return null
}

/**
 * Selects an observation that is already loaded.
 * An unknown id does not invent a date and does not fall back to another row.
 */
export function selectExistingObservation(
  observations: readonly WaterQualityObservation[],
  observationId: string,
): string | null {
  return selectObservation(observations, observationId)?.id ?? null
}

/** Dates that exist on the loaded observations. Newest first. No empty days. */
export function observationDateOptions(
  observations: readonly WaterQualityObservation[],
): ObservationDateOption[] {
  return sortObservationsNewestFirst(observations).map((observation) => ({
    id: observation.id,
    date: observation.date,
    qualityLabel: observationQualityLabel(observation),
  }))
}

/** Display date for the selector: 03 Sep 2026 */
export function formatExplorerDate(isoDate: string): string {
  return `${formatShortDisplayDate(isoDate)} ${isoDate.slice(0, 4)}`
}

export function observationDateOptionLabel(option: ObservationDateOption): string {
  return `${formatExplorerDate(option.date)} · ${option.qualityLabel ?? '—'}`
}

/**
 * Selected observation date and the production overlay stay independent.
 * The overlay string is returned unchanged.
 */
export function mapInspectionLabels(
  selectedObservationDate: string | null | undefined,
  overlayPeriod: string | null | undefined,
): { selectedObservation: string; mapOverlay: string } {
  return {
    selectedObservation: selectedObservationDate
      ? formatExplorerDate(selectedObservationDate)
      : 'Latest',
    mapOverlay: overlayPeriod?.trim() || '—',
  }
}

/** Pipeline status label only. Does not derive Good/Fair/Poor from the status enum. */
export function currentConditionLabel(statusLabel: string | null | undefined): string | null {
  const label = statusLabel?.trim()
  return label ? label : null
}

/**
 * Fields copied from this observation only.
 * Null stays null. A cloudy or invalid row does not receive another date's values.
 */
export function observationReadout(
  observation: WaterQualityObservation,
  observations: readonly WaterQualityObservation[] = [],
): ObservationReadout {
  const qualityLabel = observationQualityLabel(observation)
  const turbidity = observation.turbidity
  const ndci = observation.ndci
  const floatingVegetation = observation.floatingVegetation
  const clearPercent = observation.usablePixelPercentage
  const cloudPercent = observation.cloudCover
  const bloomRisk = observation.bloomRisk
  const lacksValidMeasurement = qualityLabel != null && qualityLabel.toLowerCase() !== 'valid'

  return {
    observationId: observation.id,
    date: observation.date,
    qualityLabel,
    turbidity,
    ndci,
    floatingVegetation,
    clearPercent,
    cloudPercent,
    bloomRisk,
    notice: lacksValidMeasurement ? NO_VALID_WATER_QUALITY_MEASUREMENT : null,
    previousValidDate: lacksValidMeasurement
      ? previousValidObservationDate(observations, observation)
      : null,
    overallLakeStatus: null,
    display: {
      date: formatExplorerDate(observation.date),
      quality: qualityLabel ?? '—',
      turbidityFnu: turbidity === null ? '—' : `${formatHistoryNumber(turbidity)} FNU`,
      ndci: formatHistoryNumber(ndci),
      floatingVegetation: formatHistoryPercent(floatingVegetation),
      clear: formatHistoryPercent(clearPercent),
      cloud: formatHistoryPercent(cloudPercent),
      bloomRisk,
    },
  }
}

export function buildObservationExplorer(input: {
  observations: readonly WaterQualityObservation[]
  selectedObservationId: string | null
  currentStatusLabel?: string | null
  overlayPeriod?: string | null
}): ObservationExplorerModel {
  const selected = selectObservation(input.observations, input.selectedObservationId)

  return {
    mode: selected ? 'observation' : 'latest',
    selectedObservationId: selected?.id ?? null,
    options: observationDateOptions(input.observations),
    readout: selected ? observationReadout(selected, input.observations) : null,
    currentConditionLabel: currentConditionLabel(input.currentStatusLabel),
    map: mapInspectionLabels(selected?.date ?? null, input.overlayPeriod),
  }
}

function previousValidObservationDate(
  observations: readonly WaterQualityObservation[],
  selected: WaterQualityObservation,
): string | null {
  const sorted = sortObservationsNewestFirst(observations)
  const selectedIndex = sorted.findIndex((item) => item.id === selected.id)
  const older =
    selectedIndex >= 0
      ? sorted.slice(selectedIndex + 1)
      : sorted.filter((item) => item.date < selected.date)
  const valid = older.find((item) => observationQualityLabel(item)?.toLowerCase() === 'valid')
  return valid?.date ?? null
}
