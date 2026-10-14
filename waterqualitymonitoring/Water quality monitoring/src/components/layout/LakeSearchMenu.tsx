import {
  lakePlaceLabel,
  type LakeSearchRecord,
} from '@/features/lakes/lake-search'
import { cn } from '@/lib/cn'

export function LakeSearchMenu({
  id = 'lake-search-results',
  query,
  results,
  activeIndex,
  loading = false,
  onHighlight,
  onSelect,
}: {
  id?: string
  query: string
  results: readonly LakeSearchRecord[]
  activeIndex: number
  loading?: boolean
  onHighlight?: (index: number) => void
  onSelect: (lakeId: string) => void
}) {
  return (
    <ul
      id={id}
      role="listbox"
      aria-label="Matching lakes"
      className="absolute right-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-[var(--radius-control)] border border-[var(--border-float)] bg-[var(--color-bg-panel-elevated)] py-1 shadow-[var(--shadow-overlay)]"
    >
      {results.length === 0 ? (
        <li className="px-2.5 py-2 text-xs text-[var(--color-text-muted)]">
          {loading && query.trim() ? 'Searching…' : 'No lakes found'}
        </li>
      ) : (
        results.map((lake, index) => {
          const active = index === activeIndex
          return (
            <li key={lake.id}>
              <button
                id={`${id}-${lake.id}`}
                type="button"
                role="option"
                aria-selected={active}
                className={cn(
                  'flex w-full items-center gap-2 px-2.5 py-1.5 text-left',
                  active ? 'bg-[var(--color-bg-selected)]' : 'hover:bg-[var(--color-bg-hover)]',
                )}
                onMouseEnter={() => onHighlight?.(index)}
                onClick={() => onSelect(lake.id)}
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs text-[var(--color-text-primary)]">
                    {lake.name}
                  </span>
                  <span className="block truncate text-2xs text-[var(--color-text-secondary)]">
                    {lakePlaceLabel(lake)}
                  </span>
                </span>
                {lake.status ? (
                  <span
                    className={cn('h-1.5 w-1.5 shrink-0 rounded-full', statusDotClass(lake.status))}
                    title={lake.statusLabel?.trim() || undefined}
                    aria-hidden="true"
                  />
                ) : null}
              </button>
            </li>
          )
        })
      )}
    </ul>
  )
}

function statusDotClass(status: NonNullable<LakeSearchRecord['status']>): string {
  if (status === 'good') return 'bg-[var(--color-status-good)]'
  if (status === 'moderate') return 'bg-[var(--color-status-moderate)]'
  if (status === 'poor' || status === 'critical') return 'bg-[var(--color-status-critical)]'
  return 'bg-[var(--color-status-unknown)]'
}
