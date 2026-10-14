/** RasterRegistry discovery records. Rendering is deferred to WATER-DATA-02. */

export interface RasterRecord {
  id: string
  kind: string
  label: string | null
  season: string | null
  acquisitionDay: string | null
  itemId: string | null
  url: string
  title: string | null
  cellSizeMeters: number | null
  active: boolean
  createdAt: string | null
  note: string | null
  meaning: string | null
}
