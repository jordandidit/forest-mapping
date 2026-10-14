import { toDate } from './date'

function num(v) {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function str(v) {
  if (v == null) return null
  return String(v)
}

/** Normalize ForestUnits feature attributes (+ optional geometry) */
export function normalizeForest(attrs = {}, geometry = null) {
  return {
    id: str(attrs.unit_id) || str(attrs.OBJECTID),
    objectId: attrs.OBJECTID ?? null,
    unitId: str(attrs.unit_id),
    unitUid: num(attrs.unit_uid),
    name: str(attrs.forest_name) || 'Unnamed forest',
    designation: str(attrs.designation),
    managedBy: str(attrs.managed_by),
    forestGroup: str(attrs.forest_group),
    areaHa: num(attrs.area_ha),
    paAreaHa: num(attrs.pa_area_ha),
    lcYear: num(attrs.lc_year),
    nVillages: num(attrs.n_villages),
    adminNote: str(attrs.admin_note),
    province: str(attrs.province),
    provinceId: str(attrs.province_id),
    district: str(attrs.district),
    districtId: str(attrs.district_id),
    sector: str(attrs.sector),
    sectorLabel: str(attrs.sector_label),
    village: str(attrs.village),
    villageLabel: str(attrs.village_label),
    status: str(attrs.status) || 'Pending',
    statusRank: num(attrs.status_rank) ?? 0,
    condition: str(attrs.condition),
    statusNote: str(attrs.status_note),
    ndvi: num(attrs.ndvi),
    ndmi: num(attrs.ndmi),
    nbr: num(attrs.nbr),
    clearPercent: num(attrs.clear_pct),
    ndviBase: num(attrs.ndvi_base),
    ndviAnomaly: num(attrs.ndvi_anom),
    ndmiAnomaly: num(attrs.ndmi_anom),
    ndviDrop: num(attrs.ndvi_drop),
    nbrDrop: num(attrs.nbr_drop),
    lastObservationDate: toDate(attrs.last_obs_date),
    daysSinceObservation: num(attrs.days_since_obs),
    lastCheckDate: toDate(attrs.last_check_date),
    lastCheckResult: str(attrs.last_check_result),
    obs14m: num(attrs.obs_14m),
    prevObsDate: toDate(attrs.prev_obs_date),
    prevNdvi: num(attrs.prev_ndvi),
    histJson: str(attrs.hist_json),
    updatedUtc: toDate(attrs.updated_utc),
    lastRunId: str(attrs.last_run_id),
    cx: num(attrs.cx),
    cy: num(attrs.cy),
    bxmin: num(attrs.bxmin),
    bymin: num(attrs.bymin),
    bxmax: num(attrs.bxmax),
    bymax: num(attrs.bymax),
    meaning: str(attrs.meaning),
    geometry: geometry || null,
  }
}

export function normalizeObservation(attrs = {}) {
  return {
    id: str(attrs.obs_id) || `${attrs.unit_id}-${attrs.acq_day}`,
    objectId: attrs.OBJECTID ?? null,
    obsId: str(attrs.obs_id),
    unitId: str(attrs.unit_id),
    forestName: str(attrs.forest_name),
    forestGroup: str(attrs.forest_group),
    province: str(attrs.province),
    district: str(attrs.district),
    areaHa: num(attrs.area_ha),
    obsDate: toDate(attrs.obs_date),
    acqDay: str(attrs.acq_day),
    tiles: str(attrs.tiles),
    nTiles: num(attrs.n_tiles),
    tileCloudPct: num(attrs.tile_cloud_pct),
    quality: str(attrs.quality),
    clearPercent: num(attrs.clear_pct),
    coveragePercent: num(attrs.coverage_pct),
    ndvi: num(attrs.ndvi),
    ndmi: num(attrs.ndmi),
    nbr: num(attrs.nbr),
    meaning: str(attrs.meaning),
    runId: str(attrs.run_id),
    createdUtc: toDate(attrs.created_utc),
  }
}

export function normalizeAdminLink(attrs = {}) {
  return {
    unitId: str(attrs.unit_id),
    forestName: str(attrs.forest_name),
    forestGroup: str(attrs.forest_group),
    designation: str(attrs.designation),
    province: str(attrs.province),
    district: str(attrs.district),
    sectorLabel: str(attrs.sector_label),
    villageLabel: str(attrs.village_label),
    status: str(attrs.status),
    statusRank: num(attrs.status_rank),
    condition: str(attrs.condition),
    ndvi: num(attrs.ndvi),
    ndviAnomaly: num(attrs.ndvi_anom),
    ndmiAnomaly: num(attrs.ndmi_anom),
    nbrDrop: num(attrs.nbr_drop),
    lastObservationDate: toDate(attrs.last_obs_date),
    daysSinceObservation: num(attrs.days_since_obs),
    meaning: str(attrs.meaning),
  }
}

export function normalizeIndexGuide(attrs = {}) {
  return {
    code: str(attrs.code),
    name: str(attrs.name),
    formula: str(attrs.formula),
    bands: str(attrs.bands),
    meaning: str(attrs.meaning),
    howToRead: str(attrs.how_to_read),
    thresholds: str(attrs.thresholds),
    caveats: str(attrs.caveats),
    reference: str(attrs.reference),
    sortOrder: num(attrs.sort_order),
  }
}

export function normalizeRunLog(attrs = {}) {
  return {
    runId: str(attrs.run_id),
    stage: str(attrs.stage),
    status: str(attrs.status),
    runMode: str(attrs.run_mode),
    startedUtc: toDate(attrs.started_utc),
    finishedUtc: toDate(attrs.finished_utc),
    dates: num(attrs.dates),
    scenes: num(attrs.scenes),
    units: num(attrs.units),
    observations: num(attrs.observations),
    alerts: num(attrs.alerts),
    latestImage: toDate(attrs.latest_image),
    message: str(attrs.message),
    meaning: str(attrs.meaning),
  }
}

export function normalizeOverlay(attrs = {}) {
  return {
    kind: str(attrs.kind),
    label: str(attrs.label),
    season: str(attrs.season),
    acqDay: str(attrs.acq_day),
    itemId: str(attrs.item_id),
    url: str(attrs.url),
    title: str(attrs.title),
    cellM: num(attrs.cell_m),
    active: num(attrs.active),
    createdUtc: toDate(attrs.created_utc),
    note: str(attrs.note),
  }
}
