import { queryFeatureLayer } from '@/data/arcgis/client'
import { ARCGIS_LAYER, getArcgisFeatureServiceUrl } from '@/data/arcgis/config'
import { SCENE_FIELDS, type SceneDto } from '@/data/arcgis/dto/scene.dto'
import { mapSceneFeature } from '@/data/arcgis/mappers/scene.mapper'
import type { SceneRecord } from '@/domain/scene/types'

/**
 * SceneLog is scene/tile pipeline provenance — not lake observation history.
 */
export async function getRecentScenes(limit = 50): Promise<SceneRecord[]> {
  const response = await queryFeatureLayer<SceneDto>(
    getArcgisFeatureServiceUrl(),
    ARCGIS_LAYER.sceneLog,
    {
      where: 'objectid IS NOT NULL',
      outFields: SCENE_FIELDS,
      returnGeometry: false,
      orderByFields: 'acq_date DESC',
      resultRecordCount: limit,
    },
  )

  return (response.features ?? []).map(mapSceneFeature)
}
