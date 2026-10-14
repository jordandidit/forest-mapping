import type { MapLegendModel } from '@/features/map/types'
import { cn } from '@/lib/cn'

/** Legend content, reusable both as a floating map overlay and inline in the layers panel. */
export function LegendBody({ legend, className }: { legend: MapLegendModel; className?: string }) {
  const gradient =
    legend.stops.length > 1
      ? `linear-gradient(90deg, ${legend.stops.map((s) => s.color).join(', ')})`
      : legend.stops[0]?.color

  return (
    <div className={className}>
      <p className="panel-section-title">{legend.title}</p>
      {legend.subtitle ? (
        <p className="mt-0.5 text-2xs leading-snug text-[var(--color-text-secondary)]">
          {legend.subtitle}
        </p>
      ) : null}
      {gradient ? (
        <div
          className="mt-2 h-2 w-full rounded-[var(--radius-sm)]"
          style={{ background: gradient }}
        />
      ) : null}
      {legend.stops.length ? (
        <div className="mt-1 flex justify-between gap-1 type-tech text-[var(--color-text-secondary)]">
          {legend.stops
            .filter((stop) => stop.label)
            .map((stop) => (
              <span key={`${stop.label}-${stop.color}`} className="max-w-[30%] text-center leading-tight">
                {stop.label}
              </span>
            ))}
        </div>
      ) : null}
      <p className="mt-1.5 text-2xs leading-snug text-[var(--color-text-muted)]">
        {legend.normalization === 'per-lake'
          ? 'Normalized index — not FNU / mg/m³'
          : 'Index classes — not calibrated lab units'}
      </p>
    </div>
  )
}

export function ProductionLegend({
  legend,
  className,
}: {
  legend: MapLegendModel | null
  className?: string
}) {
  if (!legend || legend.normalization === 'none') {
    return null
  }

  return (
    <div
      className={cn(
        'map-chrome-panel absolute bottom-3 left-3 z-10 w-[180px] px-2.5 py-1.5',
        className,
      )}
    >
      <LegendBody legend={legend} />
    </div>
  )
}
