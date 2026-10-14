import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { QUERY_STALE_TIME_MS } from '@/data/arcgis/config'
import { dataProvider } from '@/data/provider'
import { useArcGisQueryEnabled } from '@/features/auth/hooks/use-arcgis-query-enabled'

export function useWaterBodies() {
  const enabled = useArcGisQueryEnabled()

  return useQuery({
    queryKey: ['water-bodies'],
    queryFn: () => dataProvider.waterBodies.getAll(),
    staleTime: QUERY_STALE_TIME_MS,
    enabled,
  })
}

export function useWaterBody(routeKey: string | undefined) {
  const enabled = useArcGisQueryEnabled(Boolean(routeKey))

  return useQuery({
    queryKey: ['water-body', routeKey],
    queryFn: () => {
      if (!routeKey) return null
      return dataProvider.waterBodies.getByRouteKey(routeKey)
    },
    enabled,
    staleTime: QUERY_STALE_TIME_MS,
    placeholderData: keepPreviousData,
  })
}
