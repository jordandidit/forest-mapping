import type { MapErrorState, MapLoadPhase } from '@/features/map/types'
import { cn } from '@/lib/cn'

const PHASE_LABELS: Record<Exclude<MapLoadPhase, 'ready' | 'error'>, string> = {
  initializing: 'Initializing map…',
  loading_webmap: 'Loading production web map…',
  loading_raster: 'Loading water quality raster…',
}

export function MapStatusOverlay({
  phase,
  error,
  unsupportedLayerMessage,
}: {
  phase: MapLoadPhase
  error: MapErrorState | null
  unsupportedLayerMessage?: string | null
}) {
  if (phase === 'ready' && !error?.fatal && !unsupportedLayerMessage) {
    return null
  }

  if (phase !== 'ready' && phase !== 'error') {
    return (
      <div
        className="absolute inset-0 z-20 flex items-center justify-center bg-[rgba(8,12,20,0.72)] backdrop-blur-[2px]"
        role="status"
        aria-live="polite"
      >
        <div className="rounded-[var(--radius-control)] border border-[var(--border-float)] bg-[rgba(7,11,20,0.94)] px-4 py-3 text-center shadow-[var(--shadow-overlay)]">
          <p className="text-xs font-medium text-[var(--color-text-primary)]">
            {PHASE_LABELS[phase]}
          </p>
          <p className="mt-1 text-2xs text-[var(--color-text-muted)]">
            ArcGIS production services
          </p>
        </div>
      </div>
    )
  }

  if (error?.fatal) {
    return (
      <div
        className="absolute inset-0 z-20 flex items-center justify-center bg-[rgba(8,12,20,0.82)] p-4"
        role="alert"
      >
        <div className="max-w-sm rounded-[var(--radius-control)] border border-[var(--border-float)] bg-[rgba(7,11,20,0.95)] px-4 py-3 shadow-[var(--shadow-overlay)]">
          <p className="text-2xs font-semibold uppercase tracking-[0.08em] text-[var(--color-danger,#f07178)]">
            {error.code.replace(/_/g, ' ')}
          </p>
          <p className="mt-1.5 text-xs text-[var(--color-text-primary)]">{error.message}</p>
          <p className="mt-2 text-2xs text-[var(--color-text-muted)]">
            Fake scientific imagery is not shown in ArcGIS mode.
          </p>
        </div>
      </div>
    )
  }

  if (unsupportedLayerMessage || (error && !error.fatal)) {
    return (
      <div
        className={cn(
          'pointer-events-none absolute bottom-14 left-1/2 z-20 w-[min(420px,calc(100%-1.5rem))] -translate-x-1/2',
        )}
      >
        <div className="rounded-[var(--radius-control)] border border-[var(--border-float)] bg-[rgba(7,11,20,0.94)] px-3 py-2 text-center text-2xs text-[var(--color-text-secondary)] shadow-[var(--shadow-overlay)]">
          {unsupportedLayerMessage ?? error?.message}
        </div>
      </div>
    )
  }

  return null
}
