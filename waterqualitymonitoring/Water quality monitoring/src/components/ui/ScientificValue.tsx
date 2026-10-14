import { formatScientificValue } from '@/lib/format'
import { cn } from '@/lib/cn'

interface ScientificValueProps {
  value: number | string
  unit?: string
  className?: string
}

export function ScientificValue({ value, unit, className }: ScientificValueProps) {
  return (
    <span className={cn('font-mono tabular-nums tracking-tight type-tech', className)}>
      {formatScientificValue(value, unit)}
    </span>
  )
}
