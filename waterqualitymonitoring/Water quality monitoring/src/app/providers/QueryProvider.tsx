import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { useState } from 'react'
import { QUERY_STALE_TIME_MS } from '@/data/arcgis/config'

interface QueryProviderProps {
  children: ReactNode
}

/**
 * TanStack Query for provider-backed server state (mock or ArcGIS).
 * Water-quality products update roughly nightly — avoid aggressive refetch.
 */
export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: QUERY_STALE_TIME_MS,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
