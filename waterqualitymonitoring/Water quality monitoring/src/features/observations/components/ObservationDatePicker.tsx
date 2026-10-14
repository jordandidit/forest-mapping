import { useState } from 'react'
import { observationQualityLabel, selectObservation } from '@/features/observations/history'
import {
  formatExplorerDate,
  type ObservationDateSelection,
} from '@/features/observations/observation-explorer'
import {
  datePickerSelection,
  NO_OBSERVATION_FOR_DATE,
} from '@/features/observations/temporal-selection'

/** Calendar control for the current lake. Empty means Latest. */
export function ObservationDatePicker({
  observations,
  selectedObservationId,
  onSelectObservation,
  onReturnToLatest,
}: ObservationDateSelection) {
  const [rejectedDate, setRejectedDate] = useState<string | null>(null)
  const selected = selectObservation(observations, selectedObservationId)
  const quality = selected ? observationQualityLabel(selected) : null
  const value = rejectedDate ?? selected?.date ?? ''

  return (
    <div className="relative flex items-center gap-2">
      <label className="text-xs text-[var(--color-text-muted)]" htmlFor="nav-observation-date">
        Date
      </label>
      <input
        id="nav-observation-date"
        type="date"
        value={value}
        aria-label={
          selected
            ? `Date ${formatExplorerDate(selected.date)}${quality ? ` · ${quality}` : ''}`
            : 'Date Latest'
        }
        aria-invalid={rejectedDate ? true : undefined}
        className="h-8 rounded-[var(--radius-control)] border border-transparent bg-transparent px-2.5 text-xs text-[var(--color-text-primary)] shadow-none transition-colors duration-[var(--transition-fast)] hover:bg-[var(--color-bg-hover)]"
        style={{ colorScheme: 'dark' }}
        onChange={(event) => {
          const date = event.target.value
          const next = datePickerSelection(observations, date, selectedObservationId)
          if (next.message) {
            setRejectedDate(date)
            return
          }
          setRejectedDate(null)
          if (next.selectedObservationId) onSelectObservation(next.selectedObservationId)
          else onReturnToLatest()
        }}
      />
      {selected && quality ? (
        <span className="hidden text-2xs text-[var(--color-text-secondary)] sm:inline">
          {quality}
        </span>
      ) : !selected ? (
        <span className="text-2xs text-[var(--color-text-primary)]">Latest</span>
      ) : null}
      {selected ? (
        <button
          type="button"
          className="rounded-[var(--radius-control)] px-2 py-1 text-xs text-[var(--color-accent)] transition-colors duration-[var(--transition-fast)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
          onClick={() => {
            setRejectedDate(null)
            onReturnToLatest()
          }}
        >
          Latest
        </button>
      ) : null}
      {rejectedDate ? (
        <p
          role="status"
          className="absolute left-0 top-full z-30 mt-1 w-56 rounded-[var(--radius-control)] border border-[var(--border-float)] bg-[var(--color-bg-panel-elevated)] px-2 py-1.5 text-2xs text-[var(--color-text-primary)] shadow-[var(--shadow-overlay)]"
        >
          {NO_OBSERVATION_FOR_DATE}
        </p>
      ) : null}
    </div>
  )
}
