import type { ReactNode } from 'react'
import type { Coordinates, GeoJsonGeometry, BoundingBox } from '@/domain/shared/geo'
import type { Hotspot } from '@/domain/hotspot/types'
import type { SamplingStation } from '@/domain/hotspot/types'
import type { MapLayerId } from '@/domain/water-quality/types'

/**
 * Map provider abstraction.
 * Presentational UI depends on these contracts — not on ArcGIS or MapLibre.
 * A future ArcGIS Maps SDK or MapLibre/deck.gl adapter can implement the same surface.
 */

export interface MapViewportState {
  center: Coordinates
  zoom: number
  bounds?: BoundingBox
}

export interface WaterBodyLayerProps {
  geometry?: GeoJsonGeometry
  selected?: boolean
}

export interface RasterLayerProps {
  layerId: MapLayerId
  rasterUrl?: string
  rasterBounds?: BoundingBox
  opacity?: number
}

export interface HotspotLayerProps {
  hotspots: Hotspot[]
  selectedHotspotId: string | null
  onSelectHotspot?: (hotspotId: string) => void
}

export interface SamplingStationLayerProps {
  stations: SamplingStation[]
}

export interface MapProviderProps {
  children: ReactNode
  initialViewport: MapViewportState
  className?: string
}

export interface MapViewportProps {
  children?: ReactNode
  className?: string
  basemapUrl?: string
  basemapMode?: 'map' | 'satellite' | 'terrain'
}
