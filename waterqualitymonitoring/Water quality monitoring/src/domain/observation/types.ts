import type { BloomRisk } from '@/domain/water-quality/types'

export type ObservationQuality = 'excellent' | 'good' | 'fair' | 'poor' | 'unusable'

export type ObservationUsability = 'usable' | 'cloudy' | 'partial' | 'unavailable'

export type SatelliteMission = 'Sentinel-2' | 'Landsat-8' | 'Landsat-9'

export interface WaterQualityObservation {
  id: string
  waterBodyId: string
  /** Stable production water-body id when available. */
  wbId?: string
  date: string
  /**
   * Pipeline `acq_day` when the observation stores one.
   * Scene selection prefers this over `date` (`obs_date`).
   */
  acquisitionDay?: string | null
  /** Sentinel tile names for this observation (`tilename`), not image object IDs. */
  tiles?: string[]
  acquiredAt: string
  satellite: SatelliteMission
  cloudCover: number | null
  usablePixelPercentage: number | null
  coveragePercentage?: number | null
  /** Normalized quality used by the UI. */
  quality: ObservationQuality
  /** Original production quality label (e.g. Valid, Cloudy). */
  qualityLabel?: string | null
  turbidity: number | null
  /** Pipeline `turbidity_level` when the observation stores one. */
  turbidityLevel?: string | null
  ndci: number | null
  chlorophyll?: number | null
  /** Pipeline `chlorophyll_level` when the observation stores one. */
  chlorophyllLevel?: string | null
  floatingVegetation: number | null
  bloomRisk: BloomRisk | null
  /** Pipeline FAI when the observation query already returns it. */
  fai?: number | null
  meaning?: string | null
}

export interface ObservationAvailabilityItem {
  id: string
  waterBodyId: string
  date: string
  usability: ObservationUsability
  /** Display label from production quality when available. */
  qualityLabel: string
  usablePixelPercentage: number | null
  coveragePercentage?: number | null
  tileCloudPercentage?: number | null
}

export interface TimeSeriesPoint {
  date: string
  /** Null preserves chart gaps; never coerce missing values to 0. */
  value: number | null
  quality: ObservationQuality
  /** Observation row this point came from. Absent on synthetic series. */
  observationId?: string
  /** Pipeline quality label when the observation stored one. */
  qualityLabel?: string | null
  /**
   * Pipeline class for this metric (`turbidity_level` or `chlorophyll_level`).
   * Copied from the observation. Not derived from the numeric value.
   */
  classification?: string | null
}

export interface TimeSeriesEventAnnotation {
  date: string
  label: string
}

export type TimeRangeId = '1M' | '3M' | '1Y' | '3Y' | '5Y'

export interface ParameterTimeSeries {
  waterBodyId: string
  parameter: 'turbidity' | 'ndci' | 'floating_vegetation' | 'chlorophyll'
  points: TimeSeriesPoint[]
  annotations: TimeSeriesEventAnnotation[]
  threshold?: {
    value: number
    label: string
  }
}
