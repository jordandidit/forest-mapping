import { useQuery } from '@tanstack/react-query'
import { QUERY_STALE_TIME_MS } from '@/data/arcgis/config'
import { dataProvider } from '@/data/provider'
import { useArcGisQueryEnabled } from '@/features/auth/hooks/use-arcgis-query-enabled'
import type { ParameterTimeSeries } from '@/domain/observation/types'
import type { WaterBody } from '@/domain/water-body/types'

export function useObservations(waterBody: WaterBody | null | undefined) {
  const enabled = useArcGisQueryEnabled(Boolean(waterBody))

  return useQuery({
    queryKey: ['observations', waterBody?.wbId ?? waterBody?.id],
    queryFn: () => {
      if (!waterBody) return []
      return dataProvider.observations.getForWaterBody(waterBody)
    },
    enabled,
    staleTime: QUERY_STALE_TIME_MS,
  })
}

export function useLatestObservation(waterBody: WaterBody | null | undefined) {
  const enabled = useArcGisQueryEnabled(Boolean(waterBody))

  return useQuery({
    queryKey: ['observations', 'latest', waterBody?.wbId ?? waterBody?.id],
    queryFn: () => {
      if (!waterBody) return null
      return dataProvider.observations.getLatest(waterBody)
    },
    enabled,
    staleTime: QUERY_STALE_TIME_MS,
  })
}

export function useLakeMetrics(waterBody: WaterBody | null | undefined) {
  const enabled = useArcGisQueryEnabled(Boolean(waterBody))

  return useQuery({
    queryKey: ['metrics', waterBody?.wbId ?? waterBody?.id],
    queryFn: () => {
      if (!waterBody) return []
      return dataProvider.observations.getMetrics(waterBody)
    },
    enabled,
    staleTime: QUERY_STALE_TIME_MS,
  })
}

export function useParameterTimeSeries(
  waterBody: WaterBody | null | undefined,
  parameter: ParameterTimeSeries['parameter'],
) {
  const enabled = useArcGisQueryEnabled(Boolean(waterBody))

  return useQuery({
    queryKey: ['observations', 'timeseries', waterBody?.wbId ?? waterBody?.id, parameter],
    queryFn: () => {
      if (!waterBody) return undefined
      return dataProvider.observations.getTimeSeries(waterBody, parameter)
    },
    enabled,
    staleTime: QUERY_STALE_TIME_MS,
  })
}

export function useObservationAvailability(waterBody: WaterBody | null | undefined) {
  const enabled = useArcGisQueryEnabled(Boolean(waterBody))

  return useQuery({
    queryKey: ['observations', 'availability', waterBody?.wbId ?? waterBody?.id],
    queryFn: () => {
      if (!waterBody) return []
      return dataProvider.observations.getAvailability(waterBody)
    },
    enabled,
    staleTime: QUERY_STALE_TIME_MS,
  })
}
