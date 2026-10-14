export function filterForests(forests, filters = {}) {
  const q = (filters.search || '').trim().toLowerCase()
  return forests.filter((f) => {
    if (q) {
      const hay = `${f.name} ${f.district || ''} ${f.province || ''} ${f.unitId || ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    if (filters.province && f.province !== filters.province) return false
    if (filters.district && f.district !== filters.district) return false
    if (filters.forestGroup && f.forestGroup !== filters.forestGroup) return false
    if (filters.status && f.status !== filters.status) return false
    return true
  })
}

export function sortForests(forests, sortKey = 'risk') {
  const list = [...forests]
  switch (sortKey) {
    case 'name':
      return list.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    case 'area':
      return list.sort((a, b) => (b.areaHa || 0) - (a.areaHa || 0))
    case 'ndvi':
      return list.sort((a, b) => (a.ndvi ?? 99) - (b.ndvi ?? 99))
    case 'nbr_drop':
      return list.sort((a, b) => (b.nbrDrop || 0) - (a.nbrDrop || 0))
    case 'risk':
    default:
      return list.sort((a, b) => {
        const r = (b.statusRank || 0) - (a.statusRank || 0)
        if (r !== 0) return r
        return (b.areaHa || 0) - (a.areaHa || 0)
      })
  }
}

export function summarizeForests(forests) {
  const byStatus = {}
  let areaHa = 0
  for (const f of forests) {
    byStatus[f.status] = (byStatus[f.status] || 0) + 1
    areaHa += f.areaHa || 0
  }
  return {
    count: forests.length,
    areaHa,
    byStatus,
    healthy: byStatus.Healthy || 0,
    disturbance: byStatus['Disturbance alert'] || 0,
    moisture: byStatus['Moisture stress'] || 0,
    watch: byStatus.Watch || 0,
  }
}

export function uniqueValues(forests, key) {
  return [...new Set(forests.map((f) => f[key]).filter(Boolean))].sort((a, b) =>
    String(a).localeCompare(String(b)),
  )
}
