import { useEffect, useRef, useState } from 'react'
import esriConfig from '@arcgis/core/config.js'
import { watch } from '@arcgis/core/core/reactiveUtils.js'
import type WebMap from '@arcgis/core/WebMap.js'
import MapView from '@arcgis/core/views/MapView.js'
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer.js'
import Graphic from '@arcgis/core/Graphic.js'
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol.js'
import SimpleLineSymbol from '@arcgis/core/symbols/SimpleLineSymbol.js'
import '@arcgis/core/assets/esri/themes/dark/main.css'

import { getArcgisPortalUrl } from '@/data/arcgis/config'
import { useAuthStore } from '@/features/auth/store/auth.store'
import { LAKE_FOCUS_PADDING } from '@/features/map/arcgis/constants'
import { loadProductionWebMap } from '@/features/map/arcgis/load-production-webmap'
import {
  extentFromGeometryOrBounds,
  polygonFromGeoJson,
} from '@/features/map/arcgis/geometry'
import {
  applyLayerListPolicy,
  getLayerUrl,
  isProvincesLayer,
  isUserToggleableLayer,
  resolveProductionLayers,
  setHistoricalWaterQualityRasters,
  setWaterMapMode,
  type ResolvedProductionLayers,
} from '@/features/map/arcgis/layer-resolver'
import { buildLegendFromLayer } from '@/features/map/arcgis/legend-from-layer'
import { buildReferenceLayerRows, type ReferenceLayerKey } from '@/features/map/arcgis/layer-inventory'
import {
  classifyLoadError,
  mapError,
  sanitizeErrorMessage,
} from '@/features/map/arcgis/map-errors'
import {
  cloneMosaicRule,
  imageServiceRasterCount,
  mosaicRuleFromSpec,
} from '@/features/map/arcgis/apply-sentinel-mosaic'
import { reconcileActiveRaster } from '@/features/map/arcgis/raster-reconciliation'
import { LakeMapDateStack } from '@/features/map/components/MapDateContext'
import {
  SATELLITE_SCENE_UNAVAILABLE,
  rasterModeAvailability,
  resolveSentinelMosaic,
  unavailableSentinelMosaic,
} from '@/features/map/historical-sentinel'
import { selectObservation } from '@/features/observations/history'
import type ImageryLayer from '@arcgis/core/layers/ImageryLayer.js'
import { MapStatusOverlay } from '@/features/map/components/MapStatusOverlay'
import { ProductionLegend } from '@/features/map/components/ProductionLegend'
import { MapLayersPanel } from '@/features/map/components/MapLayersPanel'
import {
  isSupportedWaterMapLayer,
  mapLayerIdToWaterMapMode,
  waterMapModeToMapLayerId,
  WATER_MAP_MODE_OPTIONS,
} from '@/features/map/water-map-modes'
import type {
  ActiveRasterMeta,
  ArcGISLakeMapProps,
  MapErrorState,
  MapLegendModel,
  MapLoadPhase,
  WaterMapMode,
} from '@/features/map/types'
import { MapZoomControls } from '@/features/lakes/components/MapToolbar'
import { cn } from '@/lib/cn'

const SELECTION_LAYER_ID = 'app-lake-selection'

interface RemovableHandle {
  remove: () => void
}

interface RuntimeHandles {
  view: MapView
  webmap: WebMap
  resolved: ResolvedProductionLayers
  selectionLayer: GraphicsLayer
  handles: RemovableHandle[]
}

const REFERENCE_LAYER_KEYS: ReferenceLayerKey[] = [
  'waterBodies',
  'districts',
  'sectors',
  'provinces',
]

