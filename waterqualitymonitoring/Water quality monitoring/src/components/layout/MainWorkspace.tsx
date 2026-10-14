import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface MainWorkspaceProps {
  children: ReactNode
  className?: string
}

export function MainWorkspace({ children, className }: MainWorkspaceProps) {
  return (
    <section
      className={cn(
        'relative min-h-0 min-w-0 flex-1 overflow-hidden bg-transparent',
        className,
      )}
      aria-label="Main map workspace"
    >
      {children}
    </section>
  )
}
