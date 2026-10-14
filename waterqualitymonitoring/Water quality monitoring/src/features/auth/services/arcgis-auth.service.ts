import IdentityManager from '@arcgis/core/identity/IdentityManager.js'
import OAuthInfo from '@arcgis/core/identity/OAuthInfo.js'
import Portal from '@arcgis/core/portal/Portal.js'
import ServerInfo from '@arcgis/core/identity/ServerInfo.js'
import esriConfig from '@arcgis/core/config.js'
import {
  ARCGIS_IMAGE_REST_URL,
  ARCGIS_SERVER_REST_URL,
  getArcgisClientId,
  getArcgisFeatureServiceUrl,
  getArcgisPortalUrl,
  getOAuthRedirectUri,
  getServerRestRootFromServiceUrl,
  OAUTH_CALLBACK_PATH,
  toBrowserPath,
  validateArcgisAuthConfig,
} from '@/data/arcgis/config'
import type {
  ArcgisAuthConfig,
  AuthErrorState,
  AuthUser,
} from '@/features/auth/types/auth.types'

const RETURN_PATH_KEY = 'rw-water-auth-return-path'
const OAUTH_REGISTERED_FLAG = 'rw-water-oauth-registered'
/** Set on explicit sign-out so Portal asks for credentials instead of reusing its SSO session. */
const FORCE_LOGIN_KEY = 'rw-water-force-login'

let oauthInitialized = false

