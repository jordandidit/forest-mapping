import { createContext, useContext, useMemo, useState } from 'react'
import { cn } from '@/lib/cn'
import type { MapProviderProps, MapViewportState } from '@/components/map/types'

interface MapContextValue {
  viewport: MapViewportState
  setViewport: (viewport: MapViewportState) => void
}

const MapContext = createContext<MapContextValue | null>(null)

export function MapProvider({
  children,
  initialViewport,
  className,
}: MapProviderProps) {
  const [viewport, setViewport] = useState(initialViewport)

  const value = useMemo(
    () => ({
      viewport,
      setViewport,
    }),
    [viewport],
  )

  return (
    <MapContext.Provider value={value}>
      <div
        className={cn(
          'relative h-full w-full overflow-hidden bg-[var(--color-bg-app)] [&:fullscreen]:h-screen [&:fullscreen]:w-screen',
          className,
        )}
        data-map-provider="mock"
        data-map-surface=""
      >
        {children}
      </div>
    </MapContext.Provider>
  )
}

export function useMapContext(): MapContextValue {
  const context = useContext(MapContext)
  if (!context) {
    throw new Error('useMapContext must be used within MapProvider')
  }
  return context
}
