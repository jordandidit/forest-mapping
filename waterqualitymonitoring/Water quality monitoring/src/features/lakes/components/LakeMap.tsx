import { getDataProviderKind } from '@/data/arcgis/config'
import type { WaterBody } from '@/domain/water-body/types'
import type { Hotspot } from '@/domain/hotspot/types'
import type { MapLayerId } from '@/domain/water-quality/types'
import { ArcGISLakeMap } from '@/features/map/arcgis/ArcGISLakeMap'
import { MockLakeMap } from '@/features/lakes/components/MockLakeMap'
import { useActiveRaster } from '@/features/observations/hooks/use-scenes'
import { WATER_OVERLAY_KIND } from '@/features/map/arcgis/constants'
import type { ObservationDateSelection } from '@/features/observations/observation-explorer'
import { useUiStore } from '@/stores/ui-store'

interface LakeMapProps {
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

/**
 * Lake map boundary.
 * mock → placeholder visualization
 * arcgis → production WebMap + MapView (WATER-DATA-02B)
 */
export function LakeMap({
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
}: LakeMapProps) {
  const provider = getDataProviderKind()
  const setSelectedLayer = useUiStore((s) => s.setSelectedLayer)

  if (provider === 'arcgis') {
    return (
      <ArcGISLakeMapBridge
        lake={lake}
        layer={layer}
        latestSceneDate={latestSceneDate}
        latestSceneQuality={latestSceneQuality}
        latestSceneCloud={latestSceneCloud}
        latestValidDate={latestValidDate}
        dateSelection={dateSelection}
        onLayerChange={setSelectedLayer}
      />
    )
  }

  return (
    <MockLakeMap
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
  )
}

function ArcGISLakeMapBridge({
  lake,
  layer,
  latestSceneDate,
  latestSceneQuality,
  latestSceneCloud,
  latestValidDate,
  dateSelection = null,
  onLayerChange,
}: {
  lake: WaterBody
  layer: MapLayerId
  latestSceneDate: string | null
  latestSceneQuality: string | null
  latestSceneCloud: number | null
  latestValidDate: string | null
  dateSelection?: ObservationDateSelection | null
  onLayerChange: (layer: MapLayerId) => void
}) {
  const rasterQuery = useActiveRaster(WATER_OVERLAY_KIND)

  return (
    <div className="h-full min-h-[240px]">
      <ArcGISLakeMap
        lakeId={lake.id}
        lakeName={lake.name}
        province={lake.province}
        country={lake.country}
        geometry={lake.geometry}
        bounds={lake.map.bounds}
        center={lake.map.center}
        layer={layer}
        onLayerChange={onLayerChange}
        latestSceneDate={latestSceneDate}
        latestSceneQuality={latestSceneQuality}
        latestSceneCloud={latestSceneCloud}
        latestValidDate={latestValidDate}
        dateSelection={dateSelection}
        activeRaster={rasterQuery.data ?? null}
        rasterLoading={rasterQuery.isLoading || rasterQuery.isFetching}
        rasterError={(rasterQuery.error as Error | null) ?? null}
      />
    </div>
  )
}
