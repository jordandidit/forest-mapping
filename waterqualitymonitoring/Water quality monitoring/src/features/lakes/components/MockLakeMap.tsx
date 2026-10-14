import type { WaterBody } from '@/domain/water-body/types'
import type { Hotspot } from '@/domain/hotspot/types'
import type { MapLayerId } from '@/domain/water-quality/types'
import {
  MapProvider,
  MapViewport,
  WaterBodyLayer,
  RasterLayer,
  HotspotLayer,
} from '@/components/map'
import {
  MapToolbar,
  LayerLegend,
  MapScaleBar,
  MapZoomControls,
} from '@/features/lakes/components/MapToolbar'
import { useMapContext } from '@/components/map/MapProvider'
import { getLakeBasemapAsset } from '@/lib/map-assets'
import type { ObservationDateSelection } from '@/features/observations/observation-explorer'
import { useUiStore } from '@/stores/ui-store'

export interface MockLakeMapProps {
  lake: WaterBody
  layer: MapLayerId
  hotspots: Hotspot[]
  selectedHotspotId: string | null
  latestSceneDate: string | null
  latestSceneQuality: string | null
  latestSceneCloud: number | null
  latestValidDate: string | null
  dateSelection?: ObservationDateSelection | null
  onSelectHotspot: (hotspotId: string) => void
}

/** Placeholder map used when VITE_DATA_PROVIDER=mock. */
export function MockLakeMap({
  lake,
  layer,
  hotspots,
  selectedHotspotId,
  latestSceneDate,
  latestSceneQuality,
  latestSceneCloud,
  latestValidDate,
  dateSelection = null,
  onSelectHotspot,
}: MockLakeMapProps) {
  return (
    <MapProvider
      initialViewport={{
        center: lake.map.center,
        zoom: lake.map.defaultZoom,
        bounds: lake.map.bounds,
      }}
      className="h-full min-h-[240px]"
    >
      <MockLakeMapInner
        lake={lake}
        layer={layer}
        hotspots={hotspots}
        selectedHotspotId={selectedHotspotId}
        latestSceneDate={latestSceneDate}
        latestSceneQuality={latestSceneQuality}
        latestSceneCloud={latestSceneCloud}
        latestValidDate={latestValidDate}
        dateSelection={dateSelection}
        onSelectHotspot={onSelectHotspot}
      />
    </MapProvider>
  )
}

function MockLakeMapInner({
  lake,
  layer,
  hotspots,
  selectedHotspotId,
  latestSceneDate,
  latestSceneQuality,
  latestSceneCloud,
  latestValidDate,
  dateSelection = null,
  onSelectHotspot,
}: MockLakeMapProps) {
  const { viewport, setViewport } = useMapContext()
  const { basemapMode, setBasemapMode } = useUiStore()
  const basemapUrl = getLakeBasemapAsset(lake.id)

  return (
    <>
      <MapViewport basemapUrl={basemapUrl} basemapMode={basemapMode}>
        <WaterBodyLayer geometry={lake.geometry} selected />
        <RasterLayer layerId={layer} rasterBounds={lake.map.bounds} />
        <HotspotLayer
          hotspots={hotspots}
          selectedHotspotId={selectedHotspotId}
          onSelectHotspot={onSelectHotspot}
        />
      </MapViewport>

      <MapToolbar
        lakeId={lake.id}
        basemapMode={basemapMode}
        onBasemapChange={setBasemapMode}
        latestSceneDate={latestSceneDate}
        latestSceneQuality={latestSceneQuality}
        latestSceneCloud={latestSceneCloud}
        latestValidDate={latestValidDate}
        dateSelection={dateSelection}
      />
      <LayerLegend key={layer} layer={layer} className="motion-crossfade" />
      <MapScaleBar />
      <MapZoomControls
        onZoomIn={() => setViewport({ ...viewport, zoom: viewport.zoom + 1 })}
        onZoomOut={() => setViewport({ ...viewport, zoom: Math.max(1, viewport.zoom - 1) })}
        onLocate={() =>
          setViewport({
            center: lake.map.center,
            zoom: lake.map.defaultZoom,
            bounds: lake.map.bounds,
          })
        }
      />
    </>
  )
}
