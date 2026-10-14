/**
 * GeoHub portal OAuth (implicit / token flow).
 * Uses the registered developer app — no custom password form.
 */
import esriId from '@arcgis/core/identity/IdentityManager.js'
import OAuthInfo from '@arcgis/core/identity/OAuthInfo.js'
import ServerInfo from '@arcgis/core/identity/ServerInfo.js'

const PORTAL_URL = (import.meta.env.VITE_PORTAL_URL || 'https://gh.space.gov.rw/portal').replace(
  /\/$/,
  '',
)
const CLIENT_ID = String(
  import.meta.env.VITE_ARCGIS_CLIENT_ID || 'U2YKEbSfWRrjG16y',
).trim()

/**
 * Known redirects — register each production host on the GeoHub OAuth app.
 * Unknown hosts (Vercel previews, custom domains) use getOAuthRedirectUri() fallback:
 *   {origin}{BASE_URL}oauth/callback
 */
export const OAUTH_REDIRECT_URIS = [
  'http://localhost:5173/forest-mapping/oauth/callback',
  'https://gh.space.gov.rw/forest-mapping/oauth/callback',
]

const PORTAL_SHARING = `${PORTAL_URL}/sharing`
const PORTAL_REST = `${PORTAL_URL}/sharing/rest`

let registered = false

/** Active redirect URI for this host (override with VITE_OAUTH_REDIRECT_URI if set). */
export function getOAuthRedirectUri() {
  const forced = String(import.meta.env.VITE_OAUTH_REDIRECT_URI || '').trim()
  if (forced) return forced.replace(/\/$/, '')

  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const match = OAUTH_REDIRECT_URIS.find((uri) => uri.startsWith(`${origin}/`))
  if (match) return match

  // Fallback: same path under current origin (useful for previews).
  const base = (import.meta.env.BASE_URL || '/forest-mapping/').replace(/\/?$/, '/')
  return `${origin}${base}oauth/callback`.replace(/([^:]\/)\/+/g, '$1')
}

export function getPortalUrl() {
  return PORTAL_URL
}

export function getClientId() {
  return CLIENT_ID
}

export function isOAuthCallbackPath(pathname = window.location.pathname) {
  return /\/oauth\/callback\/?$/.test(pathname)
}

/** True when portal returned an OAuth token/error in the URL (hash or query). */
export function isOAuthReturn() {
  const hash = window.location.hash || ''
  const search = window.location.search || ''
  const blob = `${hash}${search}`
  return (
    /[#&?]access_token=/.test(blob) ||
    hash.startsWith('#access_token=') ||
    /[#&?]error=/.test(blob)
  )
}

export function registerOAuth() {
  if (registered) return
  registered = true

  esriId.registerServers([
    new ServerInfo({
      server: PORTAL_SHARING,
      tokenServiceUrl: `${PORTAL_REST}/generateToken`,
    }),
  ])

  esriId.registerOAuthInfos([
    new OAuthInfo({
      appId: CLIENT_ID,
      portalUrl: PORTAL_URL,
      popup: false,
      flowType: 'auto',
      preserveUrlHash: false,
    }),
  ])
}

function normalizeCredential(cred) {
  if (!cred?.token) throw new Error('OAuth did not return an access token')
  const expiresRaw = cred.expires
  const expires =
    typeof expiresRaw === 'number'
      ? expiresRaw
      : expiresRaw
        ? new Date(expiresRaw).getTime()
        : Date.now() + 60 * 60 * 1000

  return {
    token: cred.token,
    expires,
    username: cred.userId || cred.username || null,
    portalUrl: PORTAL_URL,
  }
}

/** Redirect the browser to the GeoHub portal authorize page. */
export function beginOAuthLogin() {
  registerOAuth()
  if (!CLIENT_ID) {
    throw new Error('VITE_ARCGIS_CLIENT_ID is not configured')
  }

  const authorize = new URL(`${PORTAL_REST}/oauth2/authorize`)
  authorize.searchParams.set('client_id', CLIENT_ID)
  authorize.searchParams.set('response_type', 'token')
  authorize.searchParams.set('expiration', '20160')
  authorize.searchParams.set('redirect_uri', getOAuthRedirectUri())
  window.location.assign(authorize.toString())
}

/**
 * Finish OAuth on /oauth/callback — read token from the URL hash,
 * register it with IdentityManager, return credential for API session exchange.
 */
export async function completeOAuthCallback() {
  registerOAuth()

  const hash = window.location.hash?.replace(/^#/, '') || ''
  const query = window.location.search?.replace(/^\?/, '') || ''
  const params = new URLSearchParams(hash || query)

  if (params.get('error')) {
    const detail = params.get('error_description') || params.get('error')
    throw new Error(detail || 'GeoHub OAuth failed')
  }

  const accessToken = params.get('access_token')
  if (!accessToken) {
    throw new Error('OAuth callback is missing access_token')
  }

  const expiresIn = Number(params.get('expires_in') || 7200)
  const expires = Date.now() + Math.max(60, expiresIn) * 1000
  const username = params.get('username') || params.get('userId') || null

  esriId.registerToken({
    server: PORTAL_REST,
    token: accessToken,
    expires,
    ssl: true,
    userId: username || undefined,
  })

  // Drop secrets and leave /oauth/callback so a refresh does not re-run the exchange.
  const home = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '/') || '/'
  window.history.replaceState({}, document.title, home)

  return normalizeCredential({
    token: accessToken,
    expires,
    userId: username,
  })
}

/** Existing IdentityManager session, if any. */
export async function getExistingOAuthCredential() {
  registerOAuth()
  try {
    const cred = await esriId.checkSignInStatus(PORTAL_SHARING)
    return normalizeCredential(cred)
  } catch {
    return null
  }
}

export async function destroyOAuthCredentials() {
  try {
    registerOAuth()
    esriId.destroyCredentials()
  } catch {
    // ignore
  }
}
