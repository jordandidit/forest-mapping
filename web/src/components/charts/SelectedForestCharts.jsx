import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import ChartContainer from '../ui/ChartContainer'
import { formatDate } from '../../utils/date'

const SERIES = [
  {
    key: 'ndvi',
    title: 'Greenness (NDVI)',
    color: '#22A06B',
    description: 'Canopy greenness over time',
  },
  {
    key: 'nbr',
    title: 'Disturbance (NBR)',
    color: '#EA7A26',
    description: 'Burn / clear-cut sensitivity',
  },
  {
    key: 'ndmi',
    title: 'Moisture (NDMI)',
    color: '#2563EB',
    description: 'Canopy moisture index',
  },
]

function IndexLineChart({ observations, series, loading, forestName }) {
  const data = (observations || [])
    .filter((o) => o.quality === 'Valid' && o.obsDate)
    .slice()
    .sort((a, b) => a.obsDate - b.obsDate)
    .map((o) => ({
      date: formatDate(o.obsDate, 'd MMM yy'),
      value: o[series.key],
    }))

  return (
    <ChartContainer
      title={series.title}
      subtitle={
        loading
          ? 'Loading…'
          : forestName
            ? `${forestName} · ${series.description}`
            : 'Select a forest'
      }
      empty={!loading && data.length === 0}
      emptyTitle={forestName ? 'No valid imagery' : 'Select a forest'}
      chartHeight={220}
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 4, right: 12, top: 8, bottom: 8 }}>
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
          {series.key === 'ndvi' ? (
            <ReferenceLine
              y={0}
              stroke="var(--chart-axis)"
              strokeDasharray="4 4"
              strokeOpacity={0.4}
            />
          ) : null}
          <Line
            type="monotone"
            dataKey="value"
            name={series.title}
            stroke={series.color}
            strokeWidth={2}
            dot={{ r: 2.5, strokeWidth: 0, fill: series.color }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

/**
 * Notebook-style selected-forest detail charts: NDVI, NBR, NDMI time series.
 */
export default function SelectedForestCharts({
  observations,
  forestName,
  forest,
  range,
  onRangeChange,
  loading,
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold">Selected forest indices</h2>
          <p className="text-xs muted">
            {forestName
              ? `${forestName}${forest?.status ? ` · ${forest.status}` : ''}${
                  forest?.condition ? ` · ${forest.condition}` : ''
                }`
              : 'Pick a forest above to see its NDVI, NBR and NDMI history'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 3, label: '3 months' },
            { id: 6, label: '6 months' },
            { id: 12, label: '12 months' },
            { id: 14, label: '14 months' },
            { id: 'all', label: 'All' },
          ].map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => onRangeChange(r.id)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                range === r.id ? 'bg-[var(--primary)] text-white' : 'bg-[var(--surface-2)] muted'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {SERIES.map((series) => (
          <IndexLineChart
            key={series.key}
            series={series}
            observations={observations}
            forestName={forestName}
            loading={loading}
          />
        ))}
      </div>
    </div>
  )
}
