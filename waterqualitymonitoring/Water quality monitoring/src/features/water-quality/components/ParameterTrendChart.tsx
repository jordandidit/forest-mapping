import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ReactNode } from 'react'
import { formatSignedPercent, percentDifference } from '@/domain/intelligence/helpers'
import type { ParameterTimeSeries, TimeRangeId, TimeSeriesPoint } from '@/domain/observation/types'
import {
  ParameterTabs,
  TimeRangeSelector,
  TrendViewToggle,
} from '@/features/water-quality/components/ParameterTabs'
import {
  PIPELINE_SCREENING_LEGEND,
  screeningFill,
} from '@/features/observations/history-screening'
import type { TrendParameterTab, TrendView } from '@/stores/ui-store'
import {
  formatChartTickDate,
  formatNumber,
  formatObservationDate,
  formatStatusLabel,
  formatTechnicalDate,
} from '@/lib/format'

interface ParameterTrendChartProps {
  series: ParameterTimeSeries | undefined
  parameter: TrendParameterTab
  timeRange: TimeRangeId
  onParameterChange: (parameter: TrendParameterTab) => void
  onTimeRangeChange: (range: TimeRangeId) => void
  /** Authoritative baseline (e.g. turb_base / ndci_base). Omit when unavailable. */
  baselineMean?: number | null
  /** History selection. Marks this observation; does not keep a separate chart date. */
  selectedObservationId?: string | null
  /** Same selection function used by the date filter and observation history. */
  onSelectObservation?: (observationId: string) => void
  /** Dates of the two compared observations, when a comparison is active. */
  comparisonDates?: readonly string[]
  /** Stored pipeline trend label. Not derived from the plotted points. */
  trendLabel?: string | null
  /** Chart or table. The toggle is shown only when a table is supplied. */
  view?: TrendView
  onViewChange?: (view: TrendView) => void
  /** Observation table rendered in place of the chart when view is 'table'. */
  table?: ReactNode
}

function filterByRange(
  series: ParameterTimeSeries,
  range: TimeRangeId,
): ParameterTimeSeries['points'] {
  const dated = series.points.filter((point) => point.date)
  const end = new Date(dated.at(-1)?.date ?? dated[0]?.date ?? '2026-10-03')
  const months =
    range === '1M' ? 1 : range === '3M' ? 3 : range === '1Y' ? 12 : range === '3Y' ? 36 : 60
  const start = new Date(end)
  start.setUTCMonth(start.getUTCMonth() - months)
  return series.points.filter((point) => new Date(point.date) >= start)
}

function parameterUnit(parameter: TrendParameterTab): string {
  if (parameter === 'turbidity') return 'FNU'
  if (parameter === 'floating_vegetation') return '%'
  return ''
}

function metricLabel(parameter: TrendParameterTab): string {
  if (parameter === 'turbidity') return 'Turbidity'
  if (parameter === 'floating_vegetation') return 'Floating vegetation'
  return 'NDCI'
}

/** Presentation only. Uses the lake 14-month mean already on the chart; never invents one. */
function formatVs14MonthMean(
  value: number | null | undefined,
  baseline: number | null | undefined,
): string {
  if (value == null || baseline == null) return '—'
  const pct = percentDifference(value, baseline)
  if (pct == null) return '—'
  return formatSignedPercent(pct)
}

function storedClassification(point: TimeSeriesPoint | undefined): string {
  const level = point?.classification?.trim()
  return level || '—'
}

function storedObservationQuality(point: TimeSeriesPoint | undefined): string {
  const label = point?.qualityLabel?.trim()
  if (label) return label
  if (point?.quality) return formatStatusLabel(point.quality)
  return '—'
}

function metricValue(value: number | null | undefined, unit: string): string {
  if (value == null || Number.isNaN(Number(value))) return '—'
  const formatted = formatNumber(Number(value))
  return unit ? `${formatted} ${unit}` : formatted
}

const BASELINE_HELP =
  'Average of valid monthly observations available within the 14-month historical window.'

/** Present the stored pipeline trend label. Does not derive a direction from values. */
export function presentLongTermTrend(label: string | null | undefined): string | null {
  const raw = label?.trim()
  if (!raw) return null
  const normalized = raw.toLowerCase().replace(/\s+/g, ' ')
  if (normalized === 'increasing') return 'Increasing ↑'
  if (normalized === 'decreasing') return 'Decreasing ↓'
  if (normalized === 'stable') return 'Stable'
  if (normalized === 'not enough data') return 'Not enough data'
  return raw
}

