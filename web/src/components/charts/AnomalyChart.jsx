import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import ChartContainer from '../ui/ChartContainer'
import { THRESHOLDS } from '../../constants/status'
import { ForestAxisTick, shortForestName } from '../../utils/chartLabels.jsx'

export default function AnomalyChart({ forests, onSelect, selectedId }) {
  const data = [...forests]
    .filter((f) => f.ndviAnomaly != null)
    .sort((a, b) => a.ndviAnomaly - b.ndviAnomaly)
    .slice(0, 10)
    .map((f) => ({
      id: f.unitId,
      name: shortForestName(f.name, 28),
      fullName: f.name,
      value: f.ndviAnomaly,
    }))

  return (
    <ChartContainer
      title="Greenness vs normal"
      subtitle="NDVI against each forest's 14-month mean"
      empty={data.length === 0}
      emptyTitle="No anomaly data"
      chartHeight={320}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 4, right: 20, top: 12, bottom: 8 }}
          barCategoryGap="18%"
        >
          <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
          <XAxis type="number" stroke="var(--chart-axis)" fontSize={11} domain={['auto', 'auto']} />
          <YAxis
            type="category"
            dataKey="name"
            width={118}
            interval={0}
            tick={<ForestAxisTick maxChars={14} />}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            formatter={(v) => [Number(v).toFixed(3), 'NDVI anomaly']}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              color: 'var(--text)',
            }}
          />
          <ReferenceLine
            x={THRESHOLDS.WATCH_NDVI_ANOMALY}
            stroke="var(--amber)"
            strokeDasharray="4 4"
            label={{ value: 'Watch', fill: 'var(--chart-axis)', fontSize: 10, position: 'insideTopRight' }}
          />
          <Bar
            dataKey="value"
            radius={[0, 6, 6, 0]}
            cursor="pointer"
            onClick={(entry) => onSelect?.(entry.id)}
          >
            {data.map((d) => (
              <Cell
                key={d.id}
                fill={d.value < 0 ? '#c62828' : '#2e7d32'}
                opacity={!selectedId || selectedId === d.id ? 1 : 0.4}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
