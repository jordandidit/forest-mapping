import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Image as ImageIcon, MapPin } from 'lucide-react'
import ObservationMap from '../map/ObservationMap'
import EmptyState from '../ui/EmptyState'
import { formatDate } from '../../utils/date'
import { formatNumber, formatPct } from '../../utils/format'

const PAGE_SIZE = 8

export default function ObservationsPanel({
  rows,
  forests,
  selectedForestName,
  tableScope,
  onScopeChange,
  hasSelection,
  selectedForestId,
  isDark,
  compact = false,
}) {
  const [page, setPage] = useState(0)
  const [selectedObsId, setSelectedObsId] = useState(null)

  const sorted = useMemo(
    () => [...rows].sort((a, b) => (b.obsDate?.getTime() || 0) - (a.obsDate?.getTime() || 0)),
    [rows],
  )

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const current = sorted.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  const selectedObs = useMemo(
    () => sorted.find((r) => r.id === selectedObsId) || null,
    [sorted, selectedObsId],
  )

  useEffect(() => {
    setPage(0)
    setSelectedObsId(null)
  }, [tableScope, rows.length, selectedForestName])

  useEffect(() => {
    if (page > pageCount - 1) setPage(Math.max(0, pageCount - 1))
  }, [page, pageCount])

  // Image clicks only drive the observation map — never the main forest map.
  function handlePick(row) {
    setSelectedObsId(row.id)
  }

  const mapForests = useMemo(() => {
    if (tableScope === 'selected' && selectedForestId) {
      return forests.filter((f) => f.unitId === selectedForestId)
    }
    const ids = new Set(sorted.map((r) => r.unitId))
    return forests.filter((f) => ids.has(f.unitId))
  }, [forests, sorted, tableScope, selectedForestId])

  const listHeight = compact
    ? 'max-h-[min(340px,42dvh)]'
    : 'max-h-[640px]'

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">Satellite observations</h2>
          <p className="text-xs muted">
            Click an image to draw it and zoom on the map
            {sorted.length ? ` · ${sorted.length} images` : ''}
          </p>
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            disabled={!hasSelection}
            onClick={() => onScopeChange('selected')}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
              tableScope === 'selected'
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--surface-2)] text-[var(--text-muted)] disabled:opacity-40'
            }`}
          >
            Selected forest
          </button>
          <button
            type="button"
            onClick={() => onScopeChange('all')}
            className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
              tableScope === 'all'
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--surface-2)] text-[var(--text-muted)]'
            }`}
          >
            All filtered
          </button>
        </div>
      </div>

      {/* Image list on the left, observation map on the right */}
      <div className="grid grid-cols-1 gap-2.5 xl:grid-cols-[minmax(200px,0.55fr)_minmax(0,1.45fr)]">
        <div className={`surface flex flex-col overflow-hidden p-0 ${listHeight}`}>
          <div className="border-b border-[var(--border)] px-3 py-2">
            <div className="text-sm font-semibold">Images</div>
            <p className="text-[11px] muted truncate">
              {tableScope === 'selected' && selectedForestName
                ? selectedForestName
                : 'Filtered forests'}
            </p>
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
              <ul className="scrollbar-thin flex-1 space-y-1.5 overflow-y-auto p-1.5">
                {current.map((row) => {
                  const active = row.id === selectedObsId
                  return (
                    <li key={row.id}>
                      <button
                        type="button"
                        onClick={() => handlePick(row)}
                        className={`w-full rounded-lg border px-2.5 py-2 text-left transition ${
                          active
                            ? 'border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]'
                            : 'border-transparent bg-[var(--surface-2)] hover:border-[var(--border)]'
                        }`}
                      >
                        <div className="mb-1 flex items-start justify-between gap-1.5">
                          <div className="min-w-0">
                            <div className="truncate text-xs font-semibold">{row.forestName}</div>
                            <div className="mt-0.5 text-[10px] muted">{formatDate(row.obsDate)}</div>
                          </div>
                          <QualityBadge quality={row.quality} />
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[10px]">
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

              <div className="flex items-center justify-between gap-1 border-t border-[var(--border)] px-2 py-1.5">
                <button
                  type="button"
                  disabled={safePage === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="inline-flex h-7 items-center gap-0.5 rounded-lg border border-[var(--border)] px-1.5 text-[10px] disabled:opacity-40"
                  aria-label="Previous page"
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
                  className="inline-flex h-7 items-center gap-0.5 rounded-lg border border-[var(--border)] px-1.5 text-[10px] disabled:opacity-40"
                  aria-label="Next page"
                >
                  Next
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </>
          )}
        </div>

        <div className="space-y-2">
          <ObservationMap
            forests={mapForests.length ? mapForests : forests}
            selectedObs={selectedObs}
            isDark={isDark}
            compact={compact}
          />

          {selectedObs ? (
            <div className="surface flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2">
              <ImageIcon className="h-3.5 w-3.5 shrink-0 text-[var(--primary)]" aria-hidden />
              <span className="truncate text-xs font-semibold">{selectedObs.forestName}</span>
              <QualityBadge quality={selectedObs.quality} />
              <span className="text-[11px] muted">{formatDate(selectedObs.obsDate)}</span>
              <span className="hidden h-3 w-px bg-[var(--border)] sm:block" aria-hidden />
              <MetricInline label="NDVI" value={formatNumber(selectedObs.ndvi, 3)} />
              <MetricInline label="NDMI" value={formatNumber(selectedObs.ndmi, 3)} />
              <MetricInline label="NBR" value={formatNumber(selectedObs.nbr, 3)} />
              <MetricInline label="Clear" value={formatPct(selectedObs.clearPercent)} />
              <MetricInline label="Coverage" value={formatPct(selectedObs.coveragePercent)} />
            </div>
          ) : (
            <div className="surface flex items-center gap-2 px-3 py-2 text-xs muted">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Select an image from the list to draw it on the observation map.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MetricInline({ label, value }) {
  return (
    <span className="inline-flex items-baseline gap-1 text-[11px]">
      <span className="muted">{label}</span>
      <span className="font-semibold tabular-nums">{value}</span>
    </span>
  )
}

function QualityBadge({ quality }) {
  if (quality === 'Valid') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[color-mix(in_srgb,#2e7d32_35%,transparent)] bg-[color-mix(in_srgb,#2e7d32_14%,transparent)] px-1.5 py-0.5 text-[10px] font-medium text-[#2e7d32]">
        Valid
      </span>
    )
  }
  return (
    <span className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface)] px-1.5 py-0.5 text-[10px] font-medium muted">
      {quality || 'Unknown'}
    </span>
  )
}
