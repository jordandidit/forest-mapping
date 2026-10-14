import {
  currentMeasurementUpdate,
  methodologyEntries,
  pipelineCitations,
  rasterBands,
  type MethodologyEntry,
} from '@/domain/methodology/water-quality-methodology'
import type { WaterQualityObservation } from '@/domain/observation/types'
import type { WaterBodyMetricsSnapshot } from '@/domain/water-body/types'
import {
  formatExplorerDate,
  observationReadout,
} from '@/features/observations/observation-explorer'
import { formatHistoryNumber, formatHistoryPercent } from '@/features/observations/history'

export const PIPELINE_SCREENING_BENCHMARK = 'Pipeline screening benchmark'
export const HISTORICAL_COMPARISON = 'Historical comparison'

export const SCREENING_DISCLAIMER =
  'These classifications are monitoring-screening rules used by the water-quality pipeline. They are not regulatory or drinking-water safety classifications.'

const METHOD_TOPICS = [
  'Turbidity conversion',
  'NDCI',
  'Chlorophyll estimate',
  'FAI',
  'NDTI',
] as const

export interface ScaleRow {
  label: string
  range: string
  current: boolean
}

export interface ConditionDriver {
  title: string
  detail: string
  reference: typeof PIPELINE_SCREENING_BENCHMARK
}

export interface ConditionTrace {
  measurementName: string
  measurementValue: string
  classification: string
  range: string | null
  /** Stored WaterBodies status. Omitted for a historical observation. */
  condition: string | null
}

export interface MethodologyExplanation {
  mode: 'current' | 'observation'
  title: string
  conditionLabel: string | null
  referenceLabel: typeof PIPELINE_SCREENING_BENCHMARK
  disclaimer: string
  drivers: ConditionDriver[]
  traces: ConditionTrace[]
  statusNote: string | null
  turbidityScale: ScaleRow[]
  ndciScale: ScaleRow[]
  bloomRules: { label: string; detail: string }[]
  vegetationRule: string
  conditionRules: { label: string; detail: string }[]
  qualityRules: { label: string; detail: string; current: boolean }[]
  validUpdatesCurrent: string
  baseline: {
    summary: string
    turbBase: string
    ndciBase: string
    comparisons: string[]
    referenceLabel: typeof HISTORICAL_COMPARISON
    notAnEnvironmentalStandard: string
  }
  mapColors: { summary: string; labels: readonly string[] }
  methods: { topic: string; citation: string }[]
  methodsNote: string
  noExternalStatusReference: string
  observation: {
    date: string
    quality: string
    notice: string | null
    rows: { label: string; value: string }[]
  } | null
}

export function methodologyDrawerOpen(
  _open: boolean,
  action: 'open' | 'close' | 'escape',
): boolean {
  return action === 'open'
}

