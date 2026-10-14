import { useQuery } from '@tanstack/react-query'
import { QUERY_STALE_TIME_MS } from '@/data/arcgis/config'
import { dataProvider } from '@/data/provider'
import { useArcGisQueryEnabled } from '@/features/auth/hooks/use-arcgis-query-enabled'

export function useScenes(limit = 50) {
  const enabled = useArcGisQueryEnabled()

  return useQuery({
    queryKey: ['scenes', limit],
    queryFn: () => dataProvider.scenes.getRecent(limit),
    staleTime: QUERY_STALE_TIME_MS,
    enabled,
  })
}

export function useActiveRaster(kind?: string) {
  const enabled = useArcGisQueryEnabled()

  return useQuery({
    queryKey: ['active-raster', kind ?? 'any'],
    queryFn: () => dataProvider.rasters.getActive(kind),
    staleTime: QUERY_STALE_TIME_MS,
    enabled,
  })
}

export function useHotspots(waterBodyId: string | undefined) {
  const enabled = useArcGisQueryEnabled(Boolean(waterBodyId))

  return useQuery({
    queryKey: ['hotspots', waterBodyId],
    queryFn: () => {
      if (!waterBodyId) return []
      return dataProvider.hotspots.getForWaterBody(waterBodyId)
    },
    enabled,
    staleTime: QUERY_STALE_TIME_MS,
  })
}
