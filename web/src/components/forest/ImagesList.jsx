import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import EmptyState from '../ui/EmptyState'
import { formatDate } from '../../utils/date'
import { formatNumber } from '../../utils/format'

const PAGE_SIZE = 12

/**
 * Right-rail satellite image list. Clicking an image loads it on the centre map
 * (does not drive forest selection).
 */
export default function ImagesList({
  rows,
  selectedObsId,
  onSelect,
  forestName,
  tableScope,
  onScopeChange,
  hasSelection,
}) {
  const [page, setPage] = useState(0)

  const sorted = useMemo(
    () => [...rows].sort((a, b) => (b.obsDate?.getTime() || 0) - (a.obsDate?.getTime() || 0)),
    [rows],
  )

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const current = sorted.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  useEffect(() => {
    setPage(0)
  }, [tableScope, rows.length, forestName])

  useEffect(() => {
    if (page > pageCount - 1) setPage(Math.max(0, pageCount - 1))
  }, [page, pageCount])

  return (
    <div className="surface flex h-full min-h-0 flex-col overflow-hidden p-0">
      <div className="shrink-0 border-b border-[var(--border)] px-2.5 py-2">
        <div className="text-sm font-semibold">Images</div>
        <p className="text-[11px] muted">
          {tableScope === 'selected' && forestName ? forestName : 'All filtered forests'}
          {sorted.length ? ` · ${sorted.length}` : ''}
        </p>
        <div className="mt-1.5 flex gap-1">
          <button
            type="button"
            disabled={!hasSelection}
            onClick={() => onScopeChange('selected')}
            className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
              tableScope === 'selected'
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--surface-2)] muted disabled:opacity-40'
            }`}
          >
            Selected
          </button>
          <button
            type="button"
            onClick={() => onScopeChange('all')}
            className={`rounded-md px-2 py-0.5 text-[10px] font-medium ${
              tableScope === 'all'
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--surface-2)] muted'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          title="No images"
          description={
            tableScope === 'selected'
              ? 'No Sentinel-2 observations for this forest.'
              : 'No observations match filters.'
          }
        />
      ) : (
        <>
          <ul className="scrollbar-thin flex-1 space-y-1 overflow-y-auto p-1.5">
            {current.map((row) => {
              const active = row.id === selectedObsId
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(row)}
                    className={`w-full rounded-lg border px-2.5 py-2 text-left transition ${
                      active
                        ? 'border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_12%,transparent)]'
                        : 'border-transparent bg-[var(--surface-2)] hover:border-[var(--border)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-xs font-semibold">{row.forestName}</div>
                        <div className="mt-0.5 text-[10px] muted">{formatDate(row.obsDate)}</div>
                      </div>
                      <QualityDot quality={row.quality} />
                    </div>
                    <div className="mt-1.5 flex justify-between gap-2 text-[10px]">
                      <span>
                        <span className="muted">NDVI </span>
                        <span className="font-medium">{formatNumber(row.ndvi, 2)}</span>
                      </span>
                      <span>
                        <span className="muted">NBR </span>
                        <span className="font-medium">{formatNumber(row.nbr, 2)}</span>
                      </span>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="flex items-center justify-between border-t border-[var(--border)] px-2 py-1.5">
            <button
              type="button"
              disabled={safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="inline-flex h-7 items-center gap-0.5 rounded-md px-1.5 text-[10px] disabled:opacity-40"
            >
              <ChevronLeft className="h-3 w-3" />
              Prev
            </button>
            <span className="text-[10px] muted">
              {safePage + 1}/{pageCount}
            </span>
            <button
              type="button"
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
              className="inline-flex h-7 items-center gap-0.5 rounded-md px-1.5 text-[10px] disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function QualityDot({ quality }) {
  const ok = quality === 'Valid'
  return (
    <span
      className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${ok ? 'bg-[#2e7d32]' : 'bg-[var(--text-muted)]'}`}
      title={quality || 'Unknown'}
    />
  )
}
