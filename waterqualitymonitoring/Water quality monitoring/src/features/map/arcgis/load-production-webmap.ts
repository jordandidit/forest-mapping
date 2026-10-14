import IdentityManager from '@arcgis/core/identity/IdentityManager.js'
import WebMap from '@arcgis/core/WebMap.js'
import { getArcgisPortalUrl } from '@/data/arcgis/config'
import { DEV_PORTAL_PROXY_PREFIX } from '@/data/arcgis/portal-dev-proxy'
import { getProductionWebMapId } from '@/features/map/arcgis/constants'

/**
 * Load the production Web Map without PortalItem CORS / proxy-host auth dialogs.
 * DEV: fetch item JSON through the Vite portal proxy with the existing OAuth token.
 * PROD: use standard portalItem loading (same-origin or CORS-enabled portal).
 */
export async function loadProductionWebMap(): Promise<WebMap> {
  const webMapId = getProductionWebMapId()

  if (import.meta.env.DEV) {
    return loadWebMapViaDevProxy(webMapId)
  }

  const webmap = new WebMap({
    portalItem: { id: webMapId },
  })
  await webmap.load()
  return webmap
}

async function loadWebMapViaDevProxy(webMapId: string): Promise<WebMap> {
  const tokenInfo = ensurePortalToken()
  if (!tokenInfo?.token) {
    throw new Error('AUTH_REQUIRED: No Portal OAuth credential available for Web Map load.')
  }

  const base = `${window.location.origin}${DEV_PORTAL_PROXY_PREFIX}/sharing/rest/content/items/${webMapId}`
  const token = tokenInfo.token

  const itemRes = await fetch(`${base}?f=json&token=${encodeURIComponent(token)}`)
  if (!itemRes.ok) {
    throw new Error(`WEBMAP_UNAVAILABLE: Portal item HTTP ${itemRes.status}`)
  }
  const item = await itemRes.json()
  if (item?.error) {
    throw new Error(
      `WEBMAP_UNAVAILABLE: ${item.error.message ?? 'Portal item inaccessible'}`,
    )
  }

  const dataRes = await fetch(`${base}/data?f=json&token=${encodeURIComponent(token)}`)
  if (!dataRes.ok) {
    throw new Error(`WEBMAP_UNAVAILABLE: Portal item data HTTP ${dataRes.status}`)
  }
  const data = await dataRes.json()
  if (data?.error) {
    throw new Error(
      `WEBMAP_UNAVAILABLE: ${data.error.message ?? 'Portal item data inaccessible'}`,
    )
  }

  // fromJSON preserves production layer renderingRule / opacity / visibility.
  // Prefer service URLs already embedded in the Web Map JSON (no Portal item re-fetch).
  const webmap = WebMap.fromJSON(stripPortalItemDependencies(data))
  await webmap.load()
  return webmap
}

/**
 * Read OAuth token from IdentityManager or esriJSAPIOAuth session cache.
 * Avoid checkSignInStatus / Portal.load — those hit Portal CORS from localhost.
 */
function ensurePortalToken(): { token: string; userId?: string } | null {
  const portalUrl = getArcgisPortalUrl()
  const sharing = `${portalUrl}/sharing/rest`

  const existing =
    IdentityManager.findCredential(sharing) ??
    IdentityManager.findCredential(portalUrl) ??
    IdentityManager.findCredential(`${portalUrl}/sharing`)

  if (existing?.token) {
    return { token: existing.token, userId: existing.userId }
  }

  try {
    const oauth = JSON.parse(sessionStorage.getItem('esriJSAPIOAuth') || '{}') as Record<
      string,
      Record<string, { token?: string; userId?: string; expires?: number }>
    >
    const root = oauth['/'] ?? {}
    const entry =
      root[portalUrl] ??
      root[`${portalUrl}/`] ??
      Object.entries(root).find(([key]) => key.includes('gh.space.gov.rw/portal'))?.[1]

    if (!entry?.token) return null

    IdentityManager.registerToken({
      server: sharing,
      token: entry.token,
      userId: entry.userId,
      expires: entry.expires ?? Date.now() + 60 * 60 * 1000,
      ssl: true,
    })
    IdentityManager.registerToken({
      server: portalUrl,
      token: entry.token,
      userId: entry.userId,
      expires: entry.expires ?? Date.now() + 60 * 60 * 1000,
      ssl: true,
    })

    return { token: entry.token, userId: entry.userId }
  } catch {
    return null
  }
}

/**
 * Keep operational layer service URLs; drop portal item refs that would re-hit Portal.
 */
function stripPortalItemDependencies(data: Record<string, unknown>): Record<string, unknown> {
  const clone = structuredClone(data) as {
    operationalLayers?: Array<Record<string, unknown>>
    baseMap?: { baseMapLayers?: Array<Record<string, unknown>> }
  }

  for (const layer of clone.operationalLayers ?? []) {
    if (layer.url) {
      delete layer.itemId
    }
  }
  for (const layer of clone.baseMap?.baseMapLayers ?? []) {
    if (layer.url) {
      delete layer.itemId
    }
  }

  return clone
}
