import type { WaterQualityStatus } from '@/domain/water-quality/types'
import { cn } from '@/lib/cn'
import { formatStatusLabel } from '@/lib/format'

const STATUS_CLASS: Record<WaterQualityStatus, string> = {
  good: 'border-[var(--color-status-good)] text-[var(--color-status-good)]',
  moderate: 'border-[var(--color-status-moderate)] text-[var(--color-status-moderate)]',
  poor: 'border-[var(--color-status-poor)] text-[var(--color-status-poor)]',
  critical: 'border-[var(--color-status-critical)] text-[var(--color-status-critical)]',
  unknown: 'border-[var(--color-text-muted)] text-[var(--color-text-muted)]',
}

interface StatusBadgeProps {
  status: WaterQualityStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center border px-2 py-0.5 text-2xs font-medium uppercase tracking-[0.08em]',
        STATUS_CLASS[status],
        className,
      )}
    >
      {formatStatusLabel(status)}
    </span>
  )
}
