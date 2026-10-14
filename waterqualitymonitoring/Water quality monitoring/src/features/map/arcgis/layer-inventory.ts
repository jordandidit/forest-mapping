import type { ProductionLayerKey } from '@/features/map/types'

/**
 * Boundary/reference outlines users can inspect and toggle independently of map mode.
 * Satellite, turbidity and chlorophyll are not listed: the map-mode selector owns them.
 * Fixed-class rasters are not listed: they are technical alternates of the per-lake overlays.
 */
export type ReferenceLayerKey = Extract<
  ProductionLayerKey,
  'waterBodies' | 'districts' | 'sectors' | 'provinces'
>

export interface ReferenceLayerRow {
  key: ReferenceLayerKey
  label: string
  description: string
  /** Always-on layers the app itself depends on; not user-toggleable. */
  locked: boolean
  visible: boolean
}

interface ReferenceLayerDef {
  label: string
  description: string
  locked: boolean
}

const REFERENCE_LAYER_DEFS: Record<ReferenceLayerKey, ReferenceLayerDef> = {
  waterBodies: {
    label: 'Water bodies',
    description: 'Lake outlines. Always on to anchor the selected lake.',
    locked: true,
  },
  districts: {
    label: 'District boundaries',
    description: 'Administrative district outlines for spatial context.',
    locked: false,
  },
  sectors: {
    label: 'Sector boundaries',
    description: 'Administrative sector outlines for spatial context.',
    locked: false,
  },
  provinces: {
    label: 'Provinces',
    description: 'Provincial boundaries.',
    locked: false,
  },
}

/** Stable display order, independent of Web Map layer order. */
const REFERENCE_LAYER_ORDER: ReferenceLayerKey[] = [
  'waterBodies',
  'districts',
  'sectors',
  'provinces',
]

/**
 * Build user-facing rows for boundary/reference layers.
 * A key only appears when it resolved from the Web Map and is working —
 * absent or broken layers (e.g. the 404 Provinces service) are not listed at all.
 */
export function buildReferenceLayerRows(
  resolved: { byKey: Partial<Record<ReferenceLayerKey, unknown>> },
  visibility: Partial<Record<ReferenceLayerKey, boolean>>,
  unavailable: Partial<Record<ReferenceLayerKey, string>>,
): ReferenceLayerRow[] {
  const rows: ReferenceLayerRow[] = []

  for (const key of REFERENCE_LAYER_ORDER) {
    const def = REFERENCE_LAYER_DEFS[key]
    if (!resolved.byKey[key] || unavailable[key]) continue

    rows.push({
      key,
      label: def.label,
      description: def.description,
      locked: def.locked,
      visible: Boolean(visibility[key]),
    })
  }

  return rows
}
