import type { ObservationAvailabilityItem } from '@/domain/observation/types'
import { formatObservationDate, formatPercent } from '@/lib/format'
import { cn } from '@/lib/cn'

interface ObservationAvailabilityProps {
  items: ObservationAvailabilityItem[]
  rangeLabel?: string
}

export function ObservationAvailability({
  items,
  rangeLabel = 'Recent scenes',
}: ObservationAvailabilityProps) {
  return (
    <section className="flex h-full min-h-0 flex-col" aria-labelledby="availability-heading">
      <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-3 py-2">
        <h2 id="availability-heading" className="panel-section-title">
          Data Availability
        </h2>
        <span className="rounded-[var(--radius-sm)] border border-[var(--color-border)] px-1.5 py-0.5 font-mono text-2xs text-[var(--color-text-secondary)]">
          {rangeLabel}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="px-3 py-6 text-center text-xs text-[var(--color-text-muted)]">
          No observation availability for this lake yet.
        </p>
      ) : (
        <ul className="flex-1 space-y-1 overflow-y-auto p-2">
          {items.map((item) => {
            const usable = item.usability === 'usable'
            const pct = item.usablePixelPercentage
            const qualityText =
              item.qualityLabel || (usable ? 'Valid' : item.usability === 'cloudy' ? 'Cloudy' : 'Partial')

            return (
              <li
                key={item.id}
                className="flex items-center gap-2 rounded-[var(--radius-sm)] px-1.5 py-1.5 text-2xs"
              >
                <span
                  className={cn(
                    'h-2 w-2 shrink-0 rounded-full border',
                    usable
                      ? 'border-[var(--color-status-good)] bg-[var(--color-status-good)]'
                      : 'border-[var(--color-text-muted)] bg-transparent',
                  )}
                  aria-hidden="true"
                />
                <span className="w-[5.5rem] shrink-0 font-mono text-[var(--color-text-primary)]">
                  {formatObservationDate(item.date)}
                </span>
                <span
                  className={cn(
                    'w-14 shrink-0 truncate text-2xs',
                    usable ? 'text-[var(--color-status-good)]' : 'text-[var(--color-text-muted)]',
                  )}
                  title={qualityText}
                >
                  {qualityText}
                </span>
                <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-[1px] bg-[var(--color-bg-hover)]">
                  {pct !== null ? (
                    <div
                      className={cn(
                        'h-full rounded-[1px]',
                        usable ? 'bg-[var(--color-status-good)]' : 'bg-[var(--color-text-muted)]',
                      )}
                      style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
                    />
                  ) : (
                    <div className="availability-stripe h-full w-full" />
                  )}
                </div>
                <span className="w-8 shrink-0 text-right font-mono text-[var(--color-text-secondary)]">
                  {pct !== null ? formatPercent(pct, 0) : '—'}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
