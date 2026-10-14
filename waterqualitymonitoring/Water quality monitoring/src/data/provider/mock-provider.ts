import {
  getAvailabilityForLake,
  getHotspotsForLake,
  getLakeById,
  getLakeMetrics,
  getLatestObservation,
  getObservationsForLake,
  getParameterTimeSeries,
  getSidebarLakes,
  lakes,
} from '@/data/mock'
import type { DataProvider } from '@/data/provider/types'
import type { WaterBody } from '@/domain/water-body/types'

async function resolveWaterBody(routeKey: string): Promise<WaterBody | null> {
  return getLakeById(routeKey) ?? null
}

export const mockDataProvider: DataProvider = {
  kind: 'mock',
  waterBodies: {
    async getAll() {
      return getSidebarLakes()
    },
    async getByRouteKey(routeKey) {
      return resolveWaterBody(routeKey)
    },
  },
  observations: {
    async getForWaterBody(waterBody) {
      return getObservationsForLake(waterBody.id)
    },
    async getLatest(waterBody) {
      return getLatestObservation(waterBody.id) ?? null
    },
    async getMetrics(waterBody) {
      return getLakeMetrics(waterBody.id)
    },
    async getTimeSeries(waterBody, parameter) {
      if (parameter === 'chlorophyll') {
        return getParameterTimeSeries(waterBody.id, 'ndci')
      }
      return getParameterTimeSeries(
        waterBody.id,
        parameter as 'turbidity' | 'ndci' | 'floating_vegetation',
      )
    },
    async getAvailability(waterBody) {
      return getAvailabilityForLake(waterBody.id)
    },
  },
  scenes: {
    async getRecent() {
      return []
    },
  },
  rasters: {
    async getActive() {
      return null
    },
  },
  hotspots: {
    async getForWaterBody(waterBodyId) {
      return getHotspotsForLake(waterBodyId)
    },
  },
}

export function getMockWaterBodyCount(): number {
  return lakes.length
}
