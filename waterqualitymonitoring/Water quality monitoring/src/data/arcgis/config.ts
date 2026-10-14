export type DataProviderKind = 'mock' | 'arcgis'

export const ARCGIS_LAYER = {
  waterBodies: 0,
  observations: 1,
  adminLinks: 2,
  indexGuide: 3,
  sceneLog: 4,
  runLog: 5,
  rasterRegistry: 6,
} as const

/** Deployment base path without trailing slash, e.g. `/water-quality` (from Vite `base`). */
export const APP_BASE_PATH = import.meta.env.BASE_URL.replace(/\/+$/, '')

/** Stable OAuth return route (router-relative) — register `<origin>/water-quality/oauth/callback` in Portal. */
export const OAUTH_CALLBACK_PATH = '/oauth/callback'

/** Prefix a router-relative path with the deployment base path for use with `window.location`. */
export function toBrowserPath(routerPath: string): string {
  return `${APP_BASE_PATH}${routerPath}`
}

/** Federated ArcGIS Server REST roots used by IdentityManager. */
export const ARCGIS_SERVER_REST_URL = 'https://gh.space.gov.rw/server/rest'
export const ARCGIS_IMAGE_REST_URL = 'https://gh.space.gov.rw/image/rest'

export function getDataProviderKind(): DataProviderKind {
  const value = (import.meta.env.VITE_DATA_PROVIDER ?? 'mock').toLowerCase()
  return value === 'arcgis' ? 'arcgis' : 'mock'
}

export function getArcgisFeatureServiceUrl(): string {
  const url = import.meta.env.VITE_ARCGIS_FEATURE_SERVICE_URL?.trim()
  if (!url) {
    throw new Error(
      'VITE_ARCGIS_FEATURE_SERVICE_URL is required when VITE_DATA_PROVIDER=arcgis',
    )
  }
  if (/[?&]token=/i.test(url)) {
    throw new Error(
      'VITE_ARCGIS_FEATURE_SERVICE_URL must not include a token query parameter',
    )
  }
  return url.replace(/\/+$/, '')
}

export function getArcgisPortalUrl(): string {
  const url = import.meta.env.VITE_ARCGIS_PORTAL_URL?.trim()
  if (!url) {
    throw new Error('VITE_ARCGIS_PORTAL_URL is required when VITE_DATA_PROVIDER=arcgis')
  }
  return url.replace(/\/+$/, '')
}

export function getArcgisClientId(): string {
  const clientId = import.meta.env.VITE_ARCGIS_CLIENT_ID?.trim()
  if (!clientId) {
    throw new Error('VITE_ARCGIS_CLIENT_ID is required when VITE_DATA_PROVIDER=arcgis')
  }
  return clientId
}

export function getOAuthRedirectUri(): string {
  if (typeof window === 'undefined') {
    return toBrowserPath(OAUTH_CALLBACK_PATH)
  }
  return `${window.location.origin}${toBrowserPath(OAUTH_CALLBACK_PATH)}`
}

/**
 * Derive the ArcGIS Server REST root from a FeatureServer / MapServer URL.
 * IdentityManager credentials are scoped to the server root, not each service.
 */
export function getServerRestRootFromServiceUrl(serviceUrl: string): string {
  const cleaned = serviceUrl.replace(/\/+$/, '')
  const match = cleaned.match(/^(https?:\/\/[^/]+\/[^/]+\/rest)/i)
  if (match?.[1]) return match[1]
  // Fallback for this deployment
  return ARCGIS_SERVER_REST_URL
}

export function validateArcgisAuthConfig(): string[] {
  const missing: string[] = []
  if (!import.meta.env.VITE_ARCGIS_PORTAL_URL?.trim()) {
    missing.push('VITE_ARCGIS_PORTAL_URL')
  }
  if (!import.meta.env.VITE_ARCGIS_CLIENT_ID?.trim()) {
    missing.push('VITE_ARCGIS_CLIENT_ID')
  }
  if (!import.meta.env.VITE_ARCGIS_FEATURE_SERVICE_URL?.trim()) {
    missing.push('VITE_ARCGIS_FEATURE_SERVICE_URL')
  }
  return missing
}

/** Nightly satellite products — avoid aggressive refetching. */
export const QUERY_STALE_TIME_MS = 30 * 60 * 1000
