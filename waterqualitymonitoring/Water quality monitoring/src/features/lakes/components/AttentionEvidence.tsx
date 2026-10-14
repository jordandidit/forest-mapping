import type { EvidenceCategory, EvidenceItem } from '@/domain/intelligence'

const SECTION_ORDER: EvidenceCategory[] = [
  'measurement',
  'pipeline_classification',
  'observation',
  'historical_context',
]

const SECTION_TITLE: Record<EvidenceCategory, string> = {
  measurement: 'Measurement',
  pipeline_classification: 'Pipeline classification',
  observation: 'Observation',
  historical_context: 'Historical context',
}

function displayValue(item: EvidenceItem): string {
  if (item.value === null || item.value === undefined || item.value === '') return '—'
  return `${item.value}${item.unit ? ` ${item.unit}` : ''}`
}

export function AttentionEvidence({
  title,
  items,
  onOpenMethodology,
}: {
  title: string
  items: EvidenceItem[]
  onOpenMethodology: () => void
}) {
  const groups = SECTION_ORDER.map((category) => ({
    category,
    items: items.filter((item) => item.category === category),
  })).filter((group) => group.items.length > 0)

  return (
    <div className="mt-2 min-w-0 space-y-2" role="region" aria-label={`${title} evidence`}>
      {groups.map((group) => (
        <div key={group.category} className="min-w-0">
          <p className="text-xs font-medium text-[var(--color-text-muted)]">
            {SECTION_TITLE[group.category]}
          </p>
          <ul className="mt-0.5">
            {group.items.map((item) => (
              <li key={item.id} className="flex min-w-0 items-baseline justify-between gap-3">
                <span className="min-w-0 text-xs text-[var(--color-text-secondary)]">{item.label}</span>
                <span className="type-tech max-w-[62%] text-right leading-snug text-[var(--color-text-primary)] [overflow-wrap:break-word]">
                  {displayValue(item)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
      <button
        type="button"
        className="text-xs text-[var(--color-text-muted)] transition-colors duration-[var(--transition-fast)] hover:text-[var(--color-accent)]"
        aria-haspopup="dialog"
        onClick={onOpenMethodology}
      >
        How is this determined?
      </button>
    </div>
  )
}
