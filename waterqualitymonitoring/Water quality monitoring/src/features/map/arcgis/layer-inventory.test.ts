import { describe, expect, it } from 'vitest'
import { buildReferenceLayerRows } from '@/features/map/arcgis/layer-inventory'

describe('buildReferenceLayerRows', () => {
  it('omits layers absent from the Web Map and not marked unavailable', () => {
    const rows = buildReferenceLayerRows({ byKey: { waterBodies: {} } }, {}, {})
    expect(rows).toHaveLength(1)
    expect(rows[0]?.key).toBe('waterBodies')
  })

  it('locks Water bodies as always-on and reports its current visibility', () => {
    const rows = buildReferenceLayerRows(
      { byKey: { waterBodies: {} } },
      { waterBodies: true },
      {},
    )
    expect(rows[0]).toMatchObject({ locked: true, visible: true })
  })

  it('reports district/sector visibility from the supplied visibility map', () => {
    const rows = buildReferenceLayerRows(
      { byKey: { districts: {}, sectors: {} } },
      { districts: true, sectors: false },
      {},
    )
    const districts = rows.find((r) => r.key === 'districts')
    const sectors = rows.find((r) => r.key === 'sectors')
    expect(districts).toMatchObject({ locked: false, visible: true })
    expect(sectors).toMatchObject({ locked: false, visible: false })
  })

  it('omits a broken layer that never resolved from the Web Map', () => {
    const rows = buildReferenceLayerRows(
      { byKey: {} },
      {},
      { provinces: 'Provinces layer is unavailable in production.' },
    )
    expect(rows).toEqual([])
  })

  it('omits a resolved-but-broken layer rather than listing it', () => {
    const rows = buildReferenceLayerRows(
      { byKey: { provinces: {}, districts: {} } },
      { provinces: true, districts: false },
      { provinces: 'Provinces layer is unavailable in production.' },
    )
    expect(rows.map((r) => r.key)).toEqual(['districts'])
  })

  it('empty inputs produce no rows', () => {
    expect(buildReferenceLayerRows({ byKey: {} }, {}, {})).toEqual([])
  })

  it('always returns rows in a stable display order', () => {
    const rows = buildReferenceLayerRows(
      { byKey: { sectors: {}, waterBodies: {}, districts: {}, provinces: {} } },
      {},
      {},
    )
    expect(rows.map((r) => r.key)).toEqual(['waterBodies', 'districts', 'sectors', 'provinces'])
  })

  it('does not list scientific or fixed-class rasters even when they resolve from the Web Map', () => {
    const rows = buildReferenceLayerRows(
      {
        byKey: {
          waterBodies: {},
          turbidityFixed: {},
          chlorophyllFixed: {},
          turbidityPerLake: {},
          chlorophyllPerLake: {},
          sentinelNatural: {},
        } as never,
      },
      {},
      {},
    )
    expect(rows.map((r) => r.key)).toEqual(['waterBodies'])
  })

  it('lists every reference layer when all resolve', () => {
    const rows = buildReferenceLayerRows(
      {
        byKey: {
          waterBodies: {},
          districts: {},
          sectors: {},
          provinces: {},
        },
      },
      {},
      {},
    )
    expect(rows.map((r) => r.key)).toEqual([
      'waterBodies',
      'districts',
      'sectors',
      'provinces',
    ])
  })
})
