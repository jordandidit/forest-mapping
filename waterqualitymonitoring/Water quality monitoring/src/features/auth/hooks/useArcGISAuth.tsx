import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useLocation, useNavigate } from 'react-router-dom'
import { getDataProviderKind, getOAuthRedirectUri, OAUTH_CALLBACK_PATH } from '@/data/arcgis/config'
import { DEFAULT_LAKE_ID } from '@/data/mock/lakes'
import {
  checkExistingSession,
  clearReturnPath,
  ensureFederatedServiceCredentials,
  getReturnPath,
  hasPendingOAuthCallback,
  initializeOAuth,
  setReturnPath as persistReturnPath,
  signInWithArcGIS,
  signOutOfArcGIS,
} from '@/features/auth/services/arcgis-auth.service'
import { useAuthStore } from '@/features/auth/store/auth.store'
import type { AuthErrorState, AuthStatus, AuthUser } from '@/features/auth/types/auth.types'

interface ArcGISAuthContextValue {
  status: AuthStatus
  user: AuthUser | null
  error: AuthErrorState | null
  returnPath: string | null
  redirectUri: string | null
  providerKind: 'mock' | 'arcgis'
  isArcGisMode: boolean
  isAuthenticated: boolean
  signIn: () => Promise<void>
  signOut: () => Promise<void>
}

const ArcGISAuthContext = createContext<ArcGISAuthContextValue | null>(null)

function isAuthError(error: unknown): error is Error & { authError: AuthErrorState } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'authError' in error &&
    typeof (error as { authError?: unknown }).authError === 'object'
  )
}

