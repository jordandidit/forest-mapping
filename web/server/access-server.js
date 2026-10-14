/**
 * Secure GeoHub proxy for Rwanda Forest Health Monitor.
 * - Accepts a portal token from Esri IdentityManager / OAuth (no app password form)
 * - Stores token in an encrypted HttpOnly cookie
 * - Proxies only allowed Forest Health Feature Service endpoints
 */
import crypto from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// Local .env; on Vercel, Project Environment Variables are injected instead.
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const IS_VERCEL = Boolean(process.env.VERCEL)
const PORT = Number(process.env.PORT || 8787)
const PORTAL_URL = (process.env.ARCGIS_PORTAL_URL || '').replace(/\/$/, '')
const SERVICE_URL = (process.env.FOREST_HEALTH_SERVICE_URL || '').replace(/\/$/, '')
const WEBMAP_ITEM_ID = process.env.WEBMAP_ITEM_ID || ''
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-only-change-me'
const AUTH_REQUIRED = String(process.env.AUTH_REQUIRED || 'true').toLowerCase() === 'true'
const COOKIE_NAME = 'fh_session_v2'
const TOKEN_TTL_MIN = 60

const LAYER_ALIAS = {
  units: 'ForestUnits',
  observations: 'Observations',
  'admin-links': 'AdminLinks',
  'index-guide': 'IndexGuide',
  runlog: 'RunLog',
  overlay: 'RasterRegistry',
}

const app = express()
// Required on Vercel so Secure cookies and req.protocol honor X-Forwarded-*.
if (IS_VERCEL) app.set('trust proxy', 1)

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
)
app.use(express.json({ limit: '2mb' }))
// ImageryLayer exportImage sends renderingRule / mosaicRule as form fields.
// Without this, overlay POSTs arrive with an empty body and draw raw dark pixels.
app.use(express.urlencoded({ extended: true, limit: '12mb' }))
app.use(cookieParser())

let layerMapCache = null
let layerMapFetchedAt = 0

function keyBuf() {
  return crypto.createHash('sha256').update(SESSION_SECRET).digest()
}

function seal(payload) {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuf(), iv)
  const json = Buffer.from(JSON.stringify(payload), 'utf8')
  const enc = Buffer.concat([cipher.update(json), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString('base64url')
}

function open(token) {
  try {
    const buf = Buffer.from(token, 'base64url')
    const iv = buf.subarray(0, 12)
    const tag = buf.subarray(12, 28)
    const enc = buf.subarray(28)
    const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuf(), iv)
    decipher.setAuthTag(tag)
    const json = Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8')
    return JSON.parse(json)
  } catch {
    return null
  }
}

function setSession(res, session) {
  res.cookie(COOKIE_NAME, seal(session), {
    httpOnly: true,
    sameSite: 'lax',
    // Vercel and any HTTPS host must set Secure or browsers drop the cookie.
    secure: IS_VERCEL || process.env.NODE_ENV === 'production',
    maxAge: TOKEN_TTL_MIN * 60 * 1000,
    path: '/',
  })
}

function clearSession(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' })
}

function getSession(req) {
  const raw = req.cookies?.[COOKIE_NAME]
  if (!raw) return null
  const session = open(raw)
  if (!session?.token || !session?.expires) return null
  if (Date.now() > session.expires - 60_000) return null
  return session
}

/** Validate a portal token issued by GeoHub / ArcGIS IdentityManager. */
async function validatePortalToken(token) {
  if (!PORTAL_URL) throw new Error('ARCGIS_PORTAL_URL is not configured')
  if (!token) {
    const err = new Error('Portal token is required')
    err.status = 400
    throw err
  }
  const endpoint = `${PORTAL_URL}/sharing/rest/community/self?f=json&token=${encodeURIComponent(token)}`
  const res = await fetch(endpoint)
  const data = await res.json()
  if (data.error || !data.username) {
    const msg = data.error?.message || 'Invalid or expired portal token'
    const err = new Error(msg)
    err.status = 401
    throw err
  }
  return data
}

async function ensureServiceConfigured() {
  if (!SERVICE_URL) {
    const err = new Error(
      'FOREST_HEALTH_SERVICE_URL is not set. Provide the FeatureServer URL for RW_ForestHealth_V2 or RW_ForestHealth_V2_View.',
    )
    err.status = 503
    err.code = 'SERVICE_URL_MISSING'
    throw err
  }
}

