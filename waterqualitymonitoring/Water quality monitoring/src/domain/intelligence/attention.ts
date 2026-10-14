/**
 * WATER-INTEL-03B — Attention signals.
 *
 * The monitoring pipeline owns classifications. This module only turns those
 * labels into short sentences. It does not score lakes or apply thresholds.
 *
 * Fields used:
 * statusLabel, turbidityLevel, chlorophyllLevel, bloomRisk,
 * floatingVegetationFlag, turbidityTrendLabel, chlorophyllTrendLabel,
 * plus stored measurements, baselines, observation quality, and inventory ranges.
 */

import {
  bloomRiskLabel,
  evidence,
  isFiniteNumber,
  percentDifference,
  surfaceTrendLabel,
} from '@/domain/intelligence/helpers'
import { inventoryClassRange } from '@/domain/methodology/inventory-range'
import { formatNumber, formatShortDisplayDate } from '@/lib/format'
import type {
  AttentionLevel,
  AttentionMapLayer,
  AttentionSignal,
  AttentionSignalKind,
  EvidenceItem,
  InterpretLakeConditionInput,
  LakeAttentionAssessment,
} from '@/domain/intelligence/types'
import type { WaterQualityObservation } from '@/domain/observation/types'
import type { WaterBody } from '@/domain/water-body/types'

const EMPTY_STATE = 'No additional attention signals identified.'

function normalizeLabel(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase()
}

function isHighClass(level: string | null | undefined): boolean {
  const normalized = normalizeLabel(level)
  return normalized === 'high' || normalized === 'very high'
}

function isModerateClass(level: string | null | undefined): boolean {
  return normalizeLabel(level) === 'moderate'
}

function isIncreasingTrend(label: string | null | undefined): boolean {
  return normalizeLabel(label) === 'increasing'
}

function isNoRecentData(statusLabel: string | null | undefined): boolean {
  return normalizeLabel(statusLabel).includes('no recent')
}

function displayNumber(value: number | null | undefined): string | null {
  return isFiniteNumber(value) ? formatNumber(value) : null
}

function displayDate(iso: string | null | undefined): string | null {
  const day = iso?.slice(0, 10) ?? ''
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null
  return `${formatShortDisplayDate(day)} ${day.slice(0, 4)}`
}

function differenceFromMean(current: number | null | undefined, baseline: number | null | undefined): string | null {
  if (!isFiniteNumber(current) || !isFiniteNumber(baseline)) return null
  const pct = percentDifference(current, baseline)
  if (pct == null) return null
  const rounded = Number(pct.toFixed(0))
  const magnitude = Math.abs(rounded).toLocaleString('en-US')
  if (rounded < 0) return `${magnitude}% below mean`
  if (rounded > 0) return `${magnitude}% above mean`
  return '0% from mean'
}

function classEvidence(id: string, label: string, inventoryKey: string, sourceField: string): EvidenceItem {
  return evidence(id, label, inventoryClassRange(inventoryKey, label), sourceField, {
    category: 'pipeline_classification',
  })
}

function observationEvidence(
  id: string,
  waterBody: WaterBody,
  latestObservation?: WaterQualityObservation | null,
): EvidenceItem {
  const date = displayDate(validObservationDate(waterBody, latestObservation))
  return evidence(id, date ?? 'Date', latestObservation?.qualityLabel?.trim() || null, 'qualityLabel', {
    category: 'observation',
  })
}

function historicalEvidence(
  idPrefix: string,
  current: number | null | undefined,
  baseline: number | null | undefined,
  baselineField: string,
  unit?: string,
): EvidenceItem[] {
  return [
    evidence(`${idPrefix}-mean`, '14-month mean', displayNumber(baseline), baselineField, {
      unit,
      category: 'historical_context',
    }),
    evidence(`${idPrefix}-diff`, 'Difference', differenceFromMean(current, baseline), baselineField, {
      category: 'historical_context',
    }),
  ]
}

function makeSignal(partial: {
  id: string
  kind: AttentionSignalKind
  title: string
  summary: string
  level: AttentionLevel
  order: number
  evidence: EvidenceItem[]
  relatedMapLayer?: AttentionMapLayer | null
}): AttentionSignal {
  return {
    ...partial,
    source: 'pipeline',
    relatedMapLayer: partial.relatedMapLayer ?? null,
  }
}

function validObservationDate(
  waterBody: WaterBody,
  latestObservation?: WaterQualityObservation | null,
): string | null {
  if (waterBody.lastObservationAt) {
    return waterBody.lastObservationAt.slice(0, 10)
  }
  if (latestObservation?.date) {
    return latestObservation.date.slice(0, 10)
  }
  return null
}

