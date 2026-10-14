import { useEffect, useState } from 'react'
import { Maximize2, Minimize2 } from 'lucide-react'
import EmptyState from './EmptyState'

export default function ChartContainer({
  title,
  subtitle,
  children,
  controls = null,
  empty = false,
  emptyTitle = 'No data',
  emptyDescription,
  chartHeight = 280,
  allowFullscreen = true,
  dense = false,
}) {
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (!expanded) return
    const onKey = (e) => {
      if (e.key === 'Escape') setExpanded(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [expanded])

  const chartBlock = (height) => (
    <div className="w-full" style={{ height }}>
      {empty ? <EmptyState title={emptyTitle} description={emptyDescription} /> : children}
    </div>
  )

  return (
    <>
      <div
        className={
          dense
            ? 'flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-2.5'
            : 'surface flex min-h-[320px] flex-col p-4 md:p-5'
        }
      >
        <div className={`flex items-start justify-between gap-2 ${dense ? 'mb-1.5' : 'mb-3'}`}>
          <div className="min-w-0">
            <h3
              className={`font-[family-name:var(--font-display)] font-semibold tracking-tight ${
                dense ? 'text-xs' : 'text-sm'
              }`}
            >
              {title}
            </h3>
            {subtitle ? (
              <p className={`muted ${dense ? 'mt-0.5 text-[10px] leading-snug' : 'mt-0.5 text-xs'}`}>
                {subtitle}
              </p>
            ) : null}
          </div>
          {allowFullscreen ? (
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className={`inline-flex shrink-0 items-center justify-center rounded-lg bg-[var(--surface)] text-[var(--text-muted)] transition hover:text-[var(--text)] ${
                dense ? 'h-7 w-7' : 'h-8 w-8 bg-[var(--surface-2)] hover:bg-[var(--surface-3)]'
              }`}
              aria-label="Expand chart"
              title="Fullscreen"
            >
              <Maximize2 className={dense ? 'h-3 w-3' : 'h-3.5 w-3.5'} />
            </button>
          ) : null}
        </div>
        {controls ? (
          <div className={`flex flex-wrap gap-1 ${dense ? 'mb-1.5' : 'mb-3 gap-2'}`}>{controls}</div>
        ) : null}
        {!expanded ? chartBlock(chartHeight) : <div aria-hidden style={{ height: chartHeight }} />}
      </div>

      {expanded ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-3 md:p-8"
          onClick={() => setExpanded(false)}
          role="presentation"
        >
          <div
            className="surface flex max-h-[min(720px,90dvh)] w-full max-w-5xl flex-col overflow-auto p-4 shadow-xl md:p-5"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-[family-name:var(--font-display)] text-sm font-semibold tracking-tight">
                  {title}
                </h3>
                {subtitle ? <p className="mt-0.5 text-xs muted">{subtitle}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--surface-2)] text-[var(--text-muted)] transition hover:bg-[var(--surface-3)] hover:text-[var(--text)]"
                aria-label="Collapse chart"
                title="Collapse"
              >
                <Minimize2 className="h-3.5 w-3.5" />
              </button>
            </div>
            {controls ? <div className="mb-3 flex flex-wrap gap-2">{controls}</div> : null}
            {chartBlock('min(480px, calc(90dvh - 9rem))')}
          </div>
        </div>
      ) : null}
    </>
  )
}
