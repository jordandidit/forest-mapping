import type { ArcgisFeature } from '@/data/arcgis/types'
import type { RasterDto } from '@/data/arcgis/dto/raster.dto'
import {
  asNullableBooleanFlag,
  asNullableNumber,
  asNullableString,
  fromArcgisDate,
} from '@/data/arcgis/dates'
import type { RasterRecord } from '@/domain/raster/types'

export function mapRasterFeature(feature: ArcgisFeature<RasterDto>): RasterRecord | null {
  const dto = feature.attributes
  const url = asNullableString(dto.url)
  if (!url) return null

  return {
    id: String(dto.objectid ?? dto.item_id ?? url),
    kind: asNullableString(dto.kind) ?? 'unknown',
    label: asNullableString(dto.label),
    season: asNullableString(dto.season),
    acquisitionDay: asNullableString(dto.acq_day),
    itemId: asNullableString(dto.item_id),
    url,
    title: asNullableString(dto.title),
    cellSizeMeters: asNullableNumber(dto.cell_m),
    active: asNullableBooleanFlag(dto.active) ?? false,
    createdAt: fromArcgisDate(dto.created_utc),
    note: asNullableString(dto.note),
    meaning: asNullableString(dto.meaning),
  }
}