function pushTurbidity(
  waterBody: WaterBody,
  latestObservation: WaterQualityObservation | null,
  out: AttentionSignal[],
): void {
  const level = waterBody.metrics?.turbidityLevel?.trim() || null
  if (!level || !isHighClass(level)) return

  out.push(
    makeSignal({
      id: 'attention-turbidity',
      kind: 'turbidity',
      title: 'Turbidity',
      summary: `Turbidity is currently classified as ${level}.`,
      level: 'attention',
      order: 10,
      relatedMapLayer: 'turbidity',
      evidence: [
        evidence(
          'att-turbidity-value',
          'Turbidity',
          displayNumber(waterBody.metrics?.turbidity),
          'metrics.turbidity',
          { unit: 'FNU', category: 'measurement' },
        ),
        classEvidence('att-turbidity-level', level, 'turbidity', 'metrics.turbidityLevel'),
        observationEvidence('att-turbidity-obs', waterBody, latestObservation),
        ...historicalEvidence(
          'att-turbidity',
          waterBody.metrics?.turbidity,
          waterBody.baseline?.turbidity14MonthMean,
          'baseline.turbidity14MonthMean',
          'FNU',
        ),
      ],
    }),
  )
}

function pushChlorophyll(
  waterBody: WaterBody,
  latestObservation: WaterQualityObservation | null,
  out: AttentionSignal[],
): void {
  const level = waterBody.metrics?.chlorophyllLevel?.trim() || null
  if (!level) return

  const high = isHighClass(level)
  const moderate = isModerateClass(level)
  if (!high && !moderate) return

  out.push(
    makeSignal({
      id: 'attention-chlorophyll',
      kind: 'chlorophyll',
      title: 'Chlorophyll conditions',
      summary: `Chlorophyll conditions are currently classified as ${level}.`,
      level: high ? 'attention' : 'info',
      order: 20,
      relatedMapLayer: 'ndci',
      evidence: [
        evidence('att-ndci-value', 'NDCI', displayNumber(waterBody.metrics?.ndci), 'metrics.ndci', {
          category: 'measurement',
        }),
        classEvidence('att-chlorophyll-level', level, 'ndci', 'metrics.chlorophyllLevel'),
        observationEvidence('att-chlorophyll-obs', waterBody, latestObservation),
        ...historicalEvidence(
          'att-ndci',
          waterBody.metrics?.ndci,
          waterBody.baseline?.ndci14MonthMean,
          'baseline.ndci14MonthMean',
        ),
      ],
    }),
  )
}

function pushBloom(
  waterBody: WaterBody,
  latestObservation: WaterQualityObservation | null,
  out: AttentionSignal[],
): void {
  const risk = waterBody.metrics?.bloomRisk ?? null
  if (risk !== 'elevated' && risk !== 'high') return

  const label = bloomRiskLabel(risk)
  if (!label) return

  out.push(
    makeSignal({
      id: `attention-bloom-${risk}`,
      kind: 'bloom',
      title: 'Bloom risk',
      summary: `Bloom risk is currently ${label}.`,
      level: risk === 'high' ? 'attention' : 'watch',
      order: 30,
      evidence: [
        evidence('att-bloom-risk', 'Bloom risk', label, 'metrics.bloomRisk', {
          category: 'measurement',
        }),
        evidence('att-bloom-ndci', 'NDCI', displayNumber(waterBody.metrics?.ndci), 'metrics.ndci', {
          category: 'measurement',
        }),
        evidence('att-bloom-fai', 'FAI', displayNumber(latestObservation?.fai), 'fai', {
          category: 'measurement',
        }),
        evidence(
          'att-bloom-rule',
          'Screening rule',
          inventoryClassRange('bloom-risk', label),
          'methodology:bloom-risk',
          { category: 'pipeline_classification' },
        ),
      ],
    }),
  )
}

function pushVegetation(waterBody: WaterBody, out: AttentionSignal[]): void {
  if (waterBody.metrics?.floatingVegetationFlag !== true) return
  const flagged = waterBody.metrics.floatingVegetationFlag

  out.push(
    makeSignal({
      id: 'attention-vegetation',
      kind: 'vegetation',
      title: 'Floating vegetation',
      summary: 'Floating vegetation was flagged in the latest valid observation.',
      level: 'watch',
      order: 40,
      evidence: [
        evidence(
          'att-vegetation-pct',
          'Floating vegetation',
          displayNumber(waterBody.metrics.floatingVegetationPct),
          'metrics.floatingVegetationPct',
          { unit: '%', category: 'measurement' },
        ),
        evidence(
          'att-vegetation-flag',
          'Flag',
          flagged ? 'Yes' : 'No',
          'metrics.floatingVegetationFlag',
          { category: 'measurement' },
        ),
        evidence(
          'att-vegetation-threshold',
          'Flag threshold',
          inventoryClassRange('floating-vegetation', 'Yes'),
          'methodology:floating-vegetation',
          { category: 'pipeline_classification' },
        ),
      ],
    }),
  )
}

