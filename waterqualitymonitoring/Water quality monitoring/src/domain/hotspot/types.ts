import type { Coordinates } from '@/domain/shared/geo'
import type { TrendDirection, WaterQualityParameter } from '@/domain/water-quality/types'

export type HotspotConfidence = 'low' | 'medium' | 'high'

export interface Hotspot {
  id: string
  waterBodyId: string
  observationId: string
  label: string
  parameter: WaterQualityParameter
  location: Coordinates
  value: number
  unit: string
  areaKm2: number
  trend: TrendDirection
  durationDays: number
  confidence: HotspotConfidence
}

export interface SamplingStation {
  id: string
  waterBodyId: string
  name: string
  coordinates: Coordinates
  latestMeasurement?: {
    parameter: WaterQualityParameter
    value: number
    unit: string
    sampledAt: string
  }
}
