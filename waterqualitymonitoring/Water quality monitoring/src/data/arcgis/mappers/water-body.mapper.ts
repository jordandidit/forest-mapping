import type { ArcgisFeature, ArcgisPolygonGeometry } from '@/data/arcgis/types'
import type { WaterBodyDto } from '@/data/arcgis/dto/water-body.dto'
import {
  asNullableBooleanFlag,
  asNullableNumber,
  asNullableString,
  fromArcgisDate,
  fromArcgisDateOnly,
} from '@/data/arcgis/dates'
import type { GeoJsonGeometry, MapBounds } from '@/domain/shared/geo'
import type {
  WaterBody,
  WaterBodyType,
} from '@/domain/water-body/types'
import type { BloomRisk, TrendDirection, WaterQualityStatus } from '@/domain/water-quality/types'

export function slugifyRouteSegment(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
}

export function toWaterBodyRouteId(name: string, wbKey?: string | null): string {
  const key = wbKey?.trim()
  if (key && /^[a-z0-9]+(?:-[a-z0-9]+)*$/i.test(key)) {
    return key.toLowerCase()
  }

  const slug = slugifyRouteSegment(name)
  if (!slug) return 'water-body'
  return slug.startsWith('lake-') ? slug : `lake-${slug}`
}

function mapWaterBodyType(value: string | null | undefined): WaterBodyType {
  const normalized = (value ?? '').toLowerCase()
  if (normalized.includes('reservoir')) return 'reservoir'
  if (normalized.includes('wetland')) return 'wetland'
  if (normalized.includes('river')) return 'river_reach'
  return 'lake'
}

function mapStatus(value: string | null | undefined): WaterQualityStatus {
  const normalized = (value ?? '').toLowerCase().replace(/\s+/g, '_')
  if (normalized.includes('critical')) return 'critical'
  if (normalized.includes('poor') || normalized.includes('bad')) return 'poor'
  if (normalized.includes('moderate') || normalized.includes('fair') || normalized.includes('watch')) {
    return 'moderate'
  }
  if (normalized.includes('good') || normalized.includes('healthy') || normalized.includes('ok')) {
    return 'good'
  }
  return 'unknown'
}

function mapTrend(value: string | null | undefined): TrendDirection {
  const normalized = (value ?? '').toLowerCase()
  if (
    normalized.includes('improv') ||
    normalized.includes('decreas') ||
    normalized === 'down' ||
    normalized === 'falling'
  ) {
    return 'improving'
  }
  if (
    normalized.includes('deter') ||
    normalized.includes('wors') ||
    normalized.includes('increas') ||
    normalized === 'up' ||
    normalized === 'rising'
  ) {
    return 'deteriorating'
  }
  if (normalized.includes('stable') || normalized.includes('flat') || normalized === 'none') {
    return 'stable'
  }
  return 'unknown'
}

function preserveTrendLabel(value: string | null | undefined): string | null {
  const label = asNullableString(value)
  return label
}

export function mapBloomRisk(value: string | null | undefined): BloomRisk | null {
  if (!value) return null
  const normalized = value.toLowerCase()
  if (normalized.includes('high') || normalized.includes('severe')) return 'high'
  if (normalized.includes('elevat')) return 'elevated'
  if (normalized.includes('moderat') || normalized.includes('medium')) return 'moderate'
  if (normalized.includes('low') || normalized.includes('none')) return 'low'
  return null
}

function mapGeometry(geometry: ArcgisPolygonGeometry | undefined): GeoJsonGeometry | undefined {
  if (!geometry?.rings || geometry.rings.length === 0) return undefined
  return {
    type: geometry.rings.length > 1 ? 'MultiPolygon' : 'Polygon',
    coordinates:
      geometry.rings.length > 1
        ? geometry.rings.map((ring) => [ring])
        : [geometry.rings[0]!],
  }
}

function mapBounds(dto: WaterBodyDto): MapBounds {
  const west = asNullableNumber(dto.bxmin)
  const south = asNullableNumber(dto.bymin)
  const east = asNullableNumber(dto.bxmax)
  const north = asNullableNumber(dto.bymax)
  const cx = asNullableNumber(dto.cx)
  const cy = asNullableNumber(dto.cy)

  const bounds =
    west !== null && south !== null && east !== null && north !== null
      ? { west, south, east, north }
      : {
          west: (cx ?? 30.4) - 0.1,
          south: (cy ?? -1.86) - 0.1,
          east: (cx ?? 30.4) + 0.1,
          north: (cy ?? -1.86) + 0.1,
        }

  return {
    bounds,
    center: {
      longitude: cx ?? (bounds.west + bounds.east) / 2,
      latitude: cy ?? (bounds.south + bounds.north) / 2,
    },
    defaultZoom: 12,
  }
}

