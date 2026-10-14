import { queryAllFeatures, escapeSqlLiteral } from '@/data/arcgis/client'
import { ARCGIS_LAYER, getArcgisFeatureServiceUrl } from '@/data/arcgis/config'
import {
  OBSERVATION_FIELDS,
  type ObservationDto,
} from '@/data/arcgis/dto/observation.dto'
import {
  buildMetricsFromProduction,
  mapObservationFeature,
  mapObservationsToAvailability,
  mapObservationsToTimeSeries,
} from '@/data/arcgis/mappers/observation.mapper'
import type {
  ObservationAvailabilityItem,
  ParameterTimeSeries,
  WaterQualityObservation,
} from '@/domain/observation/types'
import type { WaterBody } from '@/domain/water-body/types'
import type { WaterQualityMetric } from '@/domain/water-quality/types'

function baseUrl(): string {
  return getArcgisFeatureServiceUrl()
}

export async function getObservationsForWaterBody(
  wbId: string,
  routeWaterBodyId: string,
): Promise<WaterQualityObservation[]> {
  const features = await queryAllFeatures<ObservationDto>(baseUrl(), ARCGIS_LAYER.observations, {
    where: `wb_id = '${escapeSqlLiteral(wbId)}'`,
    outFields: OBSERVATION_FIELDS,
    returnGeometry: false,
    orderByFields: 'obs_date ASC',
    pageSize: 1000,
  })

  return (features ?? []).map((feature) => mapObservationFeature(feature, routeWaterBodyId))
}

export async function getLatestObservationForWaterBody(
  wbId: string,
  routeWaterBodyId: string,
): Promise<WaterQualityObservation | null> {
  const observations = await getObservationsForWaterBody(wbId, routeWaterBodyId)
  if (observations.length === 0) return null
  return observations[observations.length - 1] ?? null
}

export async function getAvailabilityForWaterBody(
  wbId: string,
  routeWaterBodyId: string,
): Promise<ObservationAvailabilityItem[]> {
  const observations = await getObservationsForWaterBody(wbId, routeWaterBodyId)
  return mapObservationsToAvailability(observations)
}

export async function getParameterTimeSeriesForWaterBody(
  wbId: string,
  routeWaterBodyId: string,
  parameter: ParameterTimeSeries['parameter'],
): Promise<ParameterTimeSeries> {
  const observations = await getObservationsForWaterBody(wbId, routeWaterBodyId)
  return mapObservationsToTimeSeries(routeWaterBodyId, parameter, observations)
}

export function getMetricsForWaterBody(
  waterBody: WaterBody,
  observations: WaterQualityObservation[],
): WaterQualityMetric[] {
  return buildMetricsFromProduction(waterBody, observations)
}
