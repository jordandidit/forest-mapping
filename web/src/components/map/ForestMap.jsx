import { useEffect, useRef, useState } from 'react'
import esriConfig from '@arcgis/core/config'
import Map from '@arcgis/core/Map'
import MapView from '@arcgis/core/views/MapView'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import ImageryLayer from '@arcgis/core/layers/ImageryLayer'
import FeatureLayer from '@arcgis/core/layers/FeatureLayer'
import Graphic from '@arcgis/core/Graphic'
import Polygon from '@arcgis/core/geometry/Polygon'
import Extent from '@arcgis/core/geometry/Extent'
import RasterFunction from '@arcgis/core/layers/support/RasterFunction'
import MosaicRule from '@arcgis/core/layers/support/MosaicRule'
import { Home, Layers, Maximize2 } from 'lucide-react'
import {
  STATUS_COLORS,
  STATUS_ORDER,
  NDVI_BREAKS,
  NDVI_PALETTE,
  NBR_BREAKS,
  NBR_PALETTE,
} from '../../constants/status'
import { formatDate } from '../../utils/date'
import { formatNumber } from '../../utils/format'
import { getApiBase } from '../../api/base'
import { getWebMapConfig } from '../../api/forestHealth'

/**
 * Map behaviour mirrors RW_ForestHealth_Nightly.ipynb:
 * Forests (status outline) — status-coloured outlines, zoom on select (no blue glow).
 */

const RWANDA = new Extent({
  xmin: 28.85,
  ymin: -2.85,
  xmax: 30.9,
  ymax: -1.05,
  spatialReference: { wkid: 4326 },
})

const BASEMAPS = {
  satellite: 'satellite',
  topo: 'topo-vector',
  dark: 'dark-gray-vector',
}

let proxyInstalled = false

/**
 * Route GeoHub requests through our Node proxy.
 * Critical: fold params.query into the *target* URL before wrapping, otherwise
 * exportImage bbox / renderingRule land on the proxy URL and overlays stay dark.
 */
