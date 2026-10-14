import type { SamplingStationLayerProps } from '@/components/map/types'

/** Placeholder sampling stations — ready for field-data integration. */
export function SamplingStationLayer({ stations }: SamplingStationLayerProps) {
  if (stations.length === 0) {
    return null
  }

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {stations.map((station, index) => (
        <div
          key={station.id}
          className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--color-text-primary)] bg-[var(--color-accent)]"
          style={{
            top: `${45 + index * 8}%`,
            left: `${40 + index * 10}%`,
          }}
          title={station.name}
        />
      ))}
    </div>
  )
}
