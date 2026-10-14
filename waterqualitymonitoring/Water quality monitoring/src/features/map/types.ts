import type { MapLayerId } from '@/domain/water-quality/types'
import type { RasterRecord } from '@/domain/raster/types'
import type { ObservationDateSelection } from '@/features/observations/observation-explorer'

/** Primary lake investigation map modes (production Web Map). */
export type WaterMapMode = 'satellite' | 'turbidity' | 'chlorophyll'

/** Future modes — resolver-ready, not exposed in UI yet. */
export type WaterMapExtendedMode =
  | WaterMapMode
  | 'turbidity-relative'
  | 'turbidity-absolute'
  | 'chlorophyll-relative'
  | 'chlorophyll-absolute'

export type MapLoadPhase =
  | 'initializing'
  | 'loading_webmap'
  | 'loading_raster'
  | 'ready'
  | 'error'

export type MapErrorCode =
  | 'AUTH_REQUIRED'
  | 'WEBMAP_UNAVAILABLE'
  | 'IMAGESERVER_UNAVAILABLE'
  | 'RASTER_ACCESS_DENIED'
  | 'RASTER_REGISTRY_MISMATCH'
  | 'LAKE_GEOMETRY_UNAVAILABLE'
  | 'MAP_INITIALIZATION_FAILED'
  | 'BROKEN_OPTIONAL_LAYER'

export interface MapErrorState {
  code: MapErrorCode
  message: string
  /** Optional layers may warn without blocking the map. */
  fatal: boolean
}

export interface MapLegendStop {
  color: string
  label: string
}

export interface MapLegendModel {
  title: string
  subtitle: string | null
  /** Interpretation: absolute vs per-lake normalized. */
  normalization: 'absolute' | 'per-lake' | 'none'
  stops: MapLegendStop[]
  /** Source of colors/labels for provenance. */
  source: 'webmap-rendering-rule' | 'none'
}

export interface ActiveRasterMeta {
  title: string | null
  label: string | null
  acquisitionDay: string | null
  cellSizeMeters: number | null
  itemId: string | null
  url: string
  reconciled: boolean
}

export interface ArcGISLakeMapProps {
  lakeId: string
  lakeName: string
  province: string
  country: string
  /** Selected lake geometry (GeoJSON from adapter). */
  geometry?: import('@/domain/shared/geo').GeoJsonGeometry
  bounds: import('@/domain/shared/geo').BoundingBox
  center: import('@/domain/shared/geo').Coordinates
  /** App layer id from sidebar / mobile chips. */
  layer: MapLayerId
  onLayerChange?: (layer: MapLayerId) => void
  /** Newest observation row, including cloudy or hazy scenes. Not the lake-condition source. */
  latestSceneDate: string | null
  latestSceneQuality: string | null
  latestSceneCloud: number | null
  /** Newest observation whose quality label is Valid. */
  latestValidDate: string | null
  /** Loaded-observation date selector. Does not switch the raster. */
  dateSelection?: ObservationDateSelection | null
  activeRaster: RasterRecord | null
  rasterLoading: boolean
  rasterError: Error | null
}

export type ProductionLayerKey =
  | 'chlorophyllFixed'
  | 'turbidityFixed'
  | 'sentinelNatural'
  | 'districts'
  | 'provinces'
  | 'sectors'
  | 'chlorophyllPerLake'
  | 'turbidityPerLake'
  | 'waterBodies'
