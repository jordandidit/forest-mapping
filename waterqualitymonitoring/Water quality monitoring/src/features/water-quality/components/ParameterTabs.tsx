import type { TimeRangeId } from '@/domain/observation/types'
import type { TrendParameterTab, TrendView } from '@/stores/ui-store'
import { cn } from '@/lib/cn'

const TABS: { id: TrendParameterTab; label: string }[] = [
  { id: 'turbidity', label: 'Turbidity' },
  { id: 'ndci', label: 'Chlorophyll' },
  { id: 'floating_vegetation', label: 'Floating veg.' },
]

interface ParameterTabsProps {
  value: TrendParameterTab
  onChange: (value: TrendParameterTab) => void
}

export function ParameterTabs({ value, onChange }: ParameterTabsProps) {
  return (
    <div role="tablist" aria-label="Parameter" className="flex min-w-0 flex-wrap gap-0.5 rounded-[var(--radius-control)] bg-[var(--color-bg-inset)] p-0.5">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={value === tab.id}
          className={cn(
            'motion-control rounded-[8px] px-2 py-1 text-sm font-medium',
            value === tab.id
              ? 'bg-[var(--color-bg-selected)] text-[var(--color-text-primary)]'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]',
          )}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

const RANGES: TimeRangeId[] = ['1M', '3M', '1Y', '3Y', '5Y']

interface TimeRangeSelectorProps {
  value: TimeRangeId
  onChange: (value: TimeRangeId) => void
}

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div role="group" aria-label="Time range" className="flex min-w-0 flex-wrap gap-0.5 rounded-[var(--radius-control)] bg-[var(--color-bg-inset)] p-0.5">
      {RANGES.map((range) => (
        <button
          key={range}
          type="button"
          className={cn(
            'motion-control rounded-[8px] px-1.5 py-1 text-xs',
            value === range
              ? 'bg-[var(--color-bg-selected)] text-[var(--color-text-primary)]'
              : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-secondary)]',
          )}
          aria-pressed={value === range}
          onClick={() => onChange(range)}
        >
          {range}
        </button>
      ))}
    </div>
  )
}

const VIEWS: { id: TrendView; label: string }[] = [
  { id: 'chart', label: 'Chart' },
  { id: 'table', label: 'Table' },
]

interface TrendViewToggleProps {
  value: TrendView
  onChange: (value: TrendView) => void
}

export function TrendViewToggle({ value, onChange }: TrendViewToggleProps) {
  return (
    <div role="group" aria-label="View" className="flex min-w-0 gap-0.5 rounded-[var(--radius-control)] bg-[var(--color-bg-inset)] p-0.5">
      {VIEWS.map((view) => (
        <button
          key={view.id}
          type="button"
          className={cn(
            'motion-control rounded-[8px] px-2 py-1 text-xs',
            value === view.id
              ? 'bg-[var(--color-bg-selected)] text-[var(--color-text-primary)]'
              : 'text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-secondary)]',
          )}
          aria-pressed={value === view.id}
          onClick={() => onChange(view.id)}
        >
          {view.label}
        </button>
      ))}
    </div>
  )
}
