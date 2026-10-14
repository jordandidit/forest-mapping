import { getDataProviderKind } from '@/data/arcgis/config'
import { useAuthStore } from '@/features/auth/store/auth.store'

/**
 * Protected ArcGIS queries should wait until IdentityManager session is ready.
 * Mock mode always allows fetching.
 */
export function useArcGisQueryEnabled(extraEnabled = true): boolean {
  const providerKind = getDataProviderKind()
  const status = useAuthStore((state) => state.status)

  if (providerKind === 'mock') {
    return extraEnabled
  }

  return status === 'authenticated' && extraEnabled
}