function buildSummary(dto: WaterBodyDto): string | undefined {
  const note = asNullableString(dto.status_note) ?? asNullableString(dto.admin_note)
  if (note) return note

  const turbidity = asNullableNumber(dto.turbidity_fnu)
  const ndci = asNullableNumber(dto.ndci)
  const bloom = asNullableString(dto.bloom_risk)
  const parts: string[] = []
  if (turbidity !== null) parts.push(`Latest turbidity ${turbidity.toFixed(1)} FNU`)
  if (ndci !== null) parts.push(`NDCI ${ndci.toFixed(3)}`)
  if (bloom) parts.push(`bloom risk ${bloom}`)
  return parts.length > 0 ? `${parts.join('; ')}.` : undefined
}

export function mapWaterBodyFeature(
  feature: ArcgisFeature<WaterBodyDto>,
  options?: { includeGeometry?: boolean },
): WaterBody {
  const dto = feature.attributes
  const name = asNullableString(dto.name) ?? 'Unnamed water body'
  const wbId = String(dto.wb_id ?? dto.objectid ?? name)
  const routeId = toWaterBodyRouteId(name, asNullableString(dto.wb_key))
  const areaHa = asNullableNumber(dto.area_ha)
  const lastObs = fromArcgisDate(dto.last_obs_date)
  const chlTrendRaw = asNullableString(dto.chl_trend)
  const turbTrendRaw = asNullableString(dto.turb_trend)
  const chlTrend = mapTrend(chlTrendRaw)
  const turbTrend = mapTrend(turbTrendRaw)
  const statusRaw = asNullableString(dto.status)

  return {
    id: routeId,
    wbId,
    name: name.toLowerCase().startsWith('lake ') ? name : `Lake ${name}`,
    nameLocal: asNullableString(dto.name_rw),
    type: mapWaterBodyType(asNullableString(dto.wb_type)),
    province: asNullableString(dto.province) ?? '—',
    district: asNullableString(dto.district) ?? '—',
    country: 'Rwanda',
    geometry: options?.includeGeometry === false ? undefined : mapGeometry(feature.geometry),
    map: mapBounds(dto),
    surfaceAreaKm2: areaHa !== null ? areaHa / 100 : 0,
    status: mapStatus(statusRaw),
    statusLabel: statusRaw,
    statusNote: asNullableString(dto.status_note),
    trend: chlTrend !== 'unknown' ? chlTrend : turbTrend,
    turbidityTrendLabel: preserveTrendLabel(turbTrendRaw),
    chlorophyllTrendLabel: preserveTrendLabel(chlTrendRaw),
    lastObservationAt: lastObs ?? '',
    daysSinceObservation: asNullableNumber(dto.days_since_obs),
    observationCount14Month: asNullableNumber(dto.obs_14m),
    summary: buildSummary(dto),
    metrics: {
      turbidity: asNullableNumber(dto.turbidity_fnu),
      turbidityLevel: asNullableString(dto.turbidity_level),
      ndci: asNullableNumber(dto.ndci),
      chlorophyll: asNullableNumber(dto.chl_mgm3),
      chlorophyllLevel: asNullableString(dto.chlorophyll_level),
      bloomRisk: mapBloomRisk(asNullableString(dto.bloom_risk)),
      floatingVegetationPct: asNullableNumber(dto.floating_veg_pct),
      floatingVegetationFlag: asNullableBooleanFlag(dto.floating_veg_flag),
      waterPct: asNullableNumber(dto.water_pct),
      clearPct: asNullableNumber(dto.clear_pct),
    },
    baseline: {
      turbidity14MonthMean: asNullableNumber(dto.turb_base),
      ndci14MonthMean: asNullableNumber(dto.ndci_base),
      // Pipeline fields — React must not recompute percentile ranks.
      turbidityPercentileRank: asNullableNumber(dto.turb_pctrank),
      ndciPercentileRank: asNullableNumber(dto.ndci_pctrank),
    },
    trends: {
      turbidityTrend: turbTrend,
      turbiditySlopePerYear: asNullableNumber(dto.turb_slope_yr),
      chlorophyllTrend: chlTrend,
      ndciSlopePerYear: asNullableNumber(dto.ndci_slope_yr),
      // Mapped for future evidence; p-value semantics not yet confirmed for UI use.
      turbidityTrendP: asNullableNumber(dto.turb_trend_p),
      chlorophyllTrendP: asNullableNumber(dto.chl_trend_p),
    },
    previousObservation: {
      observedAt: fromArcgisDateOnly(dto.prev_obs_date),
      turbidity: asNullableNumber(dto.prev_turbidity_fnu),
      ndci: asNullableNumber(dto.prev_ndci),
    },
  }
}
