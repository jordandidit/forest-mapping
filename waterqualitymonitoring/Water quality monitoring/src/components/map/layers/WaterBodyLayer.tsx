import type { WaterBodyLayerProps } from '@/components/map/types'

/**
 * Vector boundary overlay placeholder.
 * Basemap SVG already includes shoreline; this keeps the layer contract for ArcGIS/MapLibre.
 */
export function WaterBodyLayer({ selected = true }: WaterBodyLayerProps) {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
      data-layer="water-body"
      data-selected={selected}
    />
  )
}
