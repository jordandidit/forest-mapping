const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
  timeZone: 'UTC',
})

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
  timeZone: 'UTC',
})

export function formatObservationDate(isoDate: string): string {
  return dateFormatter.format(new Date(`${isoDate}T00:00:00Z`))
}

/** Compact technical date for chart axes: JUL 05 */
export function formatChartTickDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`)
  const month = date
    .toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })
    .toUpperCase()
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${month} ${day}`
}

/** Technical readout date: 03 SEP 2026 */
export function formatTechnicalDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`)
  const day = String(date.getUTCDate()).padStart(2, '0')
  const month = date
    .toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })
    .toUpperCase()
  const year = date.getUTCFullYear()
  return `${day} ${month} ${year}`
}

/** Short display date: 03 Sep */
export function formatShortDisplayDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00Z`)
  const day = String(date.getUTCDate()).padStart(2, '0')
  const month = date.toLocaleString('en-US', { month: 'short', timeZone: 'UTC' })
  return `${day} ${month}`
}

export function formatObservationDateTime(isoTimestamp: string): string {
  return `${dateTimeFormatter.format(new Date(isoTimestamp))} UTC`
}

export function formatObservationTime(isoTimestamp: string): string {
  return `${timeFormatter.format(new Date(isoTimestamp))} (UTC)`
}

export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 3,
    ...options,
  }).format(value)
}

export function formatPercent(value: number, digits = 1): string {
  return `${formatNumber(value, { maximumFractionDigits: digits, minimumFractionDigits: digits })}%`
}

export function formatScientificValue(
  value: number | string,
  unit?: string,
): string {
  if (typeof value === 'string') {
    return value
  }

  const formatted = formatNumber(value, {
    maximumFractionDigits: value < 1 ? 3 : 1,
    minimumFractionDigits: value < 1 ? 3 : 1,
  })

  return unit ? `${formatted} ${unit}` : formatted
}

export function formatStatusLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

export function formatTrendLabel(trend: string): string {
  return formatStatusLabel(trend)
}
