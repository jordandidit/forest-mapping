import { selectObservation } from '@/features/observations/history'
import {
  SATELLITE_SCENE_UNAVAILABLE,
  observationSceneDay,
} from '@/features/map/historical-sentinel'
import {
  formatExplorerDate,
  type ObservationDateSelection,
} from '@/features/observations/observation-explorer'

interface MapDateContextProps {
  latestSceneDate: string | null
  latestSceneQuality: string | null
  latestValidDate: string | null
  /** Null means Latest. This date is not the raster overlay date. */
  selectedObservationDate?: string | null
  /** Scene day actually requested from the Sentinel mosaic. Null in Latest mode. */
  satelliteSceneDay?: string | null
  satelliteSceneUnavailable?: boolean
}

/**
 * Compact scene context for the map corner.
 * Display only — does not choose which raster or which lake metrics are shown.
 */
export function MapDateContext({
  latestSceneDate,
  latestSceneQuality,
  latestValidDate,
  selectedObservationDate = null,
  satelliteSceneDay = null,
  satelliteSceneUnavailable = false,
}: MapDateContextProps) {
  const sceneQuality = nonValidQuality(latestSceneQuality)

  if (selectedObservationDate) {
    return (
      <div
        className="map-chrome-panel pointer-events-auto px-2.5 py-1.5 text-xs leading-snug text-[var(--color-text-secondary)]"
        aria-label="Observation context"
      >
        <p className="whitespace-nowrap text-[var(--color-text-primary)]">
          Sentinel scene · {satelliteSceneDay ? formatExplorerDate(satelliteSceneDay) : '—'}
        </p>
        {satelliteSceneUnavailable ? (
          <p className="text-[var(--color-text-primary)]">{SATELLITE_SCENE_UNAVAILABLE}</p>
        ) : null}
      </div>
    )
  }

  return (
    <div
      className="map-chrome-panel pointer-events-auto px-2.5 py-1.5 text-xs leading-snug text-[var(--color-text-secondary)]"
      aria-label="Observation context"
    >
      <p className="whitespace-nowrap text-[var(--color-text-primary)]">
        Latest scene · {latestSceneDate ? formatExplorerDate(latestSceneDate) : '—'}
        {sceneQuality ? ` · ${sceneQuality}` : ''}
      </p>
      <p className="whitespace-nowrap text-[var(--color-text-primary)]">
        Latest valid · {latestValidDate ? formatExplorerDate(latestValidDate) : '—'}
      </p>
    </div>
  )
}

/** Compact scene context. The date selector lives above the map, not here. */
export function LakeMapDateStack({
  lakeId = 'lake',
  dateSelection = null,
  latestSceneDate,
  latestSceneQuality,
  latestSceneCloud: _latestSceneCloud,
  latestValidDate,
  satelliteSceneUnavailable = false,
}: {
  lakeId?: string
  dateSelection?: ObservationDateSelection | null
  latestSceneDate: string | null
  latestSceneQuality: string | null
  latestSceneCloud: number | null
  latestValidDate: string | null
  satelliteSceneUnavailable?: boolean
}) {
  const selected = dateSelection
    ? selectObservation(dateSelection.observations, dateSelection.selectedObservationId)
    : null
  const selectedDate = selected?.date ?? null
  const satelliteSceneDay = selected ? observationSceneDay(selected) : null

  return (
    <div key={lakeId} className="motion-context ml-auto flex max-w-[min(16rem,46%)] justify-end">
      <div
        key={dateSelection?.selectedObservationId ?? 'latest'}
        className="motion-date pointer-events-auto flex flex-col items-end gap-1"
      >
      <MapDateContext
        latestSceneDate={latestSceneDate}
        latestSceneQuality={latestSceneQuality}
        latestValidDate={latestValidDate}
        selectedObservationDate={selectedDate}
        satelliteSceneDay={satelliteSceneDay}
        satelliteSceneUnavailable={satelliteSceneUnavailable}
      />
      </div>
    </div>
  )
}

function nonValidQuality(quality: string | null): string | null {
  const label = quality?.trim()
  if (!label || label.toLowerCase() === 'valid') return null
  return label
}
