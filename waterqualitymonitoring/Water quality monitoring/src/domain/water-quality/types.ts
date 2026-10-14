export type WaterQualityStatus =
  | 'good'
  | 'moderate'
  | 'poor'
  | 'critical'
  | 'unknown'

export type TrendDirection = 'improving' | 'stable' | 'deteriorating' | 'unknown'

export type BloomRisk = 'low' | 'moderate' | 'elevated' | 'high'

export type WaterQualityParameter =
  | 'turbidity'
  | 'ndci'
  | 'floating_vegetation'
  | 'bloom_risk'
  | 'true_colour'

export type MapLayerId =
  | 'true_colour'
  | 'turbidity'
  | 'ndci'
  | 'floating_vegetation'
  | 'bloom_risk'

export interface WaterQualityMetric {
  parameter: WaterQualityParameter
  label: string
  value: number | string
  unit: string
  status: WaterQualityStatus
  changePercent: number | null
  changeLabel: string
  baselineLabel: string
  sparkline: number[]
}

export interface WaterQualityThreshold {
  parameter: WaterQualityParameter
  value: number
  label: string
}
