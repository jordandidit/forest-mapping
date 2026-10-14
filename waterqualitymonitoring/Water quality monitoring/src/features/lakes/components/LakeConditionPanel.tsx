import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  conditionTone,
  interpretLakeCondition,
  type AttentionLevel,
  type AttentionMapLayer,
  type AttentionSignal,
  type EvidenceCategory,
  type EvidenceItem,
  type InterpretationStatement,
  type InterpretationTone,
} from '@/domain/intelligence'
import type { WaterBody } from '@/domain/water-body/types'
import type { WaterQualityObservation } from '@/domain/observation/types'
import type { MapLayerId } from '@/domain/water-quality/types'
import {
  currentConditionLabel,
  formatExplorerDate,
  observationReadout,
} from '@/features/observations/observation-explorer'
import { formatNumber, formatTechnicalDate } from '@/lib/format'
import { cn } from '@/lib/cn'
import { toneFromQualityLabel } from '@/domain/intelligence/helpers'
import { useUiStore } from '@/stores/ui-store'
import { AttentionEvidence } from '@/features/lakes/components/AttentionEvidence'
import { MethodologyDrawer } from '@/features/lakes/components/MethodologyDrawer'
import {
  buildMethodologyExplanation,
  methodologyDrawerOpen,
} from '@/features/lakes/methodology-explanation'
import { discloseConditionExplanation } from '@/features/lakes/condition-hierarchy'

interface LakeConditionPanelProps {
  lake: WaterBody
  /** Latest observation used for the current lake summary. Not the inspected history row. */
  observation?: WaterQualityObservation
  /** Null means Latest. Does not replace WaterBodies.status. */
  selectedObservation?: WaterQualityObservation | null
  observations?: readonly WaterQualityObservation[]
}

const TONE_DOT: Record<InterpretationTone, string> = {
  positive: 'bg-[var(--color-status-good)]',
  neutral: 'bg-[var(--color-text-muted)]',
  watch: 'bg-[var(--color-status-moderate)]',
  concern: 'bg-[var(--color-status-critical)]',
  unknown: 'bg-[var(--color-status-unknown)]',
}

const TONE_TEXT: Record<InterpretationTone, string> = {
  positive: 'text-[var(--color-status-good)]',
  neutral: 'text-[var(--color-text-secondary)]',
  watch: 'text-[var(--color-status-moderate)]',
  concern: 'text-[var(--color-status-critical)]',
  unknown: 'text-[var(--color-text-muted)]',
}

const TONE_BORDER: Record<InterpretationTone, string> = {
  positive: 'border-l-[var(--color-status-good)]',
  neutral: 'border-l-[var(--color-text-muted)]',
  watch: 'border-l-[var(--color-status-moderate)]',
  concern: 'border-l-[var(--color-status-critical)]',
  unknown: 'border-l-[var(--color-status-unknown)]',
}

function formatDaysAgo(days: number): string {
  if (days === 0) return 'today'
  return days === 1 ? '1 day ago' : `${days} days ago`
}

/** UI marker weight only — not labeled as scientific severity. */
const ATTENTION_DOT: Record<AttentionLevel, string> = {
  info: 'bg-[var(--color-text-muted)]',
  watch: 'bg-[var(--color-status-moderate)]',
  attention: 'bg-[var(--color-status-poor)]',
}

const ATTENTION_TEXT: Record<AttentionLevel, string> = {
  info: 'text-[var(--color-text-secondary)]',
  watch: 'text-[var(--color-status-moderate)]',
  attention: 'text-[var(--color-status-poor)]',
}

const EVIDENCE_SECTION_LABEL: Record<EvidenceCategory, string> = {
  pipeline_classification: 'Pipeline classification',
  measurement: 'Measurement',
  historical_context: 'Historical context',
  observation: 'Observation',
}

const EVIDENCE_ORDER: EvidenceCategory[] = [
  'pipeline_classification',
  'measurement',
  'historical_context',
  'observation',
]

const SIGNAL_ATTENTION_KIND: Record<string, AttentionSignal['kind']> = {
  'signal-turbidity': 'turbidity',
  'signal-chlorophyll': 'chlorophyll',
  'signal-bloom-risk': 'bloom',
  'signal-floating-vegetation': 'vegetation',
}

