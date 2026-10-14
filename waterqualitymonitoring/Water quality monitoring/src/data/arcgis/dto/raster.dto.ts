export interface RasterDto {
  objectid?: number
  kind?: string | null
  label?: string | null
  season?: string | null
  acq_day?: string | number | null
  item_id?: string | null
  url?: string | null
  title?: string | null
  cell_m?: number | null
  active?: number | boolean | null
  created_utc?: number | string | null
  note?: string | null
  meaning?: string | null
}

export const RASTER_FIELDS = [
  'objectid',
  'kind',
  'label',
  'season',
  'acq_day',
  'item_id',
  'url',
  'title',
  'cell_m',
  'active',
  'created_utc',
  'note',
  'meaning',
].join(',')
