import { Link } from 'react-router-dom'

export function AlertsPage() {
  return (
    <div className="flex h-full items-center justify-center p-6">
      <div className="max-w-md border border-[var(--color-border)] bg-[var(--color-bg-panel)] p-5">
        <p className="text-2xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          Monitoring
        </p>
        <h1 className="mt-2 text-lg font-semibold">Alerts</h1>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Threshold breaches, bloom risk alerts, and data-quality notifications will appear here.
        </p>
        <Link
          to="/lakes/lake-muhazi"
          className="mt-4 inline-flex text-xs text-[var(--color-accent)] hover:underline"
        >
          Open Lake Muhazi →
        </Link>
      </div>
    </div>
  )
}
