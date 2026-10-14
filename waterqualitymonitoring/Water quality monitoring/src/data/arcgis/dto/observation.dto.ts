export interface ObservationDto {
  objectid?: number
  obs_id?: string | number | null
  wb_id?: string | number | null
  wb_key?: string | null
  name?: string | null
  obs_date?: number | string | null
  acq_day?: string | number | null
  tiles?: string | null
  n_tiles?: number | null
  tile_cloud_pct?: number | null
  quality?: string | null
  clear_pct?: number | null
  coverage_pct?: number | null
  water_px?: number | null
  water_pct?: number | null
  floating_veg_pct?: number | null
  red_refl?: number | null
  ndti?: number | null
  ndci?: number | null
  fai?: number | null
  mndwi?: number | null
  turbidity_fnu?: number | null
  chl_mgm3?: number | null
  turbidity_level?: string | null
  chlorophyll_level?: string | null
  bloom_risk?: string | null
  run_id?: string | null
  created_utc?: number | string | null
  meaning?: string | null
}

export const OBSERVATION_FIELDS = [
  'objectid',
  'obs_id',
  'wb_id',
  'wb_key',
  'name',
  'obs_date',
  'acq_day',
  'tiles',
  'n_tiles',
  'tile_cloud_pct',
  'quality',
  'clear_pct',
  'coverage_pct',
  'water_pct',
  'floating_veg_pct',
  'ndti',
  'ndci',
  'fai',
  'mndwi',
  'turbidity_fnu',
  'chl_mgm3',
  'turbidity_level',
  'chlorophyll_level',
  'bloom_risk',
  'run_id',
  'created_utc',
  'meaning',
].join(',')