function assertServicePath(targetUrl) {
  if (!SERVICE_URL) return false
  const allowed = SERVICE_URL.toLowerCase()
  const u = targetUrl.toLowerCase().split('?')[0]
  return u === allowed || u.startsWith(`${allowed}/`)
}

async function arcgisFetch(url, token, params = {}) {
  if (!assertServicePath(url)) {
    const err = new Error('Blocked: URL is outside the configured Forest Health service')
    err.status = 403
    throw err
  }
  const qs = new URLSearchParams({ f: 'json', ...params })
  if (token) qs.set('token', token)
  const full = `${url}?${qs.toString()}`
  const res = await fetch(full)
  const data = await res.json()
  if (data.error) {
    const err = new Error(data.error.message || 'ArcGIS request failed')
    err.status = data.error.code || 502
    err.details = data.error
    throw err
  }
  return data
}

async function resolveLayers(token) {
  const now = Date.now()
  if (layerMapCache && now - layerMapFetchedAt < 10 * 60 * 1000) return layerMapCache
  await ensureServiceConfigured()
  const meta = await arcgisFetch(SERVICE_URL, token)
  const map = {}
  for (const layer of [...(meta.layers || []), ...(meta.tables || [])]) {
    map[layer.name] = {
      id: layer.id,
      name: layer.name,
      url: `${SERVICE_URL}/${layer.id}`,
    }
  }
  layerMapCache = map
  layerMapFetchedAt = now
  return map
}

async function queryAll(layerUrl, token, params = {}) {
  const pageSize = Number(params.resultRecordCount || 2000)
  let offset = 0
  const features = []
  const queryUrl = `${layerUrl.replace(/\/$/, '')}/query`
  for (;;) {
    const data = await arcgisFetch(queryUrl, token, {
      where: params.where || '1=1',
      outFields: params.outFields || '*',
      returnGeometry: params.returnGeometry === false ? 'false' : 'true',
      outSR: params.outSR || '4326',
      // Hosted table fields are often lowercase (objectid), not OBJECTID
      orderByFields: params.orderByFields || 'objectid',
      resultOffset: String(offset),
      resultRecordCount: String(pageSize),
    })
    const batch = data.features || []
    features.push(...batch)
    if (batch.length < pageSize || data.exceededTransferLimit !== true) break
    offset += batch.length
    if (offset > 100000) break
  }
  return features
}

async function requireAuth(req, res, next) {
  try {
    if (!SERVICE_URL) {
      return res.status(503).json({
        error: 'Service not configured',
        code: 'SERVICE_URL_MISSING',
        hint: 'Set FOREST_HEALTH_SERVICE_URL in .env.',
      })
    }
    const session = getSession(req)
    if (AUTH_REQUIRED && !session) {
      return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' })
    }
    req.session = session
    next()
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message, code: 'AUTH_FAILED' })
  }
}

function tokenFrom(req) {
  return req.session?.token || null
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    serviceConfigured: Boolean(SERVICE_URL),
    authRequired: AUTH_REQUIRED,
    portalConfigured: Boolean(PORTAL_URL),
  })
})

/**
 * Establish API session from a portal token obtained via Esri IdentityManager / OAuth.
 * Body: { token, expires?, username? }
 */
app.post('/api/auth/portal-session', async (req, res) => {
  try {
    const token = String(req.body?.token || '').trim()
    const portalUser = await validatePortalToken(token)
    const expiresRaw = req.body?.expires
    const expires =
      typeof expiresRaw === 'number' && Number.isFinite(expiresRaw)
        ? expiresRaw
        : Date.now() + TOKEN_TTL_MIN * 60 * 1000

    setSession(res, {
      token,
      expires,
      username: portalUser.username,
    })
    layerMapCache = null
    res.json({
      authenticated: true,
      username: portalUser.username,
      fullName: portalUser.fullName || null,
      expires,
    })
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Portal session failed', code: 'AUTH_FAILED' })
  }
})

app.post('/api/auth/logout', (req, res) => {
  clearSession(res)
  res.json({ authenticated: false })
})

