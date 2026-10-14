import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import ChartContainer from '../ui/ChartContainer'
import EmptyState from '../ui/EmptyState'
import { getObservations } from '../../api/forestHealth'
import { COMPARE_COLORS } from '../../constants/status'
import { formatDate } from '../../utils/date'
import { shortForestName } from '../../utils/chartLabels.jsx'

export default function CompareChart({ forests, compareIds, onRemove, onClear, metric, onMetricChange }) {
  const selected = forests.filter((f) => compareIds.includes(f.unitId))
  const [series, setSeries] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      const next = {}
      await Promise.all(
        selected.map(async (f) => {
          const rows = await getObservations(f.unitId)
          next[f.unitId] = rows.filter((o) => o.quality === 'Valid' && o.obsDate)
        }),
      )
      if (!cancelled) {
        setSeries(next)
        setLoading(false)
      }
    }
    if (selected.length) load()
    else {
      setSeries({})
      setLoading(false)
    }
    return () => {
      cancelled = true
    }
  }, [compareIds.join('|')]) // eslint-disable-line react-hooks/exhaustive-deps

  const chartData = useMemo(() => {
    const byDate = new Map()
    selected.forEach((f) => {
      const rows = series[f.unitId] || []
      rows.forEach((o) => {
        const key = o.obsDate.toISOString().slice(0, 10)
        if (!byDate.has(key)) {
          byDate.set(key, {
            date: formatDate(o.obsDate, 'd MMM yy'),
            ts: o.obsDate.getTime(),
          })
        }
        byDate.get(key)[f.unitId] = o[metric]
      })
    })
    return [...byDate.values()].sort((a, b) => a.ts - b.ts)
  }, [selected, series, metric])

  const totalPoints = selected.reduce((n, f) => n + (series[f.unitId]?.length || 0), 0)

  return (
    <div className="space-y-4">
      <div className="surface p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold">Forest comparison</h3>
            <p className="text-xs muted">Up to 4 forests · aligned by observation date</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {['ndvi', 'ndmi', 'nbr'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onMetricChange(m)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium uppercase ${
                  metric === m ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface-2)] muted'
                }`}
              >
                {m}
              </button>
            ))}
            <button
              type="button"
              onClick={onClear}
              className="rounded-lg border border-[var(--border)] px-2.5 py-1 text-xs muted"
            >
              Clear comparison
            </button>
          </div>
        </div>

        {selected.length === 0 ? (
          <EmptyState
            title="No forests selected for compare"
            description="Use the Compare control on forest cards (maximum 4)."
          />
        ) : (
          <div className="flex flex-wrap gap-2">
            {selected.map((f, i) => (
              <span
                key={f.unitId}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-xs"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: COMPARE_COLORS[i % COMPARE_COLORS.length] }}
                />
                {f.name}
                <button type="button" className="muted hover:text-[var(--text)]" onClick={() => onRemove(f.unitId)}>
                  Remove
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <ChartContainer
        title={`${metric.toUpperCase()} comparison`}
        subtitle={
          loading
            ? 'Loading observations…'
            : `${selected.length} forests · ${totalPoints} valid observations`
        }
        empty={!loading && selected.length > 0 && chartData.length === 0}
        emptyTitle="No valid imagery for comparison"
        chartHeight={320}
      >
        {selected.length === 0 ? (
          <EmptyState title="Add forests to compare" />
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ left: 4, right: 12, top: 8, bottom: 8 }}>
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="var(--chart-axis)" fontSize={11} minTickGap={28} />
              <YAxis stroke="var(--chart-axis)" fontSize={11} domain={['auto', 'auto']} />
              <Tooltip
                contentStyle={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  color: 'var(--text)',
                }}
              />
              <Legend formatter={(value) => shortForestName(value, 32)} />
              {selected.map((f, i) => (
                <Line
                  key={f.unitId}
                  type="monotone"
                  dataKey={f.unitId}
                  name={f.name}
                  stroke={COMPARE_COLORS[i % COMPARE_COLORS.length]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </ChartContainer>
    </div>
  )
}
