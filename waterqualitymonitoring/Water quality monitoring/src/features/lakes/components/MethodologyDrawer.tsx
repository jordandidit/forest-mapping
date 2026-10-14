import { useEffect, useRef, type ReactNode } from 'react'
import type { MethodologyExplanation, ScaleRow } from '@/features/lakes/methodology-explanation'

interface MethodologyDrawerProps {
  open: boolean
  explanation: MethodologyExplanation
  onClose: () => void
  onEscape: () => void
}

export function MethodologyDrawer({ open, explanation, onClose, onEscape }: MethodologyDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onEscape()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onEscape])

  return (
    <dialog
      ref={dialogRef}
      className="h-dvh max-h-none w-[min(100vw,22rem)] max-w-none border-l border-[var(--color-border)] bg-[var(--color-bg-panel)] p-0 text-[var(--color-text-primary)] backdrop:bg-black/40"
      style={{ margin: 0, marginLeft: 'auto', height: '100dvh', maxHeight: '100dvh' }}
      aria-labelledby="methodology-drawer-title"
      onCancel={(event) => {
        event.preventDefault()
        onEscape()
      }}
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex items-start justify-between gap-3 border-b border-[var(--color-border-subtle)] px-3.5 py-3">
          <div className="min-w-0">
            <p className="text-2xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
              {explanation.referenceLabel}
            </p>
            <h2 id="methodology-drawer-title" className="mt-1 text-md font-semibold leading-snug">
              {explanation.title}
            </h2>
          </div>
          <button
            type="button"
            className="shrink-0 text-2xs uppercase tracking-[0.08em] text-[var(--color-accent)]"
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-3.5 py-3">
          <p className="text-2xs leading-relaxed text-[var(--color-text-secondary)]">
            {explanation.disclaimer}
          </p>

          {explanation.mode === 'observation' && explanation.conditionLabel ? (
            <p className="mt-3 text-2xs text-[var(--color-text-secondary)]">
              Current condition · {explanation.conditionLabel}
            </p>
          ) : null}

          {explanation.observation ? (
            <ObservationBlock explanation={explanation} />
          ) : null}

          {explanation.mode === 'current' ? (
            <section className="mt-4" aria-labelledby="why-condition-heading">
              <h3 id="why-condition-heading" className="panel-section-title">
                Why this condition?
              </h3>
              <p className="mt-2 text-2xs leading-relaxed text-[var(--color-text-secondary)]">
                Lake condition is the status stored on this water body.
                {explanation.conditionLabel ? ` ${explanation.conditionLabel}.` : ''}
              </p>
              {explanation.drivers.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {explanation.drivers.map((driver) => (
                    <li key={driver.title}>
                      <p className="text-2xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                        Condition driver
                      </p>
                      <p className="mt-0.5 text-xs font-medium">{driver.title}</p>
                      <p className="type-tech text-[var(--color-text-secondary)]">{driver.detail}</p>
                      <p className="mt-0.5 text-2xs text-[var(--color-text-muted)]">{driver.reference}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-2xs leading-relaxed text-[var(--color-text-secondary)]">
                  This water body has no stored turbidity, chlorophyll, bloom, or vegetation label listed for this status.
                </p>
              )}
              {explanation.statusNote ? (
                <p className="mt-2 text-2xs leading-relaxed text-[var(--color-text-secondary)]">
                  {explanation.statusNote}
                </p>
              ) : null}
            </section>
          ) : null}

          {explanation.traces.length > 0 ? (
            <section className="mt-4" aria-label="Classification trace">
              <ul className="space-y-3">
                {explanation.traces.map((trace) => (
                  <li key={`${trace.measurementName}-${trace.classification}`}>
                    <Trace trace={trace} />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="mt-4" aria-labelledby="classification-reference-heading">
            <h3 id="classification-reference-heading" className="panel-section-title">
              Classification reference
            </h3>
            <Scale title="Turbidity" rows={explanation.turbidityScale} />
            <Scale title="NDCI / chlorophyll condition" rows={explanation.ndciScale} />
          </section>

          <Disclosure title="Overall condition rules">
            <RuleList items={explanation.bloomRules} heading="Bloom risk" />
            <p className="mt-2 text-2xs text-[var(--color-text-secondary)]">
              Floating vegetation. {explanation.vegetationRule}
            </p>
            <RuleList items={explanation.conditionRules} heading="Overall condition" />
          </Disclosure>

          <Disclosure title="Observation quality">
            <ul className="space-y-1.5">
              {explanation.qualityRules.map((rule) => (
                <li key={rule.label} className="text-2xs leading-snug">
                  <span className="font-medium">{rule.label}</span>
                  {rule.current ? <span className="ml-1 text-2xs uppercase tracking-[0.06em]">Current</span> : null}
                  <span className="text-[var(--color-text-secondary)]"> · {rule.detail}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-2xs leading-relaxed text-[var(--color-text-secondary)]">
              {explanation.validUpdatesCurrent}
            </p>
          </Disclosure>

          <Disclosure title="Historical baseline">
            <p className="text-2xs uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
              {explanation.baseline.referenceLabel}
            </p>
            <p className="mt-1 text-2xs leading-relaxed text-[var(--color-text-secondary)]">
              {explanation.baseline.summary} {explanation.baseline.notAnEnvironmentalStandard}
            </p>
            <p className="type-tech mt-2">{explanation.baseline.turbBase}</p>
            <p className="type-tech">{explanation.baseline.ndciBase}</p>
            {explanation.baseline.comparisons.length > 0 ? (
              <ul className="mt-2 space-y-1">
                {explanation.baseline.comparisons.map((comparison) => (
                  <li key={comparison} className="text-2xs text-[var(--color-text-secondary)]">
                    Shown in Lake Condition: {comparison}
                  </li>
                ))}
              </ul>
            ) : null}
          </Disclosure>

          <Disclosure title="Map interpretation">
            <p className="text-2xs leading-relaxed text-[var(--color-text-secondary)]">
              {explanation.mapColors.summary}
            </p>
            <p className="mt-1 text-2xs">{explanation.mapColors.labels.join(' · ')}</p>
          </Disclosure>

          <Disclosure title="Methods & references">
            <ul className="space-y-1.5">
              {explanation.methods.map((method) => (
                <li key={method.topic} className="text-2xs leading-snug">
                  <span className="font-medium">{method.topic}</span>
                  <span className="text-[var(--color-text-secondary)]"> · {method.citation}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-2xs leading-relaxed text-[var(--color-text-secondary)]">
              {explanation.methodsNote}
            </p>
            <p className="mt-1 text-2xs leading-relaxed text-[var(--color-text-secondary)]">
              {explanation.noExternalStatusReference}
            </p>
          </Disclosure>
        </div>
      </div>
    </dialog>
  )
}

function ObservationBlock({ explanation }: { explanation: MethodologyExplanation }) {
  const observation = explanation.observation
  if (!observation) return null
  return (
    <section className="mt-4" aria-label="Selected observation">
      <dl className="space-y-1">
        {observation.rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-3">
            <dt className="text-2xs text-[var(--color-text-secondary)]">{row.label}</dt>
            <dd className="type-tech">{row.value}</dd>
          </div>
        ))}
      </dl>
      {observation.notice ? (
        <p className="mt-2 text-2xs leading-relaxed text-[var(--color-text-secondary)]">
          {observation.notice}
        </p>
      ) : null}
    </section>
  )
}

function Trace({ trace }: { trace: MethodologyExplanation['traces'][number] }) {
  return (
    <div className="text-2xs leading-snug">
      <p className="text-[var(--color-text-muted)]">{trace.measurementName}</p>
      <p className="type-tech">{trace.measurementValue}</p>
      <p className="text-[var(--color-text-muted)]" aria-hidden="true">
        ↓
      </p>
      <p className="font-medium">{trace.classification}</p>
      {trace.range ? <p className="type-tech text-[var(--color-text-secondary)]">{trace.range}</p> : null}
      {trace.condition ? (
        <>
          <p className="text-[var(--color-text-muted)]" aria-hidden="true">
            ↓
          </p>
          <p className="text-[var(--color-text-muted)]">Lake condition</p>
          <p className="font-medium">{trace.condition}</p>
        </>
      ) : null}
    </div>
  )
}

function Scale({ title, rows }: { title: string; rows: ScaleRow[] }) {
  return (
    <div className="mt-2">
      <p className="text-2xs font-medium">{title}</p>
      <ul className="mt-1">
        {rows.map((row) => (
          <li
            key={row.label}
            className="flex items-baseline justify-between gap-3 py-0.5 text-2xs"
            aria-current={row.current ? 'true' : undefined}
          >
            <span className={row.current ? 'font-medium' : 'text-[var(--color-text-secondary)]'}>
              {row.label}
              {row.current ? <span className="ml-1 text-2xs uppercase tracking-[0.06em]">Current</span> : null}
            </span>
            <span className="type-tech">{row.range}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function RuleList({
  heading,
  items,
}: {
  heading: string
  items: { label: string; detail: string }[]
}) {
  return (
    <div className="mt-2">
      <p className="text-2xs font-medium">{heading}</p>
      <ul className="mt-1 space-y-1">
        {items.map((item) => (
          <li key={item.label} className="text-2xs leading-snug">
            <span className="font-medium uppercase tracking-[0.04em]">{item.label}</span>
            <span className="text-[var(--color-text-secondary)]"> · {item.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Disclosure({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="mt-3 border-t border-[var(--color-border-subtle)] pt-2">
      <summary className="cursor-pointer text-2xs uppercase tracking-[0.08em] text-[var(--color-accent)]">
        {title}
      </summary>
      <div className="mt-2">{children}</div>
    </details>
  )
}
