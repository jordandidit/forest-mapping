import esriRequest from '@arcgis/core/request.js'
import IdentityManager from '@arcgis/core/identity/IdentityManager.js'
import type { ArcgisErrorBody, ArcgisQueryParams, ArcgisQueryResponse } from '@/data/arcgis/types'
import {
  getDataProviderKind,
  getServerRestRootFromServiceUrl,
} from '@/data/arcgis/config'
import {
  ensureFederatedServiceCredentials,
  isPortalSessionActive,
  markServiceAccessFailed,
  markSessionExpired,
  sanitizeAuthMessage,
} from '@/features/auth/services/arcgis-auth.service'
import { useAuthStore } from '@/features/auth/store/auth.store'

export class ArcgisRestError extends Error {
  readonly code: number | undefined
  readonly details: unknown
  readonly authRequired: boolean
  readonly permissionDenied: boolean
  readonly sessionExpired: boolean
  readonly serviceAccessFailed: boolean

  constructor(message: string, code?: number, details?: unknown) {
    super(sanitizeAuthMessage(message))
    this.name = 'ArcgisRestError'
    this.code = code
    this.details = details
    this.permissionDenied = code === 403
    const tokenProblem =
      code === 499 ||
      code === 401 ||
      /token required|session.*(expired|invalid)|unauthorized/i.test(message)
    // If Portal OAuth is still alive, a 499 is a federated-service problem — not a full logout.
    this.serviceAccessFailed = tokenProblem && isPortalSessionActive()
    this.sessionExpired = tokenProblem && !this.serviceAccessFailed
    this.authRequired = this.sessionExpired || this.permissionDenied || this.serviceAccessFailed
  }
}

export function escapeSqlLiteral(value: string): string {
  return value.replaceAll("'", "''")
}

function assertNoEmbeddedTokenInConfiguredUrl(url: string): void {
  if (/[?&]token=/i.test(url)) {
    throw new ArcgisRestError(
      'ArcGIS requests must not include hardcoded authentication tokens',
    )
  }
}

function notifyAuthLayer(error: ArcgisRestError): void {
  if (getDataProviderKind() !== 'arcgis') return

  // 403: authenticated but unauthorized — do not force login loops.
  if (error.permissionDenied) {
    return
  }

  // Portal session still valid, but federated service token failed.
  // Keep the user signed in; surface a service-access problem instead of SESSION_EXPIRED.
  if (error.serviceAccessFailed && isPortalSessionActive()) {
    const current = useAuthStore.getState()
    useAuthStore.setState({
      status: 'authenticated',
      user: current.user,
      error: markServiceAccessFailed(),
    })
    return
  }

  if (error.sessionExpired || error.serviceAccessFailed) {
    useAuthStore.setState({
      status: 'unauthenticated',
      user: null,
      error: markSessionExpired(),
    })
  }
}

function throwIfArcgisError(payload: ArcgisErrorBody, context: string): void {
  if (payload.error) {
    const message = payload.error.message ?? 'ArcGIS request failed'
    const error = new ArcgisRestError(
      `${context}: ${message}`,
      payload.error.code,
      payload.error.details,
    )
    notifyAuthLayer(error)
    throw error
  }
}

/**
 * Ensure IdentityManager can supply a credential for the federated FeatureServer.
 * Tokens remain inside IdentityManager — never stored in Zustand or query keys.
 */
async function ensureServiceCredential(serviceUrl: string): Promise<void> {
  if (getDataProviderKind() !== 'arcgis') return

  const resource = serviceUrl.replace(/\/+$/, '')
  const serverRoot = getServerRestRootFromServiceUrl(resource)
  const candidates = [`${serverRoot}/services`, serverRoot, resource]

  for (const candidate of candidates) {
    const existing = IdentityManager.findCredential(candidate)
    if (existing?.token && (!existing.expires || Date.now() < existing.expires)) {
      return
    }
  }

  try {
    await ensureFederatedServiceCredentials(resource)
  } catch (error) {
    const message = sanitizeAuthMessage(
      error instanceof Error ? error.message : 'Unable to obtain ArcGIS service credential',
    )
    const restError = new ArcgisRestError(message, 499)
    notifyAuthLayer(restError)
    throw restError
  }
}

export async function queryFeatureLayer<TAttributes>(
  baseUrl: string,
  layerId: number,
  params: ArcgisQueryParams,
): Promise<ArcgisQueryResponse<TAttributes>> {
  assertNoEmbeddedTokenInConfiguredUrl(baseUrl)

  const serviceUrl = baseUrl.replace(/\/+$/, '')
  const queryUrl = `${serviceUrl}/${layerId}/query`

  await ensureServiceCredential(serviceUrl)

  const runQuery = async () => {
    const response = await esriRequest(queryUrl, {
      query: {
        f: 'json',
        where: params.where,
        outFields: params.outFields ?? '*',
        returnGeometry: params.returnGeometry ?? false,
        ...(params.orderByFields ? { orderByFields: params.orderByFields } : {}),
        ...(params.resultOffset !== undefined ? { resultOffset: params.resultOffset } : {}),
        ...(params.resultRecordCount !== undefined
          ? { resultRecordCount: params.resultRecordCount }
          : {}),
      },
      responseType: 'json',
    })
    return response.data as ArcgisQueryResponse<TAttributes>
  }

  try {
    let payload = await runQuery()

    // One federation retry when the first authenticated call still returns 499.
    if (payload.error?.code === 499 && isPortalSessionActive()) {
      await ensureFederatedServiceCredentials(serviceUrl)
      payload = await runQuery()
    }

    throwIfArcgisError(payload, `FeatureServer layer ${layerId}`)
    return payload
  } catch (error) {
    if (error instanceof ArcgisRestError) throw error

    const message = sanitizeAuthMessage(
      error instanceof Error ? error.message : 'Network request failed',
    )

    if (/failed to fetch|cors|networkerror/i.test(message)) {
      throw new ArcgisRestError(`CORS or network failure querying layer ${layerId}: ${message}`)
    }

    const code =
      typeof error === 'object' &&
      error !== null &&
      'details' in error &&
      typeof (error as { details?: { httpStatus?: number } }).details?.httpStatus === 'number'
        ? (error as { details: { httpStatus: number } }).details.httpStatus
        : undefined

    const restError = new ArcgisRestError(
      `FeatureServer layer ${layerId}: ${message}`,
      code,
    )
    notifyAuthLayer(restError)
    throw restError
  }
}

/**
 * Paginated query helper. MaxRecordCount on this service is 1000 —
 * never assume a single page is complete when exceededTransferLimit is set.
 */
export async function queryAllFeatures<TAttributes>(
  baseUrl: string,
  layerId: number,
  params: Omit<ArcgisQueryParams, 'resultOffset' | 'resultRecordCount'> & {
    pageSize?: number
    maxPages?: number
  },
): Promise<ArcgisQueryResponse<TAttributes>['features']> {
  const pageSize = params.pageSize ?? 1000
  const maxPages = params.maxPages ?? 50
  const features: NonNullable<ArcgisQueryResponse<TAttributes>['features']> = []

  for (let page = 0; page < maxPages; page += 1) {
    const response = await queryFeatureLayer<TAttributes>(baseUrl, layerId, {
      where: params.where,
      outFields: params.outFields,
      returnGeometry: params.returnGeometry,
      orderByFields: params.orderByFields,
      resultOffset: page * pageSize,
      resultRecordCount: pageSize,
    })

    const batch = response.features ?? []
    features.push(...batch)

    if (!response.exceededTransferLimit || batch.length < pageSize) {
      break
    }
  }

  return features
}
