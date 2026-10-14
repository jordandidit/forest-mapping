import { LakeConditionFilter } from '@/components/layout/LakeConditionFilter'
import { LakeSearch } from '@/components/layout/LakeSearch'
import { NavDatePicker } from '@/components/layout/NavDatePicker'
import { UserMenu } from '@/features/auth/components/UserMenu'

function DropIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M9 1.5C9 1.5 3.5 8.2 3.5 11.4a5.5 5.5 0 0 0 11 0C14.5 8.2 9 1.5 9 1.5Z"
        fill="var(--color-accent)"
        fillOpacity="0.9"
      />
      <path
        d="M7.2 11.8c0 1.2.9 2 1.8 2"
        stroke="var(--color-bg-app)"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function TopNavigation() {
  return (
    <header className="flex min-w-0 shrink-0 flex-wrap items-start gap-x-4 gap-y-1 bg-[var(--color-bg-app)] px-3 py-1.5 sm:px-4">
      {/* One row. Title sits slightly above the controls; controls wrap under it when narrow. */}
      <div className="flex min-w-0 items-center gap-2.5">
        <DropIcon />
        <p className="min-w-0 truncate text-xl font-semibold leading-tight tracking-tight text-[var(--color-text-primary)]">
          Water Resources Quality Monitoring
        </p>
      </div>

      <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-x-4 gap-y-1.5 pt-1.5">
        {/* Auto margins centre the chips in the space between title and right controls. */}
        <div className="mx-auto flex min-w-0 max-w-full overflow-x-auto">
          <LakeConditionFilter />
        </div>

        <div className="flex min-w-0 flex-nowrap items-center justify-end gap-x-4 whitespace-nowrap">
          <NavDatePicker />
          <LakeSearch />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