export function buildMethodologyExplanation(input: {
  lakeName: string
  statusLabel: string | null | undefined
  statusNote?: string | null
  metrics?: WaterBodyMetricsSnapshot | null
  baselineComparisons?: readonly string[]
  observation?: WaterQualityObservation | null
  currentQualityLabel?: string | null
}): MethodologyExplanation {
  const conditionLabel = storedCondition(input.statusLabel)
  const observation = input.observation ?? null
  const mode = observation ? 'observation' : 'current'
  const qualityLabel = observation
    ? observation.qualityLabel?.trim() || null
    : input.currentQualityLabel?.trim() || null
  const invalidObservation = mode === 'observation' && isNonValidQuality(qualityLabel)

  const signals = invalidObservation
    ? []
    : mode === 'observation'
      ? observationSignals(observation)
      : currentSignals(input.metrics)

  const selected =
    mode === 'current' ? signalsForStoredStatus(conditionLabel, signals) : signals

  const traces = selected.map((signal) =>
    toTrace(signal, mode === 'current' ? conditionLabel : null),
  )

  return {
    mode,
    title:
      mode === 'observation'
        ? 'How is this observation interpreted?'
        : conditionLabel
          ? `Why is ${input.lakeName} ${conditionLabel}?`
          : `Why is ${input.lakeName} in this condition?`,
    conditionLabel,
    referenceLabel: PIPELINE_SCREENING_BENCHMARK,
    disclaimer: SCREENING_DISCLAIMER,
    drivers: selected.map((signal) => ({
      title: `${signal.measurementName} · ${signal.classification}`,
      detail: signal.range
        ? `${signal.measurementValue} · ${signal.range}`
        : signal.measurementValue,
      reference: PIPELINE_SCREENING_BENCHMARK,
    })),
    traces,
    statusNote: mode === 'current' ? input.statusNote?.trim() || null : null,
    turbidityScale: scaleRows(
      'turbidity',
      mode === 'current' && classifiesWaterQuality(conditionLabel)
        ? currentLevel(input.metrics?.turbidityLevel)
        : invalidObservation
          ? null
          : currentLevel(observation?.turbidityLevel),
    ),
    ndciScale: scaleRows(
      'ndci',
      mode === 'current' && classifiesWaterQuality(conditionLabel)
        ? currentLevel(input.metrics?.chlorophyllLevel)
        : invalidObservation
          ? null
          : currentLevel(observation?.chlorophyllLevel),
    ),
    bloomRules: bloomRules(),
    vegetationRule: vegetationRule(),
    conditionRules: conditionRules(),
    qualityRules: qualityRules(qualityLabel),
    validUpdatesCurrent: currentMeasurementUpdate.rule,
    baseline: {
      summary:
        "The lake's historical baseline is based on its rolling 14-month record of valid observations.",
      turbBase: 'turb_base = mean of monthly turbidity means',
      ndciBase: 'ndci_base = mean of monthly NDCI means',
      comparisons: mode === 'current' ? [...(input.baselineComparisons ?? [])] : [],
      referenceLabel: HISTORICAL_COMPARISON,
      notAnEnvironmentalStandard:
        'This is a historical comparison, not an environmental standard.',
    },
    mapColors: {
      summary: mapColorSummary(),
      labels: ['Lower than usual', 'Usual', 'Higher than usual'],
    },
    methods: methodCitations(),
    methodsNote:
      'These papers support remote-sensing methods where the pipeline cites them. They are not recorded as the definition of Good, Fair, or Poor.',
    noExternalStatusReference:
      'Bloom risk and overall-condition screening rules have no external reference recorded in the pipeline.',
    observation: observation ? observationSection(observation) : null,
  }
}

interface StoredSignal {
  measurementName: string
  measurementValue: string
  classification: string
  range: string | null
  kind: 'turbidity' | 'chlorophyll' | 'bloom' | 'vegetation'
  pipelineLabel: string | null
  vegetationFlag: boolean | null
}

function storedCondition(statusLabel: string | null | undefined): string | null {
  const label = statusLabel?.trim()
  return label ? label : null
}

function entry(key: string): MethodologyEntry {
  const found = methodologyEntries.find((item) => item.key === key)
  if (!found) throw new Error(`Missing methodology entry ${key}`)
  return found
}

function classifiesWaterQuality(statusLabel: string | null): boolean {
  const normalized = statusLabel?.trim().toLowerCase()
  return normalized === 'good' || normalized === 'fair' || normalized === 'poor'
}

function isNonValidQuality(qualityLabel: string | null): boolean {
  return qualityLabel != null && qualityLabel.toLowerCase() !== 'valid'
}

function currentLevel(label: string | null | undefined): string | null {
  const trimmed = label?.trim()
  return trimmed ? trimmed : null
}

function canonicalLabel(key: string, label: string): string {
  const match = entry(key).classes?.find(
    (item) => item.label.toLowerCase() === label.trim().toLowerCase(),
  )
  return match?.label ?? label.trim()
}

