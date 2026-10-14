import { X } from 'lucide-react'
import EmptyState from '../ui/EmptyState'

export default function IndexGuideModal({ open, onClose, guide }) {
  if (!open) return null

  const entries = (guide || []).filter((g) => ['NDVI', 'NDMI', 'NBR', 'STATUS', 'OVERLAY_NDVI', 'OVERLAY_NBR'].includes(g.code))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" role="dialog" aria-modal="true" aria-labelledby="index-guide-title">
      <div className="surface max-h-[85vh] w-full max-w-3xl overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4">
          <div>
            <h2 id="index-guide-title" className="text-base font-semibold">
              Understanding the indices
            </h2>
            <p className="text-xs muted">From the Forest Health IndexGuide service</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[var(--border)]"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="scrollbar-thin max-h-[calc(85vh-72px)] space-y-4 overflow-y-auto p-5">
          {entries.length === 0 ? (
            <EmptyState title="Index guide unavailable" description="IndexGuide table could not be loaded." />
          ) : (
            entries.map((g) => (
              <article key={g.code} className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                <h3 className="text-sm font-semibold">
                  {g.code}: {g.name}
                </h3>
                {g.formula ? (
                  <p className="mt-1 font-mono text-xs text-[var(--primary)]">{g.formula}</p>
                ) : null}
                <dl className="mt-3 space-y-2 text-sm">
                  <Row label="Meaning" value={g.meaning} />
                  <Row label="How to read" value={g.howToRead} />
                  <Row label="Thresholds" value={g.thresholds} />
                  <Row label="Caveats" value={g.caveats} />
                  <Row label="Reference" value={g.reference} />
                </dl>
              </article>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }) {
  if (!value) return null
  return (
    <div>
      <dt className="text-xs font-medium muted">{label}</dt>
      <dd className="mt-0.5 leading-relaxed">{value}</dd>
    </div>
  )
}
