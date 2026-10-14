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
import { formatDate } from '../../utils/date'

const METRICS = {
  combined: ['ndvi', 'ndmi', 'nbr'],
  ndvi: ['ndvi'],
  ndmi: ['ndmi'],
  nbr: ['nbr'],
}

const COLORS = {
  ndvi: '#22A06B',
  ndmi: '#2563EB',
  nbr: '#EA7A26',
}

const LABELS = {
  ndvi: 'NDVI',
  ndmi: 'NDMI',
  nbr: 'NBR',
}

const METRIC_LABELS = {
  combined: 'All',
  ndvi: 'NDVI',
  ndmi: 'NDMI',
  nbr: 'NBR',
}

export default function HistoryChart({
  observations,
  forestName,
  metric,
  onMetricChange,
  range,
  onRangeChange,
  loading,
  compact = false,
  dense = false,
}) {
  const keys = METRICS[metric] || METRICS.combined
  const data = (observations || [])
    .filter((o) => o.quality === 'Valid' && o.obsDate)
    .slice()
    .sort((a, b) => a.obsDate - b.obsDate)
    .map((o) => ({
      date: formatDate(o.obsDate, 'd MMM yy'),
      ts: o.obsDate.getTime(),
      ndvi: o.ndvi,
      ndmi: o.ndmi,
      nbr: o.nbr,
    }))

  const ranges = dense
    ? [
        { id: 6, label: '6m' },
        { id: 14, label: '14m' },
        { id: 'all', label: 'All' },
      ]
    : [
        { id: 3, label: '3 months' },
        { id: 6, label: '6 months' },
        { id: 12, label: '12 months' },
        { id: 14, label: '14 months' },
        { id: 'all', label: 'All' },
      ]

  const btn = (active) =>
    dense
      ? `rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
          active ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface)] muted'
        }`
      : `rounded-lg px-2.5 py-1 text-xs font-medium ${
          active ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface-2)] muted'
        }`

  const rangeControls = (
    <>
      {ranges.map((r) => (
        <button
          key={r.id}
          type="button"
          onClick={() => onRangeChange(r.id)}
          className={btn(range === r.id)}
        >
          {r.label}
        </button>
      ))}
      {!dense ? <span className="mx-1 h-6 w-px bg-[var(--border)]" /> : null}
      {Object.keys(METRICS).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onMetricChange(m)}
          className={
            dense
              ? `rounded-md px-1.5 py-0.5 text-[10px] font-medium ${
                  metric === m ? 'bg-[var(--surface)] text-[var(--text)]' : 'muted'
                }`
              : `rounded-lg px-2.5 py-1 text-xs font-medium ${
                  metric === m ? 'bg-[var(--surface-3)] text-[var(--text)]' : 'bg-[var(--surface-2)] muted'
                }`
          }
        >
          {METRIC_LABELS[m] || m}
        </button>
      ))}
    </>
  )

  const chartHeight = dense ? 132 : compact ? 220 : 300

  return (
    <ChartContainer
      title="Historical trends"
      subtitle={
        loading
          ? 'Loading…'
          : dense
            ? `${data.length} valid obs`
            : forestName
              ? `${forestName} · Valid observations only (${data.length})`
              : 'Select a forest'
      }
      controls={rangeControls}
      empty={!loading && data.length === 0}
      emptyTitle={forestName ? 'No valid imagery' : 'Select a forest'}
      emptyDescription={
        dense
          ? undefined
          : forestName
            ? 'No Valid observations in the selected date range.'
            : undefined
      }
      chartHeight={chartHeight}
      dense={dense}
      allowFullscreen
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={dense ? { left: 0, right: 4, top: 4, bottom: 0 } : { left: 4, right: 12, top: 8, bottom: 8 }}
        >
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            stroke="var(--chart-axis)"
            fontSize={dense ? 9 : 11}
            minTickGap={dense ? 28 : 24}
            tick={!dense}
            height={dense ? 18 : undefined}
          />
          <YAxis
            stroke="var(--chart-axis)"
            fontSize={dense ? 9 : 11}
            domain={['auto', 'auto']}
            width={dense ? 28 : undefined}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              color: 'var(--text)',
              fontSize: dense ? 11 : undefined,
            }}
          />
          {!dense ? <Legend /> : null}
          {keys.map((k) => (
            <Line
              key={k}
              type="monotone"
              dataKey={k}
              name={LABELS[k]}
              stroke={COLORS[k]}
              strokeWidth={dense ? 1.5 : 2}
              dot={false}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
