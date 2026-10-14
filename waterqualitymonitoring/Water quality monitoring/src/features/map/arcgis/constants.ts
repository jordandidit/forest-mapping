/**
 * Production Web Map — WATER-DATA-02A authoritative item.
 * Override with VITE_ARCGIS_WEBMAP_ID when needed; do not hardcode alternate maps in UI.
 */
export const DEFAULT_PRODUCTION_WEBMAP_ID = 'f72eafbf58e8474c89afc49f9eb5ebd8'

export const WATER_OVERLAY_KIND = 'water_overlay'

export function getProductionWebMapId(): string {
  const fromEnv = import.meta.env.VITE_ARCGIS_WEBMAP_ID?.trim()
  return fromEnv || DEFAULT_PRODUCTION_WEBMAP_ID
}

/** Padding so the selected lake fills most of the useful viewport. */
export const LAKE_FOCUS_PADDING = {
  left: 48,
  right: 48,
  top: 72,
  bottom: 96,
} as const
