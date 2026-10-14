interface SignInPageProps {
  onSignIn: () => void
  busy?: boolean
  errorTitle?: string | null
  errorDetail?: string | null
  guidance?: string | null
  redirectUri?: string | null
}

export function SignInPage({
  onSignIn,
  busy = false,
  errorTitle,
  errorDetail,
  guidance,
  redirectUri,
}: SignInPageProps) {
  return (
    <div className="flex h-full min-h-0 items-center justify-center bg-[var(--color-bg-app)] px-6">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold tracking-tight text-[var(--color-text-primary)]">
          Water Resources Quality Monitoring
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Water Intelligence Platform</p>
        <p className="mt-5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
          Monitor Rwanda&apos;s water resources using satellite-derived environmental observations.
        </p>

        <button
          type="button"
          className="mt-8 w-full rounded-[var(--radius-md)] border border-[var(--color-accent)] bg-[var(--color-bg-selected)] px-4 py-3 text-sm font-medium text-[var(--color-text-primary)] transition-colors duration-[var(--transition-fast)] hover:bg-[var(--color-bg-hover)] disabled:cursor-wait disabled:opacity-70"
          onClick={onSignIn}
          disabled={busy}
        >
          {busy ? 'Connecting to ArcGIS Enterprise…' : 'Sign in with ArcGIS Enterprise'}
        </button>

        <p className="mt-3 text-center text-xs text-[var(--color-text-muted)]">
          Use your organization account to continue.
        </p>

        {errorTitle || errorDetail ? (
          <div
            className="mt-6 rounded-[var(--radius-md)] border border-[var(--color-status-poor)]/40 bg-[var(--color-bg-panel)] px-4 py-3 text-left"
            role="alert"
          >
            {errorTitle ? (
              <p className="text-sm font-semibold text-[var(--color-status-poor)]">{errorTitle}</p>
            ) : null}
            {errorDetail ? (
              <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                {errorDetail}
              </p>
            ) : null}
            {guidance ? (
              <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-muted)]">{guidance}</p>
            ) : null}
            {redirectUri ? (
              <p className="mt-3 break-all font-mono text-2xs text-[var(--color-text-secondary)]">
                Required redirect URI: {redirectUri}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
