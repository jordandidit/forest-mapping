import { useEffect, useRef, useState } from 'react'
import Map from '@arcgis/core/Map'
import MapView from '@arcgis/core/views/MapView'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer'
import Graphic from '@arcgis/core/Graphic'
import Polygon from '@arcgis/core/geometry/Polygon'
import Extent from '@arcgis/core/geometry/Extent'
import { Home } from 'lucide-react'
import {
  NDVI_BREAKS,
  NDVI_PALETTE,
  NBR_BREAKS,
  NBR_PALETTE,
  STATUS_COLORS,
} from '../../constants/status'
import { formatDate } from '../../utils/date'
import { formatNumber } from '../../utils/format'

const RWANDA = new Extent({
  xmin: 28.85,
  ymin: -2.85,
  xmax: 30.9,
  ymax: -1.05,
  spatialReference: { wkid: 4326 },
})

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

/** Map index value to notebook colormap class colour (same breaks as IndexGuide overlays). */
function colorForIndex(value, breaks, palette) {
  if (value == null || Number.isNaN(Number(value))) return '#9e9e9e'
  const v = Number(value)
  for (let i = 0; i < breaks.length - 1; i++) {
    if (v >= breaks[i] && v < breaks[i + 1]) return palette[i] || palette[palette.length - 1]
  }
  if (v >= breaks[breaks.length - 1]) return palette[palette.length - 1]
  return palette[0]
}

function mutedOutline(status) {
  const color = STATUS_COLORS[status] || '#9e9e9e'
  const [r, g, b] = hexToRgb(color)
  return {
    type: 'simple-fill',
    color: [r, g, b, 0.04],
    outline: {
      type: 'simple-line',
      color: [r, g, b, 0.55],
      width: 1,
    },
  }
}

function imageFill(hex) {
  const [r, g, b] = hexToRgb(hex)
  return {
    type: 'simple-fill',
    color: [r, g, b, 0.82],
    outline: {
      type: 'simple-line',
      color: [r, g, b, 1],
      width: 1.5,
    },
  }
}

