import type { MapErrorCode, MapErrorState } from '@/features/map/types'

export function mapError(
  code: MapErrorCode,
  message: string,
  fatal = true,
): MapErrorState {
  return { code, message, fatal }
}

export function sanitizeErrorMessage(error: unknown): string {
  let raw = 'Unknown map error'

  if (typeof error === 'string') {
    raw = error
  } else if (error instanceof Error) {
    raw = error.message || error.name || raw
  } else if (error && typeof error === 'object') {
    const obj = error as {
      message?: unknown
      name?: unknown
      details?: unknown
      error?: { message?: unknown }
    }
    if (typeof obj.message === 'string' && obj.message.trim()) {
      raw = obj.message
    } else if (typeof obj.error?.message === 'string') {
      raw = obj.error.message
    } else if (typeof obj.name === 'string') {
      raw = obj.name
    } else if (typeof obj.details === 'string') {
      raw = obj.details
    } else {
      try {
        raw = JSON.stringify(obj)
      } catch {
        raw = 'Unknown map error'
      }
    }
  }

  return raw
    .replace(/([?&]token=)[^&\s]+/gi, '$1[REDACTED]')
    .replace(/Bearer\s+[A-Za-z0-9._\-]+/gi, 'Bearer [REDACTED]')
}

export function classifyLoadError(error: unknown): MapErrorState {
  const message = sanitizeErrorMessage(error)
  const lower = message.toLowerCase()

  if (/credential|sign in|unauthorized|401|403|login|oauth|auth/i.test(message)) {
    return mapError('AUTH_REQUIRED', message)
  }
  if (/access denied|do not have access|permission/i.test(message)) {
    return mapError('RASTER_ACCESS_DENIED', message)
  }
  if (/imageserver|imagery/i.test(lower) && /fail|error|404|499|500/i.test(lower)) {
    return mapError('IMAGESERVER_UNAVAILABLE', message)
  }
  if (/web.?map|portal item|item does not exist/i.test(lower)) {
    return mapError('WEBMAP_UNAVAILABLE', message)
  }

  return mapError('MAP_INITIALIZATION_FAILED', message)
}
