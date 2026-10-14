import type { ArcgisFeature } from '@/data/arcgis/types'
import type { ObservationDto } from '@/data/arcgis/dto/observation.dto'
import {
  asNullableNumber,
  asNullableString,
  fromArcgisDate,
  fromArcgisDateOnly,
} from '@/data/arcgis/dates'
import { mapBloomRisk } from '@/data/arcgis/mappers/water-body.mapper'
import type {
  ObservationAvailabilityItem,
  ObservationQuality,
  ObservationUsability,
  ParameterTimeSeries,
  TimeSeriesPoint,
  WaterQualityObservation,
} from '@/domain/observation/types'
import type { WaterBody } from '@/domain/water-body/types'
import type { WaterQualityMetric, WaterQualityStatus } from '@/domain/water-quality/types'

function parseObservationTiles(value: string | null): string[] {
  if (!value) return []
  const seen = new Set<string>()
  for (const part of value.split(',')) {
    const tile = part.trim()
    if (/^[A-Za-z0-9_-]+$/.test(tile)) seen.add(tile)
  }
  return [...seen]
}

function mapObservationQuality(label: string | null | undefined): ObservationQuality {
  const normalized = (label ?? '').toLowerCase()
  if (normalized.includes('valid') || normalized.includes('excellent')) return 'excellent'
  if (normalized.includes('good')) return 'good'
  if (normalized.includes('hazy') || normalized.includes('glint') || normalized.includes('fair')) {
    return 'fair'
  }
  if (normalized.includes('poor')) return 'poor'
  if (normalized.includes('cloud') || normalized.includes('unusable')) return 'unusable'
  return 'fair'
}

function mapUsability(label: string | null | undefined): ObservationUsability {
  const normalized = (label ?? '').toLowerCase()
  if (normalized.includes('valid') || normalized.includes('good') || normalized.includes('excellent')) {
    return 'usable'
  }
  if (normalized.includes('cloud')) return 'cloudy'
  if (normalized.includes('hazy') || normalized.includes('glint') || normalized.includes('partial')) {
    return 'partial'
  }
  return 'unavailable'
}

export function mapObservationFeature(
  feature: ArcgisFeature<ObservationDto>,
  routeWaterBodyId: string,
): WaterQualityObservation {
  const dto = feature.attributes
  const acquiredAt =
    fromArcgisDate(dto.obs_date) ??
    fromArcgisDate(dto.created_utc) ??
    new Date(0).toISOString()
  const date =
    fromArcgisDateOnly(dto.obs_date) ??
    asNullableString(dto.acq_day)?.slice(0, 10) ??
    acquiredAt.slice(0, 10)
  const acquisitionDay = asNullableString(dto.acq_day)?.slice(0, 10) ?? null
  const qualityLabel = asNullableString(dto.quality)

  return {
    id: String(dto.obs_id ?? dto.objectid ?? `${routeWaterBodyId}-${date}`),
    waterBodyId: routeWaterBodyId,
    wbId: dto.wb_id != null ? String(dto.wb_id) : undefined,
    date,
    acquisitionDay: /^\d{4}-\d{2}-\d{2}$/.test(acquisitionDay ?? '') ? acquisitionDay : null,
    tiles: parseObservationTiles(asNullableString(dto.tiles)),
    acquiredAt,
    satellite: 'Sentinel-2',
    cloudCover: asNullableNumber(dto.tile_cloud_pct),
    usablePixelPercentage: asNullableNumber(dto.clear_pct),
    coveragePercentage: asNullableNumber(dto.coverage_pct),
    quality: mapObservationQuality(qualityLabel),
    qualityLabel,
    turbidity: asNullableNumber(dto.turbidity_fnu),
    turbidityLevel: asNullableString(dto.turbidity_level),
    ndci: asNullableNumber(dto.ndci),
    chlorophyll: asNullableNumber(dto.chl_mgm3),
    chlorophyllLevel: asNullableString(dto.chlorophyll_level),
    floatingVegetation: asNullableNumber(dto.floating_veg_pct),
    bloomRisk: mapBloomRisk(asNullableString(dto.bloom_risk)),
    fai: asNullableNumber(dto.fai),
    meaning: asNullableString(dto.meaning),
  }
}

export function mapObservationsToAvailability(
  observations: WaterQualityObservation[],
): ObservationAvailabilityItem[] {
  return [...observations]
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((obs) => ({
      id: `avail-${obs.id}`,
      waterBodyId: obs.waterBodyId,
      date: obs.date,
      usability: mapUsability(obs.qualityLabel),
      qualityLabel: obs.qualityLabel ?? obs.quality,
      usablePixelPercentage: obs.usablePixelPercentage,
      coveragePercentage: obs.coveragePercentage,
      tileCloudPercentage: obs.cloudCover,
    }))
}

/** Stored pipeline class only. Missing levels stay null — do not classify from the number. */
function storedMetricClassification(
  observation: WaterQualityObservation,
  parameter: ParameterTimeSeries['parameter'],
): string | null {
  const raw =
    parameter === 'turbidity'
      ? observation.turbidityLevel
      : parameter === 'ndci' || parameter === 'chlorophyll'
        ? observation.chlorophyllLevel
        : null
  const trimmed = raw?.trim()
  return trimmed || null
}

function parameterValue(
  observation: WaterQualityObservation,
  parameter: ParameterTimeSeries['parameter'],
): number | null {
  switch (parameter) {
    case 'turbidity':
      return observation.turbidity
    case 'ndci':
      return observation.ndci
    case 'floating_vegetation':
      return observation.floatingVegetation
    case 'chlorophyll':
      return observation.chlorophyll ?? null
    default:
      return null
  }
}

