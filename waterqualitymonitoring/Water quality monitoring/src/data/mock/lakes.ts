import type { WaterBody } from '@/domain/water-body/types'

export const LAKE_MUHAZI_ID = 'lake-muhazi'
export const LAKE_KIVU_ID = 'lake-kivu'
/** Lake the app opens on when no lake is in the URL. */
export const DEFAULT_LAKE_ID = LAKE_KIVU_ID

export const lakes: WaterBody[] = [
  {
    id: LAKE_MUHAZI_ID,
    wbId: 'muhazi',
    name: 'Lake Muhazi',
    type: 'lake',
    province: 'Eastern Province',
    district: 'Rwamagana / Kayonza',
    country: 'Rwanda',
    surfaceAreaKm2: 34.2,
    status: 'moderate',
    statusLabel: 'Fair',
    trend: 'deteriorating',
    lastObservationAt: '2026-10-03T10:17:00Z',
    summary:
      'Satellite observations indicate increasing chlorophyll concentrations along the eastern shoreline. Turbidity remains within the lake\'s normal seasonal range, but algal bloom risk has increased during the past 30 days.',
    map: {
      bounds: { west: 30.32, south: -1.95, east: 30.52, north: -1.78 },
      center: { latitude: -1.86, longitude: 30.42 },
      defaultZoom: 12,
    },
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [30.35, -1.82],
          [30.48, -1.8],
          [30.5, -1.88],
          [30.42, -1.93],
          [30.34, -1.9],
          [30.35, -1.82],
        ],
      ],
    },
  },
  {
    id: LAKE_KIVU_ID,
    wbId: 'kivu',
    name: 'Lake Kivu',
    type: 'lake',
    province: 'Western Province',
    district: 'Rubavu / Karongi',
    country: 'Rwanda',
    surfaceAreaKm2: 2700,
    status: 'good',
    trend: 'stable',
    lastObservationAt: '2026-10-02T09:44:00Z',
    map: {
      bounds: { west: 28.75, south: -2.55, east: 29.4, north: -1.55 },
      center: { latitude: -2.05, longitude: 29.1 },
      defaultZoom: 9,
    },
  },
  {
    id: 'lake-ihema',
    wbId: 'ihema',
    name: 'Lake Ihema',
    type: 'lake',
    province: 'Eastern Province',
    district: 'Kayonza',
    country: 'Rwanda',
    surfaceAreaKm2: 90,
    status: 'moderate',
    trend: 'stable',
    lastObservationAt: '2026-10-01T10:05:00Z',
    map: {
      bounds: { west: 30.7, south: -1.95, east: 30.95, north: -1.75 },
      center: { latitude: -1.85, longitude: 30.82 },
      defaultZoom: 11,
    },
  },
  {
    id: 'lake-burera',
    wbId: 'burera',
    name: 'Lake Burera',
    type: 'lake',
    province: 'Northern Province',
    district: 'Burera',
    country: 'Rwanda',
    surfaceAreaKm2: 55,
    status: 'good',
    trend: 'improving',
    lastObservationAt: '2026-09-30T10:22:00Z',
    map: {
      bounds: { west: 29.75, south: -1.5, east: 29.95, north: -1.35 },
      center: { latitude: -1.42, longitude: 29.85 },
      defaultZoom: 12,
    },
  },
  {
    id: 'lake-ruhondo',
    wbId: 'ruhondo',
    name: 'Lake Ruhondo',
    type: 'lake',
    province: 'Northern Province',
    district: 'Musanze',
    country: 'Rwanda',
    surfaceAreaKm2: 28,
    status: 'good',
    trend: 'stable',
    lastObservationAt: '2026-09-29T09:58:00Z',
    map: {
      bounds: { west: 29.7, south: -1.55, east: 29.85, north: -1.42 },
      center: { latitude: -1.48, longitude: 29.78 },
      defaultZoom: 12,
    },
  },
]

export const TOTAL_MONITORED_LAKES = 39

export function getLakeById(id: string): WaterBody | undefined {
  return lakes.find((lake) => lake.id === id)
}

export function getSidebarLakes(): WaterBody[] {
  return lakes
}
