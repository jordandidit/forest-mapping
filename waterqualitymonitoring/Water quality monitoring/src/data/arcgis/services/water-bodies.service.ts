import { queryFeatureLayer, escapeSqlLiteral } from '@/data/arcgis/client'
import { ARCGIS_LAYER, getArcgisFeatureServiceUrl } from '@/data/arcgis/config'
import {
  WATER_BODY_DETAIL_FIELDS,
  WATER_BODY_LIST_FIELDS,
  type WaterBodyDto,
} from '@/data/arcgis/dto/water-body.dto'
import { mapWaterBodyFeature, toWaterBodyRouteId } from '@/data/arcgis/mappers/water-body.mapper'
import type { WaterBody } from '@/domain/water-body/types'

function baseUrl(): string {
  return getArcgisFeatureServiceUrl()
}

export async function getWaterBodies(): Promise<WaterBody[]> {
  const response = await queryFeatureLayer<WaterBodyDto>(baseUrl(), ARCGIS_LAYER.waterBodies, {
    where: 'wb_id IS NOT NULL',
    outFields: WATER_BODY_LIST_FIELDS,
    returnGeometry: false,
    orderByFields: 'name ASC',
    resultRecordCount: 1000,
  })

  return (response.features ?? []).map((feature) =>
    mapWaterBodyFeature(feature, { includeGeometry: false }),
  )
}

export async function getWaterBodyByWbId(wbId: string): Promise<WaterBody | null> {
  const response = await queryFeatureLayer<WaterBodyDto>(baseUrl(), ARCGIS_LAYER.waterBodies, {
    where: `wb_id = '${escapeSqlLiteral(wbId)}'`,
    outFields: WATER_BODY_DETAIL_FIELDS,
    returnGeometry: true,
    resultRecordCount: 1,
  })

  const feature = response.features?.[0]
  return feature ? mapWaterBodyFeature(feature) : null
}

/**
 * Resolve a route slug such as `lake-muhazi` without depending on `WHERE name='Muhazi'`.
 * Preference order: wb_id → wb_key → derived route id from name.
 */
export async function getWaterBodyByRouteKey(routeKey: string): Promise<WaterBody | null> {
  const key = routeKey.trim()
  if (!key) return null

  const byId = await getWaterBodyByWbId(key)
  if (byId) return byId

  const byKey = await queryFeatureLayer<WaterBodyDto>(baseUrl(), ARCGIS_LAYER.waterBodies, {
    where: `wb_key = '${escapeSqlLiteral(key)}'`,
    outFields: WATER_BODY_DETAIL_FIELDS,
    returnGeometry: true,
    resultRecordCount: 1,
  })
  const keyFeature = byKey.features?.[0]
  if (keyFeature) return mapWaterBodyFeature(keyFeature)

  const list = await getWaterBodies()
  const match = list.find((body) => body.id === key || body.wbId === key)
  if (!match) {
    // Secondary pass: re-derive route ids in case naming differs slightly
    const fuzzy = list.find((body) => {
      const derived = toWaterBodyRouteId(body.name.replace(/^Lake\s+/i, ''), body.wbId)
      return derived === key || body.id === key
    })
    if (!fuzzy) return null
    return getWaterBodyByWbId(fuzzy.wbId)
  }

  return getWaterBodyByWbId(match.wbId)
}
