import type { Hotspot } from '@/domain/hotspot/types'
import { cn } from '@/lib/cn'
import { formatNumber } from '@/lib/format'

interface HotspotLayerProps {
  hotspots: Hotspot[]
  selectedHotspotId: string | null
  onSelectHotspot?: (hotspotId: string) => void
}

/** Approximate positions on the Muhazi placeholder basemap (percent of viewport). */
const MARKER_POSITIONS: Record<string, { top: string; left: string }> = {
  'hotspot-muhazi-01': { top: '36%', left: '70%' },
  'hotspot-muhazi-02': { top: '58%', left: '46%' },
}

function trendLabel(trend: Hotspot['trend']): string {
  if (trend === 'deteriorating') return 'Increasing'
  if (trend === 'improving') return 'Decreasing'
  if (trend === 'stable') return 'Moderate'
  return 'Unknown'
}

export function HotspotLayer({
  hotspots,
  selectedHotspotId,
  onSelectHotspot,
}: HotspotLayerProps) {
  return (
    <div className="absolute inset-0" aria-label="Hotspot markers">
      {hotspots.map((hotspot, index) => {
        const position = MARKER_POSITIONS[hotspot.id] ?? {
          top: `${40 + index * 12}%`,
          left: `${55 + index * 8}%`,
        }
        const selected = selectedHotspotId === hotspot.id
        const isPrimary = index === 0

        return (
          <div
            key={hotspot.id}
            className="absolute z-20 -translate-x-1/2 -translate-y-full"
            style={{ top: position.top, left: position.left }}
          >
            <button
              type="button"
              className="group relative flex flex-col items-center"
              aria-pressed={selected}
              aria-label={`Select ${hotspot.label}`}
              onClick={() => onSelectHotspot?.(hotspot.id)}
            >
              <div
                className={cn(
                  'map-chrome-panel mb-1.5 min-w-[7.5rem] px-2 py-1.5 text-left transition-opacity duration-[var(--transition-fast)]',
                  selected || isPrimary ? 'opacity-100' : 'opacity-90',
                )}
              >
                <p className="text-2xs font-semibold text-[var(--color-text-primary)]">
                  {hotspot.label}
                </p>
                <p className="mt-0.5 font-mono text-2xs text-[var(--color-text-primary)]">
                  NDCI: {formatNumber(hotspot.value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <p
                  className={cn(
                    'mt-0.5 text-2xs',
                    hotspot.trend === 'deteriorating'
                      ? 'text-[var(--color-trend-up)]'
                      : hotspot.trend === 'stable'
                        ? 'text-[var(--color-status-moderate)]'
                        : 'text-[var(--color-text-secondary)]',
                  )}
                >
                  {hotspot.trend === 'deteriorating' ? '↑ ' : ''}
                  {trendLabel(hotspot.trend)}
                </p>
              </div>
              <span
                className={cn(
                  'block h-3.5 w-3.5 rotate-45 border-2 shadow-[var(--shadow-overlay)]',
                  isPrimary
                    ? 'border-white bg-[var(--color-status-critical)]'
                    : 'border-white bg-[var(--color-status-moderate)]',
                  selected ? 'scale-110' : '',
                )}
              />
              <span
                className={cn(
                  'mt-1 h-1.5 w-1.5 rounded-full',
                  isPrimary ? 'bg-[var(--color-status-critical)]' : 'bg-[var(--color-status-moderate)]',
                )}
              />
            </button>
          </div>
        )
      })}
    </div>
  )
}