app.get('/api/auth/me', (req, res) => {
  const session = getSession(req)
  if (!session) {
    return res.json({
      authenticated: false,
      authRequired: AUTH_REQUIRED,
      username: null,
      serviceConfigured: Boolean(SERVICE_URL),
    })
  }
  res.json({
    authenticated: true,
    username: session.username,
    expires: session.expires,
    serviceConfigured: Boolean(SERVICE_URL),
    webMapItemId: WEBMAP_ITEM_ID || null,
  })
})

/** Short-lived map credentials for ArcGIS Maps SDK (session cookie required — no auto-login). */
app.get('/api/auth/map-session', (req, res) => {
  try {
    const session = getSession(req)
    if (!session) {
      return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' })
    }
    if (!WEBMAP_ITEM_ID) {
      return res.status(503).json({ error: 'WEBMAP_ITEM_ID is not configured', code: 'WEBMAP_MISSING' })
    }
    res.json({
      portalUrl: PORTAL_URL,
      webMapItemId: WEBMAP_ITEM_ID,
      token: session.token,
      expires: session.expires,
      servers: [
        `${PORTAL_URL}/sharing/rest`,
        'https://gh.space.gov.rw/server/rest/services',
        'https://gh.space.gov.rw/image/rest/services',
        SERVICE_URL,
      ].filter(Boolean),
    })
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message, code: 'AUTH_FAILED' })
  }
})

app.get('/api/forest-health/units', requireAuth, async (req, res) => {
  try {
    const layers = await resolveLayers(tokenFrom(req))
    const layer = layers.ForestUnits
    if (!layer) return res.status(404).json({ error: 'ForestUnits layer not found' })
    const features = await queryAll(layer.url, tokenFrom(req), {
      returnGeometry: true,
      orderByFields: 'status_rank DESC, area_ha DESC',
    })
    res.json({ features })
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message, code: err.code || 'UNITS_ERROR' })
  }
})

app.get('/api/forest-health/unit/:unitId', requireAuth, async (req, res) => {
  try {
    const layers = await resolveLayers(tokenFrom(req))
    const layer = layers.ForestUnits
    if (!layer) return res.status(404).json({ error: 'ForestUnits layer not found' })
    const unitId = String(req.params.unitId).replace(/'/g, "''")
    const features = await queryAll(layer.url, tokenFrom(req), {
      where: `unit_id = '${unitId}'`,
      returnGeometry: true,
    })
    res.json({ feature: features[0] || null })
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message })
  }
})

function buildObsWhere(query) {
  const clauses = ['1=1']
  if (query.unitId) clauses.push(`unit_id = '${String(query.unitId).replace(/'/g, "''")}'`)
  if (query.quality) clauses.push(`quality = '${String(query.quality).replace(/'/g, "''")}'`)
  if (query.province) clauses.push(`province = '${String(query.province).replace(/'/g, "''")}'`)
  if (query.district) clauses.push(`district = '${String(query.district).replace(/'/g, "''")}'`)
  return clauses.join(' AND ')
}

app.get('/api/forest-health/observations', requireAuth, async (req, res) => {
  try {
    const layers = await resolveLayers(tokenFrom(req))
    const layer = layers.Observations
    if (!layer) return res.status(404).json({ error: 'Observations table not found' })
    const features = await queryAll(layer.url, tokenFrom(req), {
      where: buildObsWhere(req.query),
      returnGeometry: false,
      orderByFields: 'obs_date DESC',
    })
    res.json({ features })
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message })
  }
})

app.get('/api/forest-health/observations/:unitId', requireAuth, async (req, res) => {
  try {
    const layers = await resolveLayers(tokenFrom(req))
    const layer = layers.Observations
    if (!layer) return res.status(404).json({ error: 'Observations table not found' })
    const features = await queryAll(layer.url, tokenFrom(req), {
      where: buildObsWhere({ ...req.query, unitId: req.params.unitId }),
      returnGeometry: false,
      orderByFields: 'obs_date DESC',
    })
    res.json({ features })
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message })
  }
})

app.get('/api/forest-health/admin-links', requireAuth, async (req, res) => {
  try {
    const layers = await resolveLayers(tokenFrom(req))
    const layer = layers.AdminLinks
    if (!layer) return res.status(404).json({ error: 'AdminLinks table not found' })
    const features = await queryAll(layer.url, tokenFrom(req), { returnGeometry: false })
    res.json({ features })
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message })
  }
})

