import type { MapLayerId } from '@/domain/water-quality/types'
import type { WaterQualityObservation } from '@/domain/observation/types'

export const HISTORICAL_RASTER_UNAVAILABLE = 'Historical spatial overlay unavailable'

export const HISTORICAL_OVERLAY_NOTE =
  'Historical water-quality spatial overlays are unavailable.'

export const SATELLITE_SCENE_UNAVAILABLE =
  'Satellite scene unavailable for this observation.'

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/
const TILE_NAME = /^[A-Za-z0-9_-]+$/

export interface SentinelSceneTarget {
  acquisitionDay?: string | null
  date: string
  tiles?: readonly string[] | null
}

export interface SentinelMosaicSpec {
  where: string
  sortField: 'acquisitiondate'
  sortValue: string
  ascending: true
  method: 'attribute'
  operation: 'first'
}

export type SentinelMosaicChoice =
  | { status: 'production'; where: string }
  | { status: 'scene'; spec: SentinelMosaicSpec }
  | { status: 'unavailable' }

/** Null selection is Latest. A selected observation is historical mode. */
export function isHistoricalObservation(
  selected: WaterQualityObservation | null | undefined,
): boolean {
  return selected != null
}

/**
 * Acquisition day for the Sentinel mosaic.
 * `acq_day` is the scene day. `date` (`obs_date`) is only the fallback.
 */
export function observationSceneDay(observation: SentinelSceneTarget): string | null {
  const acquisitionDay = observation.acquisitionDay?.slice(0, 10)
  if (acquisitionDay && ISO_DAY.test(acquisitionDay)) return acquisitionDay
  if (ISO_DAY.test(observation.date)) return observation.date
  return null
}

/**
 * Latest keeps the production mosaic where-clause unchanged.
 * Historical mode selects the observation's acquisition day.
 * Tile names narrow the catalog when the observation stored them.
 * The production cloud ceiling is not copied: a Cloudy observation must
 * still be able to draw the scene that produced it.
 */
export function resolveSentinelMosaic(
  productionWhere: string | null | undefined,
  observation: SentinelSceneTarget | null,
): SentinelMosaicChoice {
  if (!observation) {
    return { status: 'production', where: productionWhere ?? '' }
  }

  const spec = historicalSentinelMosaic(observation)
  if (!spec) return { status: 'unavailable' }
  return { status: 'scene', spec }
}

export function historicalSentinelMosaic(
  observation: SentinelSceneTarget,
): SentinelMosaicSpec | null {
  const day = observationSceneDay(observation)
  if (!day) return null

  const next = nextUtcDay(day)
  const tiles = safeTileNames(observation.tiles)
  const tileClause = tiles.length
    ? ` AND tilename IN (${tiles.map((tile) => `'${tile}'`).join(',')})`
    : ''

  return {
    method: 'attribute',
    operation: 'first',
    sortField: 'acquisitiondate',
    sortValue: day.replaceAll('-', '/'),
    ascending: true,
    where:
      `category = 1 AND acquisitiondate >= timestamp '${day} 00:00:00' ` +
      `AND acquisitiondate < timestamp '${next} 00:00:00'` +
      tileClause,
  }
}

/** Mosaic that participates in no rasters, so Latest imagery cannot remain visible. */
export function unavailableSentinelMosaic(day: string | null): SentinelMosaicSpec {
  const sortValue = day && ISO_DAY.test(day) ? day.replaceAll('-', '/') : '1900/01/01'
  return {
    method: 'attribute',
    operation: 'first',
    sortField: 'acquisitiondate',
    sortValue,
    ascending: true,
    where: '1 = 0',
  }
}

export function rasterModeAvailability(
  historical: boolean,
  mode: 'satellite' | 'turbidity' | 'chlorophyll',
): { enabled: true } | { enabled: false; reason: string } {
  if (!historical || mode === 'satellite') return { enabled: true }
  return { enabled: false, reason: HISTORICAL_RASTER_UNAVAILABLE }
}

/** While a historical observation is selected the map stays on Satellite. */
export function mapLayerWhileViewing(
  historical: boolean,
  layer: MapLayerId,
): MapLayerId {
  return historical ? 'true_colour' : layer
}

/** Layer to put back when the user returns to Latest. */
export function layerToRestore(saved: MapLayerId | null | undefined): MapLayerId {
  return saved ?? 'true_colour'
}

function safeTileNames(tiles: readonly string[] | null | undefined): string[] {
  if (!tiles?.length) return []
  const seen = new Set<string>()
  for (const tile of tiles) {
    const name = tile.trim()
    if (TILE_NAME.test(name)) seen.add(name)
  }
  return [...seen]
}

function nextUtcDay(day: string): string {
  const [year, month, date] = day.split('-').map(Number)
  const utc = new Date(Date.UTC(year!, (month ?? 1) - 1, date ?? 1))
  utc.setUTCDate(utc.getUTCDate() + 1)
  return utc.toISOString().slice(0, 10)
}