export function mapObservationsToTimeSeries(
  waterBodyId: string,
  parameter: ParameterTimeSeries['parameter'],
  observations: WaterQualityObservation[],
): ParameterTimeSeries {
  const points: TimeSeriesPoint[] = [...observations]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((obs) => ({
      date: obs.date,
      value: parameterValue(obs, parameter),
      quality: obs.quality,
      observationId: obs.id,
      qualityLabel: obs.qualityLabel ?? null,
      classification: storedMetricClassification(obs, parameter),
    }))

  return {
    waterBodyId,
    parameter,
    points,
    annotations: [],
    threshold:
      parameter === 'ndci'
        ? { value: 0.15, label: 'NDCI screening threshold' }
        : undefined,
  }
}

function percentChange(current: number | null, baseline: number | null): number | null {
  if (current === null || baseline === null || baseline === 0) return null
  return ((current - baseline) / Math.abs(baseline)) * 100
}

function formatChangeLabel(change: number | null, absolute = false): string {
  if (change === null) return '—'
  const rounded = absolute
    ? Number(change.toFixed(1))
    : Number(change.toFixed(0))
  const arrow = rounded > 0 ? '↑' : rounded < 0 ? '↓' : '→'
  const magnitude = Math.abs(rounded)
  return absolute ? `${arrow} ${magnitude}` : `${arrow} ${magnitude}%`
}

function statusFromLevel(
  level: string | null | undefined,
  fallback: WaterQualityStatus,
): WaterQualityStatus {
  const normalized = (level ?? '').toLowerCase()
  if (normalized.includes('critical') || normalized.includes('high')) return 'poor'
  if (normalized.includes('elevat') || normalized.includes('moderat')) return 'moderate'
  if (normalized.includes('low') || normalized.includes('good') || normalized.includes('clear')) {
    return 'good'
  }
  return fallback
}

function sparklineValues(
  observations: WaterQualityObservation[],
  pick: (obs: WaterQualityObservation) => number | null,
  limit = 12,
): number[] {
  return [...observations]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(pick)
    .filter((value): value is number => value !== null)
    .slice(-limit)
}

export function buildMetricsFromProduction(
  waterBody: WaterBody,
  observations: WaterQualityObservation[],
): WaterQualityMetric[] {
  const metrics = waterBody.metrics
  const baseline = waterBody.baseline
  const previous = waterBody.previousObservation

  const turbidity = metrics?.turbidity ?? null
  const turbidityVsBase = percentChange(turbidity, baseline?.turbidity14MonthMean ?? null)
  const turbidityVsPrev = percentChange(turbidity, previous?.turbidity ?? null)

  const ndci = metrics?.ndci ?? null
  const ndciVsBase = percentChange(ndci, baseline?.ndci14MonthMean ?? null)
  const ndciVsPrev = percentChange(ndci, previous?.ndci ?? null)

  const floating = metrics?.floatingVegetationPct ?? null

  const turbidityChange = turbidityVsBase ?? turbidityVsPrev
  const turbidityBaselineLabel =
    turbidityVsBase !== null
      ? 'vs. 14-month mean'
      : turbidityVsPrev !== null
        ? 'vs. previous clear image'
        : 'baseline unavailable'

  const ndciChange = ndciVsBase ?? ndciVsPrev
  const ndciBaselineLabel =
    ndciVsBase !== null
      ? 'vs. 14-month mean'
      : ndciVsPrev !== null
        ? 'vs. previous clear image'
        : 'baseline unavailable'

  const bloomLabel = metrics?.bloomRisk
    ? metrics.bloomRisk.charAt(0).toUpperCase() + metrics.bloomRisk.slice(1)
    : '—'

  return [
    {
      parameter: 'turbidity',
      label: 'Turbidity',
      value: turbidity ?? '—',
      unit: turbidity === null ? '' : 'FNU',
      status: statusFromLevel(metrics?.turbidityLevel, waterBody.status),
      changePercent: turbidityChange,
      changeLabel: formatChangeLabel(turbidityChange),
      baselineLabel: turbidityBaselineLabel,
      sparkline: sparklineValues(observations, (o) => o.turbidity),
    },
    {
      parameter: 'ndci',
      label: 'Chlorophyll-a (NDCI)',
      value: ndci ?? '—',
      unit: '',
      status: statusFromLevel(metrics?.chlorophyllLevel, waterBody.status),
      changePercent: ndciChange,
      changeLabel: formatChangeLabel(ndciChange),
      baselineLabel: ndciBaselineLabel,
      sparkline: sparklineValues(observations, (o) => o.ndci),
    },
    {
      parameter: 'bloom_risk',
      label: 'Bloom Risk',
      value: bloomLabel,
      unit: '',
      status:
        metrics?.bloomRisk === 'high' || metrics?.bloomRisk === 'elevated'
          ? 'poor'
          : metrics?.bloomRisk === 'moderate'
            ? 'moderate'
            : metrics?.bloomRisk === 'low'
              ? 'good'
              : 'unknown',
      changePercent: null,
      changeLabel:
        waterBody.observationCount14Month != null
          ? `${waterBody.observationCount14Month} obs. (14 mo.)`
          : '—',
      baselineLabel: 'production status',
      sparkline: sparklineValues(observations, (o) => o.ndci),
    },
    {
      parameter: 'floating_vegetation',
      label: 'Floating Vegetation',
      value: floating ?? '—',
      unit: floating === null ? '' : '%',
      // Pass-through display status — do not invent a % threshold classifier in React.
      status: 'unknown',
      changePercent: null,
      changeLabel: '—',
      baselineLabel: 'latest observation',
      sparkline: sparklineValues(observations, (o) => o.floatingVegetation),
    },
  ]
}
