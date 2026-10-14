import type { Hotspot } from '@/domain/hotspot/types'
import type {
  ObservationAvailabilityItem,
  ParameterTimeSeries,
  WaterQualityObservation,
} from '@/domain/observation/types'
import type { RasterRecord } from '@/domain/raster/types'
import type { SceneRecord } from '@/domain/scene/types'
import type { WaterBody } from '@/domain/water-body/types'
import type { WaterQualityMetric } from '@/domain/water-quality/types'

export interface WaterBodiesRepository {
  getAll(): Promise<WaterBody[]>
  getByRouteKey(routeKey: string): Promise<WaterBody | null>
}

export interface ObservationsRepository {
  getForWaterBody(waterBody: WaterBody): Promise<WaterQualityObservation[]>
  getLatest(waterBody: WaterBody): Promise<WaterQualityObservation | null>
  getMetrics(waterBody: WaterBody): Promise<WaterQualityMetric[]>
  getTimeSeries(
    waterBody: WaterBody,
    parameter: ParameterTimeSeries['parameter'],
  ): Promise<ParameterTimeSeries | undefined>
  getAvailability(waterBody: WaterBody): Promise<ObservationAvailabilityItem[]>
}

export interface ScenesRepository {
  getRecent(limit?: number): Promise<SceneRecord[]>
}

export interface RastersRepository {
  getActive(kind?: string): Promise<RasterRecord | null>
}

export interface HotspotsRepository {
  getForWaterBody(waterBodyId: string): Promise<Hotspot[]>
}

export interface DataProvider {
  kind: 'mock' | 'arcgis'
  waterBodies: WaterBodiesRepository
  observations: ObservationsRepository
  scenes: ScenesRepository
  rasters: RastersRepository
  hotspots: HotspotsRepository
}
