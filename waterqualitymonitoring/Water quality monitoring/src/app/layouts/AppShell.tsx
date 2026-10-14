import { Outlet } from 'react-router-dom'
import { TopNavigation } from '@/components/layout/TopNavigation'

export function AppShell() {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-x-hidden bg-[var(--color-bg-app)] text-[var(--color-text-primary)]">
      <TopNavigation />
      <main className="min-h-0 flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
