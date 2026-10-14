import { methodologyEntries } from '@/domain/methodology/water-quality-methodology'

/**
 * Display text for one class already recorded in the methodology inventory.
 * Does not add a threshold or classify a measurement.
 */
export function inventoryClassRange(key: string, label: string | null | undefined): string | null {
  const trimmed = label?.trim()
  if (!trimmed) return null
  const item = methodologyEntries.find((entry) => entry.key === key)
  const classes = item?.classes
  if (!classes?.length) return null
  const match = classes.find((klass) => klass.label.toLowerCase() === trimmed.toLowerCase())
  if (!match) return null
  return formatInventoryBounds(match.bounds, item?.unit ?? null, match === classes[classes.length - 1])
}

function formatInventoryBounds(bounds: string, unit: string | null, openEnded: boolean): string {
  const suffix = unit ? ` ${unit}` : ''
  const upperOnly = bounds.match(/^[\w.]+ < ([0-9.eE+-]+)$/)
  if (upperOnly) return `<${upperOnly[1]}${suffix}`
  const span = bounds.match(/^([0-9.eE+-]+) <= [\w.]+ < ([0-9.eE+-]+)$/)
  if (span) {
    if (openEnded) return `≥${span[1]}${suffix}`
    return `${span[1]}–${span[2]}${suffix}`
  }
  return bounds
}
