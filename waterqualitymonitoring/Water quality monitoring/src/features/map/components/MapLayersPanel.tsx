import type { ReferenceLayerKey, ReferenceLayerRow } from '@/features/map/arcgis/layer-inventory'
import { cn } from '@/lib/cn'

export type MapLayersPanelStatus = 'loading' | 'ready' | 'error'

interface MapLayersPanelProps {
  id: string
  open: boolean
  onClose: () => void
  status: MapLayersPanelStatus
  references: ReferenceLayerRow[]
  onToggleReference: (key: ReferenceLayerKey) => void
  className?: string
}

/**
 * On-brand layer inventory and toggle surface.
 * Replaces the collapsed Esri LayerList widget as the single layer-management UI.
 * Lists working reference layers only. Satellite, turbidity and chlorophyll are switched
 * by the map-mode selector so they cannot be combined by hand.
 * Quantitative legends live on the map overlay (ProductionLegend), not here.
 * Opened from the layers button in the map's right-side toolbar (MapZoomControls).
 */
export function MapLayersPanel({
  id,
  open,
  onClose,
  status,
  references,
  onToggleReference,
  className,
}: MapLayersPanelProps) {
  return (
    <div
      id={id}
      role="region"
      aria-label="Map layers"
      hidden={!open}
      className={cn('map-chrome-panel pointer-events-auto', className)}
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose()
      }}
    >
      <div className="map-layers-panel-body max-h-[min(60vh,22rem)] w-[min(17rem,calc(100vw-5.5rem))] overflow-y-auto px-2.5 py-2">
        {status === 'loading' ? (
          <p className="py-1 text-2xs text-[var(--color-text-secondary)]">Loading layers…</p>
        ) : status === 'error' ? (
          <p className="py-1 text-2xs text-[var(--color-text-secondary)]">
            Layers unavailable until the map finishes loading.
          </p>
        ) : (
          <section aria-labelledby="layers-reference-heading">
            <p id="layers-reference-heading" className="panel-section-title">
              Reference layers
            </p>
            {references.length ? (
              <ul className="mt-1.5 space-y-2">
                {references.map((row) => (
                  <li key={row.key}>
                    <label className="flex items-start gap-1.5 text-2xs">
                      <input
                        type="checkbox"
                        className="mt-0.5"
                        checked={row.visible}
                        disabled={row.locked}
                        onChange={() => onToggleReference(row.key)}
                      />
                      <span>
                        <span className="block text-[var(--color-text-primary)]">
                          {row.label}
                          {row.locked ? (
                            <span className="ml-1 text-2xs uppercase tracking-[0.04em] text-[var(--color-text-muted)]">
                              Always on
                            </span>
                          ) : null}
                        </span>
                        <span className="block text-2xs leading-snug text-[var(--color-text-secondary)]">
                          {row.description}
                        </span>
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1.5 text-2xs text-[var(--color-text-secondary)]">
                No reference layers available.
              </p>
            )}
            <p className="mt-3 border-t border-[var(--color-border-subtle)] pt-2 text-2xs leading-snug text-[var(--color-text-muted)]">
              Satellite, turbidity and chlorophyll are switched with the map mode selector.
            </p>
          </section>
        )}
      </div>
    </div>
  )
}