app.get('/api/forest-health/index-guide', requireAuth, async (req, res) => {
  try {
    const layers = await resolveLayers(tokenFrom(req))
    const layer = layers.IndexGuide
    if (!layer) return res.status(404).json({ error: 'IndexGuide table not found' })
    const features = await queryAll(layer.url, tokenFrom(req), {
      returnGeometry: false,
      orderByFields: 'sort_order ASC',
    })
    res.json({ features })
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message })
  }
})

app.get('/api/forest-health/runlog', requireAuth, async (req, res) => {
  try {
    const layers = await resolveLayers(tokenFrom(req))
    const layer = layers.RunLog
    if (!layer) return res.status(404).json({ error: 'RunLog table not found' })
    const features = await queryAll(layer.url, tokenFrom(req), {
      returnGeometry: false,
      orderByFields: 'finished_utc DESC',
      resultRecordCount: 20,
    })
    res.json({ features })
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message })
  }
})

app.get('/api/forest-health/overlay', requireAuth, async (req, res) => {
  try {
    const layers = await resolveLayers(tokenFrom(req))
    const layer = layers.RasterRegistry
    if (!layer) return res.json({ overlay: null })
    const features = await queryAll(layer.url, tokenFrom(req), {
      where: "kind = 'forest_overlay' AND active = 1",
      returnGeometry: false,
      orderByFields: 'created_utc DESC',
      resultRecordCount: 1,
    })
    res.json({ overlay: features[0]?.attributes || null })
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message })
  }
})

async function resolvePortalItemUrl(itemId, token) {
  if (!itemId || !PORTAL_URL) return null
  try {
    const infoUrl = `${PORTAL_URL}/sharing/rest/content/items/${itemId}?f=json&token=${encodeURIComponent(token || '')}`
    const info = await (await fetch(infoUrl)).json()
    if (info?.url) return String(info.url).replace(/\/$/, '')
  } catch {
    /* ignore */
  }
  return null
}

/** Notebook web map layer list (fetched server-side to avoid browser CORS). */
app.get('/api/forest-health/webmap', requireAuth, async (req, res) => {
  try {
    if (!WEBMAP_ITEM_ID || !PORTAL_URL) {
      return res.status(503).json({ error: 'WEBMAP_ITEM_ID not configured' })
    }
    const token = tokenFrom(req)
    const dataUrl = `${PORTAL_URL}/sharing/rest/content/items/${WEBMAP_ITEM_ID}/data?f=json&token=${encodeURIComponent(token)}`
    const data = await (await fetch(dataUrl)).json()
    if (data.error) {
      return res.status(502).json({ error: data.error.message || 'Failed to load web map' })
    }
    const layers = []
    for (const l of data.operationalLayers || []) {
      let url = l.url || null
      if (!url && l.itemId) {
        url = await resolvePortalItemUrl(l.itemId, token)
      }
      layers.push({
        id: l.id,
        title: l.title,
        layerType: l.layerType,
        url,
        itemId: l.itemId || null,
        visibility: l.visibility !== false,
        opacity: l.opacity ?? 1,
        minScale: l.layerDefinition?.minScale ?? l.minScale ?? 0,
        maxScale: l.layerDefinition?.maxScale ?? l.maxScale ?? 0,
        renderer: l.layerDefinition?.drawingInfo?.renderer || null,
        // Required for NDVI / NBR classified overlays (red→green pictures).
        renderingRule: l.renderingRule || null,
        mosaicRule: l.mosaicRule || null,
        format: l.format || 'png32',
        compressionQuality: l.compressionQuality ?? 75,
        bandIds: l.bandIds || null,
        popupInfo: l.popupInfo || null,
      })
    }
    res.json({
      itemId: WEBMAP_ITEM_ID,
      basemap: data.baseMap?.baseMapLayers?.[0]?.url || 'satellite',
      layers,
    })
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message })
  }
})

