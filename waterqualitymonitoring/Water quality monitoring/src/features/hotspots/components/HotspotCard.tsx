import type { Hotspot } from '@/domain/hotspot/types'
import { ScientificValue } from '@/components/ui/ScientificValue'
import { cn } from '@/lib/cn'
import { formatNumber, formatStatusLabel } from '@/lib/format'

interface HotspotCardProps {
  hotspot: Hotspot
  index: number
  selected?: boolean
  onSelect: (hotspotId: string) => void
}

function trendText(trend: Hotspot['trend']): string {
  if (trend === 'deteriorating') return 'Increasing'
  if (trend === 'improving') return 'Decreasing'
  if (trend === 'stable') return 'Stable'
  return 'Unknown'
}

export function HotspotCard({ hotspot, index, selected = false, onSelect }: HotspotCardProps) {
  const isPrimary = index === 0

  return (
    <button
      type="button"
      onClick={() => onSelect(hotspot.id)}
      aria-pressed={selected}
      className={cn(
        'flex w-full gap-2.5 border-b border-[var(--color-border-subtle)] px-2 py-2 text-left transition-colors duration-[var(--transition-fast)] last:border-b-0',
        selected
          ? 'bg-[var(--color-bg-selected)]/50'
          : 'hover:bg-[var(--color-bg-hover)]/40',
      )}
    >
      <span
        className={cn(
          'relative h-10 w-10 shrink-0 overflow-hidden rounded-[var(--radius-sm)]',
          isPrimary
            ? 'bg-gradient-to-br from-[#0e8f8a] via-[#e6c229] to-[#ef4444]'
            : 'bg-gradient-to-br from-[#0b3d6e] via-[#3cb44b] to-[#f59e0b]',
        )}
        aria-hidden="true"
      >
        <span
          className={cn(
            'absolute left-1 top-1 h-1.5 w-1.5 rounded-full',
            isPrimary ? 'bg-[var(--color-status-critical)]' : 'bg-[var(--color-status-moderate)]',
          )}
        />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'h-1.5 w-1.5 rounded-full',
              isPrimary ? 'bg-[var(--color-status-critical)]' : 'bg-[var(--color-status-moderate)]',
            )}
          />
          <span className="text-xs font-medium text-[var(--color-text-primary)]">
            {hotspot.label}
          </span>
        </div>

        <dl className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5 text-2xs">
          <div className="flex justify-between gap-1">
            <dt className="text-[var(--color-text-muted)]">NDCI</dt>
            <dd>
              <ScientificValue value={hotspot.value} />
            </dd>
          </div>
          <div className="flex justify-between gap-1">
            <dt className="text-[var(--color-text-muted)]">Area</dt>
            <dd className="font-mono">
              {formatNumber(hotspot.areaKm2, { maximumFractionDigits: 1 })} km²
            </dd>
          </div>
          <div className="flex justify-between gap-1">
            <dt className="text-[var(--color-text-muted)]">Trend</dt>
            <dd
              className={cn(
                hotspot.trend === 'deteriorating'
                  ? 'text-[var(--color-trend-up)]'
                  : 'text-[var(--color-text-secondary)]',
              )}
            >
              {trendText(hotspot.trend)}
            </dd>
          </div>
          <div className="flex justify-between gap-1">
            <dt className="text-[var(--color-text-muted)]">Duration</dt>
            <dd className="font-mono">{hotspot.durationDays} days</dd>
          </div>
          <div className="col-span-2 flex justify-between gap-1">
            <dt className="text-[var(--color-text-muted)]">Confidence</dt>
            <dd>{formatStatusLabel(hotspot.confidence)}</dd>
          </div>
        </dl>
      </div>
    </button>
  )
}
