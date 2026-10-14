import { describe, expect, it } from 'vitest'
import type Layer from '@arcgis/core/layers/Layer.js'
import {
  applyLayerListPolicy,
  isUserToggleableLayer,
  resolveProductionLayers,
  setHistoricalWaterQualityRasters,
  setWaterMapMode,
} from '@/features/map/arcgis/layer-resolver'

function layer(title: string, visible = true): Layer {
  return { title, visible, listMode: 'show' } as Layer
}

describe('historical water-quality rasters', () => {
  it('hides current turbidity and chlorophyll rasters while a historical observation is open', () => {
    const resolved = resolveProductionLayers([
      layer('Sentinel-2 natural colour'),
      layer('Turbidity · Per lake'),
      layer('Chlorophyll · Per lake'),
      layer('Turbidity · Fixed classes'),
      layer('Chlorophyll · Fixed classes'),
      layer('Water bodies (status outline)'),
      layer('District boundaries'),
    ])

    setWaterMapMode(resolved, 'satellite')
    const locked = setHistoricalWaterQualityRasters(resolved, true)

    expect(locked).toHaveLength(4)
    expect(resolved.byKey.sentinelNatural?.visible).toBe(true)
    expect(resolved.byKey.sentinelNatural?.listMode).toBe('show')
    expect(resolved.byKey.waterBodies?.visible).toBe(true)
    expect(resolved.byKey.waterBodies?.listMode).toBe('show')
    for (const raster of locked) {
      expect(raster.visible).toBe(false)
      expect(raster.listMode).toBe('hide')
    }
  })

  it('keeps current rasters out of the layer list when returning to Latest', () => {
    const resolved = resolveProductionLayers([
      layer('Turbidity · Per lake', false),
      layer('Chlorophyll · Fixed classes', false),
    ])
    setHistoricalWaterQualityRasters(resolved, true)
    const locked = setHistoricalWaterQualityRasters(resolved, false)

    expect(locked).toHaveLength(0)
    expect(resolved.byKey.turbidityPerLake?.listMode).toBe('hide')
    expect(resolved.byKey.chlorophyllFixed?.listMode).toBe('hide')
    expect(resolved.byKey.turbidityPerLake?.visible).toBe(false)
  })

  it('never lets a water-quality raster stay visible in historical mode, whatever the mode', () => {
    for (const mode of ['satellite', 'turbidity', 'chlorophyll'] as const) {
      const resolved = resolveProductionLayers(productionLayers())
      setWaterMapMode(resolved, mode)
      setHistoricalWaterQualityRasters(resolved, true)
      for (const key of ['turbidityPerLake', 'chlorophyllPerLake', 'turbidityFixed', 'chlorophyllFixed'] as const) {
        expect(resolved.byKey[key]?.visible).toBe(false)
      }
    }
  })
})

/** Titles as audited on the production Web Map (WATER-DATA-02A), abbreviated. */
function productionLayers(): Layer[] {
  return [
    layer('Chlorophyll · Fixed classes (absolute classes …)', false),
    layer('Turbidity · Fixed classes (absolute classes …)', false),
    layer('Sentinel-2 natural colour (latest clear)', false),
    layer('District boundaries', false),
    layer('Provinces', true),
    layer('Sector boundaries', false),
    layer("Chlorophyll · Per lake (each lake's latest clear image …)", false),
    layer("Turbidity · Per lake (each lake's latest clear image …)", true),
    layer('Water bodies (status outline)', true),
  ]
}

describe('map-mode switching', () => {
  it.each([
    ['satellite', 'sentinelNatural'],
    ['turbidity', 'turbidityPerLake'],
    ['chlorophyll', 'chlorophyllPerLake'],
  ] as const)('%s shows exactly one scientific layer plus water bodies', (mode, expected) => {
    const resolved = resolveProductionLayers(productionLayers())
    setWaterMapMode(resolved, mode)

    const scientific = [
      'sentinelNatural',
      'turbidityPerLake',
      'chlorophyllPerLake',
      'turbidityFixed',
      'chlorophyllFixed',
    ] as const
    const visible = scientific.filter((key) => resolved.byKey[key]?.visible)
    expect(visible).toEqual([expected])
    expect(resolved.byKey.waterBodies?.visible).toBe(true)
  })
})

describe('applyLayerListPolicy', () => {
  it('lists only district and sector boundaries; hides every other layer without removing it', () => {
    const layers = [...productionLayers(), layer('Some new unrecognized layer'), layer('World Imagery')]
    const resolved = resolveProductionLayers(layers)
    applyLayerListPolicy(layers, resolved)

    const listed = layers.filter((l) => l.listMode === 'show').map((l) => l.title)
    expect(listed).toEqual(['District boundaries', 'Sector boundaries'])
    expect(layers).toHaveLength(11)
  })

  it('does not change layer visibility', () => {
    const layers = productionLayers()
    const before = layers.map((l) => l.visible)
    applyLayerListPolicy(layers, resolveProductionLayers(layers))
    expect(layers.map((l) => l.visible)).toEqual(before)
  })

  it('re-hides replacement overlay instances after reconciliation', () => {
    const layers = productionLayers()
    applyLayerListPolicy(layers, resolveProductionLayers(layers))
    // Reconciliation swaps in a fresh ImageryLayer, which defaults to listMode 'show'.
    const replacement = layer("Turbidity · Per lake (each lake's latest clear image …)", true)
    layers[7] = replacement
    applyLayerListPolicy(layers, resolveProductionLayers(layers))
    expect(replacement.listMode).toBe('hide')
  })

  it('only boundary layers are user-toggleable', () => {
    expect(isUserToggleableLayer('districts')).toBe(true)
    expect(isUserToggleableLayer('sectors')).toBe(true)
    for (const key of [
      'waterBodies',
      'provinces',
      'sentinelNatural',
      'turbidityPerLake',
      'chlorophyllPerLake',
      'turbidityFixed',
      'chlorophyllFixed',
    ] as const) {
      expect(isUserToggleableLayer(key)).toBe(false)
    }
  })
})
