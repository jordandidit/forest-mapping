export interface WaterBodyDto {
  objectid?: number
  wb_id?: string | number | null
  wb_key?: string | null
  name?: string | null
  name_rw?: string | null
  wb_type?: string | null
  area_ha?: number | null
  erosion_m?: number | null
  n_villages?: number | null
  admin_note?: string | null
  province?: string | null
  province_id?: string | number | null
  district?: string | null
  district_id?: string | number | null
  sector?: string | null
  sector_id?: string | number | null
  sector_label?: string | null
  cell?: string | null
  cell_id?: string | number | null
  village?: string | null
  village_id?: string | number | null
  village_label?: string | null
  cx?: number | null
  cy?: number | null
  bxmin?: number | null
  bymin?: number | null
  bxmax?: number | null
  bymax?: number | null
  status?: string | null
  status_rank?: number | null
  status_note?: string | null
  last_obs_date?: number | string | null
  days_since_obs?: number | null
  last_check_date?: number | string | null
  last_check_result?: string | null
  obs_14m?: number | null
  turbidity_fnu?: number | null
  turbidity_level?: string | null
  ndti?: number | null
  ndci?: number | null
  chl_mgm3?: number | null
  chlorophyll_level?: string | null
  bloom_risk?: string | null
  fai?: number | null
  mndwi?: number | null
  floating_veg_pct?: number | null
  floating_veg_flag?: number | boolean | null
  water_pct?: number | null
  clear_pct?: number | null
  turb_base?: number | null
  ndci_base?: number | null
  turb_pctrank?: number | null
  ndci_pctrank?: number | null
  turb_trend?: string | null
  turb_slope_yr?: number | null
  turb_trend_p?: number | null
  chl_trend?: string | null
  ndci_slope_yr?: number | null
  chl_trend_p?: number | null
  prev_obs_date?: number | string | null
  prev_turbidity_fnu?: number | null
  prev_ndci?: number | null
  hist_json?: string | null
  updated_utc?: number | string | null
  last_run_id?: string | null
}

export const WATER_BODY_LIST_FIELDS = [
  'objectid',
  'wb_id',
  'wb_key',
  'name',
  'name_rw',
  'wb_type',
  'area_ha',
  'province',
  'district',
  'cx',
  'cy',
  'bxmin',
  'bymin',
  'bxmax',
  'bymax',
  'status',
  'status_note',
  'last_obs_date',
  'days_since_obs',
  'turb_trend',
  'chl_trend',
].join(',')

export const WATER_BODY_DETAIL_FIELDS = [
  WATER_BODY_LIST_FIELDS,
  'obs_14m',
  'turbidity_fnu',
  'turbidity_level',
  'ndci',
  'chl_mgm3',
  'chlorophyll_level',
  'bloom_risk',
  'floating_veg_pct',
  'floating_veg_flag',
  'water_pct',
  'clear_pct',
  'turb_base',
  'ndci_base',
  'turb_pctrank',
  'ndci_pctrank',
  'turb_slope_yr',
  'ndci_slope_yr',
  'turb_trend_p',
  'chl_trend_p',
  'prev_obs_date',
  'prev_turbidity_fnu',
  'prev_ndci',
  'admin_note',
].join(',')
