import type { Hotspot } from '@/domain/hotspot/types'
import { LAKE_MUHAZI_ID } from '@/data/mock/lakes'

export const muhaziHotspots: Hotspot[] = [
  {
    id: 'hotspot-muhazi-01',
    waterBodyId: LAKE_MUHAZI_ID,
    observationId: 'obs-muhazi-2026-10-03',
    label: 'Hotspot 01',
    parameter: 'ndci',
    location: { latitude: -1.845, longitude: 30.465 },
    value: 0.18,
    unit: 'NDCI',
    areaKm2: 1.4,
    trend: 'deteriorating',
    durationDays: 12,
    confidence: 'high',
  },
  {
    id: 'hotspot-muhazi-02',
    waterBodyId: LAKE_MUHAZI_ID,
    observationId: 'obs-muhazi-2026-10-03',
    label: 'Hotspot 02',
    parameter: 'ndci',
    location: { latitude: -1.875, longitude: 30.435 },
    value: 0.14,
    unit: 'NDCI',
    areaKm2: 0.8,
    trend: 'stable',
    durationDays: 8,
    confidence: 'medium',
  },
]

export const hotspotsByLake: Record<string, Hotspot[]> = {
  [LAKE_MUHAZI_ID]: muhaziHotspots,
}

export function getHotspotsForLake(waterBodyId: string): Hotspot[] {
  return hotspotsByLake[waterBodyId] ?? []
}
