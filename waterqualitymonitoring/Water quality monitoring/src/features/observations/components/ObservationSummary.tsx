import type { WaterQualityObservation } from '@/domain/observation/types'
import {
  formatObservationTime,
  formatPercent,
  formatStatusLabel,
  formatTechnicalDate,
} from '@/lib/format'

interface ObservationSummaryProps {
  observation: WaterQualityObservation
}

export function ObservationSummary({ observation }: ObservationSummaryProps) {
  return (
    <section className="px-4 py-3" aria-labelledby="latest-observation-heading">
      <div className="flex items-center justify-between gap-2">
        <h2 id="latest-observation-heading" className="panel-section-title">
          Latest Observation
        </h2>
        <button
          type="button"
          className="text-2xs text-[var(--color-accent)] transition-colors duration-[var(--transition-fast)] hover:underline"
        >
          View scene →
        </button>
      </div>

      <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-2 text-2xs">
        <Meta label="Date" value={formatTechnicalDate(observation.date)} tech />
        <Meta label="Time" value={formatObservationTime(observation.acquiredAt)} tech />
        <Meta
          label="Cloud cover"
          value={
            observation.cloudCover === null ? '—' : formatPercent(observation.cloudCover)
          }
          tech
        />
        <Meta
          label="Usable pixels"
          value={
            observation.usablePixelPercentage === null
              ? '—'
              : formatPercent(observation.usablePixelPercentage, 0)
          }
          tech
        />
        <Meta
          label="Satellite"
          value={observation.satellite.toUpperCase()}
          tech
          className="col-span-1"
        />
        <Meta
          label="Quality"
          value={(observation.qualityLabel ?? formatStatusLabel(observation.quality)).toUpperCase()}
          tech
        />
      </div>
    </section>
  )
}

function Meta({
  label,
  value,
  className,
  tech = false,
}: {
  label: string
  value: string
  className?: string
  tech?: boolean
}) {
  return (
    <div className={className}>
      <p className="text-2xs text-[var(--color-text-muted)]">{label}</p>
      <p
        className={
          tech
            ? 'type-tech mt-0.5 text-[var(--color-text-primary)]'
            : 'mt-0.5 text-xs text-[var(--color-text-primary)]'
        }
      >
        {value}
      </p>
    </div>
  )
}
