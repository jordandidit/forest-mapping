import type { ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryProvider } from '@/app/providers/QueryProvider'
import { AuthProvider } from '@/features/auth/hooks/useArcGISAuth'
import { AuthGate } from '@/features/auth/components/AuthGate'
import { APP_BASE_PATH } from '@/data/arcgis/config'

interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <QueryProvider>
      <BrowserRouter basename={APP_BASE_PATH || undefined}>
        <AuthProvider>
          <AuthGate>{children}</AuthGate>
        </AuthProvider>
      </BrowserRouter>
    </QueryProvider>
  )
}