function currentAppPath(pathname: string, search: string, hash: string): string {
  if (pathname === OAUTH_CALLBACK_PATH) {
    return getReturnPath() ?? `/lakes/${DEFAULT_LAKE_ID}`
  }
  return `${pathname}${search}${hash}` || '/'
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const providerKind = getDataProviderKind()
  const oauthStartLock = useRef(false)

  const status = useAuthStore((state) => state.status)
  const user = useAuthStore((state) => state.user)
  const error = useAuthStore((state) => state.error)
  const returnPath = useAuthStore((state) => state.returnPath)
  const redirectUri = useAuthStore((state) => state.redirectUri)
  const setInitializing = useAuthStore((state) => state.setInitializing)
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated)
  const setUnauthenticated = useAuthStore((state) => state.setUnauthenticated)
  const setError = useAuthStore((state) => state.setError)
  const setReturnPathState = useAuthStore((state) => state.setReturnPath)

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      if (providerKind === 'mock') {
        if (!cancelled) {
          setAuthenticated({
            username: 'mock-user',
            fullName: 'Mock Analyst',
            thumbnailUrl: null,
          })
        }
        return
      }

      setInitializing()

      const initialized = initializeOAuth()
      if (!initialized.ok) {
        if (!cancelled) {
          setError(initialized.error, getOAuthRedirectUri())
        }
        return
      }

      const session = await checkExistingSession(initialized.config.portalUrl)
      if (cancelled) return

      if (session.authenticated) {
        try {
          await ensureFederatedServiceCredentials(initialized.config.featureServiceUrl)
        } catch {
          // Keep Portal auth; FeatureServer access is retried by the REST client.
        }
        if (cancelled) return

        setAuthenticated(session.user)
        await queryClient.invalidateQueries()

        if (location.pathname === OAUTH_CALLBACK_PATH) {
          const saved = getReturnPath() ?? `/lakes/${DEFAULT_LAKE_ID}`
          clearReturnPath()
          navigate(saved, { replace: true })
        }
        return
      }

      // Do not auto-start a new OAuth round-trip while a callback hash is present.
      if (hasPendingOAuthCallback()) {
        setInitializing()
        return
      }

      const path = currentAppPath(location.pathname, location.search, location.hash)
      setReturnPathState(path)
      persistReturnPath(path)
      setUnauthenticated(path)
    }

    void bootstrap().catch((err: unknown) => {
      if (cancelled) return
      const message = err instanceof Error ? err.message : 'Authentication initialization failed'
      setError(
        {
          code: 'OAUTH_ERROR',
          message,
          guidance: 'Check Portal connectivity and OAuth application configuration.',
        },
        getOAuthRedirectUri(),
      )
    })

    return () => {
      cancelled = true
    }
    // Bootstrap on mount; StrictMode may remount, so do not permanently latch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providerKind])

  const beginOAuthRedirect = useCallback(async () => {
    if (providerKind === 'mock') return
    if (oauthStartLock.current) return
    oauthStartLock.current = true

    const path =
      returnPath ||
      getReturnPath() ||
      currentAppPath(location.pathname, location.search, location.hash)

    persistReturnPath(path)
    setReturnPathState(path)
    setInitializing()

    try {
      await signInWithArcGIS(path)
      const initialized = initializeOAuth()
      if (!initialized.ok) {
        oauthStartLock.current = false
        setError(initialized.error, getOAuthRedirectUri())
        return
      }
      const session = await checkExistingSession(initialized.config.portalUrl)
      if (session.authenticated) {
        try {
          await ensureFederatedServiceCredentials(initialized.config.featureServiceUrl)
        } catch {
          // Portal auth succeeded; REST client retries federation as needed.
        }
        setAuthenticated(session.user)
        await queryClient.invalidateQueries()
        const saved = getReturnPath() ?? path
        clearReturnPath()
        navigate(saved, { replace: true })
      } else {
        oauthStartLock.current = false
        setUnauthenticated(path)
      }
    } catch (err) {
      oauthStartLock.current = false
      if (isAuthError(err)) {
        setError(err.authError, getOAuthRedirectUri())
        return
      }
      setError(
        {
          code: 'OAUTH_ERROR',
          message: err instanceof Error ? err.message : 'Sign-in failed',
        },
        getOAuthRedirectUri(),
      )
    }
  }, [
    location.hash,
    location.pathname,
    location.search,
    navigate,
    providerKind,
    queryClient,
    returnPath,
    setAuthenticated,
    setError,
    setInitializing,
    setReturnPathState,
    setUnauthenticated,
  ])

  const signIn = useCallback(async () => {
    if (providerKind === 'mock') return

    oauthStartLock.current = false

    const path =
      returnPath ||
      getReturnPath() ||
      currentAppPath(location.pathname, location.search, location.hash)

    persistReturnPath(path)
    setReturnPathState(path)

    if (location.pathname !== OAUTH_CALLBACK_PATH) {
      // Keep status unauthenticated so the callback route can start OAuth.
      navigate(OAUTH_CALLBACK_PATH, { replace: false })
      return
    }

    await beginOAuthRedirect()
  }, [
    beginOAuthRedirect,
    location.hash,
    location.pathname,
    location.search,
    navigate,
    providerKind,
    returnPath,
    setReturnPathState,
  ])

  useEffect(() => {
    if (providerKind !== 'arcgis') return
    if (location.pathname !== OAUTH_CALLBACK_PATH) return
    // Only auto-start from a settled unauthenticated state (not while already initializing).
    if (status !== 'unauthenticated') return
    // Never start a fresh OAuth round-trip while finishing a Portal redirect.
    if (hasPendingOAuthCallback()) return
    void beginOAuthRedirect()
  }, [beginOAuthRedirect, location.pathname, providerKind, status])

  const signOut = useCallback(async () => {
    oauthStartLock.current = false
    signOutOfArcGIS()
    queryClient.clear()
    setUnauthenticated('/')
    navigate('/', { replace: true })
  }, [navigate, queryClient, setUnauthenticated])

  const value = useMemo<ArcGISAuthContextValue>(
    () => ({
      status,
      user,
      error,
      returnPath,
      redirectUri,
      providerKind,
      isArcGisMode: providerKind === 'arcgis',
      isAuthenticated: status === 'authenticated',
      signIn,
      signOut,
    }),
    [
      error,
      providerKind,
      redirectUri,
      returnPath,
      signIn,
      signOut,
      status,
      user,
    ],
  )

  return <ArcGISAuthContext.Provider value={value}>{children}</ArcGISAuthContext.Provider>
}

export function useArcGISAuth(): ArcGISAuthContextValue {
  const value = useContext(ArcGISAuthContext)
  if (!value) {
    throw new Error('useArcGISAuth must be used within AuthProvider')
  }
  return value
}
