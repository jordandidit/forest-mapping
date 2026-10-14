import { queryFeatureLayer, escapeSqlLiteral } from '@/data/arcgis/client'
import { ARCGIS_LAYER, getArcgisFeatureServiceUrl } from '@/data/arcgis/config'
import { RASTER_FIELDS, type RasterDto } from '@/data/arcgis/dto/raster.dto'
import { mapRasterFeature } from '@/data/arcgis/mappers/raster.mapper'
import type { RasterRecord } from '@/domain/raster/types'

/**
 * Discover active ImageServer URL via RasterRegistry.
 * Do not hardcode ImageServer endpoints. Rendering is WATER-DATA-02.
 */
export async function getActiveRaster(kind?: string): Promise<RasterRecord | null> {
  const where = kind
    ? `active = 1 AND kind = '${escapeSqlLiteral(kind)}'`
    : 'active = 1'

  const response = await queryFeatureLayer<RasterDto>(
    getArcgisFeatureServiceUrl(),
    ARCGIS_LAYER.rasterRegistry,
    {
      where,
      outFields: RASTER_FIELDS,
      returnGeometry: false,
      orderByFields: 'objectid DESC',
      resultRecordCount: 5,
    },
  )

  const mapped = (response.features ?? [])
    .map(mapRasterFeature)
    .filter((record): record is RasterRecord => record !== null)

  return mapped[0] ?? null
}
