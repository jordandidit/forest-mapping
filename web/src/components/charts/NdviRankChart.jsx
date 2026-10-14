import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import ChartContainer from '../ui/ChartContainer'
import { ForestAxisTick, shortForestName } from '../../utils/chartLabels.jsx'

export default function NdviRankChart({ forests, onSelect, selectedId }) {
  const data = [...forests]
    .filter((f) => f.ndvi != null)
    .sort((a, b) => (b.ndvi || 0) - (a.ndvi || 0))
    .slice(0, 10)
    .map((f) => ({
      id: f.unitId,
      name: shortForestName(f.name, 28),
      fullName: f.name,
      value: f.ndvi,
    }))

  return (
    <ChartContainer
      title="Current greenness"
      subtitle="Latest NDVI by forest"
      empty={data.length === 0}
      emptyTitle="No NDVI values"
      chartHeight={320}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ left: 4, right: 20, top: 8, bottom: 8 }}
          barCategoryGap="18%"
        >
          <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
          <XAxis type="number" stroke="var(--chart-axis)" fontSize={11} domain={[0, 1]} />
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
            formatter={(v) => [Number(v).toFixed(3), 'NDVI']}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              color: 'var(--text)',
            }}
          />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} cursor="pointer" onClick={(entry) => onSelect?.(entry.id)}>
            {data.map((d) => (
              <Cell
                key={d.id}
                fill="#16794A"
                opacity={!selectedId || selectedId === d.id ? 1 : 0.4}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
