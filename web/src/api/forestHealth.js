import { arcgisApi } from './arcgis'
import {
  MOCK_ADMIN_LINKS,
  MOCK_FORESTS,
  MOCK_INDEX_GUIDE,
  MOCK_OBSERVATIONS,
  MOCK_OVERLAY,
  MOCK_RUNLOG,
} from './mockData'
import {
  normalizeAdminLink,
  normalizeForest,
  normalizeIndexGuide,
  normalizeObservation,
  normalizeOverlay,
  normalizeRunLog,
} from '../utils/normalize'
import { filterForests, summarizeForests } from '../utils/filters'

const USE_MOCK = String(import.meta.env.VITE_USE_MOCK_DATA).toLowerCase() === 'true'

const cache = {
  units: null,
  adminLinks: null,
  indexGuide: null,
  runLog: null,
  overlay: null,
}

function clearCaches() {
  Object.keys(cache).forEach((k) => {
    cache[k] = null
  })
}

function mockUnits() {
  return MOCK_FORESTS.map((f) => {
    const { geometry, ...attrs } = f
    return normalizeForest(attrs, geometry)
  })
}

function mockObs(unitId) {
  return MOCK_OBSERVATIONS.filter((o) => !unitId || o.unit_id === unitId).map((o) =>
    normalizeObservation(o),
  )
}

/** List all ForestUnits (cached). */
export async function listForestUnits({ force = false, signal } = {}) {
  if (USE_MOCK) {
    if (!cache.units || force) cache.units = mockUnits()
    return cache.units
  }
  if (cache.units && !force) return cache.units
  const data = await arcgisApi.get('/forest-health/units', signal)
  cache.units = (data.features || []).map((f) => normalizeForest(f.attributes, f.geometry))
  return cache.units
}

export async function getForestUnit(unitId, { signal } = {}) {
  if (!unitId) return null
  if (USE_MOCK) return mockUnits().find((f) => f.unitId === unitId) || null
  const data = await arcgisApi.get(`/forest-health/unit/${encodeURIComponent(unitId)}`, signal)
  if (!data?.feature) return null
  return normalizeForest(data.feature.attributes, data.feature.geometry)
}

export async function getForestByName(name, options) {
  const units = await listForestUnits(options)
  const q = (name || '').toLowerCase()
  return units.find((f) => f.name.toLowerCase() === q) || null
}

export async function getObservations(unitId, { signal, quality } = {}) {
  if (USE_MOCK) {
    let rows = mockObs(unitId)
    if (quality) rows = rows.filter((r) => r.quality === quality)
    return rows.sort((a, b) => (b.obsDate?.getTime() || 0) - (a.obsDate?.getTime() || 0))
  }
  // Fetch all rows for the unit; filter quality client-side (more reliable than REST where).
  const data = await arcgisApi.query(
    `/forest-health/observations/${encodeURIComponent(unitId)}`,
    {},
    signal,
  )
  let rows = (data.features || [])
    .map((f) => normalizeObservation(f.attributes))
    .sort((a, b) => (b.obsDate?.getTime() || 0) - (a.obsDate?.getTime() || 0))
  if (quality) rows = rows.filter((r) => r.quality === quality)
  return rows
}

export async function getFilteredObservations(filters = {}, { signal } = {}) {
  if (USE_MOCK) {
    let rows = mockObs()
    if (filters.unitId) rows = rows.filter((r) => r.unitId === filters.unitId)
    if (filters.quality) rows = rows.filter((r) => r.quality === filters.quality)
    if (filters.province) rows = rows.filter((r) => r.province === filters.province)
    if (filters.district) rows = rows.filter((r) => r.district === filters.district)
    return rows.sort((a, b) => (b.obsDate?.getTime() || 0) - (a.obsDate?.getTime() || 0))
  }
  const data = await arcgisApi.query('/forest-health/observations', filters, signal)
  return (data.features || [])
    .map((f) => normalizeObservation(f.attributes))
    .sort((a, b) => (b.obsDate?.getTime() || 0) - (a.obsDate?.getTime() || 0))
}

