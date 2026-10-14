import fs from 'node:fs'

const raw = fs.readFileSync(
  'D:/Esri/Water quality monitoring/tmp-dashboard-water-quality.json',
  'utf8',
)
const data = JSON.parse(raw)
const itemIds = new Set()
const urls = new Set()
const titles = new Set()

function walk(v) {
  if (v == null) return
  if (typeof v === 'string') {
    if (/^[0-9a-f]{32}$/i.test(v)) itemIds.add(v)
    if (/https?:\/\//i.test(v)) {
      urls.add(v.replace(/([?&]token=)[^&]+/gi, '$1[REDACTED]'))
    }
    return
  }
  if (Array.isArray(v)) {
    v.forEach(walk)
    return
  }
  if (typeof v === 'object') {
    for (const [k, val] of Object.entries(v)) {
      if (k === 'title' && typeof val === 'string') titles.add(val)
      if (
        ['itemId', 'webmap', 'webMapId', 'mapId', 'portalItemId'].includes(k) &&
        typeof val === 'string'
      ) {
        itemIds.add(val)
      }
      walk(val)
    }
  }
}

walk(data)
console.log('TOP_KEYS', Object.keys(data).join(','))
console.log('TITLES_COUNT', titles.size)
;[...titles].slice(0, 100).forEach((t) => console.log('TITLE', t))
console.log('ITEM_IDS')
;[...itemIds].forEach((id) => console.log(id))
console.log('URLS')
;[...urls].forEach((u) => console.log(u))

const candidates = [
  data.widgets,
  data.desktopView?.widgets,
  data.desktopWidgets,
  data.mobileView?.widgets,
  data.elements,
].filter(Boolean)

for (const widgets of candidates) {
  if (!Array.isArray(widgets)) {
    console.log('WIDGETS_NON_ARRAY', typeof widgets)
    continue
  }
  console.log('WIDGETS', widgets.length)
  for (const w of widgets) {
    console.log(
      JSON.stringify({
        type: w.type,
        name: w.name,
        title: w.title,
        datasets: w.datasets?.length,
        mapId: w.mapId || w.webmap || w.itemId,
      }),
    )
  }
}