function installGisProxy() {
  if (proxyInstalled) return
  proxyInstalled = true
  esriConfig.request.interceptors.push({
    urls: [/https:\/\/gh\.space\.gov\.rw\//i],
    before: (params) => {
      try {
        const target = new URL(params.url)
        // Portal / OAuth / sharing must hit GeoHub directly — never via /api/gis/proxy.
        if (/\/portal(\/|$)/i.test(target.pathname)) return

        const query = params.query || params.requestOptions?.query
        if (query && typeof query === 'object') {
          for (const [key, value] of Object.entries(query)) {
            if (value == null || value === '') continue
            target.searchParams.set(
              key,
              typeof value === 'object' ? JSON.stringify(value) : String(value),
            )
          }
          params.query = {}
          if (params.requestOptions) params.requestOptions.query = {}
        }
        // Must match Vite proxy + VITE_API_BASE (not BASE_URL alone — base path drifts).
        const proxyBase = `${getApiBase()}/gis/proxy`
        params.url = `${proxyBase}?url=${encodeURIComponent(target.toString())}`
      } catch {
        if (/\/portal(\/|$)/i.test(String(params.url))) return
        const proxyBase = `${getApiBase()}/gis/proxy`
        params.url = `${proxyBase}?url=${encodeURIComponent(params.url)}`
      }
    },
  })
}

function escapeSql(value) {
  return String(value ?? '').replace(/'/g, "''")
}

function hexToRgb(hex) {
  const h = (hex || '#9e9e9e').replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

/**
 * Status outline — thin coloured edge so NDVI/NBR overlays stay readable inside.
 */
function statusOutlineSymbol(status, { selected = false } = {}) {
  const [r, g, b] = hexToRgb(STATUS_COLORS[status] || STATUS_COLORS.Pending)
  return {
    type: 'simple-fill',
    color: [r, g, b, selected ? 18 / 255 : 8 / 255],
    outline: {
      type: 'simple-line',
      color: [r, g, b, 1],
      width: selected ? 1 : 0.5,
    },
  }
}

function createForestRenderer() {
  return {
    type: 'unique-value',
    field: 'status',
    defaultSymbol: statusOutlineSymbol('No recent data'),
    uniqueValueInfos: STATUS_ORDER.map((status) => ({
      value: status,
      symbol: statusOutlineSymbol(status),
    })),
  }
}

function colorForIndex(value, breaks, palette) {
  if (value == null || Number.isNaN(Number(value))) return '#9e9e9e'
  const v = Number(value)
  for (let i = 0; i < breaks.length - 1; i++) {
    if (v >= breaks[i] && v < breaks[i + 1]) return palette[i] || palette[palette.length - 1]
  }
  if (v >= breaks[breaks.length - 1]) return palette[palette.length - 1]
  return palette[0]
}

/** Image selection — outline only, no fill, so NDVI/NBR overlays stay visible. */
function imageOutline(hex) {
  const [r, g, b] = hexToRgb(hex)
  return {
    type: 'simple-fill',
    color: [0, 0, 0, 0],
    outline: {
      type: 'simple-line',
      color: [r, g, b, 1],
      width: 1.5,
    },
  }
}

/**
 * Notebook class_colormap(ExtractBand) — classified red→green picture for the
 * published 2-band forest overlay (band 0 = NDVI, band 1 = NBR).
 */
function buildOverlayColormap(bandId, breaks, colors) {
  const ranges = []
  for (let i = 0; i < breaks.length - 1; i++) {
    ranges.push(breaks[i], breaks[i + 1])
  }
  const remap = new RasterFunction({
    functionName: 'Remap',
    functionArguments: {
      InputRanges: ranges,
      OutputValues: Array.from({ length: breaks.length - 1 }, (_, i) => i + 1),
      AllowUnmatched: false,
      Raster: new RasterFunction({
        functionName: 'ExtractBand',
        functionArguments: { BandIDs: [bandId] },
      }),
    },
    outputPixelType: 'u8',
  })
  return new RasterFunction({
    functionName: 'Colormap',
    functionArguments: {
      Raster: remap,
      Colormap: colors.map((hex, i) => {
        const [r, g, b] = hexToRgb(hex)
        return [i + 1, r, g, b]
      }),
    },
  })
}

/** Convert webmap REST renderingRule JSON into an ArcGIS RasterFunction (nested). */
function rasterFunctionFromRule(rule) {
  if (!rule) return null
  if (typeof rule === 'string') {
    try {
      return rasterFunctionFromRule(JSON.parse(rule))
    } catch {
      return null
    }
  }
  if (rule.declaredClass || rule instanceof RasterFunction) return rule
  try {
    return RasterFunction.fromJSON(rule)
  } catch {
    const name = rule.rasterFunction || rule.functionName
    const rawArgs = rule.rasterFunctionArguments || rule.functionArguments || {}
    const functionArguments = {}
    for (const [key, value] of Object.entries(rawArgs)) {
      if (value && typeof value === 'object' && (value.rasterFunction || value.functionName)) {
        functionArguments[key] = rasterFunctionFromRule(value)
      } else if (Array.isArray(value)) {
        functionArguments[key] = value.map((item) =>
          item && typeof item === 'object' && (item.rasterFunction || item.functionName)
            ? rasterFunctionFromRule(item)
            : item,
        )
      } else {
        functionArguments[key] = value
      }
    }
    return new RasterFunction({
      functionName: name,
      functionArguments,
      outputPixelType: rule.outputPixelType,
    })
  }
}

function shortLayerTitle(title) {
  if (/greenness|ndvi overlay/i.test(title)) return 'Greenness overlay, NDVI'
  if (/disturbance|nbr overlay/i.test(title)) return 'Disturbance overlay, NBR'
  if (/natural colour|natural color/i.test(title)) return 'Sentinel-2 natural colour'
  if (/district/i.test(title)) return 'District boundaries'
  if (/sector/i.test(title)) return 'Sector boundaries'
  if (/village/i.test(title)) return 'Village boundaries'
  return title
}

function isAdminBoundaryLayer(title, url = '') {
  return /boundary|Admin_Boundaries|district|sector|village/i.test(`${title} ${url}`)
}

/** Hollow admin outlines — grey lines, no fill. */
function adminHollowRenderer(kind) {
  const styles = {
    district: { color: [158, 158, 158, 0.95], width: 1.3 },
    sector: { color: [180, 180, 180, 0.9], width: 0.8 },
    village: { color: [200, 200, 200, 0.85], width: 0.4 },
  }
  const style = styles[kind] || styles.district
  return {
    type: 'simple',
    symbol: {
      type: 'simple-fill',
      color: [0, 0, 0, 0],
      outline: {
        type: 'simple-line',
        color: style.color,
        width: style.width,
      },
    },
  }
}

function adminKindFromTitle(title) {
  if (/village/i.test(title)) return 'village'
  if (/sector/i.test(title)) return 'sector'
  if (/district/i.test(title)) return 'district'
  return 'district'
}

function layerKindFromTitle(title) {
  if (/greenness|ndvi/i.test(title)) return 'ndvi'
  if (/disturbance|nbr/i.test(title)) return 'nbr'
  if (/district|sector|village|boundary/i.test(title)) return 'admin'
  return 'other'
}

function createForestLayer() {
  return new FeatureLayer({
    title: 'Forests (status outline)',
    listMode: 'show',
    source: [],
    objectIdField: 'OBJECTID',
    geometryType: 'polygon',
    spatialReference: { wkid: 4326 },
    fields: [
      { name: 'OBJECTID', type: 'oid' },
      { name: 'unit_id', type: 'string' },
      { name: 'name', type: 'string' },
      { name: 'status', type: 'string' },
      { name: 'condition', type: 'string' },
      { name: 'ndvi', type: 'double' },
      { name: 'lastObs', type: 'string' },
    ],
    outFields: ['*'],
    renderer: createForestRenderer(),
    popupEnabled: false,
  })
}

function forestToGraphic(forest, objectId) {
  return new Graphic({
    geometry: new Polygon({
      rings: forest.geometry.rings,
      spatialReference: { wkid: 4326 },
    }),
    attributes: {
      OBJECTID: objectId,
      unit_id: forest.unitId,
      name: forest.name,
      status: forest.status,
      condition: forest.condition || '',
      ndvi: forest.ndvi ?? null,
      lastObs: forest.lastObservationDate ? formatDate(forest.lastObservationDate) : '—',
    },
  })
}

async function syncForestLayer(layer, forests) {
  if (!layer) return
  const existing = await layer.queryFeatures({
    where: '1=1',
    returnGeometry: false,
    outFields: ['OBJECTID'],
  })
  const adds = forests
    .filter((f) => f.geometry?.rings)
    .map((f, i) => forestToGraphic(f, i + 1))

  await layer.applyEdits({
    deleteFeatures: existing.features,
    addFeatures: adds,
  })
}

/** Union extent of filtered forests (province / district / status / group / search). */
function extentForForests(forests) {
  let xmin = Infinity
  let ymin = Infinity
  let xmax = -Infinity
  let ymax = -Infinity
  let found = false

  for (const f of forests || []) {
    let e = null
    if (f.geometry?.rings) {
      e = new Polygon({
        rings: f.geometry.rings,
        spatialReference: { wkid: 4326 },
      }).extent
    } else if (f.bxmin != null && f.bxmax != null) {
      e = new Extent({
        xmin: f.bxmin,
        ymin: f.bymin,
        xmax: f.bxmax,
        ymax: f.bymax,
        spatialReference: { wkid: 4326 },
      })
    }
    if (!e) continue
    xmin = Math.min(xmin, e.xmin)
    ymin = Math.min(ymin, e.ymin)
    xmax = Math.max(xmax, e.xmax)
    ymax = Math.max(ymax, e.ymax)
    found = true
  }

  if (!found) return null
  return new Extent({
    xmin,
    ymin,
    xmax,
    ymax,
    spatialReference: { wkid: 4326 },
  })
}

function forestsSignature(forests) {
  return (forests || [])
    .map((f) => f.unitId)
    .sort()
    .join('|')
}

async function safeGoTo(view, target, options) {
  if (!view) return
  try {
    await view.goTo(target, options)
  } catch (err) {
    if (err?.name !== 'AbortError') console.error(err)
  }
}

export default function ForestMap({
  forests,
  selectedId,
  selectedObs = null,
  onSelect,
  filters = null,
  compact = false,
  fill = false,
}) {
  const containerRef = useRef(null)
  const viewRef = useRef(null)
  const forestLayerRef = useRef(null)
  const selectionLayerRef = useRef(null)
  const imageLayerRef = useRef(null)
  const extraLayersRef = useRef([])
  const previousViewpointRef = useRef(null)
  const focusedUnitIdRef = useRef(null)
  const lastImageObsKeyRef = useRef(null)
  const lastFilterZoomKeyRef = useRef(null)
  const focusTokenRef = useRef(0)
  const onSelectRef = useRef(onSelect)
  const forestsRef = useRef(forests)

  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)
  const [basemap, setBasemap] = useState('satellite')
  const [layersOpen, setLayersOpen] = useState(false)
  const [layerState, setLayerState] = useState([])
  const [forestLayerVisible, setForestLayerVisible] = useState(true)
  const [imageMetric, setImageMetric] = useState('ndvi')

  onSelectRef.current = onSelect
  forestsRef.current = forests

  const filterZoomKey = filters
    ? [
        filters.province || '',
        filters.district || '',
        filters.forestGroup || '',
        filters.status || '',
        (filters.search || '').trim().toLowerCase(),
        forestsSignature(forests),
      ].join('::')
    : forestsSignature(forests)

  const hasActiveAreaFilter = Boolean(
    filters?.province ||
      filters?.district ||
      filters?.forestGroup ||
      filters?.status ||
      (filters?.search || '').trim(),
  )

  const clearSelectionVisuals = () => {
    focusTokenRef.current += 1
    selectionLayerRef.current?.removeAll()
    focusedUnitIdRef.current = null
  }

  const clearImageOverlay = () => {
    imageLayerRef.current?.removeAll()
    lastImageObsKeyRef.current = null
  }

  /** Zoom map to the currently filtered forests (or national extent when unfiltered). */
  const zoomToFilteredArea = async ({ animate = true, force = false } = {}) => {
    const view = viewRef.current
    if (!view) return

    const key = filterZoomKey || 'all'
    if (!force && lastFilterZoomKeyRef.current === key) return
    lastFilterZoomKeyRef.current = key

    const list = forestsRef.current || []
    const extent = extentForForests(list)

    // No matches, or full national list with no area/status filters → Rwanda overview.
    if (!extent || list.length === 0 || (!hasActiveAreaFilter && list.length > 3)) {
      await safeGoTo(view, RWANDA, {
        duration: animate ? 750 : 0,
        easing: 'ease-in-out',
      })
      return
    }

    const pad = list.length === 1 ? 1.45 : 1.25
    await safeGoTo(view, extent.expand(pad), {
      duration: animate ? 900 : 0,
      easing: 'ease-in-out',
    })
  }

  const queryForestFeature = async (unitId) => {
    const layer = forestLayerRef.current
    if (!layer || !unitId) return null
    const result = await layer.queryFeatures({
      where: `unit_id = '${escapeSql(unitId)}'`,
      returnGeometry: true,
      outFields: ['*'],
    })
    return result.features?.[0] || null
  }

  const geometryForForest = (forest) => {
    if (forest?.geometry?.rings) {
      return new Polygon({
        rings: forest.geometry.rings,
        spatialReference: { wkid: 4326 },
      })
    }
    if (forest?.bxmin != null) {
      return new Extent({
        xmin: forest.bxmin,
        ymin: forest.bymin,
        xmax: forest.bxmax,
        ymax: forest.bymax,
        spatialReference: { wkid: 4326 },
      })
    }
    return null
  }

  /** Zoom to forest; emphasize with status-coloured outline only (no blue glow). */
  const focusForest = async (unitId, { animate = true } = {}) => {
    const view = viewRef.current
    if (!view || !unitId) return

    if (focusedUnitIdRef.current === unitId && !animate) return

    if (!focusedUnitIdRef.current && !previousViewpointRef.current) {
      previousViewpointRef.current = view.viewpoint?.clone?.() || null
    }

    const token = ++focusTokenRef.current
    const signal = { get cancelled() { return focusTokenRef.current !== token } }

    const forest = forestsRef.current.find((f) => f.unitId === unitId)
    let feature = await queryForestFeature(unitId)
    let geometry = feature?.geometry || geometryForForest(forest)
    if (!geometry || signal.cancelled) return

    selectionLayerRef.current?.removeAll()
    const status = feature?.attributes?.status || forest?.status || 'Pending'
    selectionLayerRef.current?.add(
      new Graphic({
        geometry,
        symbol: statusOutlineSymbol(status, { selected: true }),
      }),
    )

    focusedUnitIdRef.current = unitId

    if (animate) {
      const target = geometry.extent ? geometry.extent.expand(1.35) : geometry
      await safeGoTo(view, { target }, { duration: 900, easing: 'ease-in-out' })
    }
  }

  useEffect(() => {
    let destroyed = false
    let clickHandle
    let pointerHandle

    async function init() {
      if (!containerRef.current || viewRef.current) return
      setError(null)
      try {
        installGisProxy()

        const forestLayer = createForestLayer()
        const selectionLayer = new GraphicsLayer({
          title: 'Selected forest',
          listMode: 'hide',
        })
        const imageLayer = new GraphicsLayer({
          title: 'Selected image',
          listMode: 'hide',
        })
        forestLayerRef.current = forestLayer
        selectionLayerRef.current = selectionLayer
        imageLayerRef.current = imageLayer

        const map = new Map({
          basemap: BASEMAPS.satellite,
          layers: [forestLayer, selectionLayer, imageLayer],
        })

        try {
          const cfg = await getWebMapConfig()
          const extras = []
          for (const layer of cfg.layers || []) {
            if (!layer.url) continue
            const title = layer.title || layer.id
            let lyr = null
            if (layer.layerType === 'ArcGISImageServiceLayer') {
              // Notebook overlays: Colormap(Remap(...)) — without rasterFunction
              // the service returns raw dark pixels instead of red→green classes.
              const isNdviOverlay = /greenness|ndvi overlay/i.test(title)
              const isNbrOverlay = /disturbance|nbr overlay/i.test(title)
              const isOverlay = isNdviOverlay || isNbrOverlay
              const props = {
                url: layer.url,
                title: shortLayerTitle(title),
                opacity: layer.opacity ?? (isOverlay ? 0.95 : 0.9),
                // Keep greenness / disturbance available in the layer list by default.
                visible: isOverlay ? true : Boolean(layer.visibility),
                // Keep notebook zoom gate, but never hide overlays at typical forest zoom.
                minScale: isOverlay ? Math.max(Number(layer.minScale) || 0, 600000) : layer.minScale || 0,
                maxScale: layer.maxScale || 0,
                format: layer.format || 'png32',
                interpolation: 'nearest',
                popupEnabled: false,
                legendEnabled: true,
              }
              if (layer.compressionQuality != null) {
                props.compressionQuality = layer.compressionQuality
              }
              if (layer.renderingRule) {
                props.rasterFunction = rasterFunctionFromRule(layer.renderingRule)
              } else if (isNdviOverlay) {
                props.rasterFunction = buildOverlayColormap(0, NDVI_BREAKS, NDVI_PALETTE)
              } else if (isNbrOverlay) {
                props.rasterFunction = buildOverlayColormap(1, NBR_BREAKS, NBR_PALETTE)
              }
              if (layer.mosaicRule) {
                try {
                  props.mosaicRule = MosaicRule.fromJSON(layer.mosaicRule)
                } catch (mrErr) {
                  console.warn(`Mosaic rule failed for ${title}:`, mrErr.message)
                }
              }
              lyr = new ImageryLayer(props)
              lyr.load().catch((err) => {
                console.warn(`Overlay failed to load (${props.title}):`, err?.message || err)
              })
            } else if (
              layer.layerType === 'ArcGISFeatureLayer' &&
              isAdminBoundaryLayer(title, layer.url || '')
            ) {
              const adminKind = adminKindFromTitle(title)
              // Notebook defaults: district always available; sector/village appear when zoomed in.
              const defaultMinScale =
                adminKind === 'village' ? 90000 : adminKind === 'sector' ? 700000 : 0
              lyr = new FeatureLayer({
                url: layer.url,
                title: shortLayerTitle(title),
                opacity: layer.opacity ?? 1,
                // District boundaries on by default; sector/village follow web map.
                visible: adminKind === 'district' ? true : Boolean(layer.visibility),
                minScale: layer.minScale || defaultMinScale,
                maxScale: layer.maxScale || 0,
                renderer: adminHollowRenderer(adminKind),
                popupEnabled: adminKind !== 'district',
                legendEnabled: true,
                listMode: 'show',
              })
              lyr.load().catch((err) => {
                console.warn(`Admin layer failed (${title}):`, err?.message || err)
              })
            }
            if (lyr) {
              // Keep imagery / admin under status outlines (same order as the ArcGIS dashboard).
              map.add(lyr, 0)
              extras.push(lyr)
            }
          }
          extraLayersRef.current = extras
          if (!destroyed) {
            setLayerState(
              extras.map((l) => ({
                id: l.id,
                title: l.title,
                visible: l.visible,
                kind: layerKindFromTitle(l.title),
              })),
            )
          }
        } catch (layerErr) {
          console.warn('Web map extras unavailable:', layerErr.message)
        }

        const view = new MapView({
          container: containerRef.current,
          map,
          extent: RWANDA,
          constraints: { minZoom: 7, maxZoom: 18 },
          ui: { components: ['zoom'] },
        })

        await view.when()
        if (destroyed) {
          view.destroy()
          return
        }

        viewRef.current = view

        clickHandle = view.on('click', async (event) => {
          const hit = await view.hitTest(event, { include: [forestLayer] })
          const graphic = hit.results?.find((r) => r.layer === forestLayer)?.graphic
          const unitId = graphic?.attributes?.unit_id
          if (unitId) onSelectRef.current?.(unitId)
        })

        pointerHandle = view.on('pointer-move', async (event) => {
          const hit = await view.hitTest(event, { include: [forestLayer] })
          const unitId = hit.results?.find((r) => r.layer === forestLayer)?.graphic?.attributes?.unit_id
          view.container.style.cursor = unitId ? 'pointer' : 'default'
        })

        setReady(true)
      } catch (err) {
        if (!destroyed) setError(err.message || 'Failed to load map')
      }
    }

    init()
    return () => {
      destroyed = true
      focusTokenRef.current += 1
      clickHandle?.remove()
      pointerHandle?.remove()
      forestLayerRef.current = null
      selectionLayerRef.current = null
      imageLayerRef.current = null
      viewRef.current?.destroy()
      viewRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const view = viewRef.current
    if (!view?.map) return
    view.map.basemap = BASEMAPS[basemap] || BASEMAPS.satellite
  }, [basemap])

  useEffect(() => {
    if (!ready || !forestLayerRef.current) return
    let cancelled = false

    ;(async () => {
      await syncForestLayer(forestLayerRef.current, forests)
      if (cancelled) return
      if (selectedId && !selectedObs) {
        focusedUnitIdRef.current = null
        await focusForest(selectedId, { animate: false })
        return
      }
      if (!selectedId && !selectedObs) {
        await zoomToFilteredArea({ animate: true })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [forests, ready, filterZoomKey]) // eslint-disable-line react-hooks/exhaustive-deps

  /** Forest focus — skipped while an image is driving the map. */
  useEffect(() => {
    if (!ready) return
    if (selectedObs) return
    let cancelled = false

    ;(async () => {
      if (!selectedId) {
        // Always reset the map when leaving a forest — including after image mode,
        // which clears focusedUnitIdRef and would otherwise skip the zoom.
        clearSelectionVisuals()
        clearImageOverlay()
        previousViewpointRef.current = null
        lastFilterZoomKeyRef.current = null
        await zoomToFilteredArea({ animate: true, force: true })
        return
      }
      if (cancelled) return
      // Leaving image mode for a still-selected forest: drop overlay and refocus.
      clearImageOverlay()
      await focusForest(selectedId, { animate: true })
    })()

    return () => {
      cancelled = true
    }
  }, [selectedId, ready, selectedObs]) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Image click: reset map focus and draw the observation footprint coloured by NDVI/NBR,
   * even when a forest remains selected on the left.
   */
  useEffect(() => {
    if (!ready) return
    const layer = imageLayerRef.current
    const view = viewRef.current
    if (!layer) return

    if (!selectedObs?.unitId) {
      clearImageOverlay()
      return
    }

    const forest =
      forestsRef.current.find((f) => f.unitId === selectedObs.unitId) ||
      forests.find((f) => f.unitId === selectedObs.unitId)
    if (!forest?.geometry?.rings) return

    // Leave forest outline alone; image overlay takes visual priority.
    selectionLayerRef.current?.removeAll()
    focusedUnitIdRef.current = null

    const value = imageMetric === 'nbr' ? selectedObs.nbr : selectedObs.ndvi
    const breaks = imageMetric === 'nbr' ? NBR_BREAKS : NDVI_BREAKS
    const palette = imageMetric === 'nbr' ? NBR_PALETTE : NDVI_PALETTE
    const fill = colorForIndex(value, breaks, palette)
    const geometry = new Polygon({
      rings: forest.geometry.rings,
      spatialReference: { wkid: 4326 },
    })

    layer.removeAll()
    layer.add(
      new Graphic({
        geometry,
        symbol: imageOutline(fill),
        attributes: {
          unitId: forest.unitId,
          name: forest.name,
          value,
          metric: imageMetric,
        },
      }),
    )

    const obsKey = `${selectedObs.id || `${selectedObs.unitId}-${selectedObs.obsDate}`}-${imageMetric}`
    if (view && geometry.extent && lastImageObsKeyRef.current !== obsKey) {
      lastImageObsKeyRef.current = obsKey
      previousViewpointRef.current = previousViewpointRef.current || view.viewpoint?.clone?.() || null
      safeGoTo(view, { target: geometry.extent.expand(1.4) }, { duration: 900, easing: 'ease-in-out' })
    }
  }, [selectedObs, forests, ready, imageMetric])

  const goHome = () => {
    clearSelectionVisuals()
    clearImageOverlay()
    previousViewpointRef.current = null
    // Prevent the filter-zoom effect from overriding this national overview.
    lastFilterZoomKeyRef.current = filterZoomKey
    // Clears left forest selection and any active image overlay in App.
    onSelectRef.current?.(null)
    safeGoTo(viewRef.current, RWANDA, { duration: 750, easing: 'ease-in-out' })
  }

  const toggleFullscreen = () => {
    const el = containerRef.current?.parentElement
    if (!el) return
    if (document.fullscreenElement) document.exitFullscreen()
    else el.requestFullscreen?.()
  }

  const toggleForestLayer = () => {
    const lyr = forestLayerRef.current
    if (!lyr) return
    lyr.visible = !lyr.visible
    setForestLayerVisible(lyr.visible)
  }

  const toggleLayer = (id) => {
    const lyr = extraLayersRef.current.find((l) => l.id === id)
    if (!lyr) return
    lyr.visible = !lyr.visible
    setLayerState((prev) => prev.map((l) => (l.id === id ? { ...l, visible: lyr.visible } : l)))
  }

  const selected = forests.find((f) => f.unitId === selectedId)
  const imageForest = selectedObs
    ? forests.find((f) => f.unitId === selectedObs.unitId)
    : null
  const imageValue =
    selectedObs == null ? null : imageMetric === 'nbr' ? selectedObs.nbr : selectedObs.ndvi
  const legendPalette = imageMetric === 'nbr' ? NBR_PALETTE : NDVI_PALETTE

  const mapHeight = fill
    ? 'min-h-0 flex-1'
    : compact
      ? 'h-[min(360px,calc(100dvh-22rem))] md:h-[min(440px,calc(100dvh-20rem))]'
      : 'h-[min(420px,calc(100dvh-16.5rem))] md:h-[min(520px,calc(100dvh-14.5rem))]'

  return (
    <div className={`forest-map surface relative overflow-hidden p-0 ${mapHeight}`}>
      <div ref={containerRef} className="h-full w-full" />

      {!ready && !error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface)]/75 text-sm muted">
          Loading map…
        </div>
      ) : null}

      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface)] p-4 text-center text-sm text-[var(--danger)]">
          {error}
        </div>
      ) : null}

      <div className="absolute top-2 left-2 z-20 flex flex-wrap gap-1.5">
        {selectedObs
          ? [
              { id: 'ndvi', label: 'NDVI' },
              { id: 'nbr', label: 'NBR' },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setImageMetric(opt.id)}
                className={`rounded-lg px-2 py-1 text-[11px] font-medium shadow ${
                  imageMetric === opt.id
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--map-control)] text-[var(--text)]'
                }`}
              >
                {opt.label}
              </button>
            ))
          : Object.keys(BASEMAPS).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setBasemap(key)}
                className={`rounded-lg px-2 py-1 text-[11px] font-medium capitalize shadow ${
                  basemap === key
                    ? 'bg-[var(--primary)] text-white'
                    : 'bg-[var(--map-control)] text-[var(--text)]'
                }`}
              >
                {key}
              </button>
            ))}
      </div>

      <div className="absolute top-2 right-2 z-20 flex flex-col items-end gap-1.5">
        <button
          type="button"
          onClick={goHome}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--map-control)] shadow"
          aria-label="Zoom to Rwanda"
        >
          <Home className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={toggleFullscreen}
          className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--map-control)] shadow"
          aria-label="Fullscreen map"
        >
          <Maximize2 className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setLayersOpen((v) => !v)}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg shadow ${
            layersOpen
              ? 'bg-[var(--primary)] text-white'
              : 'bg-[var(--map-control)] text-[var(--text)]'
          }`}
          aria-label="Layers"
          aria-expanded={layersOpen}
        >
          <Layers className="h-3.5 w-3.5" />
        </button>
        {layersOpen ? (
          <div className="max-h-[min(16rem,42dvh)] w-56 shrink-0 overflow-y-auto rounded-xl bg-[var(--map-control)] p-2.5 text-left text-[11px] shadow-lg">
            <div className="mb-1.5 font-semibold">Layers</div>
            <label className="mb-1.5 flex items-start gap-2">
              <input
                type="checkbox"
                checked={forestLayerVisible}
                onChange={toggleForestLayer}
                className="mt-0.5"
              />
              <span className="leading-snug">Forests (status outline)</span>
            </label>
            {layerState.map((l) => (
              <label key={l.id} className="mb-1.5 flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={l.visible}
                  onChange={() => toggleLayer(l.id)}
                  className="mt-0.5"
                />
                <span className="leading-snug">
                  <span className="block">{l.title}</span>
                  {l.kind === 'ndvi' ? (
                    <span className="muted">red = bare, green = dense — zoom in to see it</span>
                  ) : null}
                  {l.kind === 'nbr' ? (
                    <span className="muted">red = burnt or cleared — zoom in to see it</span>
                  ) : null}
                  {l.kind === 'admin' && /sector/i.test(l.title) ? (
                    <span className="muted">shows when zoomed in</span>
                  ) : null}
                  {l.kind === 'admin' && /village/i.test(l.title) ? (
                    <span className="muted">shows when zoomed further in</span>
                  ) : null}
                </span>
              </label>
            ))}
            <div className="mt-2 border-t border-[var(--border)] pt-2">
              <div className="mb-1 font-semibold">Status colours</div>
              {Object.entries(STATUS_COLORS).map(([status, color]) => (
                <div key={status} className="mb-0.5 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-sm" style={{ background: color }} />
                  {status}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="pointer-events-none absolute inset-x-2 bottom-7 z-10 flex items-end justify-between gap-2">
        {selectedObs ? (
          <div className="pointer-events-auto max-w-[200px] rounded-md bg-[var(--map-control)]/95 px-2 py-1.5 text-[10px] shadow-sm backdrop-blur-sm">
            <div className="mb-1 flex items-center justify-between gap-2 font-medium">
              <span>{imageMetric.toUpperCase()}</span>
              <span className="muted">low → high</span>
            </div>
            <div className="flex h-1.5 overflow-hidden rounded-full">
              {legendPalette.map((c, i) => (
                <div key={`${c}-${i}`} className="flex-1" style={{ background: c }} />
              ))}
            </div>
          </div>
        ) : (
          <div />
        )}

        <div className="pointer-events-auto max-w-[240px] rounded-md bg-[var(--map-control)]/95 px-2.5 py-1.5 text-[10px] shadow-sm backdrop-blur-sm">
          {selectedObs ? (
            <div className="leading-snug">
              <div className="truncate font-semibold">
                {selectedObs.forestName || imageForest?.name}
              </div>
              <div className="muted">
                {formatDate(selectedObs.obsDate)} · {imageMetric.toUpperCase()}{' '}
                {formatNumber(imageValue, 3)}
                {selectedObs.quality === 'Cloudy' ? (
                  <span className="text-[var(--amber)]"> · Cloudy</span>
                ) : null}
              </div>
            </div>
          ) : selected ? (
            <div className="leading-snug">
              <div className="truncate font-semibold">{selected.name}</div>
              <div className="muted">
                {selected.status} · NDVI {formatNumber(selected.ndvi, 2)} ·{' '}
                {formatDate(selected.lastObservationDate)}
              </div>
            </div>
          ) : (
            <div className="muted">Select a forest or image</div>
          )}
        </div>
      </div>
    </div>
  )
}