function formFieldValue(value) {
  if (value == null) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/**
 * Restricted GIS forwarder for map tiles/queries.
 * Supports:
 *  - /api/gis/proxy?url=<encoded target>  (app interceptor)
 *  - /api/gis/proxy?<absolute-https-url>  (Esri addProxyRule style)
 * Must forward POST form bodies intact — NDVI/NBR overlays depend on renderingRule.
 */
app.all('/api/gis/proxy', requireAuth, async (req, res) => {
  try {
    let target = req.query.url
    if (!target || typeof target !== 'string') {
      // Esri proxy style: everything after "?" is the absolute target URL.
      const q = req.originalUrl.indexOf('?')
      if (q >= 0) {
        const rest = req.originalUrl.slice(q + 1)
        if (/^https?:\/\//i.test(rest)) target = decodeURIComponent(rest)
      }
    }
    if (!target || typeof target !== 'string') {
      return res.status(400).json({ error: 'Missing url query parameter' })
    }
    let parsed
    try {
      parsed = new URL(target)
    } catch {
      return res.status(400).json({ error: 'Invalid url' })
    }
    if (parsed.protocol !== 'https:' || parsed.hostname !== 'gh.space.gov.rw') {
      return res.status(403).json({ error: 'Host not allowed' })
    }
    // IdentityManager / OAuth must reach Portal directly (not rewritten under /api).
    if (/^\/portal(\/|$)/i.test(parsed.pathname)) {
      return res.status(403).json({ error: 'Portal URLs must not be proxied' })
    }
    const token = tokenFrom(req)
    const forward = new URL(parsed.toString())
    if (token && !forward.searchParams.has('token')) forward.searchParams.set('token', token)

    const method = req.method === 'GET' || req.method === 'HEAD' ? req.method : 'POST'
    const init = { method, headers: {} }

    if (method === 'POST') {
      const contentType = req.headers['content-type'] || 'application/x-www-form-urlencoded'
      init.headers['Content-Type'] = contentType

      if (Buffer.isBuffer(req.body) && req.body.length) {
        init.body = req.body
        if (token && !String(req.body).includes('token=')) {
          // Rare: append token when the raw body did not include one.
          init.headers['Content-Type'] = 'application/x-www-form-urlencoded'
          init.body = `${req.body.toString('utf8')}&token=${encodeURIComponent(token)}`
        }
      } else if (typeof req.body === 'string' && req.body.length) {
        init.body = req.body.includes('token=') || !token
          ? req.body
          : `${req.body}&token=${encodeURIComponent(token)}`
      } else if (req.body && typeof req.body === 'object' && Object.keys(req.body).length) {
        const body = new URLSearchParams()
        for (const [key, value] of Object.entries(req.body)) {
          if (Array.isArray(value)) {
            value.forEach((item) => body.append(key, formFieldValue(item)))
          } else {
            body.set(key, formFieldValue(value))
          }
        }
        if (token && !body.has('token')) body.set('token', token)
        init.body = body.toString()
      }
    }

    const upstream = await fetch(forward.toString(), init)
    const upstreamType = upstream.headers.get('content-type') || 'application/octet-stream'
    res.status(upstream.status)
    res.setHeader('Content-Type', upstreamType)
    res.setHeader('Cache-Control', 'private, max-age=30')
    const buf = Buffer.from(await upstream.arrayBuffer())
    res.send(buf)
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message || 'Proxy failed' })
  }
})

// No catch-all open proxy beyond the host-restricted /api/gis/proxy above.

export default app
export { app }

// Local / Docker only — on Vercel the app is exported as a serverless function.
if (!IS_VERCEL) {
  const server = app.listen(PORT, () => {
    console.log(`[forest-health] access server on http://localhost:${PORT}`)
    console.log(`  portal: ${PORTAL_URL || '(not set)'}`)
    console.log(`  service: ${SERVICE_URL || '(not set — set FOREST_HEALTH_SERVICE_URL)'}`)
    console.log(`  authRequired: ${AUTH_REQUIRED}`)
    console.log(`  webmap: ${WEBMAP_ITEM_ID || '(not set)'}`)
    console.log(`  layers aliases: ${Object.values(LAYER_ALIAS).join(', ')}`)
  })

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(
        `[forest-health] port ${PORT} is already in use. Stop the other process, then run npm run dev again.`,
      )
    } else {
      console.error('[forest-health] server error:', err.code || '', err.message)
    }
    process.exit(1)
  })

  process.on('uncaughtException', (err) => {
    console.error('[forest-health] uncaughtException:', err)
    process.exit(1)
  })

  process.on('unhandledRejection', (err) => {
    console.error('[forest-health] unhandledRejection:', err)
    process.exit(1)
  })
}
