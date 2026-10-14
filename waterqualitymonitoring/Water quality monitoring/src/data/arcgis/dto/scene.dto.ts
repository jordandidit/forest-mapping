export interface SceneDto {
  objectid?: number
  scene_name?: string | null
  acq_date?: number | string | null
  acq_day?: string | number | null
  tile?: string | null
  cloud_pct?: number | null
  status?: string | null
  units?: string | null
  note?: string | null
  run_id?: string | null
  logged_utc?: number | string | null
  meaning?: string | null
}

export const SCENE_FIELDS = [
  'objectid',
  'scene_name',
  'acq_date',
  'acq_day',
  'tile',
  'cloud_pct',
  'status',
  'units',
  'note',
  'run_id',
  'logged_utc',
  'meaning',
].join(',')
