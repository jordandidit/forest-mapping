import type { MapLayerId } from '@/domain/water-quality/types'
import type { WaterMapMode } from '@/features/map/types'

/** Map app layer ids to production investigation modes. */
export function mapLayerIdToWaterMapMode(layer: MapLayerId): WaterMapMode | null {
  switch (layer) {
    case 'true_colour':
      return 'satellite'
    case 'turbidity':
      return 'turbidity'
    case 'ndci':
      return 'chlorophyll'
    default:
      return null
  }
}

export function waterMapModeToMapLayerId(mode: WaterMapMode): MapLayerId {
  switch (mode) {
    case 'satellite':
      return 'true_colour'
    case 'turbidity':
      return 'turbidity'
    case 'chlorophyll':
      return 'ndci'
  }
}

export function isSupportedWaterMapLayer(layer: MapLayerId): boolean {
  return mapLayerIdToWaterMapMode(layer) !== null
}

export const WATER_MAP_MODE_OPTIONS: {
  mode: WaterMapMode
  layerId: MapLayerId
  /** Compact label for the map mode switch. */
  label: string
  /** Sentence-case name and explanation, shown as the mode switch tooltip. */
  name: string
  description: string
}[] = [
  {
    mode: 'satellite',
    layerId: 'true_colour',
    label: 'Satellite',
    name: 'Satellite',
    description: 'Sentinel-2 natural-colour imagery of the lake.',
  },
  {
    mode: 'turbidity',
    layerId: 'turbidity',
    label: 'Turbidity',
    name: 'Turbidity · Per lake',
    description: "Classes scaled to this lake's own range, to show where water is clearer or muddier.",
  },
  {
    mode: 'chlorophyll',
    layerId: 'ndci',
    label: 'Chlorophyll',
    name: 'Chlorophyll · Per lake',
    description: "Classes scaled to this lake's own range, to show where algae is lower or higher.",
  },
]
