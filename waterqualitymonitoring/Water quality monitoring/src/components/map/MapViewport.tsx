import type { MapViewportProps } from '@/components/map/types'
import { cn } from '@/lib/cn'

/**
 * Geographic viewport host.
 * Later: ArcGIS MapView or MapLibre canvas mounts here.
 * Until then, basemapUrl provides a replaceable satellite placeholder.
 */
export function MapViewport({
  children,
  className,
  basemapUrl,
  basemapMode = 'satellite',
}: MapViewportProps) {
  const modeTint =
    basemapMode === 'terrain'
      ? 'sepia(0.35) saturate(0.85) brightness(0.9)'
      : basemapMode === 'map'
        ? 'grayscale(0.35) contrast(1.05) brightness(0.95)'
        : 'none'

  return (
    <div
      className={cn('absolute inset-0', className)}
      role="img"
      aria-label="Lake map viewport"
    >
      {basemapUrl ? (
        <img
          src={basemapUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: modeTint }}
          draggable={false}
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse at 45% 40%, #1a4a5c 0%, #0f2a3a 35%, #0a1a28 70%, #071018 100%)',
          }}
        />
      )}
      {children}
    </div>
  )
}
