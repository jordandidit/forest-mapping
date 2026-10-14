import type { ArcgisFeature } from '@/data/arcgis/types'
import type { SceneDto } from '@/data/arcgis/dto/scene.dto'
import {
  asNullableNumber,
  asNullableString,
  fromArcgisDate,
  fromArcgisDateOnly,
} from '@/data/arcgis/dates'
import type { SceneRecord } from '@/domain/scene/types'

export function mapSceneFeature(feature: ArcgisFeature<SceneDto>): SceneRecord {
  const dto = feature.attributes
  return {
    id: String(dto.objectid ?? dto.scene_name ?? 'scene-unknown'),
    sceneName: asNullableString(dto.scene_name) ?? 'Unknown scene',
    acquiredAt: fromArcgisDate(dto.acq_date),
    acquisitionDay:
      asNullableString(dto.acq_day) ?? fromArcgisDateOnly(dto.acq_date),
    tile: asNullableString(dto.tile),
    cloudPct: asNullableNumber(dto.cloud_pct),
    status: asNullableString(dto.status),
    units: asNullableString(dto.units),
    note: asNullableString(dto.note),
    runId: asNullableString(dto.run_id),
    loggedAt: fromArcgisDate(dto.logged_utc),
    meaning: asNullableString(dto.meaning),
  }
}
