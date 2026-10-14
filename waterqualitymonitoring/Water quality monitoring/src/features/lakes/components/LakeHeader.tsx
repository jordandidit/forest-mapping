import type { WaterBody } from '@/domain/water-body/types'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { TrendIndicator } from '@/components/ui/TrendIndicator'
import { formatNumber } from '@/lib/format'

interface LakeHeaderProps {
  lake: WaterBody
}

export function LakeHeader({ lake }: LakeHeaderProps) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-[var(--color-border-subtle)] px-3 py-2">
      <div className="min-w-0">
        <h1 className="truncate text-sm font-semibold tracking-wide">{lake.name}</h1>
        <p className="text-2xs text-[var(--color-text-muted)]">
          {lake.province} · {lake.country} · {formatNumber(lake.surfaceAreaKm2, { maximumFractionDigits: 1 })} km²
        </p>
      </div>
      <div className="ml-auto flex items-center gap-3">
        <StatusBadge status={lake.status} />
        <TrendIndicator trend={lake.trend} />
      </div>
    </div>
  )
}
