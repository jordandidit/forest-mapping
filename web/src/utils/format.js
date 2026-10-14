export function formatNumber(value, digits = 0) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return Number(value).toLocaleString('en-US', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  })
}

export function formatHa(value) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return `${formatNumber(value, 0)} ha`
}

export function formatIndex(value, digits = 2) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  const n = Number(value)
  const sign = n > 0 ? '+' : ''
  return `${sign}${n.toFixed(digits)}`
}

export function formatSigned(value, digits = 2) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  const n = Number(value)
  if (n > 0) return `+${n.toFixed(digits)}`
  return n.toFixed(digits)
}

export function formatPct(value, digits = 0) {
  if (value == null || Number.isNaN(Number(value))) return '—'
  return `${Number(value).toFixed(digits)}%`
}

export function debounce(fn, ms = 250) {
  let t
  return (...args) => {
    clearTimeout(t)
    t = setTimeout(() => fn(...args), ms)
  }
}