function pushTrend(
  out: AttentionSignal[],
  options: {
    id: string
    title: string
    summary: string
    label: string
    sourceField: string
    mapLayer: AttentionMapLayer
    order: number
    slope: number | null | undefined
    slopeField: string
    pValue: number | null | undefined
    pValueField: string
  },
): void {
  out.push(
    makeSignal({
      id: options.id,
      kind: 'trend',
      title: options.title,
      summary: options.summary,
      level: 'watch',
      order: options.order,
      relatedMapLayer: options.mapLayer,
      evidence: [
        evidence(`${options.id}-label`, 'Trend', options.label, options.sourceField, {
          category: 'pipeline_classification',
        }),
        evidence(`${options.id}-slope`, 'Slope', displayNumber(options.slope), options.slopeField, {
          category: 'measurement',
        }),
        evidence(`${options.id}-p`, 'p-value', displayNumber(options.pValue), options.pValueField, {
          category: 'measurement',
        }),
      ],
    }),
  )
}

function pushTrends(waterBody: WaterBody, out: AttentionSignal[]): void {
  const turbidityTrend = surfaceTrendLabel(waterBody.turbidityTrendLabel)
  if (turbidityTrend && isIncreasingTrend(turbidityTrend)) {
    pushTrend(out, {
      id: 'attention-trend-turbidity',
      title: 'Turbidity trend',
      summary: 'Turbidity shows an increasing longer-term trend.',
      label: turbidityTrend,
      sourceField: 'turbidityTrendLabel',
      mapLayer: 'turbidity',
      order: 50,
      slope: waterBody.trends?.turbiditySlopePerYear,
      slopeField: 'trends.turbiditySlopePerYear',
      pValue: waterBody.trends?.turbidityTrendP,
      pValueField: 'trends.turbidityTrendP',
    })
  }

  const chlorophyllTrend = surfaceTrendLabel(waterBody.chlorophyllTrendLabel)
  if (chlorophyllTrend && isIncreasingTrend(chlorophyllTrend)) {
    pushTrend(out, {
      id: 'attention-trend-chlorophyll',
      title: 'Chlorophyll trend',
      summary: 'Chlorophyll shows an increasing longer-term trend.',
      label: chlorophyllTrend,
      sourceField: 'chlorophyllTrendLabel',
      mapLayer: 'ndci',
      order: 60,
      slope: waterBody.trends?.ndciSlopePerYear,
      slopeField: 'trends.ndciSlopePerYear',
      pValue: waterBody.trends?.chlorophyllTrendP,
      pValueField: 'trends.chlorophyllTrendP',
    })
  }
}

/**
 * Attention items from authoritative pipeline labels.
 * Does not reclassify status, levels, bloom risk, or trends.
 */
export function assessLakeAttention(input: InterpretLakeConditionInput): LakeAttentionAssessment {
  const { waterBody, latestObservation = null } = input
  const evidenceDate = validObservationDate(waterBody, latestObservation)
  const statusLabel = waterBody.statusLabel?.trim() || null

  if (statusLabel && isNoRecentData(statusLabel)) {
    return {
      signals: [
        makeSignal({
          id: 'attention-recency-no-recent',
          kind: 'recency',
          title: 'No recent observation',
          summary: 'No recent valid water-quality observation is available.',
          level: 'info',
          order: 10,
          evidence: [
            evidence(
              'att-recency-date',
              'Last valid observation',
              displayDate(evidenceDate),
              'lastObservationAt',
              { category: 'observation' },
            ),
            evidence(
              'att-recency-days',
              'Days since observation',
              isFiniteNumber(waterBody.daysSinceObservation) ? waterBody.daysSinceObservation : null,
              'daysSinceObservation',
              { category: 'measurement' },
            ),
            evidence(
              'att-recency-rule',
              'Freshness rule',
              inventoryClassRange('lake-condition', 'No recent data'),
              'methodology:lake-condition',
              { category: 'pipeline_classification' },
            ),
          ],
        }),
      ],
      hasAttentionSignals: true,
      evidenceDate,
      emptyStateMessage: null,
    }
  }

  const signals: AttentionSignal[] = []
  pushTurbidity(waterBody, latestObservation, signals)
  pushChlorophyll(waterBody, latestObservation, signals)
  pushBloom(waterBody, latestObservation, signals)
  pushVegetation(waterBody, signals)
  pushTrends(waterBody, signals)
  signals.sort((a, b) => a.order - b.order || a.id.localeCompare(b.id))

  return {
    signals,
    hasAttentionSignals: signals.length > 0,
    evidenceDate,
    emptyStateMessage: signals.length > 0 ? null : EMPTY_STATE,
  }
}
