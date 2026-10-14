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

export function interpretChlorophyll(waterBody: WaterBody): {
  signal: InterpretationStatement | null
  changes: InterpretationStatement[]
  fields: string[]
  summaryClause: string | null
} {
  const metrics = waterBody.metrics
  const fields: string[] = []
  const changes: InterpretationStatement[] = []
  const level = metrics?.chlorophyllLevel?.trim() || null
  const ndci = metrics?.ndci ?? null
  const chl = metrics?.chlorophyll ?? null
  const baseline = waterBody.baseline?.ndci14MonthMean ?? null
  const previous = waterBody.previousObservation?.ndci ?? null
  const prevDate = waterBody.previousObservation?.observedAt ?? null
  const trendLabel = surfaceTrendLabel(waterBody.chlorophyllTrendLabel)
  const slope = waterBody.trends?.ndciSlopePerYear ?? null
  const obsDate = waterBody.lastObservationAt?.slice(0, 10) || null

  if (level) fields.push('metrics.chlorophyllLevel')
  if (isFiniteNumber(ndci)) fields.push('metrics.ndci')
  if (isFiniteNumber(chl)) fields.push('metrics.chlorophyll')
  if (isFiniteNumber(baseline)) fields.push('baseline.ndci14MonthMean')
  if (isFiniteNumber(previous)) fields.push('previousObservation.ndci')
  if (trendLabel) fields.push('chlorophyllTrendLabel')
  if (isFiniteNumber(slope)) fields.push('trends.ndciSlopePerYear')

  if (!level && !isFiniteNumber(ndci) && !isFiniteNumber(chl)) {
    return { signal: null, changes: [], fields, summaryClause: null }
  }

  const signal: InterpretationStatement = {
    id: 'signal-chlorophyll',
    title: 'Chlorophyll',
    detail: level ?? (isFiniteNumber(ndci) ? `NDCI ${ndci}` : undefined),
    tone: toneFromLevelLabel(level),
    evidence: [
      ...(level
        ? [
            evidence('chl-level', 'Chlorophyll', level, 'metrics.chlorophyllLevel', {
              observationDate: obsDate,
              category: 'pipeline_classification',
            }),
          ]
        : []),
      ...(isFiniteNumber(ndci)
        ? [
            evidence('ndci-current', 'NDCI', ndci, 'metrics.ndci', {
              observationDate: obsDate,
              category: 'measurement',
            }),
          ]
        : []),
      ...(isFiniteNumber(chl)
        ? [
            evidence('chl-mgm3', 'Indicative chlorophyll-a', chl, 'metrics.chlorophyll', {
              unit: 'mg/m³',
              observationDate: obsDate,
              category: 'measurement',
            }),
          ]
        : []),
    ],
  }

  let summaryClause: string | null = null
  if (level) {
    summaryClause = `chlorophyll conditions are classified as ${level}`
  } else if (isFiniteNumber(ndci)) {
    summaryClause = `latest NDCI is ${ndci}`
  }

  const pct =
    isFiniteNumber(ndci) && isFiniteNumber(baseline) ? percentDifference(ndci, baseline) : null

  if (pct !== null && isFiniteNumber(ndci) && isFiniteNumber(baseline)) {
    const direction = pct < 0 ? 'below' : pct > 0 ? 'above' : 'equal to'
    const quantitative =
      pct === 0 ? 'At 14-month mean' : `${formatSignedPercent(pct)} vs 14-month mean`

    changes.push({
      id: 'change-ndci-baseline',
      title: 'NDCI',
      detail: quantitative,
      tone: pct < 0 ? 'positive' : pct > 0 ? 'watch' : 'neutral',
      evidence: [
        evidence('ndci-current', 'NDCI', ndci, 'metrics.ndci', {
          observationDate: obsDate,
          category: 'measurement',
        }),
        evidence('ndci-base', '14-month mean', baseline, 'baseline.ndci14MonthMean', {
          category: 'historical_context',
        }),
        evidence('ndci-pct', 'Difference', formatSignedPercent(pct), 'derived.percentDifference', {
          category: 'historical_context',
        }),
      ],
    })

    if (summaryClause) {
      summaryClause = `${summaryClause} and NDCI is ${
        pct === 0 ? 'equal to' : `${formatSignedPercent(pct).replace(/^[+−]/, '')} ${direction}`
      } its 14-month mean`
    }
  }

  if (isFiniteNumber(ndci) && isFiniteNumber(previous)) {
    const comparison = formatAbsoluteDifference(ndci, previous, '', 3)
    changes.push({
      id: 'change-ndci-previous',
      title: 'NDCI vs previous clear observation',
      detail: comparison,
      tone: 'neutral',
      evidence: [
        evidence('ndci-current', 'NDCI', ndci, 'metrics.ndci', {
          observationDate: obsDate,
          category: 'measurement',
        }),
        evidence('ndci-prev', 'Previous clear observation', previous, 'previousObservation.ndci', {
          observationDate: prevDate,
          category: 'historical_context',
        }),
      ],
    })
  }

  if (trendLabel) {
    changes.push({
      id: 'change-chlorophyll-trend',
      title: 'Chlorophyll longer-term trend',
      detail: trendLabel,
      tone: 'neutral',
      evidence: [
        evidence('chl-trend', 'Trend', trendLabel, 'chlorophyllTrendLabel', {
          category: 'pipeline_classification',
        }),
        ...(isFiniteNumber(slope)
          ? [
              evidence('ndci-slope', 'NDCI slope per year', slope, 'trends.ndciSlopePerYear', {
                category: 'historical_context',
              }),
            ]
          : []),
      ],
    })
  }

  return { signal, changes, fields, summaryClause }
}
