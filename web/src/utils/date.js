import { format, parseISO, subMonths, isValid } from 'date-fns'

/** Normalize ArcGIS epoch ms, ISO strings, or Date -> Date | null */
export function toDate(value) {
  if (value == null || value === '') return null
  if (value instanceof Date) return isValid(value) ? value : null
  if (typeof value === 'number') {
    const d = new Date(value)
    return isValid(d) ? d : null
  }
  if (typeof value === 'string') {
    const asNum = Number(value)
    if (!Number.isNaN(asNum) && value.trim() !== '') {
      const d = new Date(asNum)
      if (isValid(d)) return d
    }
    const iso = parseISO(value)
    if (isValid(iso)) return iso
    const d = new Date(value)
    return isValid(d) ? d : null
  }
  return null
}

export function formatDate(value, pattern = 'd MMM yyyy') {
  const d = toDate(value)
  if (!d) return '—'
  return format(d, pattern)
}

export function formatDateTime(value) {
  return formatDate(value, 'd MMM yyyy, HH:mm')
}

export function monthsAgo(n) {
  return subMonths(new Date(), n)
}

export function inDateRange(value, from, to) {
  const d = toDate(value)
  if (!d) return false
  if (from && d < from) return false
  if (to && d > to) return false
  return true
}
