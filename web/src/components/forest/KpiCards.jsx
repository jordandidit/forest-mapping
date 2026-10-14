import { formatHa, formatNumber } from '../../utils/format'
import Skeleton from '../ui/Skeleton'
import { STATUS_COLORS } from '../../constants/status'

/** Thin single-row overview strip — Crop Health style. */
export default function KpiCards({ summary, loading }) {
  if (loading) {
    return <Skeleton className="h-11 w-full rounded-xl" />
  }

  const cards = [
    {
      key: 'total',
      value: formatNumber(summary.count),
      label: 'Forests',
      sub: formatHa(summary.areaHa),
      dot: null,
    },
    {
      key: 'healthy',
      value: formatNumber(summary.healthy),
      label: 'Healthy',
      sub: null,
      dot: STATUS_COLORS.Healthy,
    },
    {
      key: 'watch',
      value: formatNumber(summary.watch + summary.moisture),
      label: 'Watch / moisture',
      sub: `${formatNumber(summary.watch)}·${formatNumber(summary.moisture)}`,
      dot: STATUS_COLORS.Watch,
    },
    {
      key: 'alerts',
      value: formatNumber(summary.disturbance),
      label: 'Alerts',
      sub: null,
      dot: STATUS_COLORS['Disturbance alert'],
    },
  ]

  return (
    <div className="flex min-w-0 items-stretch gap-2 overflow-x-auto [scrollbar-width:thin]">
      {cards.map((card) => (
        <div
          key={card.key}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2"
        >
          {card.dot ? (
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: card.dot }} />
          ) : null}
          <span className="font-[family-name:var(--font-display)] text-base font-semibold tabular-nums">
            {card.value}
          </span>
          <span className="truncate text-xs font-medium">{card.label}</span>
          {card.sub ? <span className="truncate text-[11px] muted">{card.sub}</span> : null}
        </div>
      ))}
    </div>
  )
}
