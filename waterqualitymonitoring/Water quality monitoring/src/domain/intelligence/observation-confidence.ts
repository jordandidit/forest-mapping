import type { ObservationQualityBlock } from '@/domain/intelligence/types'
import { evidence, isFiniteNumber } from '@/domain/intelligence/helpers'
import type { WaterQualityObservation } from '@/domain/observation/types'
import type { WaterBody } from '@/domain/water-body/types'

/**
 * Present authoritative observation quality from the pipeline.
 * Does not invent High / Moderate / Limited confidence categories.
 */
export function interpretObservationQuality(
  waterBody: WaterBody,
  latestObservation?: WaterQualityObservation | null,
): { block: ObservationQualityBlock; fields: string[]; limitationClause: string | null } {
  const fields: string[] = []
  const evidenceItems = []
  const qualityLabel = latestObservation?.qualityLabel?.trim() || null
  const clearPct =
    latestObservation?.usablePixelPercentage ?? waterBody.metrics?.clearPct ?? null
  const coveragePct = latestObservation?.coveragePercentage ?? null
  const cloudCover = latestObservation?.cloudCover ?? null
  const daysSince = waterBody.daysSinceObservation ?? null
  const obsCount = waterBody.observationCount14Month ?? null
  const obsDate =
    latestObservation?.date ??
    (waterBody.lastObservationAt ? waterBody.lastObservationAt.slice(0, 10) : null)

  if (qualityLabel) fields.push('latestObservation.qualityLabel')
  if (isFiniteNumber(clearPct)) {
    fields.push(
      latestObservation?.usablePixelPercentage != null
        ? 'latestObservation.usablePixelPercentage'
        : 'metrics.clearPct',
    )
  }
  if (isFiniteNumber(coveragePct)) fields.push('latestObservation.coveragePercentage')
  if (isFiniteNumber(cloudCover)) fields.push('latestObservation.cloudCover')
  if (isFiniteNumber(daysSince)) fields.push('daysSinceObservation')
  if (isFiniteNumber(obsCount)) fields.push('observationCount14Month')
  if (obsDate) fields.push('latestObservation.date|lastObservationAt')

  if (qualityLabel) {
    evidenceItems.push(
      evidence('obs-quality', 'Quality', qualityLabel, 'latestObservation.qualityLabel', {
        observationDate: obsDate,
        category: 'observation',
      }),
    )
  }

  if (isFiniteNumber(clearPct)) {
    evidenceItems.push(
      evidence('obs-clear', 'Clear pixels', clearPct, 'latestObservation.usablePixelPercentage', {
        unit: '%',
        observationDate: obsDate,
        category: 'observation',
      }),
    )
  }
  if (isFiniteNumber(coveragePct)) {
    evidenceItems.push(
      evidence('obs-coverage', 'Coverage', coveragePct, 'latestObservation.coveragePercentage', {
        unit: '%',
        observationDate: obsDate,
        category: 'observation',
      }),
    )
  }
  if (isFiniteNumber(cloudCover)) {
    evidenceItems.push(
      evidence('obs-cloud', 'Tile cloud cover', cloudCover, 'latestObservation.cloudCover', {
        unit: '%',
        observationDate: obsDate,
        category: 'observation',
      }),
    )
  }
  if (obsDate) {
    evidenceItems.push(
      evidence('obs-date', 'Latest valid observation', obsDate, 'latestObservation.date', {
        observationDate: obsDate,
        category: 'observation',
      }),
    )
  }
  if (isFiniteNumber(daysSince)) {
    evidenceItems.push(
      evidence('obs-days', 'Days since observation', daysSince, 'daysSinceObservation', {
        category: 'observation',
      }),
    )
  }
  if (isFiniteNumber(obsCount)) {
    evidenceItems.push(
      evidence(
        'obs-14m',
        'Clear observations (14 months)',
        obsCount,
        'observationCount14Month',
        { category: 'historical_context' },
      ),
    )
  }

  const labelLower = (qualityLabel ?? '').toLowerCase()
  let classification: string
  let limitationClause: string | null = null

  if (!latestObservation && !waterBody.lastObservationAt) {
    classification = 'No recent observation is available.'
    limitationClause = 'no recent observation is available'
  } else if (qualityLabel) {
    classification = `Latest observation was classified as ${qualityLabel}.`
    if (
      labelLower.includes('cloud') ||
      labelLower.includes('hazy') ||
      labelLower.includes('glint') ||
      labelLower.includes('too few') ||
      labelLower.includes('unusable')
    ) {
      limitationClause = `the latest observation was classified as ${qualityLabel}`
    }
  } else {
    classification = 'Observation quality classification is not available.'
  }

  if (isFiniteNumber(clearPct)) {
    classification = `${classification} ${clearPct}% clear pixels.`
  }

  let availability = ''
  if (isFiniteNumber(daysSince) && daysSince >= 0) {
    availability =
      daysSince === 0
        ? 'Latest valid observation is from today.'
        : daysSince === 1
          ? 'Latest valid observation was 1 day ago.'
          : `Latest valid observation was ${daysSince} days ago.`
  } else if (obsDate) {
    availability = `Latest valid observation: ${obsDate}.`
  }

  if (isFiniteNumber(obsCount)) {
    availability = `${availability} ${obsCount} clear observation${
      obsCount === 1 ? '' : 's'
    } are available over the last 14 months.`
  }

  const explanationLines = [classification.trim(), availability.trim()].filter(Boolean)

  return {
    block: {
      qualityLabel,
      qualityExplanation: explanationLines.join(' '),
      qualityFacts: {
        clearPct: isFiniteNumber(clearPct) ? clearPct : null,
        daysSinceObservation: isFiniteNumber(daysSince) && daysSince >= 0 ? daysSince : null,
        observationDate: obsDate,
        observationCount14Month: isFiniteNumber(obsCount) ? obsCount : null,
      },
      evidence: evidenceItems,
    },
    fields,
    limitationClause,
  }
}

/** @deprecated Use interpretObservationQuality */
export const interpretObservationConfidence = interpretObservationQuality
