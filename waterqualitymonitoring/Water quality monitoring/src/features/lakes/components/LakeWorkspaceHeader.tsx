import type { ReactNode } from 'react'
import { MainWorkspace } from '@/components/layout/MainWorkspace'

export function lakeIdentityLabel(lakeName: string): string {
  return lakeName.replace(/^Lake\s+/i, '')
}

/** Lake name overlaid on the map. The date picker lives in the top navigation. */
export function LakeWorkspaceHeader({
  lakeName,
  province,
}: {
  lakeName: string
  province: string
}) {
  return (
    <div data-region="lake-workspace-header" className="flex max-w-[14rem] flex-col gap-0.5">
      <p className="truncate text-lg font-medium leading-tight text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_10px_rgba(0,0,0,0.75)]">
        {lakeIdentityLabel(lakeName)}
      </p>
      <p className="truncate text-xs leading-snug text-white/85 [text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_0_8px_rgba(0,0,0,0.7)]">
        {province}
      </p>
    </div>
  )
}

/** Map, with the lake name floating on it, then the investigation panels. */
export function LakeWorkspaceFrame({
  header,
  map,
  below,
}: {
  header: ReactNode
  map: ReactNode
  below?: ReactNode
}) {
  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-1.5">
      <MainWorkspace className="relative min-h-0 flex-1 p-0">
        <div
          data-region="lake-map"
          className="relative h-full overflow-hidden rounded-[var(--radius-surface)] shadow-[var(--shadow-map)]"
        >
          {map}
          <div className="pointer-events-none absolute left-3 top-2.5 z-20">{header}</div>
        </div>
      </MainWorkspace>
      {below}
    </div>
  )
}
