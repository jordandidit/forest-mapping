import { formatHistoryNumber } from '@/features/observations/history'

/** Stored pipeline screening labels. Not a numeric classifier. */
const SCREENING_LABELS = ['Low', 'Moderate', 'High', 'Very high'] as const

export type ScreeningLabel = (typeof SCREENING_LABELS)[number]

/** Existing status palette. High and Very high stay distinct. */
const SCREENING_TEXT: Record<ScreeningLabel, string> = {
  Low: 'text-[var(--color-status-good)]',
  Moderate: 'text-[var(--color-status-moderate)]',
  High: 'text-[var(--color-status-poor)]',
  'Very high': 'text-[var(--color-status-critical)]',
}

const SCREENING_COLOR: Record<ScreeningLabel, string> = {
  Low: 'var(--color-status-good)',
  Moderate: 'var(--color-status-moderate)',
  High: 'var(--color-status-poor)',
  'Very high': 'var(--color-status-critical)',
}

/** Slate for a missing measurement. Not a screening class. */
const NEUTRAL_TEXT = 'text-[var(--color-status-unknown)]'
const NEUTRAL_COLOR = 'var(--color-status-unknown)'

export interface HistoryScreeningPresentation {
  text: string
  /** Null means a measured value has no stored screening label. */
  className: string | null
  /**
   * Inline color. Beats the unlayered `.type-tech` text color, which would
   * otherwise paint classified values the same cool gray.
   */
  color: string | null
  /** Colored marker. Omitted when there is no stored class. */
  showDot: boolean
  /** Tooltip. Present only when a stored screening label is shown. */
  title?: string
  ariaLabel: string
}

/**
 * Present a stored pipeline screening label beside a history measurement.
 * Does not read thresholds, the 14-month mean, or observation quality.
 * A missing measurement stays a slate em dash and is never colored as a class.
 */
export function presentHistoryScreening(input: {
  metric: 'FNU' | 'NDCI'
  value: number | null
  level: string | null | undefined
}): HistoryScreeningPresentation {
  const text = formatHistoryNumber(input.value)
  if (input.value === null) {
    return {
      text: '—',
      className: NEUTRAL_TEXT,
      color: NEUTRAL_COLOR,
      showDot: false,
      ariaLabel: `${input.metric} —`,
    }
  }

  const label = storedScreeningLabel(input.level)
  if (!label) {
    return {
      text,
      className: null,
      color: null,
      showDot: false,
      ariaLabel: `${input.metric} ${text}`,
    }
  }

  return {
    text,
    className: SCREENING_TEXT[label],
    color: SCREENING_COLOR[label],
    showDot: true,
    title: screeningTitle(input.metric, text, label),
    ariaLabel: `${input.metric} ${text}, ${label}`,
  }
}

function screeningTitle(metric: 'FNU' | 'NDCI', text: string, label: ScreeningLabel): string {
  if (metric === 'FNU') return `Turbidity ${text} FNU · ${label}`
  return `NDCI ${text} · ${label}`
}

/** Exact stored label only. Unknown or blank labels are not classified. */
export function storedScreeningLabel(level: string | null | undefined): ScreeningLabel | null {
  const normalized = level?.trim().replace(/\s+/g, ' ').toLowerCase()
  if (!normalized) return null
  return SCREENING_LABELS.find((label) => label.toLowerCase() === normalized) ?? null
}

/** Same status tokens as Observation History. Null when the stored label is not a screening class. */
export function screeningFill(level: string | null | undefined): string | null {
  const label = storedScreeningLabel(level)
  return label ? SCREENING_COLOR[label] : null
}

export const PIPELINE_SCREENING_LEGEND: ReadonlyArray<{ label: ScreeningLabel; color: string }> = [
  { label: 'Low', color: SCREENING_COLOR.Low },
  { label: 'Moderate', color: SCREENING_COLOR.Moderate },
  { label: 'High', color: SCREENING_COLOR.High },
  { label: 'Very high', color: SCREENING_COLOR['Very high'] },
]
