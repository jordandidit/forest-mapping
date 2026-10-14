import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface RightInsightsPanelProps {
  children: ReactNode
  className?: string
}

export function RightInsightsPanel({ children, className }: RightInsightsPanelProps) {
  return (
    <aside
      className={cn(
        'flex w-[var(--insights-width)] shrink-0 flex-col overflow-hidden',
        className,
      )}
      aria-label="Lake health insights"
    >
      {children}
    </aside>
  )
}