export function sanitizeAuthMessage(message: string): string {
  return message
    .replace(/([?&]token=)[^&\s#]+/gi, '$1[REDACTED]')
    .replace(/(Bearer\s+)[A-Za-z0-9._~+/=-]+/gi, '$1[REDACTED]')
    .replace(/(access_token["']?\s*[:=]\s*["']?)[^"'&\s]+/gi, '$1[REDACTED]')
}

export function getReturnPath(): string | null {
  try {
    return sessionStorage.getItem(RETURN_PATH_KEY)
  } catch {
    return null
  }
}

export function setReturnPath(path: string): void {
  try {
    sessionStorage.setItem(RETURN_PATH_KEY, path)
  } catch {
    // Ignore storage failures — OAuth can still proceed.
  }
}

export function clearReturnPath(): void {
  try {
    sessionStorage.removeItem(RETURN_PATH_KEY)
  } catch {
    // ignore
  }
}

function shouldForceLogin(): boolean {
  try {
    return sessionStorage.getItem(FORCE_LOGIN_KEY) === '1'
  } catch {
    return false
  }
}

function setForceLogin(value: boolean): void {
  try {
    if (value) sessionStorage.setItem(FORCE_LOGIN_KEY, '1')
    else sessionStorage.removeItem(FORCE_LOGIN_KEY)
  } catch {
    // ignore
  }
}

export function hasPendingOAuthCallback(): boolean {
  if (typeof window === 'undefined') return false
  const { pathname, hash, search } = window.location
  if (pathname !== toBrowserPath(OAUTH_CALLBACK_PATH)) return false
  return (
    /access_token=/i.test(hash) ||
    /[#&?]code=/i.test(`${hash}${search}`) ||
    /[#&?]error=/i.test(`${hash}${search}`)
  )
}

export function resolveArcgisAuthConfig():
  | { ok: true; config: ArcgisAuthConfig }
  | { ok: false; error: AuthErrorState } {
  const missing = validateArcgisAuthConfig()
  if (missing.length > 0) {
    return {
      ok: false,
      error: {
        code: 'CONFIG_MISSING',
        message: `Missing ArcGIS OAuth configuration: ${missing.join(', ')}`,
        guidance:
          'Set VITE_ARCGIS_PORTAL_URL, VITE_ARCGIS_CLIENT_ID, and VITE_ARCGIS_FEATURE_SERVICE_URL in your local .env file. Do not commit Client Secrets or tokens.',
      },
    }
  }

  try {
    return {
      ok: true,
      config: {
        portalUrl: getArcgisPortalUrl(),
        clientId: getArcgisClientId(),
        featureServiceUrl: getArcgisFeatureServiceUrl(),
        redirectUri: getOAuthRedirectUri(),
      },
    }
  } catch (error) {
    return {
      ok: false,
      error: {
        code: 'CONFIG_MISSING',
        message: sanitizeAuthMessage(
          error instanceof Error ? error.message : 'Invalid ArcGIS OAuth configuration',
        ),
      },
    }
  }
}

function portalSharingUrl(portalUrl: string): string {
  return `${portalUrl.replace(/\/+$/, '')}/sharing`
}

function portalSharingRestUrl(portalUrl: string): string {
  return `${portalSharingUrl(portalUrl)}/rest`
}

function registerFederatedServers(portalUrl: string, featureServiceUrl: string): void {
  const portalTokenService = `${portalSharingRestUrl(portalUrl)}/generateToken`
  const featureServerRoot = getServerRestRootFromServiceUrl(featureServiceUrl)

  const servers = [
    new ServerInfo({
      server: featureServerRoot,
      tokenServiceUrl: portalTokenService,
      hasServer: true,
    }),
    new ServerInfo({
      server: ARCGIS_SERVER_REST_URL,
      tokenServiceUrl: portalTokenService,
      hasServer: true,
    }),
    new ServerInfo({
      server: ARCGIS_IMAGE_REST_URL,
      tokenServiceUrl: portalTokenService,
      hasServer: true,
    }),
  ]

  IdentityManager.registerServers(servers)
}

/**
 * Register OAuthInfo once for the application lifetime.
 * IdentityManager owns credential storage — do not mirror tokens in app state.
 */
export function initializeOAuth():
  | { ok: true; config: ArcgisAuthConfig }
  | { ok: false; error: AuthErrorState } {
  const resolved = resolveArcgisAuthConfig()
  if (!resolved.ok) return resolved

  if (!oauthInitialized) {
    esriConfig.portalUrl = resolved.config.portalUrl

    const info = new OAuthInfo({
      appId: resolved.config.clientId,
      portalUrl: resolved.config.portalUrl,
      popup: false,
      preserveUrlHash: true,
    })
    IdentityManager.registerOAuthInfos([info])
    registerFederatedServers(resolved.config.portalUrl, resolved.config.featureServiceUrl)
    oauthInitialized = true
    try {
      sessionStorage.setItem(OAUTH_REGISTERED_FLAG, '1')
    } catch {
      // ignore
    }
  }

  return resolved
}

export async function checkExistingSession(
  portalUrl: string,
): Promise<{ authenticated: boolean; user: AuthUser | null }> {
  try {
    const sharingUrl = portalSharingUrl(portalUrl)
    await Promise.race([
      IdentityManager.checkSignInStatus(sharingUrl),
      new Promise<never>((_, reject) => {
        window.setTimeout(() => reject(new Error('SESSION_CHECK_TIMEOUT')), 12_000)
      }),
    ])
    const user = await loadPortalUser(portalUrl)
    setForceLogin(false)
    return { authenticated: true, user }
  } catch {
    // Timeout, network failure, or no credential → treat as unauthenticated.
    return { authenticated: false, user: null }
  }
}

async function loadPortalUser(portalUrl: string): Promise<AuthUser | null> {
  try {
    const portal = new Portal({ url: portalUrl })
    portal.authMode = 'immediate'
    await portal.load()
    const user = portal.user
    if (!user) return null

    return {
      username: user.username,
      fullName: user.fullName || null,
      thumbnailUrl: user.thumbnailUrl || null,
    }
  } catch {
    // Signed in at IdentityManager level but portal user metadata unavailable.
    const credential = IdentityManager.findCredential(portalSharingUrl(portalUrl))
    if (!credential?.userId) return null
    return {
      username: credential.userId,
      fullName: null,
      thumbnailUrl: null,
    }
  }
}

export function isPortalSessionActive(portalUrl = getArcgisPortalUrl()): boolean {
  try {
    const credential = IdentityManager.findCredential(portalSharingUrl(portalUrl))
    if (!credential?.token) return false
    if (credential.expires && Date.now() > credential.expires) return false
    return true
  } catch {
    return false
  }
}

function registerPortalTokenForFederatedServers(
  portalUrl: string,
  featureServiceUrl: string,
): boolean {
  const portalCredential = IdentityManager.findCredential(portalSharingUrl(portalUrl))
  if (!portalCredential?.token) return false

  const serverRoot = getServerRestRootFromServiceUrl(featureServiceUrl)
  const servers = [
    `${serverRoot}/services`,
    serverRoot,
    `${ARCGIS_SERVER_REST_URL}/services`,
    ARCGIS_SERVER_REST_URL,
    `${ARCGIS_IMAGE_REST_URL}/services`,
    ARCGIS_IMAGE_REST_URL,
  ]

  for (const server of servers) {
    IdentityManager.registerToken({
      server,
      token: portalCredential.token,
      userId: portalCredential.userId,
      expires: portalCredential.expires ?? undefined,
      ssl: true,
    })
  }
  return true
}

/**
 * Exchange the Portal OAuth session for federated ArcGIS Server credentials.
 * Required for FeatureServer / ImageServer hosts under Enterprise federation.
 */
export async function ensureFederatedServiceCredentials(
  featureServiceUrl = getArcgisFeatureServiceUrl(),
): Promise<void> {
  const portalUrl = getArcgisPortalUrl()
  const serverRoot = getServerRestRootFromServiceUrl(featureServiceUrl)
  const targets = [
    `${serverRoot}/services`,
    featureServiceUrl.replace(/\/+$/, ''),
    `${ARCGIS_SERVER_REST_URL}/services`,
    `${ARCGIS_IMAGE_REST_URL}/services`,
  ]

  let lastError: unknown
  for (const target of targets) {
    try {
      const existing = IdentityManager.findCredential(target)
      if (existing?.token && (!existing.expires || Date.now() < existing.expires)) {
        return
      }
      await IdentityManager.getCredential(target)
      return
    } catch (error) {
      lastError = error
    }
  }

  // Fallback used by many Enterprise apps: reuse the Portal token for federated
  // Hosted services when server-token exchange is blocked (often CORS).
  if (registerPortalTokenForFederatedServers(portalUrl, featureServiceUrl)) {
    return
  }

  const message = sanitizeAuthMessage(
    lastError instanceof Error
      ? lastError.message
      : 'Unable to obtain federated ArcGIS Server credential',
  )
  throw Object.assign(new Error(message), {
    authError: {
      code: 'SERVICE_ACCESS_FAILED' as const,
      message:
        'Signed in to Portal, but the application could not obtain a credential for the federated FeatureServer.',
      guidance:
        'Confirm the FeatureServer is federated with the Portal and your account can access Hosted/RW_WaterQuality_Monitor_View.',
    } satisfies AuthErrorState,
  })
}

/**
 * Start redirect-based ArcGIS Enterprise OAuth.
 * Portal owns the credential UI — never collect username/password in React.
 */
export async function signInWithArcGIS(returnPath: string): Promise<void> {
  const initialized = initializeOAuth()
  if (!initialized.ok) {
    throw Object.assign(new Error(initialized.error.message), {
      authError: initialized.error,
    })
  }

  setReturnPath(returnPath || '/')

  // Never wipe credentials while IdentityManager is finishing an OAuth redirect
  // callback — that caused the sign-in → SESSION_EXPIRED loop.
  if (!hasPendingOAuthCallback()) {
    IdentityManager.destroyCredentials()
    try {
      sessionStorage.removeItem('esriJSAPIOAuth')
    } catch {
      // ignore
    }
  }

  // `forceLogin` (→ force_login=true) exists at runtime but is missing from the SDK typings.
  const oAuthInfo = IdentityManager.findOAuthInfo(initialized.config.portalUrl) as
    | (OAuthInfo & { forceLogin?: boolean })
    | null
  if (oAuthInfo) oAuthInfo.forceLogin = shouldForceLogin()

  try {
    await IdentityManager.getCredential(portalSharingUrl(initialized.config.portalUrl), {
      oAuthPopupConfirmation: false,
    })
    // Warm federated server credential before protected queries run.
    await ensureFederatedServiceCredentials(initialized.config.featureServiceUrl)
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'authError' in error &&
      typeof (error as { authError?: unknown }).authError === 'object'
    ) {
      throw error
    }

    const message = sanitizeAuthMessage(
      error instanceof Error ? error.message : 'ArcGIS sign-in failed',
    )

    if (/cancel|aborted|user.*denied/i.test(message)) {
      const authError: AuthErrorState = {
        code: 'AUTH_CANCELLED',
        message: 'Sign-in was cancelled.',
        guidance: 'Choose Sign in with ArcGIS Enterprise to try again.',
      }
      throw Object.assign(new Error(authError.message), { authError })
    }

    if (/redirect_uri|redirect uri|invalid redirect/i.test(message)) {
      const authError: AuthErrorState = {
        code: 'REDIRECT_URI_CONFIGURATION_REQUIRED',
        message: 'Portal rejected the OAuth redirect URI.',
        guidance: `Add this exact redirect URI to the ArcGIS Application item: ${initialized.config.redirectUri}`,
      }
      throw Object.assign(new Error(authError.message), { authError })
    }

    if (/failed to fetch|network|cors/i.test(message)) {
      const authError: AuthErrorState = {
        code: 'PORTAL_UNREACHABLE',
        message: 'Unable to reach ArcGIS Enterprise Portal.',
        guidance: `Verify connectivity to ${initialized.config.portalUrl}`,
      }
      throw Object.assign(new Error(authError.message), { authError })
    }

    const authError: AuthErrorState = {
      code: 'OAUTH_ERROR',
      message,
      guidance: 'Confirm the Client ID and Portal URL, then try again.',
    }
    throw Object.assign(new Error(authError.message), { authError })
  }
}

export function signOutOfArcGIS(): void {
  IdentityManager.destroyCredentials()
  clearReturnPath()
  setForceLogin(true)
  try {
    sessionStorage.removeItem('esriJSAPIOAuth')
  } catch {
    // ignore
  }
}

export function markSessionExpired(): AuthErrorState {
  return {
    code: 'SESSION_EXPIRED',
    message: 'Your ArcGIS session has expired.',
    guidance: 'Sign in again with ArcGIS Enterprise to continue.',
  }
}

export function markServiceAccessFailed(): AuthErrorState {
  return {
    code: 'SERVICE_ACCESS_FAILED',
    message:
      'You are signed in, but the application could not authorize access to the water-quality FeatureServer.',
    guidance:
      'Stay signed in and retry. If this persists, ask a Portal admin to confirm federation and layer permissions.',
  }
}

export function markPermissionDenied(resourceLabel = 'this water-quality resource'): AuthErrorState {
  return {
    code: 'PERMISSION_DENIED',
    message: `You are signed in, but your ArcGIS account does not have permission to access ${resourceLabel}.`,
    guidance: 'Contact your Portal administrator if you need access.',
  }
}