/** Hide a current-signal row when Attention already states that same fact. */
function signalRepeatsAttention(signal: InterpretationStatement, attention: AttentionSignal[]): boolean {
  const kind = SIGNAL_ATTENTION_KIND[signal.id]
  if (!kind) return false
  const match = attention.find((item) => item.kind === kind)
  if (!match) return false
  const detail = (signal.detail ?? '').trim()
  if (!detail) return true
  return summaryStatesDetail(match.summary, detail)
}

function summaryStatesDetail(summary: string, detail: string): boolean {
  const needle = detail.toLowerCase()
  if (/[^a-z0-9\s]/i.test(detail)) return summary.toLowerCase().includes(needle)
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`\\b${escaped}\\b`, 'i').test(summary)
}

function attentionMapLayer(layer: AttentionMapLayer | null | undefined): MapLayerId | null {
  if (layer === 'turbidity' || layer === 'ndci') return layer
  return null
}

export function LakeConditionPanel({
  lake,
  observation,
  selectedObservation = null,
  observations = [],
}: LakeConditionPanelProps) {
  const interpretation = useMemo(
    () => interpretLakeCondition({ waterBody: lake, latestObservation: observation ?? null }),
    [lake, observation],
  )
  const [evidenceOpen, setEvidenceOpen] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [detailsLakeId, setDetailsLakeId] = useState(lake.id)
  if (detailsLakeId !== lake.id) {
    setDetailsLakeId(lake.id)
    setDetailsOpen(false)
  }
  const [methodologyOpen, setMethodologyOpen] = useState(false)
  const [openAttentionId, setOpenAttentionId] = useState<string | null>(null)
  const methodologyTriggerRef = useRef<HTMLButtonElement>(null)
  const methodologyWasOpen = useRef(false)
  const selectedLayer = useUiStore((s) => s.selectedLayer)
  const setSelectedLayer = useUiStore((s) => s.setSelectedLayer)
  const explanation = useMemo(
    () =>
      buildMethodologyExplanation({
        lakeName: lake.name,
        statusLabel: lake.statusLabel,
        statusNote: lake.statusNote,
        metrics: lake.metrics,
        baselineComparisons: selectedObservation
          ? []
          : interpretation.changes.flatMap((change) => (change.detail ? [change.detail] : [])),
        observation: selectedObservation,
        currentQualityLabel: observation?.qualityLabel,
      }),
    [interpretation.changes, lake, observation?.qualityLabel, selectedObservation],
  )

  useEffect(() => {
    if (methodologyWasOpen.current && !methodologyOpen) {
      methodologyTriggerRef.current?.focus()
    }
    methodologyWasOpen.current = methodologyOpen
  }, [methodologyOpen])

  const methodologyButton = (
    <button
      ref={methodologyTriggerRef}
      type="button"
      className="text-sm font-medium text-[var(--color-accent)] transition-colors duration-[var(--transition-fast)] hover:text-[var(--color-text-primary)]"
      aria-haspopup="dialog"
      aria-expanded={methodologyOpen}
      onClick={() => setMethodologyOpen(methodologyDrawerOpen(methodologyOpen, 'open'))}
    >
      How is this determined?
    </button>
  )

  const methodologyDrawer = (
    <MethodologyDrawer
      open={methodologyOpen}
      explanation={explanation}
      onClose={() => setMethodologyOpen(methodologyDrawerOpen(methodologyOpen, 'close'))}
      onEscape={() => setMethodologyOpen(methodologyDrawerOpen(methodologyOpen, 'escape'))}
    />
  )

  if (selectedObservation) {
    return (
      <>
        <HistoricalObservationSection
          lake={lake}
          observation={selectedObservation}
          observations={observations}
          methodologyAction={methodologyButton}
        />
        {methodologyDrawer}
      </>
    )
  }

  const tone = conditionTone(interpretation.condition.status, lake.status)
  const statusIsPoor = (interpretation.condition.status ?? '').trim().toLowerCase() === 'poor'
  const qualityTone = toneFromQualityLabel(interpretation.observationQuality.qualityLabel)
  const qualityFacts = interpretation.observationQuality.qualityFacts
  const lastValidDate = interpretation.attention.evidenceDate ?? qualityFacts.observationDate
  const sceneDiffers = Boolean(
    interpretation.attention.evidenceDate &&
      observation?.date &&
      observation.date !== interpretation.attention.evidenceDate,
  )
  const qualityRows = [
    qualityFacts.clearPct != null
      ? { label: 'Clear pixels', value: `${formatNumber(qualityFacts.clearPct)}%` }
      : null,
    lastValidDate || qualityFacts.daysSinceObservation != null
      ? {
          label: 'Last valid',
          value: [
            lastValidDate ? formatTechnicalDate(lastValidDate) : null,
            qualityFacts.daysSinceObservation != null
              ? formatDaysAgo(qualityFacts.daysSinceObservation)
              : null,
          ]
            .filter(Boolean)
            .join(' · '),
        }
      : null,
    sceneDiffers && observation?.date
      ? { label: 'Latest scene', value: formatTechnicalDate(observation.date) }
      : null,
    qualityFacts.observationCount14Month != null
      ? { label: 'Clear images in last 14 months', value: String(qualityFacts.observationCount14Month) }
      : null,
  ].filter((row): row is { label: string; value: string } => row != null)
  const visibleSignals = interpretation.signals.filter(
    (signal) => !signalRepeatsAttention(signal, interpretation.attention.signals),
  )
  const evidenceGroups = groupEvidence(
    interpretation.signals
      .flatMap((s) => s.evidence)
      .concat(interpretation.changes.flatMap((c) => c.evidence))
      .concat(interpretation.observationQuality.evidence),
  )

  return (
    <section className="flex min-h-0 min-w-0 flex-col" aria-labelledby="lake-condition-heading">
      <div className="min-w-0 px-3 pb-3 pt-4 sm:px-4">
        <p id="lake-condition-heading" className="panel-section-title">
          Lake Condition
        </p>

        {interpretation.condition.status ? (
          <h2
            className={cn(
              'mt-1.5 font-sans text-2xl font-semibold leading-none',
              TONE_TEXT[tone],
            )}
          >
            <span
              className={cn(
                'mr-2 inline-block h-2 w-2 translate-y-[-2px] rounded-full',
                TONE_DOT[tone],
                statusIsPoor && 'h-2.5 w-2.5',
              )}
              aria-hidden="true"
            />
            {interpretation.condition.status}
          </h2>
        ) : null}

        <ConditionExplanation
          summary={interpretation.condition.summary}
          note={interpretation.condition.note}
          open={detailsOpen}
          onToggle={() => setDetailsOpen((open) => !open)}
          trailing={methodologyButton}
        />

        <p className="mt-1.5 text-xs leading-snug text-[var(--color-text-muted)]">
          {lake.name}
          {lake.province ? ` · ${lake.province}` : ''}
          {lake.district ? ` · ${lake.district}` : ''}
        </p>
      </div>

      <AttentionSection
        signals={interpretation.attention.signals}
        emptyMessage={interpretation.attention.emptyStateMessage}
        openId={openAttentionId}
        onToggle={(id) => setOpenAttentionId((current) => (current === id ? null : id))}
        selectedLayer={selectedLayer}
        onSelectMapLayer={setSelectedLayer}
        onOpenMethodology={() => setMethodologyOpen(methodologyDrawerOpen(methodologyOpen, 'open'))}
      />

      {visibleSignals.length > 0 ? (
        <div className="insight-group">
          <h3 className="panel-section-title">Current Signals</h3>
          <ul className="mt-2 space-y-1.5">
            {visibleSignals.map((signal) => (
              <li key={signal.id} className="flex min-w-0 items-baseline justify-between gap-3">
                <span className="flex min-w-0 items-center gap-1.5 text-sm text-[var(--color-text-secondary)]">
                  <span
                    className={cn('h-1.5 w-1.5 rounded-full', TONE_DOT[signal.tone])}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 truncate">{signal.title}</span>
                </span>
                <span
                  className={cn(
                    'shrink-0 text-right text-sm font-medium tabular-nums',
                    TONE_TEXT[signal.tone],
                  )}
                >
                  {signal.detail ?? '—'}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {interpretation.changes.length > 0 ? (
        <div className="insight-group">
          <h3 className="panel-section-title">What Changed</h3>
          <ul className="mt-2 space-y-1.5">
            {interpretation.changes.map((change) => (
              <ChangeRow key={change.id} statement={change} />
            ))}
          </ul>
        </div>
      ) : null}

      <div className="insight-group">
        <h3 className="panel-section-title">Observation Quality</h3>
        {interpretation.observationQuality.qualityLabel ? (
          <div className="mt-2 flex items-center gap-1.5">
            <span className={cn('h-1.5 w-1.5 rounded-full', TONE_DOT[qualityTone])} aria-hidden="true" />
            <span className={cn('type-status', TONE_TEXT[qualityTone])}>
              {interpretation.observationQuality.qualityLabel}
            </span>
          </div>
        ) : null}
        {qualityRows.length > 0 ? (
          <div
            className={cn(
              'mt-2 rounded-[var(--radius-control)] border border-l-2 border-[var(--color-border)] bg-[var(--color-bg-panel-elevated)] px-3 py-2',
              TONE_BORDER[qualityTone],
            )}
          >
            <dl className="space-y-1">
              {qualityRows.map((row) => (
                <div key={row.label} className="flex min-w-0 items-baseline justify-between gap-3">
                  <dt className="text-xs text-[var(--color-text-secondary)]">{row.label}</dt>
                  <dd className="text-right text-sm font-medium tabular-nums text-[var(--color-text-primary)]">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
            {sceneDiffers ? (
              <p className="mt-1.5 text-2xs leading-snug text-[var(--color-text-muted)]">
                Metrics use the last valid observation.
              </p>
            ) : null}
          </div>
        ) : (
          <p className="mt-1.5 text-xs leading-snug text-[var(--color-text-muted)]">
            {interpretation.observationQuality.qualityExplanation}
          </p>
        )}
      </div>

      <div className="px-4 py-3">
        <button
          type="button"
          className="panel-section-title text-[var(--color-accent)] transition-colors duration-[var(--transition-fast)] hover:text-[var(--color-text-primary)]"
          aria-expanded={evidenceOpen}
          onClick={() => setEvidenceOpen((open) => !open)}
        >
          {evidenceOpen ? 'Hide Evidence' : 'View Evidence'}
        </button>

        <div
          className={cn('motion-disclosure', evidenceOpen && 'is-open')}
          role="region"
          aria-label="Interpretation evidence"
          aria-hidden={evidenceOpen ? undefined : true}
          inert={evidenceOpen ? undefined : true}
        >
          <div className="motion-disclosure-inner">
          <div className="mt-2.5 space-y-3">
            {evidenceGroups.length === 0 ? (
              <p className="text-2xs text-[var(--color-text-secondary)]">
                No evidence fields available for this water body.
              </p>
            ) : (
              evidenceGroups.map((group) => (
                <div key={group.category}>
                  <p className="panel-section-title mb-1.5">{EVIDENCE_SECTION_LABEL[group.category]}</p>
                  <div className="space-y-1.5">
                    {group.items.map((item) => (
                      <EvidenceRow key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              ))
            )}
            <p className="pt-1 text-2xs leading-snug text-[var(--color-text-muted)]">
              Source: water quality monitoring pipeline
              {interpretation.generatedFrom.latestObservationDate
                ? ` · latest valid observation ${formatTechnicalDate(interpretation.generatedFrom.latestObservationDate)}`
                : null}
            </p>
          </div>
        </div>
      </div>
      </div>
      {methodologyDrawer}
    </section>
  )
}

function HistoricalObservationSection({
  lake,
  observation,
  observations,
  methodologyAction,
}: {
  lake: WaterBody
  observation: WaterQualityObservation
  observations: readonly WaterQualityObservation[]
  methodologyAction: ReactNode
}) {
  const readout = observationReadout(observation, observations)
  const condition = currentConditionLabel(lake.statusLabel)
  const qualityTone = toneFromQualityLabel(readout.qualityLabel)
  const rows: { label: string; value: string }[] = [
    { label: 'Date', value: readout.display.date },
    { label: 'Quality', value: readout.display.quality },
    { label: 'Turbidity', value: readout.display.turbidityFnu },
    { label: 'NDCI', value: readout.display.ndci },
    { label: 'Floating vegetation', value: readout.display.floatingVegetation },
    { label: 'Clear', value: readout.display.clear },
    { label: 'Cloud', value: readout.display.cloud },
  ]
  if (readout.display.bloomRisk) {
    rows.push({ label: 'Bloom risk', value: readout.display.bloomRisk })
  }

  return (
    <section className="flex min-h-0 min-w-0 flex-col" aria-labelledby="historical-observation-heading">
      <div className="min-w-0 px-3 py-3.5 sm:px-4">
        <p className="text-xs text-[var(--color-text-secondary)]">
          {lake.name}
          {lake.province ? ` · ${lake.province}` : ''}
          {lake.district ? ` · ${lake.district}` : ''}
        </p>
        <h2 id="historical-observation-heading" className="panel-section-title mt-2">
          Observation · {formatTechnicalDate(readout.date)}
        </h2>
        {readout.qualityLabel ? (
          <p
            className={cn(
              'mt-1.5 text-md font-medium',
              TONE_TEXT[qualityTone],
            )}
          >
            {readout.qualityLabel}
          </p>
        ) : null}
        {readout.notice ? (
          <p className="mt-2 text-2xs leading-relaxed text-[var(--color-text-secondary)]">
            {readout.notice}
          </p>
        ) : null}
        <dl className="mt-2.5 space-y-1.5">
          {rows.map((row) => (
            <div key={row.label} className="flex min-w-0 items-baseline justify-between gap-3">
              <dt className="min-w-0 text-2xs text-[var(--color-text-secondary)]">{row.label}</dt>
              <dd className="type-tech shrink-0 text-right text-[var(--color-text-primary)]">
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
        {readout.previousValidDate ? (
          <p className="mt-2.5 text-xs leading-snug text-[var(--color-text-secondary)]">
            Previous valid observation · {formatExplorerDate(readout.previousValidDate)}
          </p>
        ) : null}
        {condition ? (
          <p className="mt-2 text-xs leading-snug text-[var(--color-text-secondary)]">
            Current condition: {condition}
          </p>
        ) : null}
        <div className="mt-3">{methodologyAction}</div>
      </div>
    </section>
  )
}

function AttentionSection({
  signals,
  emptyMessage,
  openId,
  onToggle,
  selectedLayer,
  onSelectMapLayer,
  onOpenMethodology,
}: {
  signals: AttentionSignal[]
  emptyMessage: string | null
  openId: string | null
  onToggle: (id: string) => void
  selectedLayer: MapLayerId
  onSelectMapLayer: (layer: MapLayerId) => void
  onOpenMethodology: () => void
}) {
  return (
    <div className="insight-group" aria-labelledby="attention-heading">
      <h3 id="attention-heading" className="panel-section-title">
        Attention
      </h3>

      {signals.length === 0 ? (
        <p className="mt-2 text-sm leading-snug text-[var(--color-text-secondary)]">
          {emptyMessage}
        </p>
      ) : (
        <ul className="mt-2 space-y-2">
          {signals.map((item) => {
            const open = openId === item.id
            const mapLayer = attentionMapLayer(item.relatedMapLayer)
            const mapActive = mapLayer != null && selectedLayer === mapLayer
            const showEvidence = item.evidence.length > 0

            return (
              <li key={item.id}>
                <div className="flex items-start gap-2">
                  <span
                    className={cn('mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full', ATTENTION_DOT[item.level])}
                    aria-hidden="true"
                  />
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-sm leading-snug', ATTENTION_TEXT[item.level])}>
                      {item.summary}
                    </p>

                    {showEvidence || mapLayer ? (
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        {showEvidence ? (
                          <button
                            type="button"
                            className="text-xs text-[var(--color-accent)] transition-colors duration-[var(--transition-fast)] hover:text-[var(--color-text-primary)]"
                            aria-expanded={open}
                            onClick={() => onToggle(item.id)}
                          >
                            {open ? 'Hide evidence' : 'View evidence'}
                          </button>
                        ) : null}

                        {mapLayer ? (
                          <button
                            type="button"
                            className={cn(
                              'text-xs transition-colors duration-[var(--transition-fast)]',
                              mapActive
                                ? 'text-[var(--color-text-primary)]'
                                : 'text-[var(--color-text-muted)] hover:text-[var(--color-accent)]',
                            )}
                            onClick={() => onSelectMapLayer(mapLayer)}
                          >
                            View on map
                          </button>
                        ) : null}
                      </div>
                    ) : null}

                    {open ? (
                      <AttentionEvidence
                        title={item.title}
                        items={item.evidence}
                        onOpenMethodology={onOpenMethodology}
                      />
                    ) : null}
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

export function ConditionExplanation({
  summary,
  note,
  open,
  onToggle,
  trailing = null,
}: {
  summary: string
  note?: string | null
  open: boolean
  onToggle: () => void
  trailing?: ReactNode
}) {
  const disclosure = discloseConditionExplanation(summary, note)
  const visible = open ? disclosure.summary : disclosure.preview
  const [notePresent, setNotePresent] = useState(open)
  if (open && !notePresent) setNotePresent(true)

  return (
    <>
      {visible ? (
        <p
          className={cn(
            'mt-2 text-base leading-snug text-[var(--color-text-secondary)]',
            open && 'motion-expand',
            !open && 'line-clamp-2',
          )}
        >
          {visible}
        </p>
      ) : null}
      {disclosure.note ? (
        <div
          className={cn('motion-disclosure', open && 'is-open')}
          aria-hidden={open ? undefined : true}
          onTransitionEnd={(event) => {
            if (event.target !== event.currentTarget || event.propertyName !== 'grid-template-rows') return
            if (!open) setNotePresent(false)
          }}
        >
          <div className="motion-disclosure-inner">
            {notePresent ? (
              <p
                className="mt-1.5 text-xs leading-snug text-[var(--color-text-muted)]"
                role="region"
                aria-label="Status note"
              >
                {disclosure.note}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
      {disclosure.hasMore || trailing ? (
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
          {disclosure.hasMore ? (
            <button
              type="button"
              className="text-xs text-[var(--color-text-secondary)] transition-colors duration-[var(--transition-fast)] hover:text-[var(--color-text-primary)]"
              aria-expanded={open}
              onClick={onToggle}
            >
              {open ? 'Hide details' : 'View more details'}
            </button>
          ) : null}
          {trailing}
        </div>
      ) : null}
    </>
  )
}

function ChangeRow({ statement }: { statement: InterpretationStatement }) {
  return (
    <li className="flex min-w-0 items-baseline justify-between gap-3">
      <span className="min-w-0 text-sm text-[var(--color-text-secondary)]">{statement.title}</span>
      <span
        className={cn(
          'max-w-[60%] text-right text-sm font-medium leading-snug tabular-nums [overflow-wrap:break-word]',
          TONE_TEXT[statement.tone],
        )}
      >
        {statement.detail}
      </span>
    </li>
  )
}

function EvidenceRow({ item }: { item: EvidenceItem }) {
  const displayValue =
    item.value === null || item.value === undefined
      ? '—'
      : `${item.value}${item.unit ? ` ${item.unit}` : ''}`

  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5">
      <div className="min-w-0">
        <p className="text-xs text-[var(--color-text-secondary)]">{item.label}</p>
        {item.observationDate ? (
          <p className="type-tech mt-0.5 text-[var(--color-text-muted)]">
            {formatTechnicalDate(item.observationDate)}
          </p>
        ) : null}
      </div>
      <p className="type-tech shrink-0 text-[var(--color-text-primary)]">{displayValue}</p>
    </div>
  )
}

function groupEvidence(items: EvidenceItem[]): { category: EvidenceCategory; items: EvidenceItem[] }[] {
  const seen = new Set<string>()
  const byCategory = new Map<EvidenceCategory, EvidenceItem[]>()

  for (const item of items) {
    const key = `${item.category}:${item.sourceField}:${String(item.value)}:${item.label}`
    if (seen.has(key)) continue
    seen.add(key)
    const list = byCategory.get(item.category) ?? []
    list.push(item)
    byCategory.set(item.category, list)
  }

  return EVIDENCE_ORDER.filter((category) => (byCategory.get(category)?.length ?? 0) > 0).map(
    (category) => ({ category, items: byCategory.get(category) ?? [] }),
  )
}