function compactRange(bounds: string, unit: string | null, openEnded: boolean): string {
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

function rangeForLabel(key: string, label: string | null, unit: string | null): string | null {
  if (!label) return null
  const match = entry(key).classes?.find(
    (item) => item.label.toLowerCase() === label.trim().toLowerCase(),
  )
  const classes = entry(key).classes ?? []
  return match ? compactRange(match.bounds, unit, match === classes[classes.length - 1]) : null
}

function scaleRows(key: 'turbidity' | 'ndci', currentLabel: string | null): ScaleRow[] {
  const item = entry(key)
  const classes = item.classes ?? []
  return classes.map((klass, index) => ({
    label: klass.label,
    range: compactRange(klass.bounds, item.unit, index === classes.length - 1),
    current:
      currentLabel != null && klass.label.toLowerCase() === currentLabel.trim().toLowerCase(),
  }))
}

function statusBounds(label: string): string | null {
  return (
    entry('lake-condition').classes?.find(
      (item) => item.label.toLowerCase() === label.trim().toLowerCase(),
    )?.bounds ?? null
  )
}

function isNamedDriver(statusLabel: string, signal: StoredSignal): boolean {
  const bounds = statusBounds(statusLabel)
  if (!bounds || !signal.pipelineLabel) return false
  if (signal.kind === 'vegetation') {
    return signal.vegetationFlag === true && bounds.includes('floating_veg')
  }
  const predicate =
    signal.kind === 'bloom'
      ? bounds.match(/bloom_risk is ([^,]+)/i)?.[1]
      : bounds.match(/turbidity_level or chlorophyll_level is ([^,]+)/i)?.[1]
  return predicate?.toLowerCase().includes(signal.pipelineLabel.trim().toLowerCase()) ?? false
}

function signalsForStoredStatus(
  statusLabel: string | null,
  signals: StoredSignal[],
): StoredSignal[] {
  if (!statusLabel) return []
  const normalized = statusLabel.trim().toLowerCase()
  if (normalized === 'fair' || normalized === 'poor') {
    return signals.filter((signal) => isNamedDriver(statusLabel, signal))
  }
  if (normalized === 'good') {
    return signals.filter(
      (signal) => signal.pipelineLabel && !isNamedDriver('Fair', signal) && !isNamedDriver('Poor', signal),
    )
  }
  return []
}

function measurementText(value: number | null | undefined, unit: 'FNU' | 'index' | 'percent'): string {
  if (value == null) return '—'
  if (unit === 'FNU') return `${formatHistoryNumber(value)} FNU`
  if (unit === 'percent') return formatHistoryPercent(value)
  return formatHistoryNumber(value)
}

function currentSignals(metrics: WaterBodyMetricsSnapshot | null | undefined): StoredSignal[] {
  if (!metrics) return []
  const signals: StoredSignal[] = []
  const turbidityLabel = currentLevel(metrics.turbidityLevel)
  if (turbidityLabel) {
    signals.push({
      kind: 'turbidity',
      measurementName: 'Turbidity',
      measurementValue: measurementText(metrics.turbidity, 'FNU'),
      classification: canonicalLabel('turbidity', turbidityLabel),
      range: rangeForLabel('turbidity', turbidityLabel, 'FNU'),
      pipelineLabel: canonicalLabel('turbidity', turbidityLabel),
      vegetationFlag: null,
    })
  }
  const chlorophyllLabel = currentLevel(metrics.chlorophyllLevel)
  if (chlorophyllLabel) {
    signals.push({
      kind: 'chlorophyll',
      measurementName: 'Chlorophyll condition',
      measurementValue: measurementText(metrics.ndci, 'index'),
      classification: canonicalLabel('ndci', chlorophyllLabel),
      range: rangeForLabel('ndci', chlorophyllLabel, null),
      pipelineLabel: canonicalLabel('ndci', chlorophyllLabel),
      vegetationFlag: null,
    })
  }
  const bloomLabel = currentLevel(metrics.bloomRisk)
  if (bloomLabel) {
    signals.push(bloomSignal(bloomLabel))
  }
  if (metrics.floatingVegetationFlag != null) {
    signals.push(vegetationSignal(metrics.floatingVegetationFlag, metrics.floatingVegetationPct))
  }
  return signals
}

function observationSignals(observation: WaterQualityObservation | null): StoredSignal[] {
  if (!observation) return []
  const signals: StoredSignal[] = []
  const turbidityLabel = currentLevel(observation.turbidityLevel)
  if (turbidityLabel) {
    signals.push({
      kind: 'turbidity',
      measurementName: 'Turbidity',
      measurementValue: measurementText(observation.turbidity, 'FNU'),
      classification: canonicalLabel('turbidity', turbidityLabel),
      range: rangeForLabel('turbidity', turbidityLabel, 'FNU'),
      pipelineLabel: canonicalLabel('turbidity', turbidityLabel),
      vegetationFlag: null,
    })
  }
  const chlorophyllLabel = currentLevel(observation.chlorophyllLevel)
  if (chlorophyllLabel) {
    signals.push({
      kind: 'chlorophyll',
      measurementName: 'Chlorophyll condition',
      measurementValue: measurementText(observation.ndci, 'index'),
      classification: canonicalLabel('ndci', chlorophyllLabel),
      range: rangeForLabel('ndci', chlorophyllLabel, null),
      pipelineLabel: canonicalLabel('ndci', chlorophyllLabel),
      vegetationFlag: null,
    })
  }
  const bloomLabel = currentLevel(observation.bloomRisk)
  if (bloomLabel) signals.push(bloomSignal(bloomLabel))
  return signals
}

function bloomSignal(label: string): StoredSignal {
  const classification = canonicalLabel('bloom-risk', label)
  const match = entry('bloom-risk').classes?.find(
    (item) => item.label.toLowerCase() === label.trim().toLowerCase(),
  )
  return {
    kind: 'bloom',
    measurementName: 'Bloom risk',
    measurementValue: classification,
    classification,
    range: match ? presentBloom(match.label, match.bounds) : null,
    pipelineLabel: classification,
    vegetationFlag: null,
  }
}

function vegetationSignal(flag: boolean, percent: number | null): StoredSignal {
  const classification = flag ? 'Flagged' : 'Not flagged'
  return {
    kind: 'vegetation',
    measurementName: 'Floating vegetation',
    measurementValue: measurementText(percent, 'percent'),
    classification,
    range: flag ? vegetationRule() : null,
    pipelineLabel: flag ? 'Yes' : 'No',
    vegetationFlag: flag,
  }
}

function toTrace(signal: StoredSignal, condition: string | null): ConditionTrace {
  return {
    measurementName: signal.kind === 'chlorophyll' ? 'NDCI' : signal.measurementName,
    measurementValue: signal.measurementValue,
    classification: signal.classification,
    range: signal.range,
    condition,
  }
}

function presentBloom(label: string, bounds: string): string {
  if (label === 'High') {
    const match = bounds.match(/ndci >= ([0-9.]+)/i)
    return match ? `NDCI >= ${match[1]}` : bounds
  }
  if (label === 'Elevated') {
    const ndci = bounds.match(/ndci >= ([0-9.]+)/i)
    const fai = bounds.match(/fai > ([0-9.]+)/i)
    if (ndci && fai) return `NDCI >= ${ndci[1]} or FAI > ${fai[1]}`
  }
  if (label === 'Low') return 'NDCI and FAI do not meet the Elevated or High conditions'
  return bounds
}

function bloomRules(): { label: string; detail: string }[] {
  return (entry('bloom-risk').classes ?? []).map((item) => ({
    label: item.label,
    detail: presentBloom(item.label, item.bounds),
  }))
}

function vegetationRule(): string {
  const yes = entry('floating-vegetation').classes?.find((item) => item.label === 'Yes')
  const amount = yes?.bounds.match(/>= ?([0-9.]+)/)
  return amount
    ? `Flagged at >=${amount[1]}% of clear pixels.`
    : (yes?.bounds ?? 'Floating vegetation flag')
}

function conditionRules(): { label: string; detail: string }[] {
  return (entry('lake-condition').classes ?? []).map((item) => ({
    label: item.label,
    detail: readableStatus(item.bounds),
  }))
}

function readableStatus(bounds: string): string {
  return bounds
    .replaceAll('turbidity_level', 'turbidity')
    .replaceAll('chlorophyll_level', 'chlorophyll')
    .replaceAll('bloom_risk', 'bloom risk')
    .replaceAll('floating_veg_pct >= 10', 'floating vegetation >= 10%')
    .replaceAll('days_since_obs > 45', 'latest valid observation > 45 days old')
    .replaceAll(
      'no last_obs_date and no last_check_date',
      'no observation and no check yet',
    )
    .replaceAll(
      'no last_obs_date while last_check_date is set, or ',
      'no valid observation after checking, or ',
    )
}

function qualityRules(current: string | null): { label: string; detail: string; current: boolean }[] {
  return (entry('observation-quality').classes ?? []).map((item) => ({
    label: item.label,
    detail: presentQuality(item.label, item.bounds),
    current: current != null && item.label.toLowerCase() === current.trim().toLowerCase(),
  }))
}

function presentQuality(label: string, bounds: string): string {
  if (label === 'Valid') return 'Passed pipeline quality checks and may update current measurements.'
  const clear = bounds.match(/clear-pixel share < ([0-9.]+)/)
  if (clear) return `Clear-pixel share <${Number(clear[1]) * 100}%.`
  const share = bounds.match(/clean water pixels < ([0-9.]+)/)
  if (label === 'Hazy or glint' && share) {
    return `Water pixels exist, but clean-water pixels are <${Number(share[1]) * 100}% of classified water pixels.`
  }
  if (share) return `Fewer than ${share[1]} clean-water pixels.`
  return bounds
}

function methodCitations(): { topic: string; citation: string }[] {
  return METHOD_TOPICS.map((topic) => {
    const found = pipelineCitations.find((item) => item.topic === topic)
    return {
      topic: methodTitle(topic),
      citation: found ? firstSentence(found.citation) : topic,
    }
  })
}

function methodTitle(topic: (typeof METHOD_TOPICS)[number]): string {
  switch (topic) {
    case 'Turbidity conversion':
      return 'Turbidity estimation'
    case 'NDCI':
      return 'NDCI'
    case 'Chlorophyll estimate':
      return 'Indicative chlorophyll'
    case 'FAI':
      return 'Floating Algae Index (FAI)'
    case 'NDTI':
      return 'NDTI'
  }
}

function firstSentence(citation: string): string {
  const withYear = citation.match(/^(.+?\(\d{4}\))/)
  if (withYear?.[1]) return withYear[1]
  const end = citation.indexOf('. ')
  return end === -1 ? citation : citation.slice(0, end + 1)
}

function observationSection(observation: WaterQualityObservation): MethodologyExplanation['observation'] {
  const readout = observationReadout(observation)
  const rows = [
    { label: 'Date', value: formatExplorerDate(observation.date) },
    { label: 'Quality', value: readout.display.quality },
    { label: 'Turbidity', value: readout.display.turbidityFnu },
    { label: 'NDCI', value: readout.display.ndci },
    { label: 'Floating vegetation', value: readout.display.floatingVegetation },
  ]
  if (observation.turbidityLevel?.trim()) {
    rows.push({ label: 'Turbidity class', value: observation.turbidityLevel.trim() })
  }
  if (observation.chlorophyllLevel?.trim()) {
    rows.push({ label: 'Chlorophyll class', value: observation.chlorophyllLevel.trim() })
  }
  if (readout.display.bloomRisk) {
    rows.push({ label: 'Bloom risk', value: readout.display.bloomRisk })
  }
  return {
    date: formatExplorerDate(observation.date),
    quality: readout.display.quality,
    notice: readout.notice,
    rows,
  }
}

function mapColorSummary(): string {
  const perLake = rasterBands.find((band) => band.bandId === 2)
  const notFnu = perLake?.interpretation.includes('Not direct FNU')
    ? ' They are not direct FNU or mg/m³ raster values.'
    : ''
  return `The default per-lake turbidity and chlorophyll overlays are normalized to that lake’s own historical condition.${notFnu}`
}
