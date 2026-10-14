import { useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { OAUTH_CALLBACK_PATH } from '@/data/arcgis/config'
import { SignInPage } from '@/features/auth/components/SignInPage'
import { useArcGISAuth } from '@/features/auth/hooks/useArcGISAuth'
import { hasPendingOAuthCallback } from '@/features/auth/services/arcgis-auth.service'

interface AuthGateProps {
  children: ReactNode
}

const AUTO_REDIRECT_KEY = 'rw-water-auth-auto-redirect-at'
/** If Portal bounced us back unauthenticated this recently, stop auto-redirecting. */
const AUTO_REDIRECT_COOLDOWN_MS = 30_000

function recentlyAutoRedirected(): boolean {
  try {
    const at = Number(sessionStorage.getItem(AUTO_REDIRECT_KEY))
    return Number.isFinite(at) && Date.now() - at < AUTO_REDIRECT_COOLDOWN_MS
  } catch {
    return false
  }
}

function markAutoRedirect(): void {
  try {
    sessionStorage.setItem(AUTO_REDIRECT_KEY, String(Date.now()))
  } catch {
    // ignore
  }
}

function clearAutoRedirect(): void {
  try {
    sessionStorage.removeItem(AUTO_REDIRECT_KEY)
  } catch {
    // ignore
  }
}

function StatusMessage({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 items-center justify-center bg-[var(--color-bg-app)] px-6">
      <p className="text-sm text-[var(--color-text-muted)]">{children}</p>
    </div>
  )
}

export function AuthGate({ children }: AuthGateProps) {
  const { status, error, redirectUri, isArcGisMode, signIn } = useArcGISAuth()
  const location = useLocation()
  const finishingOAuth = hasPendingOAuthCallback()
  const onCallback =
    location.pathname === OAUTH_CALLBACK_PATH &&
    (status === 'initializing' || status === 'unauthenticated' || finishingOAuth)

  // Go straight to Portal sign-in instead of showing an intermediate login screen.
  // Guarded so a failed round-trip falls back to the manual page rather than looping.
  // The guard only applies to the round-trip that loaded this page: once signed in,
  // later sign-outs / session expiry must redirect again instead of showing the button.
  const [autoRedirectBlocked, setAutoRedirectBlocked] = useState(recentlyAutoRedirected)
  if (status === 'authenticated' && autoRedirectBlocked) setAutoRedirectBlocked(false)
  const shouldAutoRedirect =
    isArcGisMode && status === 'unauthenticated' && !finishingOAuth && !autoRedirectBlocked

  useEffect(() => {
    if (status === 'authenticated') clearAutoRedirect()
  }, [status])

  useEffect(() => {
    if (!shouldAutoRedirect || location.pathname === OAUTH_CALLBACK_PATH) return
    markAutoRedirect()
    void signIn()
  }, [location.pathname, shouldAutoRedirect, signIn])

  if (!isArcGisMode) {
    return <>{children}</>
  }

  if (status === 'initializing' || onCallback || finishingOAuth || shouldAutoRedirect) {
    return (
      <StatusMessage>
        {status === 'initializing' && !onCallback && !finishingOAuth
          ? 'Checking ArcGIS session…'
          : 'Connecting to ArcGIS Enterprise…'}
      </StatusMessage>
    )
  }

  if (status === 'authenticated') {
    return <>{children}</>
  }

  // Only reached on configuration/OAuth errors or after a failed automatic redirect.
  const showRedirectUri =
    error?.code === 'REDIRECT_URI_CONFIGURATION_REQUIRED' || error?.code === 'CONFIG_MISSING'

  return (
    <SignInPage
      onSignIn={() => {
        markAutoRedirect()
        void signIn()
      }}
      busy={false}
      errorTitle={error?.code ?? null}
      errorDetail={error?.message ?? null}
      guidance={error?.guidance ?? null}
      redirectUri={showRedirectUri ? redirectUri : null}
    />
  )
}
