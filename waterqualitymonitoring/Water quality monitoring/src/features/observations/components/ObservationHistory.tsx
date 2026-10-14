import { useState } from 'react'
import type { WaterQualityObservation } from '@/domain/observation/types'
import {
  buildObservationComparison,
  formatHistoryPercent,
  historyMeasurements,
  latestValidObservation,
  observationQualityLabel,
  selectObservation,
  sortObservationsNewestFirst,
} from '@/features/observations/history'
import {
  presentHistoryScreening,
  type HistoryScreeningPresentation,
} from '@/features/observations/history-screening'
import { formatShortDisplayDate, formatTechnicalDate } from '@/lib/format'
import { cn } from '@/lib/cn'

const INITIAL_VISIBLE = 6

interface ObservationHistoryProps {
  observations: WaterQualityObservation[]
  isLoading?: boolean
  error?: Error | null
  selectedId: string | null
  onSelect: (observationId: string) => void
  comparing?: boolean
  compareIds?: readonly string[]
  onComparingChange?: (comparing: boolean) => void
  onToggleCompare?: (observationId: string) => void
  onClearComparison?: () => void
  className?: string
}

export function ObservationHistory({
  observations,
  isLoading = false,
  error = null,
  selectedId,
  onSelect,
  comparing = false,
  compareIds = [],
  onComparingChange,
  onToggleCompare,
  onClearComparison,
  className,
}: ObservationHistoryProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE)
  const sorted = sortObservationsNewestFirst(observations)
  const latestScene = sorted[0] ?? null
  const latestValid = latestValidObservation(sorted)
  const latestSceneQuality = latestScene ? observationQualityLabel(latestScene) : null
  const sceneNeedsQuality =
    latestSceneQuality != null && latestSceneQuality.toLowerCase() !== 'valid'
  const selected = selectObservation(sorted, selectedId)
  const selectedIndex = selected ? sorted.findIndex((item) => item.id === selected.id) : -1
  const shownCount = selectedIndex >= visibleCount ? selectedIndex + 1 : visibleCount
  const visible = sorted.slice(0, shownCount)
  const hiddenCount = Math.max(0, sorted.length - visible.length)
  const comparison = buildObservationComparison(sorted, compareIds)
  const canCompare = sorted.length >= 2

  return (
    <section
      className={cn('flex min-h-0 min-w-0 flex-col bg-transparent', className)}
      aria-labelledby="observation-history-heading"
    >
      <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-3 pb-1 pt-2 sm:px-4">
        <h2 id="observation-history-heading" className="panel-section-title">
          Observation history
        </h2>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="min-w-0 text-xs leading-snug text-[var(--color-text-secondary)]">
            Latest scene {latestScene ? formatTechnicalDate(latestScene.date) : '—'}
            {sceneNeedsQuality ? ` · ${latestSceneQuality}` : null}
            <span className="mx-2 text-[var(--color-border-strong)]">·</span>
            Latest valid {latestValid ? formatTechnicalDate(latestValid.date) : '—'}
            <span className="mx-2 text-[var(--color-border-strong)]">·</span>
            Selected {selected ? formatTechnicalDate(selected.date) : 'Latest'}
          </p>
          {canCompare ? (
            <button
              type="button"
              className={cn(
                'text-xs transition-colors duration-[var(--transition-fast)]',
                comparing
                  ? 'text-[var(--color-accent)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]',
              )}
              aria-pressed={comparing}
              onClick={() => onComparingChange?.(!comparing)}
            >
              Compare
            </button>
          ) : null}
        </div>
      </div>

      {comparison ? (
        <div className="px-4 py-2">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="panel-section-title">Compare observations</h3>
            <button
              type="button"
              className="text-xs text-[var(--color-text-muted)] transition-colors duration-[var(--transition-fast)] hover:text-[var(--color-text-primary)]"
              onClick={() => onClearComparison?.()}
            >
              Clear comparison
            </button>
          </div>
          <div className="mt-1.5 grid grid-cols-[6.5rem_minmax(0,1fr)_minmax(0,1fr)_3.2rem] gap-x-3 text-2xs text-[var(--color-text-muted)]">
            <span />
            <span>{formatTechnicalDate(comparison.leftDate)}</span>
            <span>{formatTechnicalDate(comparison.rightDate)}</span>
            <span className="text-right">Change</span>
          </div>
          {comparison.rows.map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-[6.5rem_minmax(0,1fr)_minmax(0,1fr)_3.2rem] gap-x-3 py-px text-2xs"
            >
              <span className="text-xs text-[var(--color-text-secondary)]">{row.label}</span>
              <span className="type-tech text-[var(--color-text-primary)]">{row.left}</span>
              <span className="type-tech text-[var(--color-text-primary)]">{row.right}</span>
              <span className="type-tech text-right text-[var(--color-text-secondary)]">{row.change}</span>
            </div>
          ))}
        </div>
      ) : comparing ? (
        <p className="px-4 py-2 text-xs leading-snug text-[var(--color-text-secondary)]">
          Select two observations.
        </p>
      ) : null}

      {isLoading ? (
        <p className="px-3 py-3 text-2xs text-[var(--color-text-muted)]">Loading observations…</p>
      ) : error ? (
        <p className="px-3 py-3 text-2xs text-[var(--color-text-muted)]">{error.message}</p>
      ) : sorted.length === 0 ? (
        <p className="px-3 py-3 text-2xs text-[var(--color-text-muted)]">
          No observations for this lake yet.
        </p>
      ) : (
        <div className="panel-scroll min-h-0 min-w-0 flex-1 overflow-auto">
          <div className="grid min-w-[27rem] grid-cols-[4.6rem_minmax(0,1.3fr)_5.2rem_4.4rem_5.2rem_3rem] gap-x-3 px-4 py-1.5 text-2xs text-[var(--color-text-muted)]">
            <span>Date</span>
            <span>Quality</span>
            <span className="text-right">FNU</span>
            <span className="text-right">NDCI</span>
            <span className="text-right">Floating veg.</span>
            <span className="text-right">Clear</span>
          </div>
          <ul className="min-w-[27rem] space-y-0.5 px-1.5 pb-1">
            {visible.map((observation) => {
              const active = selected?.id === observation.id
              const compared = compareIds.includes(observation.id)
              const quality = observationQualityLabel(observation)
              const metrics = historyMeasurements(observation)
              const fnu = presentHistoryScreening({
                metric: 'FNU',
                value: metrics.turbidity,
                level: observation.turbidityLevel,
              })
              const ndci = presentHistoryScreening({
                metric: 'NDCI',
                value: metrics.ndci,
                level: observation.chlorophyllLevel,
              })

              return (
                <li key={observation.id}>
                  <button
                    type="button"
                    className={cn(
                      'motion-control grid w-full grid-cols-[4.6rem_minmax(0,1.3fr)_5.2rem_4.4rem_5.2rem_3rem] gap-x-3 rounded-[var(--radius-control)] px-2.5 py-1 text-left',
                      active
                        ? 'bg-[var(--color-bg-selected)]/70 shadow-[inset_2px_0_0_var(--color-accent)]'
                        : compared
                          ? 'bg-[var(--color-bg-hover)]'
                          : 'hover:bg-[var(--color-bg-hover)]/70',
                    )}
                    aria-pressed={active}
                    title={historyRowTitle(observation, compared)}
                    onClick={() => {
                      onSelect(observation.id)
                      if (comparing) onToggleCompare?.(observation.id)
                    }}
                  >
                    <span className="type-tech text-[var(--color-text-primary)]">
                      {formatShortDisplayDate(observation.date)}
                    </span>
                    <span className="truncate text-xs text-[var(--color-text-secondary)]">
                      {quality ?? '—'}
                    </span>
                    <ScreeningValue presentation={fnu} />
                    <ScreeningValue presentation={ndci} />
                    <span className="type-tech text-right text-[var(--color-text-primary)]">
                      {formatHistoryPercent(metrics.floatingVegetationPercent)}
                    </span>
                    <span className="type-tech text-right text-[var(--color-text-secondary)]">
                      {formatHistoryPercent(metrics.clearPercent)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          {hiddenCount > 0 ? (
            <button
              type="button"
              className="px-4 py-2 text-xs text-[var(--color-accent)] transition-colors duration-[var(--transition-fast)] hover:text-[var(--color-text-primary)]"
              onClick={() => setVisibleCount((count) => count + INITIAL_VISIBLE)}
            >
              Show more
            </button>
          ) : null}
        </div>
      )}
    </section>
  )
}

function ScreeningValue({ presentation }: { presentation: HistoryScreeningPresentation }) {
  return (
    <span
      className={cn(
        'inline-flex w-full items-center justify-end gap-1 text-right font-mono text-xs tabular-nums',
        presentation.className ?? 'text-[var(--color-text-primary)]',
      )}
      style={presentation.color ? { color: presentation.color } : undefined}
      title={presentation.title}
      aria-label={presentation.ariaLabel}
    >
      {presentation.showDot ? (
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: 'currentColor' }}
          aria-hidden="true"
        />
      ) : null}
      {presentation.text}
    </span>
  )
}

function historyRowTitle(observation: WaterQualityObservation, compared: boolean): string {
  const metrics = historyMeasurements(observation)
  const cloud =
    metrics.cloudPercent === null ? '—' : formatHistoryPercent(metrics.cloudPercent)
  const comparison = compared ? ' In comparison.' : ''
  return `${formatTechnicalDate(observation.date)}. Cloud ${cloud}.${comparison}`
}