function latestValidPoint(points: TimeSeriesPoint[]): TimeSeriesPoint | null {
  for (let i = points.length - 1; i >= 0; i -= 1) {
    const point = points[i]
    if (point && point.value !== null) return point
  }
  return null
}

export function ScientificTooltip({
  active,
  payload,
  label,
  unit,
  parameter,
  baselineMean = null,
}: {
  active?: boolean
  payload?: Array<{ value?: number | null; dataKey?: string; payload?: TimeSeriesPoint }>
  label?: string
  unit: string
  parameter: TrendParameterTab
  /** Lake 14-month mean for this metric. Null when the water body has none. */
  baselineMean?: number | null
}) {
  if (!active || !payload?.length || !label) return null
  const observation = payload.find((item) => item.dataKey !== 'trend') ?? payload[0]
  const point = observation?.payload
  const value = observation?.value
  const rows = [
    { label: metricLabel(parameter), value: metricValue(value, unit) },
    { label: 'Classification', value: storedClassification(point) },
    { label: 'vs historical baseline', value: formatVs14MonthMean(value, baselineMean) },
    { label: 'Observation quality', value: storedObservationQuality(point) },
  ]

  return (
    <div
      className="rounded-[var(--radius-control)] border border-[var(--border-float)] bg-[var(--color-bg-panel-elevated)] px-2.5 py-2 shadow-[var(--shadow-float)]"
      role="tooltip"
    >
      <p className="type-tech text-[var(--color-text-muted)]">
        {formatObservationDate(String(label))}
      </p>
      <dl className="mt-2 space-y-1">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-6">
            <dt className="type-section-label !tracking-[0.08em]">{row.label}</dt>
            <dd className="font-sans text-xs font-medium tabular-nums text-[var(--color-text-primary)]">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export function ParameterTrendChart({
  series,
  parameter,
  timeRange,
  onParameterChange,
  onTimeRangeChange,
  baselineMean = null,
  selectedObservationId = null,
  onSelectObservation,
  comparisonDates = [],
  trendLabel = null,
  view = 'chart',
  onViewChange,
  table,
}: ParameterTrendChartProps) {
  const showTable = view === 'table' && table != null
  const points = series ? filterByRange(series, timeRange) : []
  const longTermTrend = presentLongTermTrend(trendLabel)
  const selectedDate =
    points.find((point) => point.observationId && point.observationId === selectedObservationId)
      ?.date ?? null
  const selectedInView = selectedDate != null
  const comparisonInView = [...new Set(comparisonDates)].filter(
    (date) => date !== selectedDate && points.some((point) => point.date === date),
  )
  const hasPlottable = points.some((point) => point.value !== null)
  const hasGaps = points.some((point) => point.value === null)
  const latest = latestValidPoint(points)
  const unit = parameterUnit(parameter)
  const seriesColor =
    parameter === 'turbidity'
      ? 'var(--color-param-turbidity)'
      : parameter === 'floating_vegetation'
        ? 'var(--color-param-vegetation)'
        : 'var(--color-param-chlorophyll)'

  const showBaseline =
    baselineMean !== null &&
    baselineMean !== undefined &&
    (parameter === 'turbidity' || parameter === 'ndci')
  const showScreeningLegend =
    (parameter === 'turbidity' || parameter === 'ndci') &&
    points.some((point) => point.value !== null && screeningFill(point.classification) != null)

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col" aria-labelledby="trends-heading">
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-1 px-3 pb-1 pt-2 sm:px-4">
        <h2 id="trends-heading" className="panel-section-title min-w-0">
          Water quality over time
        </h2>
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {showTable ? null : (
            <>
              <ParameterTabs value={parameter} onChange={onParameterChange} />
              <TimeRangeSelector value={timeRange} onChange={onTimeRangeChange} />
            </>
          )}
          {table != null && onViewChange ? (
            <TrendViewToggle value={view} onChange={onViewChange} />
          ) : null}
        </div>
      </div>

      {showTable ? (
        <div className="motion-crossfade flex min-h-0 min-w-0 flex-1 flex-col">{table}</div>
      ) : (
      <div key={parameter} className="motion-crossfade flex min-h-0 min-w-0 flex-1 flex-col">
      {longTermTrend ? (
        <p className="flex items-baseline gap-2 px-3 pb-1 sm:px-4">
          <span className="type-section-label !tracking-[0.08em] text-[var(--color-text-muted)]">
            Long-term trend
          </span>
          <span className="text-sm font-medium text-[var(--color-text-primary)]">{longTermTrend}</span>
        </p>
      ) : null}

      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 px-3 pb-1 text-xs text-[var(--color-text-muted)] sm:px-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-px w-3" style={{ background: seriesColor }} aria-hidden="true" />
            Observation
          </span>
          {showBaseline ? (
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-px w-3 border-t border-dashed"
                style={{ borderColor: 'var(--color-chart-baseline)' }}
                aria-hidden="true"
              />
              Historical baseline
              <button
                type="button"
                className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[var(--color-border-strong)] text-2xs leading-none text-[var(--color-text-secondary)]"
                title={BASELINE_HELP}
                aria-label={BASELINE_HELP}
              >
                i
              </button>
            </span>
          ) : null}
          {showScreeningLegend ? (
            <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-0.5">
              {PIPELINE_SCREENING_LEGEND.map((item) => (
                <span key={item.label} className="inline-flex items-center gap-1">
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: item.color }}
                    aria-hidden="true"
                  />
                  {item.label}
                </span>
              ))}
            </span>
          ) : null}
          {series?.threshold ? (
            <span className="inline-flex items-center gap-1.5">
              <span
                className="h-px w-3 border-t border-dashed border-[var(--color-status-critical)]"
                aria-hidden="true"
              />
              {series.threshold.label}
            </span>
          ) : null}
      </div>

      <div className="min-h-0 min-w-0 flex-1 px-2 pb-1 pt-1">
        {!hasPlottable ? (
          <p className="px-2 py-6 text-center text-xs text-[var(--color-text-muted)]">
            No time-series data for this lake yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 8, right: 28, left: 4, bottom: 4 }}>
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={seriesColor} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={seriesColor} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid
                stroke="var(--color-chart-grid)"
                strokeDasharray="1 6"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tickFormatter={(value: string) => formatChartTickDate(value)}
                tick={{
                  fill: 'var(--color-chart-axis)',
                  fontSize: 11,
                  fontFamily: 'var(--font-sans)',
                }}
                axisLine={{ stroke: 'var(--color-border)' }}
                tickLine={false}
                minTickGap={36}
              />
              <YAxis
                tick={{
                  fill: 'var(--color-chart-axis)',
                  fontSize: 11,
                  fontFamily: 'var(--font-sans)',
                }}
                axisLine={false}
                tickLine={false}
                width={40}
                tickFormatter={(value: number) => formatNumber(value)}
                domain={['auto', 'auto']}
              />
              <Tooltip
                cursor={{ stroke: 'var(--color-border-strong)', strokeWidth: 1 }}
                content={
                  <ScientificTooltip
                    unit={unit}
                    parameter={parameter}
                    baselineMean={baselineMean}
                  />
                }
              />
              {showBaseline ? (
                <ReferenceLine
                  y={baselineMean as number}
                  stroke="var(--color-chart-baseline)"
                  strokeDasharray="3 4"
                  strokeWidth={1}
                  label={{
                    value: '14M mean',
                    fill: 'var(--color-text-muted)',
                    fontSize: 11,
                    fontFamily: 'var(--font-sans)',
                    position: 'insideTopRight',
                  }}
                />
              ) : null}
              {series?.threshold ? (
                <ReferenceLine
                  y={series.threshold.value}
                  stroke="var(--color-status-critical)"
                  strokeDasharray="4 4"
                  strokeWidth={1}
                  strokeOpacity={0.65}
                />
              ) : null}
              {series?.annotations.map((annotation) => (
                <ReferenceLine
                  key={annotation.date}
                  x={annotation.date}
                  stroke="var(--color-border-strong)"
                  strokeDasharray="2 2"
                  label={{
                    value: `${annotation.label}\n${formatChartTickDate(annotation.date)}`,
                    fill: 'var(--color-text-secondary)',
                    fontSize: 11,
                    position: 'insideTopLeft',
                  }}
                />
              ))}
              {selectedInView ? (
                <ReferenceLine
                  x={selectedDate ?? undefined}
                  stroke="var(--color-accent)"
                  strokeDasharray="2 3"
                  strokeWidth={1}
                />
              ) : null}
              {comparisonInView.map((date) => (
                <ReferenceLine
                  key={`compare-${date}`}
                  x={date}
                  stroke="var(--color-accent)"
                  strokeDasharray="2 3"
                  strokeWidth={1}
                  strokeOpacity={0.55}
                />
              ))}
              {/* The line joins consecutive valid points across null (missing/invalid) observations. No dot is drawn for a null date. */}
              <Area
                type="monotone"
                dataKey="value"
                stroke={seriesColor}
                strokeWidth={1.6}
                fill="url(#trendFill)"
                connectNulls
                isAnimationActive={false}
                dot={(props) => (
                  <ObservationPoint
                    key={`obs-point-${(props as { index?: number }).index ?? 0}`}
                    cx={(props as { cx?: number }).cx}
                    cy={(props as { cy?: number }).cy}
                    payload={(props as { payload?: TimeSeriesPoint }).payload}
                    selectedObservationId={selectedObservationId}
                    comparisonDates={comparisonDates}
                    seriesColor={seriesColor}
                    latestDate={latest?.date ?? null}
                    onSelectObservation={onSelectObservation}
                  />
                )}
                activeDot={(props) => (
                  <ObservationPoint
                    key={`obs-active-${(props as { index?: number }).index ?? 0}`}
                    cx={(props as { cx?: number }).cx}
                    cy={(props as { cy?: number }).cy}
                    payload={(props as { payload?: TimeSeriesPoint }).payload}
                    selectedObservationId={selectedObservationId}
                    comparisonDates={comparisonDates}
                    seriesColor={seriesColor}
                    latestDate={latest?.date ?? null}
                    onSelectObservation={onSelectObservation}
                    active
                  />
                )}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {hasPlottable && hasGaps ? <ChartGapNote /> : null}
      </div>
      )}
    </section>
  )
}

