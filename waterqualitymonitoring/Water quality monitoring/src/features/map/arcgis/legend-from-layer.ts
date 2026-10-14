import type Layer from '@arcgis/core/layers/Layer.js'
import type { MapLegendModel, MapLegendStop, WaterMapMode } from '@/features/map/types'

interface ColormapEntry {
  value: number
  r: number
  g: number
  b: number
}

function rgb(r: number, g: number, b: number): string {
  return `rgb(${r}, ${g}, ${b})`
}

function extractColormap(layer: Layer): ColormapEntry[] {
  const imagery = layer as Layer & {
    rasterFunction?: {
      functionName?: string
      functionArguments?: Record<string, unknown>
      toJSON?: () => Record<string, unknown>
    }
    renderingRule?: Record<string, unknown>
  }

  const rfJson =
    imagery.rasterFunction?.toJSON?.() ??
    (imagery.rasterFunction as unknown as Record<string, unknown> | undefined) ??
    imagery.renderingRule

  if (!rfJson || typeof rfJson !== 'object') return []

  return walkForColormap(rfJson)
}

function walkForColormap(node: unknown, depth = 0): ColormapEntry[] {
  if (!node || typeof node !== 'object' || depth > 8) return []

  const obj = node as Record<string, unknown>
  const fn = String(obj.rasterFunction ?? obj.functionName ?? '')
  const args = (obj.rasterFunctionArguments ?? obj.functionArguments ?? {}) as Record<
    string,
    unknown
  >

  if (/colormap/i.test(fn) && Array.isArray(args.Colormap)) {
    return (args.Colormap as unknown[])
      .map((entry) => {
        if (!Array.isArray(entry) || entry.length < 4) return null
        return {
          value: Number(entry[0]),
          r: Number(entry[1]),
          g: Number(entry[2]),
          b: Number(entry[3]),
        }
      })
      .filter((e): e is ColormapEntry => e !== null && Number.isFinite(e.value))
  }

  for (const value of Object.values(args)) {
    const found = walkForColormap(value, depth + 1)
    if (found.length) return found
  }

  return []
}

function sampleStops(entries: ColormapEntry[], count: number): MapLegendStop[] {
  if (!entries.length) return []
  if (entries.length <= count) {
    return entries.map((e) => ({
      color: rgb(e.r, e.g, e.b),
      label: String(e.value),
    }))
  }

  const stops: MapLegendStop[] = []
  for (let i = 0; i < count; i += 1) {
    const idx = Math.round((i / (count - 1)) * (entries.length - 1))
    const e = entries[idx]!
    stops.push({ color: rgb(e.r, e.g, e.b), label: String(e.value) })
  }
  return stops
}

/**
 * Build a legend from the loaded production layer's rendering configuration.
 * Per-lake layers use interpretation labels from production layer titles
 * (usual / lower / higher) — not invented numeric thresholds.
 */
export function buildLegendFromLayer(
  mode: WaterMapMode,
  layer: Layer | null | undefined,
): MapLegendModel | null {
  if (mode === 'satellite' || !layer) {
    return null
  }

  const colormap = extractColormap(layer)
  const perLake = /per\s*lake/i.test(layer.title ?? '')
  const isChlorophyll = /chlorophyll/i.test(layer.title ?? '')

  if (perLake && colormap.length) {
    const first = colormap[0]!
    const mid = colormap[Math.floor(colormap.length / 2)]!
    const last = colormap[colormap.length - 1]!
    const quantity = isChlorophyll ? 'algae' : 'turbidity'

    return {
      title: isChlorophyll ? 'Chlorophyll · Per lake' : 'Turbidity · Per lake',
      subtitle: `Relative to this lake's usual ${quantity} (normalized overlay)`,
      normalization: 'per-lake',
      source: 'webmap-rendering-rule',
      stops: [
        { color: rgb(first.r, first.g, first.b), label: 'Lower than usual' },
        { color: rgb(mid.r, mid.g, mid.b), label: 'Usual' },
        { color: rgb(last.r, last.g, last.b), label: 'Higher than usual' },
      ],
    }
  }

  if (colormap.length) {
    const stops = sampleStops(colormap, Math.min(7, colormap.length)).map((stop, index, arr) => {
      if (index === 0) {
        return { ...stop, label: isChlorophyll ? 'Lower NDCI' : 'Clearer' }
      }
      if (index === arr.length - 1) {
        return { ...stop, label: isChlorophyll ? 'Higher NDCI' : 'More turbid' }
      }
      return { ...stop, label: '' }
    })

    return {
      title: isChlorophyll ? 'Chlorophyll · Fixed classes' : 'Turbidity · Fixed classes',
      subtitle: 'Absolute classes (comparable across water bodies)',
      normalization: 'absolute',
      source: 'webmap-rendering-rule',
      stops,
    }
  }

  return {
    title: layer.title ?? (isChlorophyll ? 'Chlorophyll' : 'Turbidity'),
    subtitle: 'Legend colors unavailable from layer renderer',
    normalization: perLake ? 'per-lake' : 'absolute',
    source: 'none',
    stops: [],
  }
}