export async function getAdminLinks({ force = false, signal } = {}) {
  if (USE_MOCK) {
    if (!cache.adminLinks || force) cache.adminLinks = MOCK_ADMIN_LINKS.map(normalizeAdminLink)
    return cache.adminLinks
  }
  if (cache.adminLinks && !force) return cache.adminLinks
  const data = await arcgisApi.get('/forest-health/admin-links', signal)
  cache.adminLinks = (data.features || []).map((f) => normalizeAdminLink(f.attributes))
  return cache.adminLinks
}

export async function getIndexGuide({ force = false, signal } = {}) {
  if (USE_MOCK) {
    if (!cache.indexGuide || force) {
      cache.indexGuide = MOCK_INDEX_GUIDE.map(normalizeIndexGuide).sort(
        (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0),
      )
    }
    return cache.indexGuide
  }
  if (cache.indexGuide && !force) return cache.indexGuide
  const data = await arcgisApi.get('/forest-health/index-guide', signal)
  cache.indexGuide = (data.features || [])
    .map((f) => normalizeIndexGuide(f.attributes))
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
  return cache.indexGuide
}

export async function getRunLog({ force = false, signal } = {}) {
  if (USE_MOCK) {
    if (!cache.runLog || force) cache.runLog = MOCK_RUNLOG.map(normalizeRunLog)
    return cache.runLog
  }
  if (cache.runLog && !force) return cache.runLog
  const data = await arcgisApi.get('/forest-health/runlog', signal)
  cache.runLog = (data.features || []).map((f) => normalizeRunLog(f.attributes))
  return cache.runLog
}

export async function getOverlayInfo({ force = false, signal } = {}) {
  if (USE_MOCK) {
    cache.overlay = MOCK_OVERLAY
    return cache.overlay
  }
  if (cache.overlay && !force) return cache.overlay
  try {
    const data = await arcgisApi.get('/forest-health/overlay', signal)
    cache.overlay = data.overlay ? normalizeOverlay(data.overlay) : null
  } catch {
    cache.overlay = null
  }
  return cache.overlay
}

export async function getForestSummary(filters = {}) {
  const units = await listForestUnits()
  const filtered = filterForests(units, filters)
  return summarizeForests(filtered)
}

export async function getStatusCounts(filters = {}) {
  const summary = await getForestSummary(filters)
  return summary.byStatus
}

export function isMockMode() {
  return USE_MOCK
}

export function invalidateForestHealthCache() {
  clearCaches()
}

/** Redirect to GeoHub portal OAuth authorize page (registered app client id). */
export async function beginOAuthLogin() {
  const { beginOAuthLogin: start } = await import('./oauth')
  start()
}

/** Finish /oauth/callback — exchange portal token for API session cookie. */
export async function completeOAuthLogin() {
  const { completeOAuthCallback } = await import('./oauth')
  const cred = await completeOAuthCallback()
  const result = await arcgisApi.portalSession({
    token: cred.token,
    expires: cred.expires,
    username: cred.username,
  })
  try {
    sessionStorage.setItem('fh_oauth_just_done', '1')
  } catch {
    // ignore
  }
  clearCaches()
  return result
}

export async function logout() {
  try {
    const { destroyOAuthCredentials } = await import('./oauth')
    await destroyOAuthCredentials()
  } catch {
    // ignore oauth cleanup errors
  }
  const result = await arcgisApi.logout()
  clearCaches()
  return result
}

export async function getCurrentUser() {
  if (USE_MOCK) return { authenticated: true, username: 'mock.user', mock: true }
  return arcgisApi.me()
}

export async function getMapSession() {
  if (USE_MOCK) {
    throw new Error('Map session requires live GeoHub connection (set VITE_USE_MOCK_DATA=false)')
  }
  return arcgisApi.get('/auth/map-session')
}

export async function getWebMapConfig({ signal } = {}) {
  if (USE_MOCK) return { layers: [], basemap: 'satellite' }
  return arcgisApi.get('/forest-health/webmap', signal)
}
