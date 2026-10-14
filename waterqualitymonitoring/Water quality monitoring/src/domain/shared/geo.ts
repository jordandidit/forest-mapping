/** Geographic primitives shared across domain entities. */

export interface Coordinates {
  latitude: number
  longitude: number
}

export interface BoundingBox {
  west: number
  south: number
  east: number
  north: number
}

/** GeoJSON-compatible geometry placeholders for future ArcGIS / MapLibre wiring. */
export type GeometryType = 'Polygon' | 'MultiPolygon' | 'Point'

export interface GeoJsonGeometry {
  type: GeometryType
  coordinates: number[] | number[][] | number[][][] | number[][][][]
}

export interface MapBounds {
  bounds: BoundingBox
  center: Coordinates
  defaultZoom: number
}