const GAP_DETAIL =
  'Satellite observations may be excluded because of cloud, haze or glint, insufficient usable water pixels, or unavailable imagery.'

export function ChartGapNote() {
  return (
    <p className="flex items-center gap-1.5 px-4 pb-2 text-xs leading-snug text-[var(--color-text-muted)]">
      <span>The line connects valid observations. Dates with no valid water-quality measurement are skipped.</span>
      <button
        type="button"
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-strong)] text-2xs leading-none text-[var(--color-text-secondary)]"
        title={GAP_DETAIL}
        aria-label={GAP_DETAIL}
      >
        i
      </button>
    </p>
  )
}

function ObservationPoint({
  cx,
  cy,
  payload,
  selectedObservationId,
  comparisonDates,
  seriesColor,
  latestDate,
  onSelectObservation,
  active = false,
}: {
  cx?: number
  cy?: number
  payload?: TimeSeriesPoint
  selectedObservationId: string | null
  comparisonDates: readonly string[]
  seriesColor: string
  latestDate: string | null
  onSelectObservation?: (observationId: string) => void
  active?: boolean
}) {
  if (cx == null || cy == null || !payload || payload.value === null || !payload.observationId) {
    return <g />
  }

  const selected = payload.observationId === selectedObservationId
  const compared = comparisonDates.includes(payload.date)
  const latest = payload.date === latestDate
  const radius = (selected || compared ? 5 : latest ? 4.25 : 3.75) + (active ? 1 : 0)
  const choose = () => onSelectObservation?.(payload.observationId!)

  return (
    <g
      role="button"
      tabIndex={0}
      className="group outline-none"
      aria-label={`Select observation ${formatTechnicalDate(payload.date)}`}
      aria-pressed={selected}
      style={{ cursor: 'pointer' }}
      onClick={(event) => {
        event.stopPropagation()
        choose()
      }}
      onKeyDown={(event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return
        event.preventDefault()
        choose()
      }}
    >
      <circle cx={cx} cy={cy} r={11} fill="transparent" />
      <circle
        cx={cx}
        cy={cy}
        r={radius + 4}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={1}
        className="opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
      />
      <circle
        className="motion-point"
        cx={cx}
        cy={cy}
        r={radius}
        fill={screeningFill(payload.classification) ?? seriesColor}
        stroke={selected ? 'var(--color-text-primary)' : 'var(--color-bg-panel)'}
        strokeWidth={selected ? 2 : 1}
      />
    </g>
  )
}
