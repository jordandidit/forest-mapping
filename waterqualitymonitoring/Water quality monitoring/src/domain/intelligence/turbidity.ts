import type { InterpretationStatement } from '@/domain/intelligence/types'
import {
  evidence,
  formatAbsoluteDifference,
  formatSignedPercent,
  isFiniteNumber,
  percentDifference,
  surfaceTrendLabel,
  toneFromLevelLabel,
} from '@/domain/intelligence/helpers'
import type { WaterBody } from '@/domain/water-body/types'

export function interpretTurbidity(waterBody: WaterBody): {
  signal: InterpretationStatement | null
  changes: InterpretationStatement[]
  fields: string[]
  summaryClause: string | null
} {
  const metrics = waterBody.metrics
  const fields: string[] = []
  const changes: InterpretationStatement[] = []
  const turbidity = metrics?.turbidity ?? null
  const level = metrics?.turbidityLevel?.trim() || null
  const baseline = waterBody.baseline?.turbidity14MonthMean ?? null
  const previous = waterBody.previousObservation?.turbidity ?? null
  const prevDate = waterBody.previousObservation?.observedAt ?? null
  const trendLabel = surfaceTrendLabel(waterBody.turbidityTrendLabel)
  const slope = waterBody.trends?.turbiditySlopePerYear ?? null
  const obsDate = waterBody.lastObservationAt?.slice(0, 10) || null

  if (level) fields.push('metrics.turbidityLevel')
  if (isFiniteNumber(turbidity)) fields.push('metrics.turbidity')
  if (isFiniteNumber(baseline)) fields.push('baseline.turbidity14MonthMean')
  if (isFiniteNumber(previous)) fields.push('previousObservation.turbidity')
  if (trendLabel) fields.push('turbidityTrendLabel')
  if (isFiniteNumber(slope)) fields.push('trends.turbiditySlopePerYear')

  if (!level && !isFiniteNumber(turbidity)) {
    return { signal: null, changes: [], fields, summaryClause: null }
  }

  const signalEvidence = [
    ...(level
      ? [
          evidence('turb-level', 'Turbidity', level, 'metrics.turbidityLevel', {
            observationDate: obsDate,
            category: 'pipeline_classification',
          }),
        ]
      : []),
    ...(isFiniteNumber(turbidity)
      ? [
          evidence('turb-current', 'Measurement', turbidity, 'metrics.turbidity', {
            unit: 'FNU',
            observationDate: obsDate,
            category: 'measurement',
          }),
        ]
      : []),
  ]

  const signal: InterpretationStatement = {
    id: 'signal-turbidity',
    title: 'Turbidity',
    detail: level ?? (isFiniteNumber(turbidity) ? `${turbidity} FNU` : undefined),
    tone: toneFromLevelLabel(level),
    evidence: signalEvidence,
  }

  let summaryClause: string | null = null
  if (level) {
    summaryClause = `Turbidity is classified as ${level}`
  } else if (isFiniteNumber(turbidity)) {
    summaryClause = `Latest turbidity is ${turbidity} FNU`
  }

  const pct =
    isFiniteNumber(turbidity) && isFiniteNumber(baseline)
      ? percentDifference(turbidity, baseline)
      : null

  if (pct !== null && isFiniteNumber(turbidity) && isFiniteNumber(baseline)) {
    const direction = pct < 0 ? 'below' : pct > 0 ? 'above' : 'equal to'
    const detail =
      pct === 0
        ? 'Turbidity equals its 14-month mean.'
        : `Turbidity is ${formatSignedPercent(pct).replace(/^[+−]/, '')} ${direction} its 14-month mean.`
    const quantitative =
      pct === 0 ? 'At 14-month mean' : `${formatSignedPercent(pct)} vs 14-month mean`

    changes.push({
      id: 'change-turbidity-baseline',
      title: 'Turbidity',
      detail: quantitative,
      tone: pct < 0 ? 'positive' : pct > 0 ? 'watch' : 'neutral',
      evidence: [
        evidence('turb-current', 'Measurement', turbidity, 'metrics.turbidity', {
          unit: 'FNU',
          observationDate: obsDate,
          category: 'measurement',
        }),
        evidence('turb-base', '14-month mean', baseline, 'baseline.turbidity14MonthMean', {
          unit: 'FNU',
          category: 'historical_context',
        }),
        evidence('turb-pct', 'Difference', formatSignedPercent(pct), 'derived.percentDifference', {
          category: 'historical_context',
        }),
      ],
    })

    if (summaryClause) {
      summaryClause = `${summaryClause} and is ${
        pct === 0 ? 'equal to' : `${formatSignedPercent(pct).replace(/^[+−]/, '')} ${direction}`
      } its 14-month mean`
    } else {
      summaryClause = detail.replace(/\.$/, '')
    }
  }

  if (isFiniteNumber(turbidity) && isFiniteNumber(previous)) {
    const comparison = formatAbsoluteDifference(turbidity, previous, 'FNU', 1)
    changes.push({
      id: 'change-turbidity-previous',
      title: 'Turbidity vs previous clear observation',
      detail: comparison,
      tone: 'neutral',
      evidence: [
        evidence('turb-current', 'Measurement', turbidity, 'metrics.turbidity', {
          unit: 'FNU',
          observationDate: obsDate,
          category: 'measurement',
        }),
        evidence('turb-prev', 'Previous clear observation', previous, 'previousObservation.turbidity', {
          unit: 'FNU',
          observationDate: prevDate,
          category: 'historical_context',
        }),
      ],
    })
  }

  if (trendLabel) {
    changes.push({
      id: 'change-turbidity-trend',
      title: 'Turbidity longer-term trend',
      detail: trendLabel,
      tone: 'neutral',
      evidence: [
        evidence('turb-trend', 'Trend', trendLabel, 'turbidityTrendLabel', {
          category: 'pipeline_classification',
        }),
        ...(isFiniteNumber(slope)
          ? [
              evidence('turb-slope', 'Slope per year', slope, 'trends.turbiditySlopePerYear', {
                unit: 'FNU/yr',
                category: 'historical_context',
              }),
            ]
          : []),
      ],
    })
  }

  return { signal, changes, fields, summaryClause }
}
