/**
 * Low-level client for the app's Node proxy.
 * Components must not call ArcGIS REST URLs directly.
 */
import { getApiBase } from './base'

const API_BASE = getApiBase()
const SESSION_KEY = 'fh_session_token'

export function storeSessionToken(token) {
  try {
    if (token) sessionStorage.setItem(SESSION_KEY, token)
    else sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore (private mode / SSR)
  }
}

export function clearSessionToken() {
  storeSessionToken(null)
}

function readSessionToken() {
  try {
    return sessionStorage.getItem(SESSION_KEY) || ''
  } catch {
    return ''
  }
}

async function request(path, options = {}) {
  const { signal, method = 'GET', body, headers } = options
  const sessionToken = readSessionToken()
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: 'include',
    signal,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  const text = await res.text()
  let data = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    data = { message: text }
  }

  if (!res.ok) {
    const err = new Error(data?.error || data?.message || `Request failed (${res.status})`)
    err.status = res.status
    err.code = data?.code || null
    err.details = data
    throw err
  }
  return data
}

export const arcgisApi = {
  /** Exchange a GeoHub OAuth access token for an HttpOnly API session cookie. */
  portalSession: async ({ token, expires, username } = {}) => {
    const data = await request('/auth/portal-session', {
      method: 'POST',
      body: { token, expires, username },
    })
    if (data?.sessionToken) storeSessionToken(data.sessionToken)
    return data
  },
  logout: async () => {
    try {
      return await request('/auth/logout', { method: 'POST' })
    } finally {
      clearSessionToken()
    }
  },
  me: () => request('/auth/me'),
  get: (path, signal) => request(path, { signal }),
  query: (path, params = {}, signal) => {
    const qs = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== '') qs.set(k, String(v))
    })
    const suffix = qs.toString() ? `?${qs}` : ''
    return request(`${path}${suffix}`, { signal })
  },
}
