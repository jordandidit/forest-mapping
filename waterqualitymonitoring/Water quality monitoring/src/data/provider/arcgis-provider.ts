import {
  getActiveRaster,
} from '@/data/arcgis/services/rasters.service'
import {
  getAvailabilityForWaterBody,
  getLatestObservationForWaterBody,
  getMetricsForWaterBody,
  getObservationsForWaterBody,
  getParameterTimeSeriesForWaterBody,
} from '@/data/arcgis/services/observations.service'
import { getRecentScenes } from '@/data/arcgis/services/scenes.service'
import {
  getWaterBodies,
  getWaterBodyByRouteKey,
} from '@/data/arcgis/services/water-bodies.service'
import type { DataProvider } from '@/data/provider/types'

export const arcgisDataProvider: DataProvider = {
  kind: 'arcgis',
  waterBodies: {
    getAll: getWaterBodies,
    getByRouteKey: getWaterBodyByRouteKey,
  },
  observations: {
    async getForWaterBody(waterBody) {
      return getObservationsForWaterBody(waterBody.wbId, waterBody.id)
    },
    async getLatest(waterBody) {
      return getLatestObservationForWaterBody(waterBody.wbId, waterBody.id)
    },
    async getMetrics(waterBody) {
      const observations = await getObservationsForWaterBody(waterBody.wbId, waterBody.id)
      return getMetricsForWaterBody(waterBody, observations)
    },
    async getTimeSeries(waterBody, parameter) {
      return getParameterTimeSeriesForWaterBody(waterBody.wbId, waterBody.id, parameter)
    },
    async getAvailability(waterBody) {
      return getAvailabilityForWaterBody(waterBody.wbId, waterBody.id)
    },
  },
  scenes: {
    getRecent: getRecentScenes,
  },
  rasters: {
    getActive: getActiveRaster,
  },
  hotspots: {
    async getForWaterBody() {
      // No production hotspot layer in WATER-DATA-01
      return []
    },
  },
}
