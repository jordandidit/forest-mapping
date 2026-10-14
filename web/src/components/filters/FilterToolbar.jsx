import { useState } from 'react'
import { Search, RotateCcw, ChevronDown, SlidersHorizontal } from 'lucide-react'
import Select from '../ui/Select'

function countActiveFilters(filters) {
  let n = 0
  if (filters.search?.trim()) n += 1
  if (filters.province) n += 1
  if (filters.district) n += 1
  if (filters.forestGroup) n += 1
  if (filters.status) n += 1
  return n
}

/**
 * Inline filters for the KPI row — stays on one horizontal line
 * (scrolls horizontally if the viewport is tight).
 */
export default function FilterToolbar({
  filters,
  setFilter,
  resetFilters,
  provinces,
  districts,
  groups,
  statuses,
  filteredCount,
  totalCount,
}) {
  const [open, setOpen] = useState(false)
  const active = countActiveFilters(filters)

  return (
    <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:thin]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2.5 text-xs font-medium text-[var(--text)] hover:bg-[var(--surface-2)]"
        aria-expanded={open}
      >
        <SlidersHorizontal className="h-3.5 w-3.5 text-[var(--text-muted)]" />
        Filters
        {active > 0 ? (
          <span className="rounded-full bg-[var(--primary)] px-1.5 py-0.5 text-[10px] leading-none text-white">
            {active}
          </span>
        ) : null}
        <ChevronDown
          className={`h-3.5 w-3.5 text-[var(--text-muted)] transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <span className="shrink-0 text-[11px] muted tabular-nums">
        {filteredCount}/{totalCount}
      </span>

      {active > 0 && !open ? (
        <button
          type="button"
          onClick={resetFilters}
          className="inline-flex h-[34px] shrink-0 items-center gap-1 rounded-lg px-1.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
          title="Reset filters"
        >
          <RotateCcw className="h-3 w-3" />
        </button>
      ) : null}

      {open ? (
        <>
          <label className="relative w-40 shrink-0">
            <span className="sr-only">Search forest</span>
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
            <input
              value={filters.search}
              onChange={(e) => setFilter('search', e.target.value)}
              placeholder="Search…"
              className="h-[34px] w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] pr-2 pl-8 text-xs"
            />
          </label>

          <Select
            label=""
            value={filters.province}
            onChange={(v) => setFilter('province', v)}
            options={provinces}
            placeholder="Province"
            className="!min-w-0 w-[108px] shrink-0"
          />
          <Select
            label=""
            value={filters.district}
            onChange={(v) => setFilter('district', v)}
            options={districts}
            placeholder="District"
            className="!min-w-0 w-[108px] shrink-0"
          />
          <Select
            label=""
            value={filters.forestGroup}
            onChange={(v) => setFilter('forestGroup', v)}
            options={groups}
            placeholder="Group"
            className="!min-w-0 w-[100px] shrink-0"
          />
          <Select
            label=""
            value={filters.status}
            onChange={(v) => setFilter('status', v)}
            options={statuses}
            placeholder="Status"
            className="!min-w-0 w-[108px] shrink-0"
          />

          <button
            type="button"
            onClick={resetFilters}
            className="inline-flex h-[34px] shrink-0 items-center gap-1 rounded-lg border border-[var(--border)] px-2.5 text-xs text-[var(--text-muted)] hover:text-[var(--text)]"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        </>
      ) : null}
    </div>
  )
}
