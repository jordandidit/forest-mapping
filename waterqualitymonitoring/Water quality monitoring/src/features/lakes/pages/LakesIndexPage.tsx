import { Link } from 'react-router-dom'
import { TOTAL_MONITORED_LAKES } from '@/data/mock/lakes'
import { DataStatePanel } from '@/components/ui/DataStatePanel'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { TrendIndicator } from '@/components/ui/TrendIndicator'
import { useWaterBodies } from '@/features/lakes/hooks/use-water-bodies'
import { formatNumber } from '@/lib/format'

export function LakesIndexPage() {
  const { data: lakes = [], isLoading, error } = useWaterBodies()
  const lakeCount = Math.max(lakes.length, TOTAL_MONITORED_LAKES)

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-5xl">
        <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          Water bodies
        </p>
        <h1 className="mt-1 text-xl font-semibold">Monitored lakes</h1>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          Showing {lakes.length} of {lakeCount} monitored water bodies.
        </p>

        <div className="mt-5 overflow-hidden border border-[var(--color-border)]">
          <DataStatePanel
            isLoading={isLoading}
            error={error as Error | null}
            isEmpty={!isLoading && !error && lakes.length === 0}
            emptyMessage="No water bodies returned from the data provider."
            className="min-h-[200px]"
          >
            <table className="w-full border-collapse text-left text-xs">
              <thead className="bg-[var(--color-bg-panel)] text-2xs uppercase tracking-[0.1em] text-[var(--color-text-muted)]">
                <tr>
                  <th className="border-b border-[var(--color-border)] px-3 py-2 font-semibold">Lake</th>
                  <th className="border-b border-[var(--color-border)] px-3 py-2 font-semibold">Province</th>
                  <th className="border-b border-[var(--color-border)] px-3 py-2 font-semibold">Area</th>
                  <th className="border-b border-[var(--color-border)] px-3 py-2 font-semibold">Status</th>
                  <th className="border-b border-[var(--color-border)] px-3 py-2 font-semibold">Trend</th>
                </tr>
              </thead>
              <tbody>
                {lakes.map((lake) => (
                  <tr key={lake.id} className="odd:bg-[var(--color-bg-app)] even:bg-[var(--color-bg-panel)]">
                    <td className="border-b border-[var(--color-border-subtle)] px-3 py-2">
                      <Link to={`/lakes/${lake.id}`} className="text-[var(--color-accent)] hover:underline">
                        {lake.name}
                      </Link>
                    </td>
                    <td className="border-b border-[var(--color-border-subtle)] px-3 py-2 text-[var(--color-text-secondary)]">
                      {lake.province}
                    </td>
                    <td className="border-b border-[var(--color-border-subtle)] px-3 py-2 font-mono text-[var(--color-text-secondary)]">
                      {formatNumber(lake.surfaceAreaKm2, { maximumFractionDigits: 1 })} km²
                    </td>
                    <td className="border-b border-[var(--color-border-subtle)] px-3 py-2">
                      <StatusBadge status={lake.status} />
                    </td>
                    <td className="border-b border-[var(--color-border-subtle)] px-3 py-2">
                      <TrendIndicator trend={lake.trend} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DataStatePanel>
        </div>
      </div>
    </div>
  )
}
