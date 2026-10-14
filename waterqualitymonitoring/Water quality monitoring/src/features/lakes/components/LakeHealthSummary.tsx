import type { WaterBody } from '@/domain/water-body/types'
import type { WaterQualityObservation } from '@/domain/observation/types'
import { TrendIndicator } from '@/components/ui/TrendIndicator'
import { formatStatusLabel, formatTechnicalDate } from '@/lib/format'
import { cn } from '@/lib/cn'

interface LakeHealthSummaryProps {
  lake: WaterBody
  observation?: WaterQualityObservation
}

function displayLakeName(name: string): string {
  return name.replace(/^Lake\s+/i, '').toUpperCase()
}

export function LakeHealthSummary({ lake, observation }: LakeHealthSummaryProps) {
  return (
    <section
      className="border-b border-[var(--color-border-subtle)] px-4 py-3"
      aria-labelledby="lake-health-heading"
    >
      <p id="lake-health-heading" className="panel-section-title">
        Lake Health
      </p>

      <div className="mt-2.5 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="type-display truncate">{displayLakeName(lake.name)}</h2>
          <p className="mt-1 text-2xs text-[var(--color-text-muted)]">
            Lake · {lake.province}
            {lake.district ? ` · ${lake.district}` : ''}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <div
            className={cn(
              'inline-flex items-center gap-1.5 type-status',
              lake.status === 'moderate' && 'text-[var(--color-status-moderate)]',
              lake.status === 'good' && 'text-[var(--color-status-good)]',
              lake.status === 'poor' && 'text-[var(--color-status-poor)]',
              lake.status === 'critical' && 'text-[var(--color-status-critical)]',
              lake.status === 'unknown' && 'text-[var(--color-text-muted)]',
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                lake.status === 'moderate' && 'bg-[var(--color-status-moderate)]',
                lake.status === 'good' && 'bg-[var(--color-status-good)]',
                lake.status === 'poor' && 'bg-[var(--color-status-poor)]',
                lake.status === 'critical' && 'bg-[var(--color-status-critical)]',
                lake.status === 'unknown' && 'bg-[var(--color-status-unknown)]',
              )}
              aria-hidden="true"
            />
            {formatStatusLabel(lake.status)}
          </div>
          <div className="mt-1.5">
            <TrendIndicator trend={lake.trend} className="!text-2xs" />
          </div>
        </div>
      </div>

      {observation ? (
        <p className="type-tech mt-3 text-[var(--color-text-muted)]">
          {formatTechnicalDate(observation.date)}
          <span className="mx-1.5 text-[var(--color-border-strong)]">·</span>
          {observation.satellite.toUpperCase()}
          {observation.cloudCover !== null ? (
            <>
              <span className="mx-1.5 text-[var(--color-border-strong)]">·</span>
              CLOUD {Math.round(observation.cloudCover)}%
            </>
          ) : null}
        </p>
      ) : null}

      {lake.summary ? (
        <p className="mt-3 text-xs leading-relaxed text-[var(--color-text-secondary)]">
          {lake.summary}
        </p>
      ) : null}
    </section>
  )
}
