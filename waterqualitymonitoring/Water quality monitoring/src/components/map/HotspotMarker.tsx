import { cn } from '@/lib/cn'

interface HotspotMarkerProps {
  label: string
  selected?: boolean
}

export function HotspotMarker({ label, selected = false }: HotspotMarkerProps) {
  return (
    <span
      className={cn(
        'flex h-6 w-6 items-center justify-center border text-2xs font-semibold tracking-wide',
        selected
          ? 'border-[var(--color-status-poor)] bg-[var(--color-status-poor)] text-[var(--color-text-inverse)]'
          : 'border-[var(--color-status-moderate)] bg-[rgba(250,204,21,0.2)] text-[var(--color-text-primary)]',
      )}
    >
      {label}
    </span>
  )
}
