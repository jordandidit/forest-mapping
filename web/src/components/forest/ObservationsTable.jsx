import { useMemo, useState } from 'react'
import EmptyState from '../ui/EmptyState'
import { formatDate } from '../../utils/date'
import { formatNumber, formatPct } from '../../utils/format'

const PAGE_SIZE = 12

export default function ObservationsTable({
  rows,
  selectedForestName,
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
  const current = sorted.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

  return (
    <div className="surface overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">Satellite observations</h3>
          <p className="text-xs muted">
            {tableScope === 'selected' && selectedForestName
              ? selectedForestName
              : 'All filtered forests'}{' '}
            · {sorted.length} rows
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!hasSelection}
            onClick={() => {
              onScopeChange('selected')
              setPage(0)
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              tableScope === 'selected'
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--surface-2)] text-[var(--text-muted)]'
            }`}
          >
            Selected forest
          </button>
          <button
            type="button"
            onClick={() => {
              onScopeChange('all')
              setPage(0)
            }}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              tableScope === 'all'
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--surface-2)] text-[var(--text-muted)]'
            }`}
          >
            Show all filtered forests
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          title="No observation history"
          description={
            tableScope === 'selected'
              ? 'No Sentinel-2 observations for the selected forest.'
              : 'No observations match the current filters.'
          }
        />
      ) : (
        <>
          <div className="scrollbar-thin overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[var(--surface-2)] text-xs muted">
                <tr>
                  <Th>Forest</Th>
                  <Th>Image date</Th>
                  <Th>Quality</Th>
                  <Th>Clear %</Th>
                  <Th>Coverage %</Th>
                  <Th>NDVI</Th>
                  <Th>NDMI</Th>
                  <Th>NBR</Th>
                  <Th>Meaning</Th>
                </tr>
              </thead>
              <tbody>
                {current.map((row) => (
                  <tr key={row.id} className="border-t border-[var(--border)]">
                    <Td>{row.forestName}</Td>
                    <Td>{formatDate(row.obsDate)}</Td>
                    <Td>
                      <QualityBadge quality={row.quality} />
                    </Td>
                    <Td>{formatPct(row.clearPercent)}</Td>
                    <Td>{formatPct(row.coveragePercent)}</Td>
                    <Td>{formatNumber(row.ndvi, 3)}</Td>
                    <Td>{formatNumber(row.ndmi, 3)}</Td>
                    <Td>{formatNumber(row.nbr, 3)}</Td>
                    <Td className="max-w-[280px] truncate" title={row.meaning || ''}>
                      {row.meaning || '—'}
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between border-t border-[var(--border)] px-4 py-3 text-xs muted">
            <span>
              Page {page + 1} of {pageCount}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded-lg border border-[var(--border)] px-3 py-1 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= pageCount - 1}
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                className="rounded-lg border border-[var(--border)] px-3 py-1 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function Th({ children }) {
  return <th className="px-3 py-2 font-medium whitespace-nowrap">{children}</th>
}

function Td({ children, className = '' }) {
  return <td className={`px-3 py-2.5 whitespace-nowrap ${className}`}>{children}</td>
}

function QualityBadge({ quality }) {
  if (quality === 'Valid') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,#2e7d32_35%,transparent)] bg-[color-mix(in_srgb,#2e7d32_14%,transparent)] px-2 py-0.5 text-[11px] font-medium text-[#2e7d32]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#2e7d32]" aria-hidden />
        Valid
      </span>
    )
  }
  return (
    <span className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2 py-0.5 text-[11px] font-medium muted">
      {quality || 'Unknown'}
    </span>
  )
}
