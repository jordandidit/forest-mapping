import {
  LAKE_CONDITION_CHIPS,
  countLakesByCondition,
  type LakeConditionFilter as LakeConditionFilterId,
} from '@/features/lakes/lake-condition-filter'
import { useWaterBodies } from '@/features/lakes/hooks/use-water-bodies'
import { useUiStore } from '@/stores/ui-store'
import { cn } from '@/lib/cn'

const CONDITION_DOT: Record<Exclude<LakeConditionFilterId, 'all'>, string> = {
  good: 'bg-[var(--color-status-good)]',
  fair: 'bg-[var(--color-status-moderate)]',
  poor: 'bg-[var(--color-status-critical)]',
  no_data: 'bg-[var(--color-status-unknown)]',
}

/** Compact condition chips in the top bar. Counts come from loaded lakes. */
export function LakeConditionFilter() {
  const lakeConditionFilter = useUiStore((state) => state.lakeConditionFilter)
  const setLakeConditionFilter = useUiStore((state) => state.setLakeConditionFilter)
  const { data: lakes = [] } = useWaterBodies()
  const counts = countLakesByCondition(lakes)

  return (
    <div
      role="group"
      aria-label="Filter lakes by condition"
      className="flex shrink-0 items-center gap-0.5 rounded-full bg-transparent p-0.5"
    >
      {LAKE_CONDITION_CHIPS.map((chip) => {
        const selected = lakeConditionFilter === chip.id
        return (
          <button
            key={chip.id}
            type="button"
            aria-pressed={selected}
            data-condition-filter={chip.id}
            onClick={() => setLakeConditionFilter(chip.id)}
            className={cn(
              'motion-control inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-sm leading-none',
              selected
                ? 'bg-[var(--color-bg-selected)] font-medium text-[var(--color-text-primary)]'
                : 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]',
            )}
          >
            {chip.id === 'all' ? null : (
              <span
                className={cn('h-1.5 w-1.5 shrink-0 rounded-full', CONDITION_DOT[chip.id])}
                aria-hidden="true"
              />
            )}
            <span>{chip.label}</span>
            <span className="text-[var(--color-text-muted)]">{counts[chip.id]}</span>
          </button>
        )
      })}
    </div>
  )
}
