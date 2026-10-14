import type { ParameterTimeSeries } from '@/domain/observation/types'
import { LAKE_MUHAZI_ID } from '@/data/mock/lakes'

function buildYearlySeries(
  seed: number,
  amplitude: number,
  baseline: number,
): { date: string; value: number | null; quality: 'excellent' | 'good' | 'fair' }[] {
  const points: { date: string; value: number | null; quality: 'excellent' | 'good' | 'fair' }[] = []
  const start = new Date('2025-10-05T00:00:00Z')

  for (let i = 0; i < 52; i += 1) {
    const date = new Date(start)
    date.setUTCDate(start.getUTCDate() + i * 7)
    const seasonal = Math.sin((i / 52) * Math.PI * 2 + seed) * amplitude
    const noise = ((i * 17 + seed * 13) % 10) / 100
    const value = Number((baseline + seasonal + noise).toFixed(3))
    points.push({
      date: date.toISOString().slice(0, 10),
      value: i % 11 === 0 ? null : value,
      quality: i % 9 === 0 ? 'fair' : i % 4 === 0 ? 'good' : 'excellent',
    })
  }

  return points
}

export const muhaziNdciSeries: ParameterTimeSeries = {
  waterBodyId: LAKE_MUHAZI_ID,
  parameter: 'ndci',
  points: buildYearlySeries(1.2, 0.035, 0.075),
  annotations: [
    { date: '2026-03-03', label: 'Heavy rainfall' },
    { date: '2026-05-14', label: 'Bloom detected' },
  ],
  threshold: {
    value: 0.15,
    label: 'NDCI screening threshold',
  },
}

export const muhaziTurbiditySeries: ParameterTimeSeries = {
  waterBodyId: LAKE_MUHAZI_ID,
  parameter: 'turbidity',
  points: buildYearlySeries(0.4, 1.4, 5.1).map((point) => ({
    ...point,
    value: point.value === null ? null : Number(point.value.toFixed(1)),
  })),
  annotations: [{ date: '2026-03-03', label: 'Heavy rainfall' }],
}

export const muhaziFloatingVegetationSeries: ParameterTimeSeries = {
  waterBodyId: LAKE_MUHAZI_ID,
  parameter: 'floating_vegetation',
  points: buildYearlySeries(2.1, 0.8, 4.2).map((point) => ({
    ...point,
    value: point.value === null ? null : Number(point.value.toFixed(1)),
  })),
  annotations: [],
}

const seriesByLakeAndParameter: Record<string, ParameterTimeSeries> = {
  [`${LAKE_MUHAZI_ID}:ndci`]: muhaziNdciSeries,
  [`${LAKE_MUHAZI_ID}:turbidity`]: muhaziTurbiditySeries,
  [`${LAKE_MUHAZI_ID}:floating_vegetation`]: muhaziFloatingVegetationSeries,
}

export function getParameterTimeSeries(
  waterBodyId: string,
  parameter: 'turbidity' | 'ndci' | 'floating_vegetation',
): ParameterTimeSeries | undefined {
  return seriesByLakeAndParameter[`${waterBodyId}:${parameter}`]
}
