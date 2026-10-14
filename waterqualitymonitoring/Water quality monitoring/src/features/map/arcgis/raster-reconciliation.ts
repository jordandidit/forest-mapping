import ImageryLayer from '@arcgis/core/layers/ImageryLayer.js'
import type Layer from '@arcgis/core/layers/Layer.js'
import type EsriMap from '@arcgis/core/Map.js'
import type { RasterRecord } from '@/domain/raster/types'
import {
  getLayerUrl,
  normalizeServiceUrl,
  resolveProductionLayers,
  type ResolvedProductionLayers,
} from '@/features/map/arcgis/layer-resolver'

export type RasterReconcileResult =
  | { status: 'match'; activeUrl: string; itemId: string | null }
  | { status: 'updated'; activeUrl: string; itemId: string | null; previousUrls: string[] }
  | { status: 'mismatch'; activeUrl: string; itemId: string | null; webMapUrls: string[]; reason: string }
  | { status: 'no_overlay_layers'; activeUrl: string }
  | { status: 'no_active_raster' }

function isImageryLike(layer: Layer): layer is ImageryLayer {
  return layer.type === 'imagery' || layer instanceof ImageryLayer
}

/**
 * Compare RasterRegistry active record to Web Map water-overlay layers.
 * Prefer updating URLs while preserving each layer's production rasterFunction.
 */
export async function reconcileActiveRaster(
  map: EsriMap,
  resolved: ResolvedProductionLayers,
  activeRaster: RasterRecord | null,
): Promise<{ result: RasterReconcileResult; resolved: ResolvedProductionLayers }> {
  if (!activeRaster?.url) {
    return { result: { status: 'no_active_raster' }, resolved }
  }

  const activeUrl = normalizeServiceUrl(activeRaster.url)
  const overlays = resolved.waterOverlayLayers

  if (!overlays.length) {
    return {
      result: { status: 'no_overlay_layers', activeUrl },
      resolved,
    }
  }

  const webMapUrls = overlays
    .map((layer) => getLayerUrl(layer))
    .filter((url): url is string => Boolean(url))
    .map(normalizeServiceUrl)

  const allMatch = webMapUrls.every((url) => urlsReferToSameService(url, activeUrl))
  const itemIdsMatch =
    !activeRaster.itemId ||
    overlays.every((layer) => {
      const portalItem = (layer as ImageryLayer).portalItem
      return !portalItem?.id || portalItem.id === activeRaster.itemId
    })

  if (allMatch && itemIdsMatch) {
    return {
      result: {
        status: 'match',
        activeUrl,
        itemId: activeRaster.itemId,
      },
      resolved,
    }
  }

  // Registry advanced — retarget overlays while preserving rendering rules.
  const previousUrls = [...new Set(webMapUrls)]
  let replacedCount = 0

  try {
    for (const layer of overlays) {
      if (!isImageryLike(layer)) {
        throw new Error(`Overlay layer "${layer.title}" is not an ImageryLayer`)
      }

      const currentUrl = getLayerUrl(layer)
      if (currentUrl && urlsReferToSameService(currentUrl, activeUrl)) {
        continue
      }

      const replacement = cloneImageryLayerWithUrl(layer, activeUrl)
      const layersCollection = map.layers
      const index = layersCollection.findIndex((candidate) => candidate === layer)

      layersCollection.remove(layer)
      if (index >= 0) {
        layersCollection.add(replacement, index)
      } else {
        layersCollection.add(replacement)
      }

      replacedCount += 1
    }
  } catch (error) {
    return {
      result: {
        status: 'mismatch',
        activeUrl,
        itemId: activeRaster.itemId,
        webMapUrls: previousUrls,
        reason:
          error instanceof Error
            ? error.message
            : 'Unable to safely retarget water-overlay layers to the active RasterRegistry service',
      },
      resolved,
    }
  }

  // Refresh resolved pointers after replacements
  const nextResolved = resolveProductionLayers(map.allLayers.toArray())

  if (!replacedCount && !allMatch) {
    return {
      result: {
        status: 'mismatch',
        activeUrl,
        itemId: activeRaster.itemId,
        webMapUrls: previousUrls,
        reason: 'Web Map overlay URLs differ from RasterRegistry and could not be updated',
      },
      resolved: nextResolved,
    }
  }

  return {
    result: {
      status: replacedCount ? 'updated' : 'match',
      activeUrl,
      itemId: activeRaster.itemId,
      previousUrls,
    },
    resolved: nextResolved,
  }
}

function urlsReferToSameService(a: string, b: string): boolean {
  const na = normalizeServiceUrl(a).toLowerCase()
  const nb = normalizeServiceUrl(b).toLowerCase()
  return na === nb
}

function cloneImageryLayerWithUrl(source: ImageryLayer, url: string): ImageryLayer {
  const sourceRf = source.rasterFunction as
    | { clone?: () => unknown }
    | null
    | undefined
  const rasterFunction = sourceRf?.clone?.() ?? source.rasterFunction ?? undefined

  return new ImageryLayer({
    url,
    title: source.title,
    opacity: source.opacity,
    visible: source.visible,
    minScale: source.minScale,
    maxScale: source.maxScale,
    format: source.format,
    interpolation: source.interpolation,
    bandIds: source.bandIds,
    rasterFunction: rasterFunction as ImageryLayer['rasterFunction'],
    popupEnabled: false,
    legendEnabled: source.legendEnabled,
  })
}
