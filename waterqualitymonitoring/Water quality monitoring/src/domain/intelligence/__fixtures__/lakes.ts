import type { WaterBody } from '@/domain/water-body/types'
import type { WaterQualityObservation } from '@/domain/observation/types'
import type { BloomRisk, TrendDirection, WaterQualityStatus } from '@/domain/water-quality/types'

type MetricOverrides = Partial<NonNullable<WaterBody['metrics']>>
type BaselineOverrides = Partial<NonNullable<WaterBody['baseline']>>
type TrendOverrides = Partial<NonNullable<WaterBody['trends']>>
type PreviousOverrides = Partial<NonNullable<WaterBody['previousObservation']>>

export function makeWaterBody(overrides: Partial<WaterBody> & {
  metrics?: MetricOverrides | null
  baseline?: BaselineOverrides | null
  trends?: TrendOverrides | null
  previousObservation?: PreviousOverrides | null
} = {}): WaterBody {
  const {
    metrics: metricsOverride,
    baseline: baselineOverride,
    trends: trendsOverride,
    previousObservation: previousOverride,
    ...rest
  } = overrides

  return {
    id: 'lake-fixture',
    wbId: 'fixture',
    name: 'Lake Fixture',
    type: 'lake',
    province: 'Eastern Province',
    district: 'Test',
    country: 'Rwanda',
    surfaceAreaKm2: 10,
    status: 'moderate',
    statusLabel: 'Fair',
    trend: 'stable',
    lastObservationAt: '2026-09-03T10:00:00Z',
    daysSinceObservation: 5,
    observationCount14Month: 9,
    map: {
      bounds: { west: 30, south: -2, east: 31, north: -1 },
      center: { latitude: -1.5, longitude: 30.5 },
      defaultZoom: 12,
    },
    metrics:
      metricsOverride === null
        ? undefined
        : {
            turbidity: 1.7,
            turbidityLevel: 'Low',
            ndci: 0.052,
            chlorophyll: 4.2,
            chlorophyllLevel: 'Moderate',
            bloomRisk: 'low',
            floatingVegetationPct: 2.0,
            floatingVegetationFlag: false,
            waterPct: 98,
            clearPct: 71,
            ...metricsOverride,
          },
    baseline:
      baselineOverride === null
        ? undefined
        : {
            turbidity14MonthMean: 3.0,
            ndci14MonthMean: 0.056,
            turbidityPercentileRank: null,
            ndciPercentileRank: null,
            ...baselineOverride,
          },
    trends:
      trendsOverride === null
        ? undefined
        : {
            turbidityTrend: 'stable',
            turbiditySlopePerYear: 0.1,
            chlorophyllTrend: 'stable',
            ndciSlopePerYear: 0.0,
            turbidityTrendP: null,
            chlorophyllTrendP: null,
            ...trendsOverride,
          },
    previousObservation:
      previousOverride === null
        ? undefined
        : {
            observedAt: '2026-08-20',
            turbidity: 2.1,
            ndci: 0.055,
            ...previousOverride,
          },
    ...rest,
  }
}

export function makeObservation(
  overrides: Partial<WaterQualityObservation> = {},
): WaterQualityObservation {
  return {
    id: 'obs-1',
    waterBodyId: 'lake-fixture',
    date: '2026-09-03',
    acquiredAt: '2026-09-03T10:00:00Z',
    satellite: 'Sentinel-2',
    cloudCover: 12,
    usablePixelPercentage: 71,
    coveragePercentage: 96,
    quality: 'excellent',
    qualityLabel: 'Valid',
    turbidity: 1.7,
    ndci: 0.052,
    chlorophyll: 4.2,
    floatingVegetation: 2.0,
    bloomRisk: 'low',
    ...overrides,
  }
}

export type { BloomRisk, TrendDirection, WaterQualityStatus }
