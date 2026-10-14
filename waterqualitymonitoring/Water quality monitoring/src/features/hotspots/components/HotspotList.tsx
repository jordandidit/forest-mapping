import type { Hotspot } from '@/domain/hotspot/types'
import { HotspotCard } from '@/features/hotspots/components/HotspotCard'

interface HotspotListProps {
  hotspots: Hotspot[]
  selectedHotspotId: string | null
  onSelectHotspot: (hotspotId: string) => void
}

export function HotspotList({
  hotspots,
  selectedHotspotId,
  onSelectHotspot,
}: HotspotListProps) {
  return (
    <section className="flex h-full min-h-0 flex-col" aria-labelledby="hotspots-heading">
      <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] px-3 py-2">
        <h2 id="hotspots-heading" className="panel-section-title">
          Hotspot Intelligence
        </h2>
        <button
          type="button"
          className="text-2xs text-[var(--color-accent)] hover:underline"
        >
          View all ({hotspots.length})
        </button>
      </div>
      <div className="flex-1 space-y-0 overflow-y-auto p-1">
        {hotspots.length === 0 ? (
          <p className="px-1 py-4 text-center text-xs text-[var(--color-text-muted)]">
            No hotspots detected for this observation.
          </p>
        ) : (
          hotspots.map((hotspot, index) => (
            <HotspotCard
              key={hotspot.id}
              hotspot={hotspot}
              index={index}
              selected={selectedHotspotId === hotspot.id}
              onSelect={onSelectHotspot}
            />
          ))
        )}
      </div>
    </section>
  )
}
