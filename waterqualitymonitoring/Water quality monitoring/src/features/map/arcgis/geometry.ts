import Extent from '@arcgis/core/geometry/Extent.js'
import Polygon from '@arcgis/core/geometry/Polygon.js'
import type { BoundingBox, GeoJsonGeometry } from '@/domain/shared/geo'

/** Build a WGS84 extent from adapter map bounds. */
export function extentFromBounds(bounds: BoundingBox): Extent {
  return new Extent({
    xmin: bounds.west,
    ymin: bounds.south,
    xmax: bounds.east,
    ymax: bounds.north,
    spatialReference: { wkid: 4326 },
  })
}

/**
 * Convert domain GeoJSON (from FeatureServer rings) to an ArcGIS Polygon.
 * Coordinates are [lng, lat] WGS84.
 */
export function polygonFromGeoJson(geometry: GeoJsonGeometry): Polygon | null {
  if (geometry.type === 'Polygon') {
    const rings = geometry.coordinates as number[][][]
    if (!rings.length) return null
    return new Polygon({
      rings,
      spatialReference: { wkid: 4326 },
    })
  }

  if (geometry.type === 'MultiPolygon') {
    const polys = geometry.coordinates as number[][][][]
    const rings = polys.flatMap((poly) => poly)
    if (!rings.length) return null
    return new Polygon({
      rings,
      spatialReference: { wkid: 4326 },
    })
  }

  return null
}

export function extentFromGeometryOrBounds(
  geometry: GeoJsonGeometry | undefined,
  bounds: BoundingBox,
): Extent {
  if (geometry) {
    const polygon = polygonFromGeoJson(geometry)
    if (polygon) {
      const ext = polygon.extent
      if (ext && ext.width > 0 && ext.height > 0) {
        return ext
      }
    }
  }
  return extentFromBounds(bounds)
}
