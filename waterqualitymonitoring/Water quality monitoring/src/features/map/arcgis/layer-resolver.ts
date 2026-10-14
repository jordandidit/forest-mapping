import type Layer from '@arcgis/core/layers/Layer.js'
import type { ProductionLayerKey, WaterMapExtendedMode, WaterMapMode } from '@/features/map/types'

type LayerMatcher = (title: string) => boolean

/**
 * Centralized production layer registry.
 * Do not scatter approximate title matching through React components.
 */
const LAYER_MATCHERS: Record<ProductionLayerKey, LayerMatcher> = {
  chlorophyllFixed: (t) => /^chlorophyll\s*[·.•]\s*fixed/i.test(t),
  turbidityFixed: (t) => /^turbidity\s*[·.•]\s*fixed/i.test(t),
  sentinelNatural: (t) => /sentinel-2\s*natural/i.test(t),
  districts: (t) => /district\s*boundar/i.test(t),
  provinces: (t) => /^provinces$/i.test(t.trim()),
  sectors: (t) => /sector\s*boundar/i.test(t),
  chlorophyllPerLake: (t) => /^chlorophyll\s*[·.•]\s*per\s*lake/i.test(t),
  turbidityPerLake: (t) => /^turbidity\s*[·.•]\s*per\s*lake/i.test(t),
  waterBodies: (t) => /water\s*bodies/i.test(t),
}

export interface ResolvedProductionLayers {
  byKey: Partial<Record<ProductionLayerKey, Layer>>
  waterOverlayLayers: Layer[]
  unresolvedTitles: string[]
}

export function resolveProductionLayers(layers: Iterable<Layer>): ResolvedProductionLayers {
  const byKey: Partial<Record<ProductionLayerKey, Layer>> = {}
  const unresolvedTitles: string[] = []
  const claimed = new Set<Layer>()

  for (const layer of layers) {
    const title = (layer.title ?? '').trim()
    if (!title) continue

    let matched: ProductionLayerKey | null = null
    for (const [key, matcher] of Object.entries(LAYER_MATCHERS) as [
      ProductionLayerKey,
      LayerMatcher,
    ][]) {
      if (matcher(title)) {
        matched = key
        break
      }
    }

    if (!matched) {
      unresolvedTitles.push(title)
      continue
    }

    if (!byKey[matched]) {
      byKey[matched] = layer
      claimed.add(layer)
    }
  }

  const waterOverlayLayers = [
    byKey.chlorophyllFixed,
    byKey.turbidityFixed,
    byKey.chlorophyllPerLake,
    byKey.turbidityPerLake,
  ].filter((layer): layer is Layer => Boolean(layer))

  void claimed
  return { byKey, waterOverlayLayers, unresolvedTitles }
}

/** Modes that drive mutual-exclusive scientific visibility. */
export function modeToVisibleScientificKeys(
  mode: WaterMapExtendedMode,
): ProductionLayerKey[] {
  switch (mode) {
    case 'satellite':
      return ['sentinelNatural']
    case 'turbidity':
    case 'turbidity-relative':
      return ['turbidityPerLake']
    case 'turbidity-absolute':
      return ['turbidityFixed']
    case 'chlorophyll':
    case 'chlorophyll-relative':
      return ['chlorophyllPerLake']
    case 'chlorophyll-absolute':
      return ['chlorophyllFixed']
  }
}

const SCIENTIFIC_KEYS: ProductionLayerKey[] = [
  'chlorophyllFixed',
  'turbidityFixed',
  'sentinelNatural',
  'chlorophyllPerLake',
  'turbidityPerLake',
]

/** Current water-quality rasters. They are not a historical scene. */
const WATER_QUALITY_RASTER_KEYS: ProductionLayerKey[] = [
  'chlorophyllFixed',
  'turbidityFixed',
  'chlorophyllPerLake',
  'turbidityPerLake',
]

/**
 * Historical viewing may show the Sentinel scene for that day.
 * Current turbidity and chlorophyll rasters stay off and out of the layer list
 * so they cannot be read as that observation's spatial overlay.
 * Returning to Latest does not re-list them: the map-mode selector owns their visibility.
 */
export function setHistoricalWaterQualityRasters(
  resolved: ResolvedProductionLayers,
  historical: boolean,
): Layer[] {
  const locked: Layer[] = []
  for (const key of WATER_QUALITY_RASTER_KEYS) {
    const layer = resolved.byKey[key]
    if (!layer) continue
    layer.listMode = 'hide'
    if (historical) {
      layer.visible = false
      locked.push(layer)
    }
  }
  return locked
}

/** Boundary layers users may toggle by hand. They never change scientific content. */
const USER_TOGGLEABLE_KEYS: ProductionLayerKey[] = ['districts', 'sectors']

/**
 * Layer-list policy: only working boundary layers are listed.
 * Scientific rasters (map-mode controlled), fixed-class rasters, the water-body anchor,
 * broken layers and unrecognized layers are hidden from any layer list, never removed.
 * Re-apply after raster reconciliation, which replaces overlay layer instances.
 */
export function applyLayerListPolicy(
  layers: Iterable<Layer>,
  resolved: ResolvedProductionLayers,
): void {
  const listed = new Set<Layer>()
  for (const key of USER_TOGGLEABLE_KEYS) {
    const layer = resolved.byKey[key]
    if (layer) listed.add(layer)
  }
  for (const layer of layers) {
    layer.listMode = listed.has(layer) ? 'show' : 'hide'
  }
}

export function isUserToggleableLayer(key: ProductionLayerKey): boolean {
  return USER_TOGGLEABLE_KEYS.includes(key)
}

/**
 * Apply investigation mode to resolved Web Map layers.
 * Water-body outlines stay visible; fixed-class layers stay off for primary modes.
 */
export function setWaterMapMode(
  resolved: ResolvedProductionLayers,
  mode: WaterMapMode,
): void {
  const visibleKeys = new Set<ProductionLayerKey>(modeToVisibleScientificKeys(mode))
  visibleKeys.add('waterBodies')

  for (const key of SCIENTIFIC_KEYS) {
    const layer = resolved.byKey[key]
    if (layer) layer.visible = visibleKeys.has(key)
  }

  const waterBodies = resolved.byKey.waterBodies
  if (waterBodies) waterBodies.visible = true

  // Admin layers stay off unless the user enables them later.
  for (const key of ['districts', 'provinces', 'sectors'] as ProductionLayerKey[]) {
    const layer = resolved.byKey[key]
    if (layer && key !== 'provinces') {
      // leave production default; ensure they don't steal focus
      if (layer.visible && !visibleKeys.has(key)) {
        // keep production visibility for admin — audit had them off
      }
    }
  }
}

export function isProvincesLayer(layer: Layer): boolean {
  return LAYER_MATCHERS.provinces(layer.title ?? '')
}

export function getLayerUrl(layer: Layer): string | null {
  const withUrl = layer as Layer & { url?: string }
  return typeof withUrl.url === 'string' ? withUrl.url.replace(/\/+$/, '') : null
}

export function normalizeServiceUrl(url: string): string {
  return url.trim().replace(/\/+$/, '').split('?')[0] ?? url
}
