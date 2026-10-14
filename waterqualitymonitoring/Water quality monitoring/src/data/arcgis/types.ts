export interface ArcgisErrorBody {
  error?: {
    code?: number
    message?: string
    details?: unknown[]
  }
}

export interface ArcgisSpatialReference {
  wkid?: number
  latestWkid?: number
}

export interface ArcgisPolygonGeometry {
  rings?: number[][][]
  spatialReference?: ArcgisSpatialReference
}

export interface ArcgisFeature<TAttributes> {
  attributes: TAttributes
  geometry?: ArcgisPolygonGeometry
}

export interface ArcgisQueryResponse<TAttributes> extends ArcgisErrorBody {
  features?: ArcgisFeature<TAttributes>[]
  exceededTransferLimit?: boolean
  objectIdFieldName?: string
}

export interface ArcgisQueryParams {
  where: string
  outFields?: string
  returnGeometry?: boolean
  orderByFields?: string
  resultOffset?: number
  resultRecordCount?: number
}
