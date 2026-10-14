/**
 * Isolated map visual assets — replace files here without touching UI logic.
 * Preferred real asset later: lake-muhazi-satellite-placeholder.jpg / .webp
 */
export const MAP_ASSETS = {
  lakeMuhaziSatellite: `${import.meta.env.BASE_URL}assets/maps/lake-muhazi-satellite-placeholder.svg`,
} as const

export function getLakeBasemapAsset(lakeId: string): string | undefined {
  if (lakeId === 'lake-muhazi') {
    return MAP_ASSETS.lakeMuhaziSatellite
  }
  return undefined
}
