import type { GeoJsonGeometry, MapBounds } from '@/domain/shared/geo'
import type { BloomRisk, TrendDirection, WaterQualityStatus } from '@/domain/water-quality/types'

export type WaterBodyType = 'lake' | 'reservoir' | 'wetland' | 'river_reach'

/** Latest metric snapshot carried on a water body (from WaterBodies layer). */
export interface WaterBodyMetricsSnapshot {
  turbidity: number | null
  turbidityLevel: string | null
  ndci: number | null
  chlorophyll: number | null
  chlorophyllLevel: string | null
  bloomRisk: BloomRisk | null
  floatingVegetationPct: number | null
  floatingVegetationFlag: boolean | null
  waterPct: number | null
  clearPct: number | null
}

export interface WaterBodyBaseline {
  turbidity14MonthMean: number | null
  ndci14MonthMean: number | null
  /**
   * Pipeline `turb_pctrank` — percentile rank (0–100) of current turbidity
   * within this lake's own monthly history. Nullable; never computed in React.
   */
  turbidityPercentileRank?: number | null
  /**
   * Pipeline `ndci_pctrank` — percentile rank (0–100) of current NDCI
   * within this lake's own monthly history. Nullable; never computed in React.
   */
  ndciPercentileRank?: number | null
}

export interface WaterBodyTrendMeta {
  turbidityTrend: TrendDirection
  turbiditySlopePerYear: number | null
  chlorophyllTrend: TrendDirection
  ndciSlopePerYear: number | null
  /**
   * Pipeline `turb_trend_p` — mapped for future evidence only.
   * Do not interpret until trend p-value semantics are confirmed.
   */
  turbidityTrendP?: number | null
  /**
   * Pipeline `chl_trend_p` — mapped for future evidence only.
   * Do not interpret until trend p-value semantics are confirmed.
   */
  chlorophyllTrendP?: number | null
}

export interface WaterBodyPreviousObservation {
  observedAt: string | null
  turbidity: number | null
  ndci: number | null
}

export interface WaterBody {
  /** Application route key, e.g. `lake-muhazi`. */
  id: string
  /** Stable production identifier (`wb_id`) when available. */
  wbId: string
  name: string
  nameLocal?: string | null
  type: WaterBodyType
  province: string
  district: string
  country: string
  geometry?: GeoJsonGeometry
  map: MapBounds
  surfaceAreaKm2: number
  status: WaterQualityStatus
  /** Authoritative production status label (e.g. Good, Fair, Poor, No recent data). */
  statusLabel?: string | null
  statusNote?: string | null
  trend: TrendDirection
  /** Authoritative production turbidity trend label when available (e.g. Increasing). */
  turbidityTrendLabel?: string | null
  /** Authoritative production chlorophyll trend label when available. */
  chlorophyllTrendLabel?: string | null
  lastObservationAt: string
  daysSinceObservation?: number | null
  observationCount14Month?: number | null
  summary?: string
  metrics?: WaterBodyMetricsSnapshot
  baseline?: WaterBodyBaseline
  trends?: WaterBodyTrendMeta
  previousObservation?: WaterBodyPreviousObservation
}
