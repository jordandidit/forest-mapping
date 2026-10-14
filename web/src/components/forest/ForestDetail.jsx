import StatusBadge from '../ui/StatusBadge'
import EmptyState from '../ui/EmptyState'
import { formatDate } from '../../utils/date'
import { formatHa, formatNumber, formatPct, formatSigned } from '../../utils/format'

export default function ForestDetail({ forest }) {
  if (!forest) {
    return (
      <div className="surface min-h-[180px]">
        <EmptyState
          title="Select a forest"
          description="Click a forest on the map or in the list to see its health summary."
        />
      </div>
    )
  }

  const metrics = [
    { label: 'Area', value: formatHa(forest.areaHa) },
    { label: 'District', value: forest.district || '—' },
    { label: 'Forest group', value: forest.forestGroup || '—' },
    { label: 'Designation', value: forest.designation || '—' },
    { label: 'NDVI', value: formatNumber(forest.ndvi, 2) },
    { label: 'NDMI', value: formatNumber(forest.ndmi, 2) },
    { label: 'NBR', value: formatNumber(forest.nbr, 2) },
    { label: 'NDVI anomaly', value: formatSigned(forest.ndviAnomaly) },
    { label: 'NDMI anomaly', value: formatSigned(forest.ndmiAnomaly) },
    { label: 'NBR drop', value: formatNumber(forest.nbrDrop, 2) },
    { label: 'Clear %', value: formatPct(forest.clearPercent) },
    { label: 'Last clear image', value: formatDate(forest.lastObservationDate) },
    { label: 'Days since obs.', value: formatNumber(forest.daysSinceObservation) },
    { label: 'Valid obs. (14m)', value: formatNumber(forest.obs14m) },
  ]

  return (
    <div className="surface p-4 md:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
            {forest.name}
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge status={forest.status} />
            {forest.condition ? (
              <span className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-xs font-medium">
                {forest.condition} canopy
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl bg-[var(--surface-2)] px-3 py-2.5">
            <div className="text-[11px] muted">{m.label}</div>
            <div className="mt-0.5 text-sm font-semibold">{m.value}</div>
          </div>
        ))}
      </div>

      {forest.statusNote ? (
        <p className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm leading-relaxed text-[var(--text)]">
          {forest.statusNote}
        </p>
      ) : null}
    </div>
  )
}
