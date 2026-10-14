import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from 'recharts'
import ChartContainer from '../ui/ChartContainer'
import { STATUS_COLORS, STATUS_ORDER } from '../../constants/status'

export default function StatusChart({ forests, onStatusClick, activeStatus }) {
  const counts = {}
  forests.forEach((f) => {
    counts[f.status] = (counts[f.status] || 0) + 1
  })
  const data = STATUS_ORDER.filter((s) => counts[s]).map((status) => ({
    status,
    count: counts[status],
  }))

  return (
    <ChartContainer
      title="Forests by status"
      subtitle="Click a bar to filter"
      empty={data.length === 0}
      emptyTitle="No forests match filters"
      chartHeight={320}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 8 }} barCategoryGap="20%">
          <CartesianGrid stroke="var(--chart-grid)" horizontal={false} />
          <XAxis type="number" allowDecimals={false} stroke="var(--chart-axis)" fontSize={11} />
          <YAxis
            type="category"
            dataKey="status"
            width={130}
            interval={0}
            stroke="var(--chart-axis)"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              color: 'var(--text)',
            }}
          />
          <Bar
            dataKey="count"
            radius={[0, 6, 6, 0]}
            cursor="pointer"
            onClick={(entry) => onStatusClick?.(entry.status)}
          >
            {data.map((d) => (
              <Cell
                key={d.status}
                fill={STATUS_COLORS[d.status]}
                opacity={!activeStatus || activeStatus === d.status ? 1 : 0.35}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
