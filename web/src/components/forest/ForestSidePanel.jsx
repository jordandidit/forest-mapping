import { ArrowLeft, RotateCcw, Search } from 'lucide-react'
import EmptyState from '../ui/EmptyState'
import Select from '../ui/Select'
import StatusBadge from '../ui/StatusBadge'
import HistoryChart from '../charts/HistoryChart'
import { formatDate } from '../../utils/date'
import { formatHa, formatNumber, formatPct, formatSigned } from '../../utils/format'
import { STATUS_COLORS } from '../../constants/status'

/**
 * Left rail: forest list ↔ detail. Back clears selection and resets the map.
 */
export default function ForestSidePanel({
  forests,
  selectedForest,
  onSelect,
  onBack,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilter,
  summary,
  filters,
  setFilter,
  resetFilters,
  provinces = [],
  districts = [],
  groups = [],
  historyObs = [],
  historyMetric = 'combined',
  onHistoryMetricChange,
  historyRange = 14,
  onHistoryRangeChange,
  historyLoading = false,
}) {
  if (selectedForest) {
    return (
      <div className="surface flex h-full min-h-0 flex-col overflow-hidden p-0">
        <div className="flex shrink-0 items-center gap-2 border-b border-[var(--border)] px-3 py-2.5">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-2.5 text-xs font-medium hover:text-[var(--text)]"
            aria-label="Back to forest list"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{selectedForest.name}</div>
          </div>
        </div>

        <div className="scrollbar-thin min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={selectedForest.status} />
            {selectedForest.condition ? (
              <span className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-xs font-medium">
                {selectedForest.condition} canopy
              </span>
            ) : null}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <MetricCard label="NDVI" value={formatNumber(selectedForest.ndvi, 2)} emphasize />
            <MetricCard label="NDMI" value={formatNumber(selectedForest.ndmi, 2)} emphasize />
            <MetricCard label="NBR" value={formatNumber(selectedForest.nbr, 2)} emphasize />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <MetricCard label="NDVI anomaly" value={formatSigned(selectedForest.ndviAnomaly)} />
            <MetricCard label="NDMI anomaly" value={formatSigned(selectedForest.ndmiAnomaly)} />
            <MetricCard label="NBR drop" value={formatNumber(selectedForest.nbrDrop, 2)} />
            <MetricCard label="Clear %" value={formatPct(selectedForest.clearPercent)} />
            <MetricCard label="Area" value={formatHa(selectedForest.areaHa)} />
            <MetricCard label="District" value={selectedForest.district || '—'} />
            <MetricCard label="Forest group" value={selectedForest.forestGroup || '—'} />
            <MetricCard label="Designation" value={selectedForest.designation || '—'} />
            <MetricCard
              label="Last clear image"
              value={formatDate(selectedForest.lastObservationDate)}
            />
            <MetricCard
              label="Days since obs."
              value={formatNumber(selectedForest.daysSinceObservation)}
            />
            <MetricCard label="Valid obs. (14m)" value={formatNumber(selectedForest.obs14m)} />
          </div>

          <HistoryChart
            observations={historyObs}
            forestName={selectedForest.name}
            metric={historyMetric}
            onMetricChange={onHistoryMetricChange}
            range={historyRange}
            onRangeChange={onHistoryRangeChange}
            loading={historyLoading}
            dense
          />

          {selectedForest.statusNote ? (
            <p className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2.5 text-xs leading-relaxed">
              {selectedForest.statusNote}
            </p>
          ) : null}
        </div>
      </div>
    )
  }

  const pills = [
    { id: '', label: 'All', count: summary?.count ?? forests.length, color: null },
    {
      id: 'Disturbance alert',
      label: 'Alerts',
      count: summary?.disturbance ?? 0,
      color: STATUS_COLORS['Disturbance alert'],
    },
    {
      id: 'Moisture stress',
      label: 'Moisture',
      count: summary?.moisture ?? 0,
      color: STATUS_COLORS['Moisture stress'],
    },
    {
      id: 'Watch',
      label: 'Watch',
      count: summary?.watch ?? 0,
      color: STATUS_COLORS.Watch,
    },
    {
      id: 'Healthy',
      label: 'Healthy',
      count: summary?.healthy ?? 0,
      color: STATUS_COLORS.Healthy,
    },
  ]

  const placeActive = Boolean(filters?.province || filters?.district || filters?.forestGroup)

  return (
    <div className="surface flex h-full min-h-0 flex-col overflow-hidden p-0">
      <div className="shrink-0 border-b border-[var(--border)] px-2.5 py-2">
        <div className="flex items-baseline justify-between gap-2">
          <div className="text-sm font-semibold">Forests</div>
          <p className="text-[11px] muted">{forests.length} matching</p>
        </div>

        <label className="relative mt-1.5 block">
          <span className="sr-only">Search forests</span>
          <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={search || ''}
            onChange={(e) => onSearchChange?.(e.target.value)}
            placeholder="Filter by name or district"
            className="h-8 w-full rounded-lg border border-[var(--border)] bg-[var(--bg)] pr-2 pl-8 text-xs"
          />
        </label>

        <div className="mt-2 flex flex-wrap gap-1">
          {pills.map((p) => {
            const active = (statusFilter || '') === p.id
            return (
              <button
                key={p.id || 'all'}
                type="button"
                onClick={() => onStatusFilter?.(p.id)}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  active
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)]'
                }`}
              >
                {p.color ? (
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: p.color }} />
                ) : null}
                {p.label} ({p.count})
              </button>
            )
          })}
        </div>

        {setFilter ? (
          <div className="mt-2 flex items-center gap-1">
            <Select
              label=""
              value={filters?.province || ''}
              onChange={(v) => setFilter('province', v)}
              options={provinces}
              placeholder="Province"
              className="!min-w-0 min-w-0 flex-1"
            />
            <Select
              label=""
              value={filters?.district || ''}
              onChange={(v) => setFilter('district', v)}
              options={districts}
              placeholder="District"
              className="!min-w-0 min-w-0 flex-1"
            />
            <Select
              label=""
              value={filters?.forestGroup || ''}
              onChange={(v) => setFilter('forestGroup', v)}
              options={groups}
              placeholder="Group"
              className="!min-w-0 min-w-0 flex-1"
            />
            {placeActive || search || statusFilter ? (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text)]"
                title="Reset filters"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-1.5">
        {forests.length === 0 ? (
          <EmptyState title="No forests match" description="Clear filters or broaden search." />
        ) : (
          <ul className="space-y-0.5">
            {forests.map((f) => {
              const color = STATUS_COLORS[f.status] || '#9e9e9e'
              return (
                <li key={f.unitId}>
                  <button
                    type="button"
                    onClick={() => onSelect(f.unitId)}
                    className="flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition hover:bg-[var(--surface-2)]"
                  >
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                      style={{ background: color }}
                      title={f.status}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold">{f.name}</div>
                      <div className="mt-0.5 truncate text-[10px] muted">
                        {f.district || '—'} · {formatHa(f.areaHa)}
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-[10px]">
                      <div className="font-medium tabular-nums">{formatNumber(f.ndvi, 2)}</div>
                      <div className="muted">NDVI</div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function MetricCard({ label, value, emphasize = false }) {
  return (
    <div className="rounded-xl bg-[var(--surface-2)] px-2.5 py-2">
      <div className="text-[10px] muted">{label}</div>
      <div className={`mt-0.5 tabular-nums ${emphasize ? 'text-sm font-semibold' : 'text-xs font-semibold'}`}>
        {value ?? '—'}
      </div>
    </div>
  )
}