export function ArcGISLakeMap({
  lakeId,
  lakeName,
  province: _province,
  country: _country,
  geometry,
  bounds,
  center,
  layer,
  onLayerChange,
  latestSceneDate,
  latestSceneQuality,
  latestSceneCloud,
  latestValidDate,
  dateSelection = null,
  activeRaster,
  rasterLoading,
  rasterError,
}: ArcGISLakeMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const runtimeRef = useRef<RuntimeHandles | null>(null)
  const productionMosaicRef = useRef<ImageryLayer['mosaicRule'] | null>(null)
  const productionMosaicCapturedRef = useRef(false)
  const authStatus = useAuthStore((s) => s.status)

  const [phase, setPhase] = useState<MapLoadPhase>('initializing')
  const [error, setError] = useState<MapErrorState | null>(null)
  const [legend, setLegend] = useState<MapLegendModel | null>(null)
  const [rasterMeta, setRasterMeta] = useState<ActiveRasterMeta | null>(null)
  const [viewReady, setViewReady] = useState(false)
  const [satelliteSceneUnavailable, setSatelliteSceneUnavailable] = useState(false)
  const [referenceVisibility, setReferenceVisibility] = useState<
    Partial<Record<ReferenceLayerKey, boolean>>
  >({})
  const [unavailableReferenceLayers, setUnavailableReferenceLayers] = useState<
    Partial<Record<ReferenceLayerKey, string>>
  >({})

  const inspectedObservation = dateSelection
    ? selectObservation(dateSelection.observations, dateSelection.selectedObservationId)
    : null
  const historicalObservation = inspectedObservation != null
  const sceneKey = inspectedObservation
    ? [
        inspectedObservation.id,
        inspectedObservation.acquisitionDay ?? '',
        inspectedObservation.date,
        (inspectedObservation.tiles ?? []).join(','),
      ].join('|')
    : 'latest'
  const mode = mapLayerIdToWaterMapMode(layer)
  const unsupportedMessage =
    mode === null
      ? 'This layer is not on the production Web Map. Choose Satellite, Turbidity, or Chlorophyll.'
      : null

  // Create MapView once per mount
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    if (authStatus !== 'authenticated') {
      setPhase('error')
      setError(mapError('AUTH_REQUIRED', 'Sign in to load the production lake map.'))
      return
    }

    let cancelled = false
    const handles: RemovableHandle[] = []

    async function init() {
      setPhase('initializing')
      setError(null)

      try {
        const host = containerRef.current
        if (!host) {
          throw new Error('Map container is not mounted.')
        }
        // Avoid creating MapView in a zero-size (CSS-hidden) container.
        await waitForNonZeroSize(host)
        if (cancelled) return

        setPhase('loading_webmap')

        // Keep Enterprise portalUrl (never fall back to www.arcgis.com).
        esriConfig.portalUrl = getArcgisPortalUrl()

        const webmap = await loadProductionWebMap()
        if (cancelled) {
          return
        }

        const view = new MapView({
          container: host,
          map: webmap,
          constraints: { rotationEnabled: false },
          ui: {
            components: [],
          },
        })

        await view.when()
        if (cancelled) {
          view.destroy()
          return
        }

        // Disable popup domination (React right panel is the info surface)
        view.popupEnabled = false
        if (view.popup) {
          view.popup.dockEnabled = false
          ;(view.popup as { autoOpenEnabled?: boolean }).autoOpenEnabled = false
        }

        // Suppress broken optional Provinces layer; disable layer popups
        for (const lyr of webmap.allLayers.toArray()) {
          if ('popupEnabled' in lyr) {
            ;(lyr as { popupEnabled: boolean }).popupEnabled = false
          }

          if (isProvincesLayer(lyr)) {
            const markProvincesUnavailable = () => {
              lyr.visible = false
              lyr.listMode = 'hide'
              setUnavailableReferenceLayers((prev) => ({
                ...prev,
                provinces: 'Provinces layer is unavailable in production.',
              }))
              setError((prev) =>
                prev?.fatal
                  ? prev
                  : mapError(
                      'BROKEN_OPTIONAL_LAYER',
                      'Provinces layer is unavailable in production and was skipped.',
                      false,
                    ),
              )
            }

            const failHandle = lyr.on('layerview-create-error', () => {
              console.warn(
                '[WATER-DATA-02B] Optional Provinces layer unavailable (service 404). Continuing without it.',
              )
              markProvincesUnavailable()
            })
            handles.push(failHandle)

            lyr.load().catch(() => {
              console.warn(
                '[WATER-DATA-02B] Optional Provinces layer failed to load; suppressed.',
              )
              markProvincesUnavailable()
            })
          }
        }

        const selectionLayer = new GraphicsLayer({
          id: SELECTION_LAYER_ID,
          title: 'Selected lake',
          listMode: 'hide',
        })
        webmap.add(selectionLayer)

        const resolved = resolveProductionLayers(webmap.allLayers.toArray())
        applyLayerListPolicy(webmap.allLayers.toArray(), resolved)

        if (resolved.unresolvedTitles.length) {
          // The Layers panel only lists known keys; an unmatched title means the Web Map
          // gained a layer that isn't wired into layer-inventory.ts yet.
          console.warn(
            '[WATER-DATA-02B] Web Map layers not recognized by the layer resolver:',
            resolved.unresolvedTitles,
          )
        }

        setPhase('loading_raster')

        // Active raster may arrive asynchronously; reconcile when available below.
        runtimeRef.current = {
          view,
          webmap,
          resolved,
          selectionLayer,
          handles,
        }

        if (!cancelled) {
          setViewReady(true)
          setPhase('ready')
        }
      } catch (err) {
        if (!cancelled) {
          const classified = classifyLoadError(err)
          console.warn('[WATER-DATA-02B] Map initialization failed:', classified.message)
          setPhase('error')
          setError(classified)
        }
      }
    }

    void init()

    return () => {
      cancelled = true
      const runtime = runtimeRef.current
      runtimeRef.current = null
      if (runtime) {
        for (const handle of runtime.handles) {
          try {
            handle.remove()
          } catch {
            /* ignore */
          }
        }
        runtime.view.destroy()
      }
      setViewReady(false)
      productionMosaicRef.current = null
      productionMosaicCapturedRef.current = false
    }
    // Mount once for authenticated session; lake focus updates in separate effects.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authStatus])

  // Reconcile RasterRegistry when active raster / view ready
  useEffect(() => {
    const runtime = runtimeRef.current
    if (!viewReady || !runtime) return

    let cancelled = false

    async function runReconcile() {
      if (rasterLoading) {
        setPhase((p) => (p === 'ready' ? 'loading_raster' : p))
        return
      }

      if (rasterError) {
        setError(
          mapError(
            'IMAGESERVER_UNAVAILABLE',
            sanitizeErrorMessage(rasterError),
            true,
          ),
        )
        setPhase('error')
        return
      }

      setPhase('loading_raster')
      try {
        const { result, resolved } = await reconcileActiveRaster(
          runtime!.webmap,
          runtime!.resolved,
          activeRaster,
        )
        if (cancelled) return

        runtime!.resolved = resolved
        // Replaced overlay layers come back listable; keep them out of the layer list.
        applyLayerListPolicy(runtime!.webmap.allLayers.toArray(), resolved)

        if (result.status === 'no_active_raster') {
          setError(
            mapError(
              'RASTER_REGISTRY_MISMATCH',
              'No active water_overlay record in RasterRegistry.',
              true,
            ),
          )
          setPhase('error')
          setRasterMeta(null)
          return
        }

        if (result.status === 'mismatch') {
          setError(
            mapError(
              'RASTER_REGISTRY_MISMATCH',
              `Active raster differs from the Web Map and could not be reconciled safely. ${result.reason}`,
              true,
            ),
          )
          setPhase('error')
          setRasterMeta(
            activeRaster
              ? {
                  title: activeRaster.title,
                  label: activeRaster.label,
                  acquisitionDay: activeRaster.acquisitionDay,
                  cellSizeMeters: activeRaster.cellSizeMeters,
                  itemId: activeRaster.itemId,
                  url: activeRaster.url,
                  reconciled: false,
                }
              : null,
          )
          return
        }

        if (activeRaster) {
          setRasterMeta({
            title: activeRaster.title,
            label: activeRaster.label,
            acquisitionDay: activeRaster.acquisitionDay,
            cellSizeMeters: activeRaster.cellSizeMeters,
            itemId: activeRaster.itemId,
            url: activeRaster.url,
            reconciled: result.status === 'match' || result.status === 'updated',
          })
        }

        setError((prev) => (prev?.code === 'BROKEN_OPTIONAL_LAYER' ? prev : null))
        setPhase('ready')
      } catch (err) {
        if (!cancelled) {
          setPhase('error')
          setError(classifyLoadError(err))
        }
      }
    }

    void runReconcile()
    return () => {
      cancelled = true
    }
  }, [viewReady, activeRaster, rasterLoading, rasterError])

  // Apply mode visibility + legend
  useEffect(() => {
    const runtime = runtimeRef.current
    if (!viewReady || !runtime || !mode) {
      setLegend(null)
      return
    }

    setWaterMapMode(runtime.resolved, mode)
    const locked = setHistoricalWaterQualityRasters(runtime.resolved, historicalObservation)
    const stops = historicalObservation
      ? locked.map((layer) =>
          watch(
            () => layer.visible,
            (visible) => {
              if (visible) layer.visible = false
            },
          ),
        )
      : []

    const key =
      mode === 'satellite'
        ? 'sentinelNatural'
        : mode === 'turbidity'
          ? 'turbidityPerLake'
          : 'chlorophyllPerLake'

    const scientific = runtime.resolved.byKey[key] ?? null
    setLegend(buildLegendFromLayer(mode, scientific))
    return () => {
      for (const stop of stops) stop.remove()
    }
  }, [viewReady, mode, rasterMeta, historicalObservation])

  // Track boundary layer visibility for the Layers panel.
  // Re-run after raster reconciliation, which may replace layer instances.
  useEffect(() => {
    const runtime = runtimeRef.current
    if (!viewReady || !runtime) return

    const stops: RemovableHandle[] = []

    for (const key of REFERENCE_LAYER_KEYS) {
      const layer = runtime.resolved.byKey[key]
      if (!layer) continue

      setReferenceVisibility((prev) => ({ ...prev, [key]: layer.visible }))
      stops.push(
        watch(
          () => layer.visible,
          (visible) => setReferenceVisibility((prev) => ({ ...prev, [key]: visible }))
        ),
      )
    }

    return () => {
      for (const stop of stops) stop.remove()
    }
  }, [viewReady, rasterMeta])

  // Latest keeps the Web Map mosaic rule. A selected observation replaces it for that day only.
  useEffect(() => {
    const runtime = runtimeRef.current
    if (!viewReady || !runtime) return

    const sentinel = sentinelImagery(runtime)
    if (!sentinel) return

    if (!productionMosaicCapturedRef.current) {
      productionMosaicRef.current = cloneMosaicRule(sentinel.mosaicRule)
      productionMosaicCapturedRef.current = true
    }

    const production = productionMosaicRef.current
    const choice = resolveSentinelMosaic(production?.where ?? null, inspectedObservation)

    if (choice.status === 'production') {
      const restored = production ? cloneMosaicRule(production) : null
      if (restored) sentinel.mosaicRule = restored
      setSatelliteSceneUnavailable(false)
      return
    }

    let cancelled = false
    const serviceUrl = getLayerUrl(sentinel)

    if (choice.status === 'unavailable' || !serviceUrl) {
      sentinel.mosaicRule = mosaicRuleFromSpec(
        unavailableSentinelMosaic(inspectedObservation ? inspectedObservation.date : null),
        production,
      )
      setSatelliteSceneUnavailable(true)
      return
    }

    const spec = choice.spec

    async function applyScene() {
      sentinel!.mosaicRule = mosaicRuleFromSpec(spec, production)
      try {
        const count = await imageServiceRasterCount(serviceUrl!, spec.where)
        if (cancelled) return
        if (count > 0) {
          setSatelliteSceneUnavailable(false)
          return
        }
        sentinel!.mosaicRule = mosaicRuleFromSpec(
          unavailableSentinelMosaic(spec.sortValue.replaceAll('/', '-')),
          production,
        )
        setSatelliteSceneUnavailable(true)
      } catch {
        if (cancelled) return
        sentinel!.mosaicRule = mosaicRuleFromSpec(
          unavailableSentinelMosaic(spec.sortValue.replaceAll('/', '-')),
          production,
        )
        setSatelliteSceneUnavailable(true)
      }
    }

    void applyScene()
    return () => {
      cancelled = true
    }
  }, [viewReady, sceneKey])

  // Focus selected lake + selection outline
  useEffect(() => {
    const runtime = runtimeRef.current
    if (!viewReady || !runtime) return

    let cancelled = false

    async function focusLake() {
      const { view, selectionLayer } = runtime!

      selectionLayer.removeAll()

      const polygon = geometry ? polygonFromGeoJson(geometry) : null
      if (polygon) {
        selectionLayer.add(
          new Graphic({
            geometry: polygon,
            symbol: new SimpleFillSymbol({
              color: [0, 0, 0, 0],
              outline: new SimpleLineSymbol({
                color: [243, 246, 251, 0.8],
                width: 1,
              }),
            }),
          }),
        )
      }

      const target = extentFromGeometryOrBounds(geometry, bounds)
      try {
        await view.goTo({ target, padding: LAKE_FOCUS_PADDING }, { animate: true, duration: 600 })
      } catch {
        if (!cancelled && !geometry) {
          setError(
            mapError(
              'LAKE_GEOMETRY_UNAVAILABLE',
              `Unable to focus ${lakeName}; geometry/extent unavailable.`,
              false,
            ),
          )
        }
      }

      void lakeId
      void center
    }

    void focusLake()
    return () => {
      cancelled = true
    }
  }, [viewReady, lakeId, geometry, bounds, center, lakeName])

  const handleModeChange = (next: WaterMapMode) => {
    onLayerChange?.(waterMapModeToMapLayerId(next))
  }

  const toggleReferenceLayer = (key: ReferenceLayerKey) => {
    // Boundaries only. Water bodies is always on; scientific layers belong to the map-mode selector.
    if (!isUserToggleableLayer(key) || unavailableReferenceLayers[key]) return
    const layer = runtimeRef.current?.resolved.byKey[key]
    if (!layer) return
    layer.visible = !layer.visible
  }

  const zoomBy = (delta: number) => {
    const view = runtimeRef.current?.view
    if (!view) return
    const next = Math.min(20, Math.max(3, (view.zoom ?? 10) + delta))
    void view.goTo({ zoom: next })
  }

  const locateLake = () => {
    const view = runtimeRef.current?.view
    if (!view) return
    const target = extentFromGeometryOrBounds(geometry, bounds)
    void view.goTo({ target, padding: LAKE_FOCUS_PADDING })
  }

  const [layersOpen, setLayersOpen] = useState(false)
  const [layersLakeId, setLayersLakeId] = useState(lakeId)
  // Close the layers panel when the user switches lakes (state reset during render).
  if (layersLakeId !== lakeId) {
    setLayersLakeId(lakeId)
    setLayersOpen(false)
  }
  const closeLayers = () => setLayersOpen(false)
  const toggleLayers = () => setLayersOpen((open) => !open)

  const layersPanelStatus = phase === 'ready' ? 'ready' : phase === 'error' ? 'error' : 'loading'

  const referenceRows = buildReferenceLayerRows(
    { byKey: runtimeRef.current?.resolved.byKey ?? {} },
    referenceVisibility,
    unavailableReferenceLayers,
  )

  return (
    <div
      className="relative h-full w-full overflow-hidden bg-[var(--color-bg-app)] [&:fullscreen]:h-screen [&:fullscreen]:w-screen"
      data-map-provider="arcgis"
      data-map-surface=""
    >
      <div ref={containerRef} className="absolute inset-0 [&_.esri-view]:h-full [&_.esri-view]:w-full" />

      <MapStatusOverlay
        phase={phase}
        error={error}
        unsupportedLayerMessage={unsupportedMessage}
      />

      {/* Map chrome — React owns the application interface */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-3">
        <div
          className="map-chrome-panel map-mode-switch pointer-events-auto mt-10 flex p-0.5"
          role="group"
          aria-label="Map layer mode"
        >
          {WATER_MAP_MODE_OPTIONS.map((option) => {
            const availability = rasterModeAvailability(historicalObservation, option.mode)
            return (
              <button
                key={option.mode}
                type="button"
                className={cn(
                  'motion-control rounded-full px-2.5 py-1 text-2xs font-medium tracking-[0.04em]',
                  mode === option.mode
                    ? 'bg-[var(--color-bg-panel-elevated)] text-[var(--color-text-primary)] shadow-[0_1px_2px_rgba(0,0,0,0.35)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
                  availability.enabled ? '' : 'cursor-not-allowed opacity-40 hover:text-[var(--color-text-secondary)]',
                )}
                aria-pressed={mode === option.mode}
                aria-disabled={!availability.enabled}
                title={
                  availability.enabled
                    ? `${option.name}: ${option.description}`
                    : availability.reason
                }
                onClick={() => {
                  if (!availability.enabled) return
                  handleModeChange(option.mode)
                }}
              >
                {option.label}
              </button>
            )
          })}
        </div>

        <LakeMapDateStack
          lakeId={lakeId}
          dateSelection={dateSelection}
          latestSceneDate={latestSceneDate}
          latestSceneQuality={latestSceneQuality}
          latestSceneCloud={latestSceneCloud}
          latestValidDate={latestValidDate}
          satelliteSceneUnavailable={satelliteSceneUnavailable}
        />
      </div>

      {phase === 'ready' && isSupportedWaterMapLayer(layer) && !historicalObservation ? (
        <ProductionLegend key={layer} legend={legend} className="motion-crossfade" />
      ) : null}

      {satelliteSceneUnavailable ? (
        <p
          className="map-chrome-panel pointer-events-none absolute bottom-3 left-3 z-10 max-w-[16rem] px-2.5 py-1.5 text-2xs text-[var(--color-text-primary)]"
          role="status"
        >
          {SATELLITE_SCENE_UNAVAILABLE}
        </p>
      ) : null}

      <MapLayersPanel
        id={LAYERS_PANEL_ID}
        open={layersOpen}
        onClose={closeLayers}
        className="absolute right-[3.35rem] top-[4.5rem] z-10"
        status={layersPanelStatus}
        references={referenceRows}
        onToggleReference={toggleReferenceLayer}
      />

      <MapZoomControls
        onZoomIn={() => zoomBy(1)}
        onZoomOut={() => zoomBy(-1)}
        onLocate={locateLake}
        layers={{ open: layersOpen, onToggle: toggleLayers, controlsId: LAYERS_PANEL_ID }}
      />
    </div>
  )
}

const LAYERS_PANEL_ID = 'arcgis-map-layers-panel'

async function waitForNonZeroSize(element: HTMLElement, attempts = 60): Promise<void> {
  for (let i = 0; i < attempts; i += 1) {
    if (element.clientWidth > 10 && element.clientHeight > 10) return
    await new Promise((resolve) => window.setTimeout(resolve, 50))
  }
  throw new Error('Map container has no measurable size; cannot initialize MapView.')
}

function sentinelImagery(runtime: RuntimeHandles): ImageryLayer | null {
  const layer = runtime.resolved.byKey.sentinelNatural
  if (!layer || layer.type !== 'imagery') return null
  return layer as ImageryLayer
}
