/** Shared API root — keep GIS proxy and fetch client on the same path. */
export function getApiBase() {
  const fromEnv = String(import.meta.env.VITE_API_BASE || '').trim()
  if (fromEnv) return fromEnv.replace(/\/$/, '')
  return `${import.meta.env.BASE_URL || '/'}api`.replace(/\/{2,}/g, '/').replace(/\/$/, '') || '/api'
}
