import { GitCompareArrows } from 'lucide-react'
import StatusBadge from '../ui/StatusBadge'
import EmptyState from '../ui/EmptyState'
import Select from '../ui/Select'
import { formatDate } from '../../utils/date'
import { formatHa, formatNumber, formatSigned } from '../../utils/format'

const SORTS = [
  { value: 'risk', label: 'Highest risk' },
  { value: 'name', label: 'Forest name' },
  { value: 'area', label: 'Largest area' },
  { value: 'ndvi', label: 'Lowest NDVI' },
  { value: 'nbr_drop', label: 'Largest NBR drop' },
]

export default function ForestList({
  forests,
  selectedId,
  onSelect,
  sortKey,
  onSortChange,
  compareIds,
  onToggleCompare,
}) {
  return (
    <div className="surface flex h-[420px] flex-col overflow-hidden p-0 md:h-[480px]">
      <div className="flex items-center justify-between gap-3 border-b border-[var(--border)] px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Forests</h2>
          <p className="text-xs muted">{forests.length} matching</p>
        </div>
        <Select
          label=""
          value={sortKey}
          onChange={onSortChange}
          options={SORTS}
          placeholder=""
          className="min-w-[150px]"
        />
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto p-2">
        {forests.length === 0 ? (
          <EmptyState title="No forests match filters" description="Reset filters or broaden your search." />
        ) : (
          <ul className="space-y-2">
            {forests.map((f) => {
              const active = f.unitId === selectedId
              const compared = compareIds.includes(f.unitId)
              return (
                <li key={f.unitId}>
                  <button
                    type="button"
                    onClick={() => onSelect(f.unitId)}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                      active
                        ? 'border-[var(--primary)] bg-[color-mix(in_srgb,var(--primary)_10%,transparent)]'
                        : 'border-transparent bg-[var(--surface-2)] hover:border-[var(--border)]'
                    }`}
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{f.name}</div>
                        <div className="mt-1 text-xs muted">
                          {(f.condition ? `${f.condition} canopy · ` : '') + formatHa(f.areaHa)}
                          {f.district ? ` · ${f.district}` : ''}
                        </div>
                      </div>
                      <StatusBadge status={f.status} size="sm" />
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <Metric label="NDVI" value={formatNumber(f.ndvi, 2)} />
                      <Metric label="vs normal" value={formatSigned(f.ndviAnomaly)} />
                      <Metric label="NBR drop" value={formatNumber(f.nbrDrop, 2)} />
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[11px] muted">Last clear image {formatDate(f.lastObservationDate)}</span>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleCompare(f.unitId)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            e.stopPropagation()
                            onToggleCompare(f.unitId)
                          }
                        }}
                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] ${
                          compared
                            ? 'bg-[var(--primary)] text-white'
                            : 'bg-[var(--surface)] text-[var(--text-muted)] hover:text-[var(--text)]'
                        }`}
                        aria-label={compared ? `Remove ${f.name} from compare` : `Add ${f.name} to compare`}
                      >
                        <GitCompareArrows className="h-3 w-3" />
                        {compared ? 'Comparing' : 'Compare'}
                      </span>
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

function Metric({ label, value }) {
  return (
    <div>
      <div className="muted">{label}</div>
      <div className="font-medium text-[var(--text)]">{value}</div>
    </div>
  )
}
