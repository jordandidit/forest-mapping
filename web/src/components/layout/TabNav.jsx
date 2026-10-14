const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'trends', label: 'Trends' },
  { id: 'compare', label: 'Compare' },
  { id: 'observations', label: 'Observations' },
]

export default function TabNav({ tab, onChange }) {
  return (
    <nav className="flex gap-1 overflow-x-auto rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-1" aria-label="Dashboard sections">
      {TABS.map((t) => {
        const active = tab === t.id
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap transition ${
              active
                ? 'bg-[var(--surface)] text-[var(--text)] shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text)]'
            }`}
            aria-current={active ? 'page' : undefined}
          >
            {t.label}
          </button>
        )
      })}
    </nav>
  )
}
