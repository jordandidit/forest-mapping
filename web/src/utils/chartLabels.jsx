/**
 * Readable forest labels for tight chart axes.
 * Keeps identity while shortening common Rwanda designations.
 */
export function shortForestName(name, max = 26) {
  if (!name) return '—'
  let s = String(name)
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\bNational Park\b/gi, 'NP')
    .replace(/\bForest Reserve\b/gi, 'FR')
    .replace(/\bNatural Forest\b/gi, 'NF')
    .replace(/\bNatural Fo(?:rest)?\b/gi, 'NF')
    .replace(/\b_/g, ' ')

  if (s.length <= max) return s

  // Prefer cutting at a word boundary
  const cut = s.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  if (lastSpace > Math.floor(max * 0.45)) {
    return `${cut.slice(0, lastSpace)}…`
  }
  return `${cut}…`
}

/** Two-line tick for Recharts category axes */
export function ForestAxisTick({ x, y, payload, maxChars = 14 }) {
  const full = payload?.value || ''
  const text = String(full)
  let line1 = text
  let line2 = ''

  if (text.length > maxChars) {
    const words = text.split(' ')
    line1 = ''
    line2 = ''
    for (const w of words) {
      const next = line1 ? `${line1} ${w}` : w
      if (!line2 && next.length <= maxChars) {
        line1 = next
      } else {
        line2 = line2 ? `${line2} ${w}` : w
      }
    }
    if (line2.length > maxChars) line2 = `${line2.slice(0, maxChars - 1)}…`
  }

  return (
    <g transform={`translate(${x},${y})`}>
      <title>{full}</title>
      <text
        x={-4}
        y={line2 ? -6 : 0}
        dy={4}
        textAnchor="end"
        fill="var(--chart-axis)"
        fontSize={11}
      >
        {line1}
      </text>
      {line2 ? (
        <text x={-4} y={6} dy={4} textAnchor="end" fill="var(--chart-axis)" fontSize={11}>
          {line2}
        </text>
      ) : null}
    </g>
  )
}
