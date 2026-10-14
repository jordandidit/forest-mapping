/** Scene/tile-level pipeline provenance (SceneLog). Not lake observation history. */

export interface SceneRecord {
  id: string
  sceneName: string
  acquiredAt: string | null
  acquisitionDay: string | null
  tile: string | null
  cloudPct: number | null
  status: string | null
  units: string | null
  note: string | null
  runId: string | null
  loggedAt: string | null
  meaning: string | null
}
