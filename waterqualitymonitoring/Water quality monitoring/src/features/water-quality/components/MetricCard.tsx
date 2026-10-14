import type { WaterQualityMetric } from '@/domain/water-quality/types'
import { formatNumber, formatScientificValue } from '@/lib/format'
import { MetricSparkline } from '@/features/water-quality/components/MetricSparkline'
import { cn } from '@/lib/cn'

interface MetricCardProps {
  metric: WaterQualityMetric
  className?: string
}

function sparkColor(parameter: WaterQualityMetric['parameter']): string {
  switch (parameter) {
    case 'turbidity':
      return 'var(--color-param-turbidity)'
    case 'ndci':
      return 'var(--color-param-chlorophyll)'
    case 'floating_vegetation':
      return 'var(--color-param-vegetation)'
    case 'bloom_risk':
      return 'var(--color-param-bloom)'
    default:
      return 'var(--color-accent)'
  }
}

function statusInterpretation(metric: WaterQualityMetric): string | null {
  if (metric.parameter === 'bloom_risk') return null
  switch (metric.status) {
    case 'good':
      return 'Low'
    case 'moderate':
      return 'Moderate'
    case 'poor':
    case 'critical':
      return 'Elevated'
    default:
      return null
  }
}

export function MetricCard({ metric, className }: MetricCardProps) {
  const isNegativeChange = metric.changePercent !== null && metric.changePercent < 0
  const isPositiveChange = metric.changePercent !== null && metric.changePercent > 0
  const hasComparison =
    metric.changePercent !== null &&
    metric.changeLabel !== '—' &&
    metric.baselineLabel !== 'baseline unavailable'
  const interpretation =
    metric.parameter === 'bloom_risk'
      ? typeof metric.value === 'string' && metric.value !== '—'
        ? metric.value
        : null
      : statusInterpretation(metric)

  const displayValue =
    typeof metric.value === 'number'
      ? formatNumber(metric.value, {
          maximumFractionDigits: metric.value < 1 ? 3 : 1,
          minimumFractionDigits: metric.value < 1 ? 3 : 1,
        })
      : metric.parameter === 'bloom_risk'
        ? null
        : formatScientificValue(metric.value, undefined)

  return (
    <article
      className={cn(
        'border-b border-[var(--color-border-subtle)] px-0 py-2.5 last:border-b-0',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <span
            className={cn(
              'h-1.5 w-1.5 shrink-0 rounded-full',
              metric.status === 'good' && 'bg-[var(--color-status-good)]',
              metric.status === 'moderate' && 'bg-[var(--color-status-moderate)]',
              (metric.status === 'poor' || metric.status === 'critical') &&
                'bg-[var(--color-status-critical)]',
              metric.status === 'unknown' && 'bg-[var(--color-status-unknown)]',
            )}
            aria-hidden="true"
          />
          <h3 className="panel-section-title truncate !tracking-[0.08em]">{metric.label}</h3>
        </div>
        <MetricSparkline values={metric.sparkline} color={sparkColor(metric.parameter)} />
      </div>

      {displayValue !== null ? (
        <p className="type-metric mt-2">
          {displayValue}
          {metric.unit ? (
            <span className="type-metric-unit ml-1.5 align-baseline">{metric.unit}</span>
          ) : null}
        </p>
      ) : (
        <p className="mt-2 text-lg font-medium tracking-tight text-[var(--color-text-primary)]">
          {typeof metric.value === 'string' ? metric.value : '—'}
        </p>
      )}

      <div className="mt-1.5 space-y-0.5">
        {interpretation && metric.parameter !== 'bloom_risk' ? (
          <p className="text-xs font-medium text-[var(--color-text-secondary)]">
            {interpretation}
          </p>
        ) : null}
        {hasComparison ? (
          <p
            className={cn(
              'text-2xs',
              isNegativeChange && 'text-[var(--color-trend-down)]',
              isPositiveChange && 'text-[var(--color-trend-up)]',
              !isNegativeChange && !isPositiveChange && 'text-[var(--color-text-muted)]',
            )}
          >
            {metric.changeLabel}
            <span className="text-[var(--color-text-muted)]"> · {metric.baselineLabel}</span>
          </p>
        ) : metric.parameter === 'bloom_risk' && metric.changeLabel !== '—' ? (
          <p className="type-tech text-[var(--color-text-muted)]">{metric.changeLabel}</p>
        ) : metric.baselineLabel &&
          metric.baselineLabel !== 'baseline unavailable' &&
          metric.changeLabel === '—' ? (
          <p className="text-2xs text-[var(--color-text-muted)]">{metric.baselineLabel}</p>
        ) : null}
      </div>
    </article>
  )
}
