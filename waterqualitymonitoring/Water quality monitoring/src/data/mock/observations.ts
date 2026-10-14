import type { WaterQualityObservation } from '@/domain/observation/types'
import type { WaterQualityMetric } from '@/domain/water-quality/types'
import { LAKE_MUHAZI_ID } from '@/data/mock/lakes'

export const muhaziLatestObservation: WaterQualityObservation = {
  id: 'obs-muhazi-2026-10-03',
  waterBodyId: LAKE_MUHAZI_ID,
  date: '2026-10-03',
  acquiredAt: '2026-10-03T10:17:00Z',
  satellite: 'Sentinel-2',
  cloudCover: 4.2,
  usablePixelPercentage: 94,
  quality: 'excellent',
  qualityLabel: 'Valid',
  turbidity: 5.8,
  ndci: 0.091,
  floatingVegetation: 3.7,
  bloomRisk: 'elevated',
}

export const muhaziMetrics: WaterQualityMetric[] = [
  {
    parameter: 'turbidity',
    label: 'Turbidity',
    value: 5.8,
    unit: 'FNU',
    status: 'moderate',
    changePercent: 12,
    changeLabel: '↑ 12%',
    baselineLabel: 'vs. 30-day avg.',
    sparkline: [4.9, 5.1, 5.0, 5.3, 5.2, 5.5, 5.4, 5.6, 5.7, 5.8],
  },
  {
    parameter: 'ndci',
    label: 'Chlorophyll-a (NDCI)',
    value: 0.091,
    unit: '',
    status: 'moderate',
    changePercent: 18,
    changeLabel: '↑ 18%',
    baselineLabel: 'vs. 30-day avg.',
    sparkline: [0.068, 0.071, 0.074, 0.078, 0.08, 0.083, 0.086, 0.088, 0.09, 0.091],
  },
  {
    parameter: 'bloom_risk',
    label: 'Bloom Risk',
    value: 'Elevated',
    unit: '',
    status: 'poor',
    changePercent: null,
    changeLabel: '2 hotspots detected',
    baselineLabel: 'past 14 days',
    sparkline: [0.4, 0.42, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.72, 0.75],
  },
  {
    parameter: 'floating_vegetation',
    label: 'Floating Vegetation',
    value: 3.7,
    unit: '%',
    status: 'good',
    changePercent: -0.8,
    changeLabel: '↓ 0.8%',
    baselineLabel: 'vs. 30-day avg.',
    sparkline: [4.6, 4.5, 4.4, 4.3, 4.2, 4.1, 4.0, 3.9, 3.8, 3.7],
  },
]

const muhaziHistory: WaterQualityObservation[] = [
  muhaziLatestObservation,
  {
    id: 'obs-muhazi-2026-09-28',
    waterBodyId: LAKE_MUHAZI_ID,
    date: '2026-09-28',
    acquiredAt: '2026-09-28T10:05:00Z',
    satellite: 'Sentinel-2',
    cloudCover: 6,
    usablePixelPercentage: 89,
    quality: 'excellent',
    qualityLabel: 'Valid',
    turbidity: 4.1,
    ndci: 0.08,
    floatingVegetation: 3.2,
    bloomRisk: 'low',
  },
  {
    id: 'obs-muhazi-2026-09-23',
    waterBodyId: LAKE_MUHAZI_ID,
    date: '2026-09-23',
    acquiredAt: '2026-09-23T10:12:00Z',
    satellite: 'Sentinel-2',
    cloudCover: 48,
    usablePixelPercentage: 32,
    quality: 'unusable',
    qualityLabel: 'Cloudy',
    turbidity: null,
    ndci: null,
    floatingVegetation: null,
    bloomRisk: null,
  },
  {
    id: 'obs-muhazi-2026-09-18',
    waterBodyId: LAKE_MUHAZI_ID,
    date: '2026-09-18',
    acquiredAt: '2026-09-18T09:40:00Z',
    satellite: 'Sentinel-2',
    cloudCover: 8,
    usablePixelPercentage: 92,
    quality: 'excellent',
    qualityLabel: 'Valid',
    turbidity: 3.4,
    ndci: 0.061,
    floatingVegetation: 2.8,
    bloomRisk: 'low',
  },
  {
    id: 'obs-muhazi-2026-09-13',
    waterBodyId: LAKE_MUHAZI_ID,
    date: '2026-09-13',
    acquiredAt: '2026-09-13T10:20:00Z',
    satellite: 'Sentinel-2',
    cloudCover: 70,
    usablePixelPercentage: null,
    quality: 'unusable',
    qualityLabel: 'Cloudy',
    turbidity: null,
    ndci: null,
    floatingVegetation: null,
    bloomRisk: null,
  },
  {
    id: 'obs-muhazi-2026-09-08',
    waterBodyId: LAKE_MUHAZI_ID,
    date: '2026-09-08',
    acquiredAt: '2026-09-08T09:55:00Z',
    satellite: 'Sentinel-2',
    cloudCover: 5,
    usablePixelPercentage: 88,
    quality: 'excellent',
    qualityLabel: 'Valid',
    turbidity: 2.2,
    ndci: 0.057,
    floatingVegetation: 2.4,
    bloomRisk: 'low',
  },
  {
    id: 'obs-muhazi-2026-09-03',
    waterBodyId: LAKE_MUHAZI_ID,
    date: '2026-09-03',
    acquiredAt: '2026-09-03T10:00:00Z',
    satellite: 'Sentinel-2',
    cloudCover: 4,
    usablePixelPercentage: 98,
    quality: 'excellent',
    qualityLabel: 'Valid',
    turbidity: 1.7,
    ndci: 0.052,
    floatingVegetation: 2,
    bloomRisk: 'low',
  },
  {
    id: 'obs-muhazi-2026-08-31',
    waterBodyId: LAKE_MUHAZI_ID,
    date: '2026-08-31',
    acquiredAt: '2026-08-31T10:10:00Z',
    satellite: 'Sentinel-2',
    cloudCover: 12,
    usablePixelPercentage: 89,
    quality: 'fair',
    qualityLabel: 'Hazy or glint',
    turbidity: null,
    ndci: null,
    floatingVegetation: null,
    bloomRisk: null,
  },
  {
    id: 'obs-muhazi-2026-08-21',
    waterBodyId: LAKE_MUHAZI_ID,
    date: '2026-08-21',
    acquiredAt: '2026-08-21T09:30:00Z',
    satellite: 'Sentinel-2',
    cloudCover: 9,
    usablePixelPercentage: 91,
    quality: 'excellent',
    qualityLabel: 'Valid',
    turbidity: 2.8,
    ndci: 0.049,
    floatingVegetation: 2.1,
    bloomRisk: 'low',
  },
]

export const observationsByLake: Record<string, WaterQualityObservation[]> = {
  [LAKE_MUHAZI_ID]: muhaziHistory,
}

export function getObservationsForLake(waterBodyId: string): WaterQualityObservation[] {
  return observationsByLake[waterBodyId] ?? []
}

export function getLatestObservation(
  waterBodyId: string,
): WaterQualityObservation | undefined {
  return [...getObservationsForLake(waterBodyId)].sort((a, b) => a.date.localeCompare(b.date)).at(-1)
}

export function getLakeMetrics(waterBodyId: string): WaterQualityMetric[] {
  if (waterBodyId === LAKE_MUHAZI_ID) {
    return muhaziMetrics
  }
  return []
}
