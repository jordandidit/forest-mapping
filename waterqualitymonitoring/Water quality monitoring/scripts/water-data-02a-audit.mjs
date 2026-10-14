/**
 * Browser-side WATER-DATA-02A audit runner.
 * Loaded via CDP after IdentityManager authentication.
 * Never returns raw tokens.
 */
export async function runWaterData02aAudit() {
  const IdentityManager = (await import('@arcgis/core/identity/IdentityManager.js')).default
  const esriRequest = (await import('@arcgis/core/request.js')).default

  const PORTAL = 'https://gh.space.gov.rw/portal'
  const SHARING = `${PORTAL}/sharing`
  const FEATURE =
    'https://gh.space.gov.rw/server/rest/services/Hosted/RW_WaterQuality_Monitor_View/FeatureServer'
  const IMAGE_ROOT = 'https://gh.space.gov.rw/image/rest/services'

  function sanitizeUrl(url) {
    if (!url) return url
    return String(url)
      .replace(/([?&]token=)[^&]+/gi, '$1[REDACTED]')
      .replace(/([?&]access_token=)[^&]+/gi, '$1[REDACTED]')
  }

  function sanitizeDeep(value, depth = 0) {
    if (depth > 12) return '[max-depth]'
    if (value == null) return value
    if (typeof value === 'string') {
      if (/^[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]+\./.test(value)) return '[REDACTED_JWT_LIKE]'
      return sanitizeUrl(value)
    }
    if (Array.isArray(value)) return value.map((v) => sanitizeDeep(v, depth + 1))
    if (typeof value === 'object') {
      const out = {}
      for (const [k, v] of Object.entries(value)) {
        if (/token|password|secret|authorization|refresh/i.test(k)) {
          out[k] = '[REDACTED]'
          continue
        }
        out[k] = sanitizeDeep(v, depth + 1)
      }
      return out
    }
    return value
  }

  async function req(url, query = {}) {
    const response = await esriRequest(url, {
      query: { f: 'json', ...query },
      responseType: 'json',
    })
    return response.data
  }

  async function authProbe(url) {
    try {
      await IdentityManager.getCredential(url)
      const data = await req(url)
      return {
        url: sanitizeUrl(url),
        ok: !data?.error,
        error: data?.error
          ? { code: data.error.code, message: data.error.message }
          : null,
      }
    } catch (e) {
      return {
        url: sanitizeUrl(url),
        ok: false,
        error: { message: e instanceof Error ? e.message : String(e) },
      }
    }
  }

  // Ensure portal session
  await IdentityManager.checkSignInStatus(`${SHARING}`)

  const report = {
    generatedAt: new Date().toISOString(),
    authorization: {},
    webMapSearch: {},
    webMapItem: null,
    webMapData: null,
    operationalLayers: [],
    basemap: null,
    rasterRegistry: null,
    imageServer: null,
    muhazi: null,
    risks: [],
  }

  report.authorization = {
    portal: await authProbe(`${SHARING}/rest`),
    featureServer: await authProbe(FEATURE),
    imageRoot: await authProbe(IMAGE_ROOT),
    imageHosted: await authProbe(`${IMAGE_ROOT}/Hosted`),
  }

  // Search for the production Web Map under authenticated context
  const searchQueries = [
    'title:"RW Water Quality Monitor - Map"',
    'RW Water Quality Monitor',
    'title:"Water Resources Quality Monitoring Application V3"',
    'Water Resources Quality Monitoring',
    'type:"Web Map" AND Water Quality',
    'type:"Web Map" AND Muhazi',
    'type:"Web Map" AND Monitor',
    'type:"Image Service" AND water',
    'type:"Image Service" AND Water',
    'type:"Image Service" AND Sentinel',
  ]

  const searchHits = []
  for (const q of searchQueries) {
    try {
      const data = await req(`${SHARING}/rest/search`, {
        q,
        num: 25,
        sortField: 'modified',
        sortOrder: 'desc',
      })
      searchHits.push({
        q,
        total: data.total,
        results: (data.results || []).map((r) => ({
          id: r.id,
          title: r.title,
          type: r.type,
          owner: r.owner,
          access: r.access,
          modified: r.modified,
          typeKeywords: r.typeKeywords,
        })),
      })
    } catch (e) {
      searchHits.push({
        q,
        error: e instanceof Error ? e.message : String(e),
      })
    }
  }
  report.webMapSearch = searchHits

  // Prefer exact title match, else fuzzy water+monitor web map
  let webMapId = null
  for (const hit of searchHits) {
    const exact = (hit.results || []).find(
      (r) => r.type === 'Web Map' && /RW Water Quality Monitor - Map/i.test(r.title || ''),
    )
    if (exact) {
      webMapId = exact.id
      break
    }
  }
  if (!webMapId) {
    for (const hit of searchHits) {
      const fuzzy = (hit.results || []).find(
        (r) =>
          r.type === 'Web Map' &&
          /water/i.test(r.title || '') &&
          /monitor|quality|muhazi|sentinel/i.test(r.title || ''),
      )
      if (fuzzy) {
        webMapId = fuzzy.id
        report.risks.push(`Exact Web Map title not found; using fuzzy match: ${fuzzy.title}`)
        break
      }
    }
  }

  if (webMapId) {
    const item = await req(`${SHARING}/rest/content/items/${webMapId}`)
    report.webMapItem = {
      title: item.title,
      id: item.id,
      owner: item.owner,
      type: item.type,
      modified: item.modified,
      created: item.created,
      access: item.access,
      snippet: item.snippet,
      description: item.description,
      typeKeywords: item.typeKeywords,
      url: sanitizeUrl(item.url),
    }
    const data = await req(`${SHARING}/rest/content/items/${webMapId}/data`)
    report.webMapData = sanitizeDeep(data)

    const layers = data.operationalLayers || []
    report.operationalLayers = layers.map((layer, index) => ({
      index,
      id: layer.id,
      title: layer.title,
      layerType: layer.layerType || layer.type,
      url: sanitizeUrl(layer.url),
      visibility: layer.visibility,
      opacity: layer.opacity,
      minScale: layer.minScale,
      maxScale: layer.maxScale,
      renderer: sanitizeDeep(layer.layerDefinition?.drawingInfo?.renderer || layer.renderer),
      renderingRule: sanitizeDeep(layer.renderingRule),
      mosaicRule: sanitizeDeep(layer.mosaicRule),
      popupInfo: layer.popupInfo
        ? {
            title: layer.popupInfo.title,
            fieldInfos: (layer.popupInfo.fieldInfos || []).slice(0, 40),
          }
        : null,
      definitionExpression:
        layer.layerDefinition?.definitionExpression || layer.definitionExpression || null,
      filters: sanitizeDeep(layer.layerDefinition?.definitionExpression || layer.filter),
      blendMode: layer.blendMode || layer.layerDefinition?.blendMode || null,
      bandIds: layer.bandIds || null,
      format: layer.format || null,
      compressionQuality: layer.compressionQuality || null,
      interpolation: layer.interpolation || null,
      itemId: layer.itemId || null,
    }))

    report.basemap = sanitizeDeep(data.baseMap)
  } else {
    report.risks.push('Could not locate production Web Map item via authenticated Portal search.')
  }

  // RasterRegistry active record
  try {
    const rr = await req(`${FEATURE}/6/query`, {
      where: 'active = 1',
      outFields: '*',
      returnGeometry: false,
      resultRecordCount: 10,
    })
    report.rasterRegistry = {
      count: (rr.features || []).length,
      records: (rr.features || []).map((f) => sanitizeDeep(f.attributes)),
    }
  } catch (e) {
    report.rasterRegistry = {
      error: e instanceof Error ? e.message : String(e),
    }
  }

  // ImageServer metadata from active registry URL(s) and web map raster URLs
  const imageUrls = new Set()
  for (const rec of report.rasterRegistry?.records || []) {
    if (rec.url) imageUrls.add(String(rec.url).replace(/\/+$/, ''))
  }
  for (const layer of report.operationalLayers) {
    if (layer.url && /ImageServer/i.test(layer.url)) {
      imageUrls.add(String(layer.url).replace(/\/+$/, '').split('?')[0])
    }
  }

  // Also list Hosted image services if accessible
  let hostedListing = null
  try {
    hostedListing = await req(`${IMAGE_ROOT}/Hosted`)
  } catch (e) {
    hostedListing = { error: e instanceof Error ? e.message : String(e) }
  }

  const imageServerReports = []
  for (const url of imageUrls) {
    try {
      const meta = await req(url)
      let rasterFunctionInfos = meta.rasterFunctionInfos || null
      let multidimensionalInfo = meta.multidimensionalInfo || null
      let fields = meta.fields || null
      let keyProperties = null
      try {
        keyProperties = await req(`${url}/keyProperties`)
      } catch {
        keyProperties = null
      }
      let legend = null
      try {
        legend = await req(`${url}/legend`)
      } catch {
        legend = null
      }

      imageServerReports.push({
        url: sanitizeUrl(url),
        name: meta.name,
        description: meta.description,
        capabilities: meta.capabilities,
        pixelType: meta.pixelType,
        pixelSizeX: meta.pixelSizeX,
        pixelSizeY: meta.pixelSizeY,
        bandCount: meta.bandCount,
        spatialReference: meta.spatialReference,
        extent: meta.extent,
        minPixelSize: meta.minPixelSize,
        maxPixelSize: meta.maxPixelSize,
        allowedMosaicMethods: meta.allowedMosaicMethods,
        defaultMosaicMethod: meta.defaultMosaicMethod,
        defaultCompressionQuality: meta.defaultCompressionQuality,
        defaultResamplingMethod: meta.defaultResamplingMethod,
        hasMultidimensions: meta.hasMultidimensions,
        serviceDataType: meta.serviceDataType,
        colormap: meta.colormap || null,
        minValues: meta.minValues,
        maxValues: meta.maxValues,
        meanValues: meta.meanValues,
        stdvValues: meta.stdvValues,
        bandNames: meta.bandNames || keyProperties?.BandName || keyProperties?.bandNames || null,
        noData: meta.noDataValue ?? meta.noDataValues ?? null,
        rasterFunctionInfos: sanitizeDeep(rasterFunctionInfos),
        multidimensionalInfo: sanitizeDeep(multidimensionalInfo),
        fields: sanitizeDeep(
          (fields || []).map((f) => ({
            name: f.name,
            type: f.type,
            alias: f.alias,
          })),
        ),
        keyProperties: sanitizeDeep(keyProperties),
        legend: sanitizeDeep(legend),
        objectIdField: meta.objectIdField,
      })
    } catch (e) {
      imageServerReports.push({
        url: sanitizeUrl(url),
        error: e instanceof Error ? e.message : String(e),
      })
    }
  }

  report.imageServer = {
    hostedListing: sanitizeDeep(hostedListing),
    services: imageServerReports,
  }

  // Lake Muhazi from WaterBodies
  try {
    const list = await req(`${FEATURE}/0/query`, {
      where: "wb_id IS NOT NULL",
      outFields: 'objectid,wb_id,wb_key,name,province,district,area_ha,bxmin,bymin,bxmax,bymax,cx,cy',
      returnGeometry: false,
      orderByFields: 'name ASC',
      resultRecordCount: 1000,
    })
    const candidates = (list.features || [])
      .map((f) => f.attributes)
      .filter((a) => /muhazi/i.test(String(a.name || '')) || /muhazi/i.test(String(a.wb_key || '')))

    let muhazi = candidates[0] || null
    let geometry = null
    if (muhazi?.wb_id != null) {
      const detail = await req(`${FEATURE}/0/query`, {
        where: `wb_id = '${String(muhazi.wb_id).replaceAll("'", "''")}'`,
        outFields: '*',
        returnGeometry: true,
        resultRecordCount: 1,
        outSR: 4326,
      })
      const feature = detail.features?.[0]
      muhazi = feature?.attributes || muhazi
      geometry = feature?.geometry
        ? {
            type: feature.geometry.rings ? 'polygon' : typeof feature.geometry,
            ringCount: feature.geometry.rings?.length ?? null,
            firstRingVertexCount: feature.geometry.rings?.[0]?.length ?? null,
            spatialReference: feature.geometry.spatialReference || detail.spatialReference || null,
          }
        : null
    }

    report.muhazi = {
      candidates: candidates.map((c) => ({
        wb_id: c.wb_id,
        wb_key: c.wb_key,
        name: c.name,
      })),
      attributes: sanitizeDeep(muhazi),
      geometrySummary: geometry,
      bbox:
        muhazi &&
        muhazi.bxmin != null &&
        muhazi.bymin != null &&
        muhazi.bxmax != null &&
        muhazi.bymax != null
          ? {
              xmin: muhazi.bxmin,
              ymin: muhazi.bymin,
              xmax: muhazi.bxmax,
              ymax: muhazi.bymax,
            }
          : null,
    }
  } catch (e) {
    report.muhazi = { error: e instanceof Error ? e.message : String(e) }
  }

  return sanitizeDeep(report)
}
