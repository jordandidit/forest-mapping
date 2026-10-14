import { useEffect, useState } from 'react'
import type { MapLayerId } from '@/domain/water-quality/types'
import { fullscreenAction } from '@/features/lakes/map-fullscreen'
import { LakeMapDateStack } from '@/features/map/components/MapDateContext'
import type { ObservationDateSelection } from '@/features/observations/observation-explorer'
import type { BasemapMode } from '@/stores/ui-store'
import { cn } from '@/lib/cn'

interface MapToolbarProps {
  lakeId?: string
  basemapMode: BasemapMode
  onBasemapChange: (mode: BasemapMode) => void
  latestSceneDate: string | null
  latestSceneQuality: string | null
  latestSceneCloud: number | null
  latestValidDate: string | null
  dateSelection?: ObservationDateSelection | null
  className?: string
}

const BASEMAPS: { id: BasemapMode; label: string }[] = [
  { id: 'map', label: 'Map' },
  { id: 'satellite', label: 'Satellite' },
  { id: 'terrain', label: 'Terrain' },
]

export function MapToolbar({
  lakeId,
  basemapMode,
  onBasemapChange,
  latestSceneDate,
  latestSceneQuality,
  latestSceneCloud,
  latestValidDate,
  dateSelection = null,
  className,
}: MapToolbarProps) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-3',
        className,
      )}
    >
      <div
        className="map-chrome-panel map-mode-switch pointer-events-auto mt-10 flex p-0.5"
        role="group"
        aria-label="Basemap"
      >
        {BASEMAPS.map((mode) => (
          <button
            key={mode.id}
            type="button"
            className={cn(
              'motion-control rounded-full px-2.5 py-1 text-2xs font-medium tracking-[0.04em]',
              basemapMode === mode.id
                ? 'bg-[var(--color-bg-panel-elevated)] text-[var(--color-text-primary)] shadow-[0_1px_2px_rgba(0,0,0,0.35)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
            )}
            aria-pressed={basemapMode === mode.id}
            onClick={() => onBasemapChange(mode.id)}
          >
            {mode.label}
          </button>
        ))}
      </div>

      <LakeMapDateStack
        lakeId={lakeId}
        dateSelection={dateSelection}
        latestSceneDate={latestSceneDate}
        latestSceneQuality={latestSceneQuality}
        latestSceneCloud={latestSceneCloud}
        latestValidDate={latestValidDate}
      />
    </div>
  )
}

export function LayerLegend({ layer, className }: { layer: MapLayerId; className?: string }) {
  if (layer === 'true_colour') {
    return null
  }

  const title =
    layer === 'ndci'
      ? 'Chlorophyll (NDCI)'
      : layer === 'turbidity'
        ? 'Turbidity (FNU)'
        : layer === 'floating_vegetation'
          ? 'Floating Vegetation'
          : 'Bloom Risk'

  return (
    <div className={cn('map-chrome-panel absolute bottom-3 left-3 z-10 w-[168px] px-2.5 py-1.5', className)}>
      <p className="panel-section-title mb-1.5">{title}</p>
      <div
        className="h-2 w-full rounded-[var(--radius-sm)]"
        style={{ background: 'var(--gradient-ndci)' }}
      />
      <div className="mt-1 flex justify-between type-tech text-[var(--color-text-secondary)]">
        <span>0.00</span>
        <span>0.05</span>
        <span>0.10</span>
        <span>0.15</span>
        <span>0.20</span>
      </div>
    </div>
  )
}

export function MapScaleBar({ className }: { className?: string }) {
  return (
    <div className={cn('map-chrome-panel absolute bottom-3 right-3 z-10 px-2.5 py-1.5', className)}>
      <div className="flex w-28 flex-col gap-0.5">
        <div className="flex h-1.5 overflow-hidden rounded-[1px]">
          <div className="w-1/2 bg-[var(--color-text-primary)]" />
          <div className="w-1/2 border border-[var(--color-text-primary)] bg-transparent" />
        </div>
        <div className="flex justify-between type-tech text-[var(--color-text-secondary)]">
          <span>0</span>
          <span>2</span>
          <span>4 km</span>
        </div>
      </div>
    </div>
  )
}

export interface MapLayersToggle {
  open: boolean
  onToggle: () => void
  /** id of the layers panel element this button controls. */
  controlsId: string
}

export function MapZoomControls({
  className,
  onZoomIn,
  onZoomOut,
  onLocate,
  layers,
}: {
  className?: string
  onZoomIn?: () => void
  onZoomOut?: () => void
  onLocate?: () => void
  layers?: MapLayersToggle
}) {
  return (
    <div
      className={cn(
        'map-chrome-panel absolute right-3 top-[4.5rem] z-10 flex flex-col overflow-hidden',
        className,
      )}
    >
      <button
        type="button"
        className="px-2.5 py-1.5 text-sm text-[var(--color-text-secondary)] transition-colors duration-[var(--transition-fast)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
        aria-label="Zoom in"
        onClick={onZoomIn}
      >
        +
      </button>
      <button
        type="button"
        className="px-2.5 py-1.5 text-sm text-[var(--color-text-secondary)] transition-colors duration-[var(--transition-fast)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
        aria-label="Zoom out"
        onClick={onZoomOut}
      >
        −
      </button>
      <button
        type="button"
        className="px-2.5 py-1.5 text-[var(--color-text-secondary)] transition-colors duration-[var(--transition-fast)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
        aria-label="Locate lake"
        title="Locate lake"
        onClick={onLocate}
      >
        <HomeIcon />
      </button>
      <MapFullscreenButton />
      {layers ? (
        <button
          type="button"
          className={cn(
            'border-t border-[var(--border-float)] px-2.5 py-1.5 transition-colors duration-[var(--transition-fast)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]',
            layers.open
              ? 'bg-[var(--color-bg-panel-elevated)] text-[var(--color-text-primary)]'
              : 'text-[var(--color-text-secondary)]',
          )}
          aria-label="Map layers"
          aria-expanded={layers.open}
          aria-controls={layers.controlsId}
          title="Map layers"
          onClick={layers.onToggle}
        >
          <LayersIcon />
        </button>
      ) : null}
    </div>
  )
}

function MapFullscreenButton() {
  const [active, setActive] = useState(false)

  useEffect(() => {
    const sync = () => {
      setActive(document.fullscreenElement?.hasAttribute('data-map-surface') === true)
    }
    document.addEventListener('fullscreenchange', sync)
    return () => document.removeEventListener('fullscreenchange', sync)
  }, [])

  return (
    <button
      type="button"
      className="px-2.5 py-1.5 text-[var(--color-text-secondary)] transition-colors duration-[var(--transition-fast)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
      aria-label={active ? 'Exit full screen' : 'Full screen'}
      aria-pressed={active}
      title={active ? 'Exit full screen' : 'Full screen'}
      onClick={(event) => {
        const map = event.currentTarget.closest('[data-map-surface]')
        if (!(map instanceof HTMLElement)) return
        if (fullscreenAction(document.fullscreenElement, map) === 'exit') {
          void document.exitFullscreen()
          return
        }
        void map.requestFullscreen().catch(() => {})
      }}
    >
      <FullscreenIcon />
    </button>
  )
}

function FullscreenIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M2 5V2h3M9 2h3v3M12 9v3H9M5 12H2V9"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path
        d="M2 6.5 7 2.5l5 4M3.5 5.5V12h2.5V9h2v3h2.5V5.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LayersIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M7 1.5 1 5l6 3.5L13 5 7 1.5Z" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
      <path d="M1 8.5 7 12l6-3.5" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="round" />
    </svg>
  )
}
