import type { RasterLayerProps } from '@/components/map/types'

/**
 * Scientific raster layer contract.
 * Placeholder basemap already encodes NDCI visually; layerId drives legend/UI.
 * Later: bind rasterUrl + rasterBounds to ArcGIS ImageryLayer / MapLibre raster source.
 */
export function RasterLayer({ layerId, opacity = 1 }: RasterLayerProps) {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      aria-hidden="true"
      data-raster-layer={layerId}
      data-raster-url-ready="false"
      style={{ opacity }}
    />
  )
}
