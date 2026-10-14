export type AuthStatus =
  | 'initializing'
  | 'authenticated'
  | 'unauthenticated'
  | 'error'

export type AuthErrorCode =
  | 'CONFIG_MISSING'
  | 'PORTAL_UNREACHABLE'
  | 'REDIRECT_URI_CONFIGURATION_REQUIRED'
  | 'AUTH_CANCELLED'
  | 'SESSION_EXPIRED'
  | 'SERVICE_ACCESS_FAILED'
  | 'PERMISSION_DENIED'
  | 'OAUTH_ERROR'
  | 'UNKNOWN'

export interface AuthUser {
  username: string
  fullName: string | null
  thumbnailUrl: string | null
}

export interface AuthErrorState {
  code: AuthErrorCode
  message: string
  /** Safe, non-sensitive guidance for operators. */
  guidance?: string
}

export interface ArcgisAuthConfig {
  portalUrl: string
  clientId: string
  featureServiceUrl: string
  redirectUri: string
}
