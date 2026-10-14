import type { ReactNode } from 'react'
import { ArcgisRestError } from '@/data/arcgis/client'
import { dataProvider } from '@/data/provider'
import { cn } from '@/lib/cn'

interface DataStatePanelProps {
  isLoading?: boolean
  error?: Error | null
  isEmpty?: boolean
  emptyMessage?: string
  children: ReactNode
  className?: string
}

function describeError(error: Error): { title: string; detail: string } {
  if (error instanceof ArcgisRestError && error.permissionDenied) {
    return {
      title: 'Permission denied',
      detail:
        'You are signed in, but your ArcGIS account does not have permission to access this water-quality resource.',
    }
  }

  if (error instanceof ArcgisRestError && error.serviceAccessFailed) {
    return {
      title: 'SERVICE_ACCESS_FAILED',
      detail:
        'You are signed in to Portal, but the app could not authorize the federated FeatureServer. Retrying may help; otherwise check server federation/permissions.',
    }
  }

  if (error instanceof ArcgisRestError && error.sessionExpired) {
    return {
      title: 'SESSION_EXPIRED',
      detail: 'Your ArcGIS session has expired. Sign in again to continue.',
    }
  }

  if (error instanceof ArcgisRestError && error.authRequired) {
    return {
      title: 'Authentication required',
      detail: 'Sign in with ArcGIS Enterprise to access protected monitoring data.',
    }
  }

  if (/cors|failed to fetch|network/i.test(error.message)) {
    return {
      title: 'Network / CORS error',
      detail: error.message,
    }
  }

  return {
    title: dataProvider.kind === 'arcgis' ? 'ArcGIS data error' : 'Data error',
    detail: error.message,
  }
}

export function DataStatePanel({
  isLoading,
  error,
  isEmpty,
  emptyMessage = 'No data available.',
  children,
  className,
}: DataStatePanelProps) {
  if (isLoading) {
    return (
      <div
        className={cn(
          'flex h-full min-h-[120px] items-center justify-center px-4 text-sm text-[var(--color-text-muted)]',
          className,
        )}
      >
        Loading monitoring data…
      </div>
    )
  }

  if (error) {
    const described = describeError(error)
    return (
      <div
        className={cn(
          'flex h-full min-h-[120px] flex-col items-center justify-center gap-2 px-6 text-center',
          className,
        )}
        role="alert"
      >
        <p className="text-sm font-semibold text-[var(--color-status-poor)]">{described.title}</p>
        <p className="max-w-md text-xs leading-relaxed text-[var(--color-text-secondary)]">
          {described.detail}
        </p>
        {dataProvider.kind === 'arcgis' ? (
          <p className="text-2xs text-[var(--color-text-muted)]">
            Mock fallback is disabled in ArcGIS mode.
          </p>
        ) : null}
      </div>
    )
  }

  if (isEmpty) {
    return (
      <div
        className={cn(
          'flex h-full min-h-[120px] items-center justify-center px-4 text-sm text-[var(--color-text-muted)]',
          className,
        )}
      >
        {emptyMessage}
      </div>
    )
  }

  return <>{children}</>
}
