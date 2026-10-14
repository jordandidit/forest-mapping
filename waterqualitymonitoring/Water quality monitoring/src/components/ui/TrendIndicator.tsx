import type { TrendDirection } from '@/domain/water-quality/types'
import { cn } from '@/lib/cn'
import { formatTrendLabel } from '@/lib/format'

const TREND_CLASS: Record<TrendDirection, string> = {
  improving: 'text-[var(--color-trend-down)]',
  stable: 'text-[var(--color-trend-stable)]',
  deteriorating: 'text-[var(--color-trend-up)]',
  unknown: 'text-[var(--color-text-muted)]',
}

const TREND_GLYPH: Record<TrendDirection, string> = {
  improving: '↓',
  stable: '→',
  deteriorating: '↑',
  unknown: '—',
}

interface TrendIndicatorProps {
  trend: TrendDirection
  showLabel?: boolean
  className?: string
}

export function TrendIndicator({
  trend,
  showLabel = true,
  className,
}: TrendIndicatorProps) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs', TREND_CLASS[trend], className)}>
      <span aria-hidden="true">{TREND_GLYPH[trend]}</span>
      {showLabel ? <span>{formatTrendLabel(trend)}</span> : null}
    </span>
  )
}