export default function ObservationMap({ forests, selectedObs, isDark, compact = false }) {
  const containerRef = useRef(null)
  const viewRef = useRef(null)
  const unitsLayerRef = useRef(null)
  const imageLayerRef = useRef(null)
  const lastZoomedObsIdRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)
  const [metric, setMetric] = useState('ndvi')

  useEffect(() => {
    let destroyed = false

    async function init() {
      if (!containerRef.current || viewRef.current) return
      setError(null)
      try {
        const unitsLayer = new GraphicsLayer({ title: 'Forests', listMode: 'hide' })
        const imageLayer = new GraphicsLayer({ title: 'Selected image', listMode: 'hide' })
        unitsLayerRef.current = unitsLayer
        imageLayerRef.current = imageLayer

        const map = new Map({
          basemap: 'satellite',
          layers: [unitsLayer, imageLayer],
        })

        const view = new MapView({
          container: containerRef.current,
          map,
          extent: RWANDA,
          constraints: { minZoom: 7, maxZoom: 16 },
          ui: { components: ['zoom'] },
        })

        await view.when()
        if (destroyed) {
          view.destroy()
          return
        }
        viewRef.current = view
        setReady(true)
      } catch (err) {
        if (!destroyed) setError(err.message || 'Failed to load observation map')
      }
    }

    init()
    return () => {
      destroyed = true
      viewRef.current?.destroy()
      viewRef.current = null
      unitsLayerRef.current = null
      imageLayerRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const view = viewRef.current
    if (!view?.map) return
    view.map.basemap = 'satellite'
  }, [])

  // Context outlines for all forests (national view, like the ArcGIS dashboard)
  useEffect(() => {
    const layer = unitsLayerRef.current
    if (!layer) return
    layer.removeAll()
    const selectedId = selectedObs?.unitId
    const graphics = (forests || [])
      .filter((f) => f.geometry?.rings && f.unitId !== selectedId)
      .map(
        (f) =>
          new Graphic({
            geometry: new Polygon({
              rings: f.geometry.rings,
              spatialReference: { wkid: 4326 },
            }),
            symbol: mutedOutline(f.status),
            attributes: { unitId: f.unitId, name: f.name },
          }),
      )
    layer.addMany(graphics)
  }, [forests, selectedObs?.unitId])

  // Draw the clicked observation as a coloured forest footprint and zoom to it
  useEffect(() => {
    const layer = imageLayerRef.current
    const view = viewRef.current
    if (!layer) return
    layer.removeAll()

    if (!selectedObs?.unitId) {
      lastZoomedObsIdRef.current = null
      return
    }
    const forest = (forests || []).find((f) => f.unitId === selectedObs.unitId)
    if (!forest?.geometry?.rings) return

    const value = metric === 'nbr' ? selectedObs.nbr : selectedObs.ndvi
    const breaks = metric === 'nbr' ? NBR_BREAKS : NDVI_BREAKS
    const palette = metric === 'nbr' ? NBR_PALETTE : NDVI_PALETTE
    const fill = colorForIndex(value, breaks, palette)

    const geometry = new Polygon({
      rings: forest.geometry.rings,
      spatialReference: { wkid: 4326 },
    })

    layer.add(
      new Graphic({
        geometry,
        symbol: imageFill(fill),
        attributes: {
          unitId: forest.unitId,
          name: forest.name,
          value,
          metric,
        },
      }),
    )

    const obsKey = selectedObs.id || `${selectedObs.unitId}-${selectedObs.obsDate}`
    if (view && geometry.extent && lastZoomedObsIdRef.current !== obsKey) {
      lastZoomedObsIdRef.current = obsKey
      view
        .goTo({ target: geometry.extent.expand(1.4) }, { duration: 900, easing: 'ease-in-out' })
        .catch((err) => {
          if (err?.name !== 'AbortError') console.error(err)
        })
    }
  }, [selectedObs, forests, metric])

  const goHome = () => viewRef.current?.goTo(RWANDA).catch(() => {})

  const legendPalette = metric === 'nbr' ? NBR_PALETTE : NDVI_PALETTE
  const legendLabel = metric === 'nbr' ? 'NBR' : 'NDVI'
  const selectedValue =
    selectedObs == null ? null : metric === 'nbr' ? selectedObs.nbr : selectedObs.ndvi

  const mapHeight = compact
    ? 'h-[min(300px,40dvh)] md:h-[min(340px,42dvh)]'
    : 'h-[420px] md:h-[480px]'

  return (
    <div className={`surface relative overflow-hidden p-0 ${mapHeight}`}>
      <div ref={containerRef} className="h-full w-full" />

      {!ready && !error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface)]/75 text-sm muted">
          Loading observation map…
        </div>
      ) : null}

      {error ? (
        <div className="absolute inset-0 flex items-center justify-center bg-[var(--surface)] p-4 text-center text-sm text-[var(--danger)]">
          {error}
        </div>
      ) : null}

      <div className="absolute top-2 left-2 z-10 flex flex-wrap gap-1.5">
        {[
          { id: 'ndvi', label: 'NDVI' },
          { id: 'nbr', label: 'NBR' },
        ].map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setMetric(opt.id)}
            className={`rounded-lg px-2.5 py-1 text-[11px] font-medium shadow ${
              metric === opt.id
                ? 'bg-[var(--primary)] text-white'
                : 'bg-[var(--map-control)] text-[var(--text)]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={goHome}
        className="absolute top-2 right-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--map-control)] shadow"
        aria-label="Reset to Rwanda view"
      >
        <Home className="h-3.5 w-3.5" />
      </button>

      {/* Lifted above Esri attribution bar */}
      <div className="pointer-events-none absolute inset-x-2 bottom-7 z-10 flex items-end justify-between gap-2">
        <div className="pointer-events-auto max-w-[200px] rounded-md bg-[var(--map-control)]/95 px-2 py-1.5 text-[10px] shadow-sm backdrop-blur-sm">
          <div className="mb-1 flex items-center justify-between gap-2 font-medium">
            <span>{legendLabel}</span>
            <span className="muted">low → high</span>
          </div>
          <div className="flex h-1.5 overflow-hidden rounded-full">
            {legendPalette.map((c, i) => (
              <div key={`${c}-${i}`} className="flex-1" style={{ background: c }} />
            ))}
          </div>
        </div>

        <div className="pointer-events-auto max-w-[240px] rounded-md bg-[var(--map-control)]/95 px-2.5 py-1.5 text-[10px] shadow-sm backdrop-blur-sm">
          {selectedObs ? (
            <div className="leading-snug">
              <div className="truncate font-semibold">{selectedObs.forestName}</div>
              <div className="muted">
                {formatDate(selectedObs.obsDate)} · {legendLabel} {formatNumber(selectedValue, 3)}
                {selectedObs.quality === 'Cloudy' ? (
                  <span className="text-[var(--amber)]"> · Cloudy</span>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="muted">Select an image to draw it here</div>
          )}
        </div>
      </div>
    </div>
  )
}
