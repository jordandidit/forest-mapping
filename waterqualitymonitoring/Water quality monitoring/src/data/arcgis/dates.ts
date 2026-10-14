/** Centralized ArcGIS epoch-ms → ISO helpers. Keep Date parsing out of UI components. */

export function fromArcgisDate(value: number | string | null | undefined): string | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return null
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? null : date.toISOString()
  }

  const asNumber = Number(value)
  if (Number.isFinite(asNumber) && /^\d+$/.test(value.trim())) {
    const date = new Date(asNumber)
    return Number.isNaN(date.getTime()) ? null : date.toISOString()
  }

  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

export function fromArcgisDateOnly(value: number | string | null | undefined): string | null {
  const iso = fromArcgisDate(value)
  return iso ? iso.slice(0, 10) : null
}

export function asNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const num = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(num) ? num : null
}

export function asNullableString(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const text = String(value).trim()
  return text.length > 0 ? text : null
}

export function asNullableBooleanFlag(value: unknown): boolean | null {
  if (value === null || value === undefined || value === '') return null
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  const text = String(value).toLowerCase()
  if (text === 'true' || text === '1' || text === 'yes') return true
  if (text === 'false' || text === '0' || text === 'no') return false
  return null
}
