import { Outlet } from 'react-router-dom'
import { LakeSidebar } from '@/components/layout/LakeSidebar'

/** Layout for lake-centric monitoring routes with left control sidebar. */
export function LakeMonitorLayout() {
  return (
    <div className="flex h-full min-h-0 min-w-0 gap-1.5 bg-[var(--color-bg-app)] p-1.5">
      <div className="sticky top-0 hidden h-full min-h-0 shrink-0 self-start overflow-hidden md:flex">
        <LakeSidebar />
      </div>
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  )
}
