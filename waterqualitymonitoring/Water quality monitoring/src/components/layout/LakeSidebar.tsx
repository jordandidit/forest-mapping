import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authoritativeStatusLabel } from '@/domain/intelligence/helpers'
import { assignLakeIcons } from '@/features/lakes/lake-icons'
import { lakeConditionDotClass } from '@/features/lakes/lake-condition-filter'
import { TOTAL_MONITORED_LAKES } from '@/data/mock/lakes'
import { DataStatePanel } from '@/components/ui/DataStatePanel'
import {
  filterLakesForSidebar,
  lakeSidebarEmptyMessage,
} from '@/features/lakes/lake-condition-filter'
import {
  previewSidebarLakes,
  SIDEBAR_INITIAL_LAKE_COUNT,
  SIDEBAR_LAKE_PAGE_SIZE,
} from '@/features/lakes/sidebar-lake-list'
import { useWaterBodies } from '@/features/lakes/hooks/use-water-bodies'
import { useUiStore } from '@/stores/ui-store'
import { cn } from '@/lib/cn'

export function LakeSidebar() {
  const navigate = useNavigate()
  const {
    selectedLakeId,
    sidebarCollapsed,
    lakeSearchQuery,
    lakeConditionFilter,
    setSelectedLakeId,
    setSidebarCollapsed,
  } = useUiStore()

  const { data: lakes = [], isLoading, error } = useWaterBodies()
  const lakeIcons = useMemo(() => assignLakeIcons(lakes), [lakes])
  const lakeCount = Math.max(lakes.length, TOTAL_MONITORED_LAKES)
  const matchingLakes = filterLakesForSidebar(lakes, lakeConditionFilter, lakeSearchQuery)
  const listKey = `${lakeConditionFilter}\0${lakeSearchQuery}`
  const [extraByList, setExtraByList] = useState<Record<string, number>>({})
  const extraCount = extraByList[listKey] ?? 0
  const preview = previewSidebarLakes(matchingLakes, {
    visibleCount: SIDEBAR_INITIAL_LAKE_COUNT + extraCount,
    selectedLakeId,
  })
  const showMore = preview.hiddenCount > 0
  const showLess = extraCount > 0

  return (
    <aside
      className={cn(
        'flex h-full min-h-0 shrink-0 flex-col overflow-hidden rounded-[var(--radius-surface)] bg-[var(--color-bg-panel)] shadow-[var(--shadow-surface)] transition-[width] duration-[var(--transition-fast)]',
        sidebarCollapsed ? 'w-11' : 'w-[var(--sidebar-width)]',
        'lg:flex',
        sidebarCollapsed ? 'md:flex' : 'md:flex',
      )}
      aria-label="Lake monitoring controls"
    >
      <div className="flex items-center justify-end px-2 py-1.5 md:hidden lg:flex xl:hidden">
        <button
          type="button"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="rounded-[var(--radius-sm)] px-1.5 py-0.5 text-2xs text-[var(--color-text-muted)] hover:bg-[var(--color-bg-hover)]"
          aria-expanded={!sidebarCollapsed}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? '»' : '«'}
        </button>
      </div>

      {!sidebarCollapsed ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <section className="flex min-h-0 flex-1 flex-col px-2 pt-2" aria-labelledby="sidebar-lakes-heading">
            <h2 id="sidebar-lakes-heading" className="panel-section-title mb-1 shrink-0 px-1">
              Lakes
            </h2>
            <div className="min-h-0 flex-1 overflow-y-auto">
            <DataStatePanel
              isLoading={isLoading}
              error={error as Error | null}
              isEmpty={!isLoading && !error && lakes.length === 0}
              emptyMessage="No water bodies available."
              className="min-h-[80px]"
            >
              {matchingLakes.length === 0 ? (
                <p className="motion-settle px-1.5 py-1 text-2xs text-[var(--color-text-secondary)]">
                  {lakeSidebarEmptyMessage(lakeSearchQuery)}
                </p>
              ) : (
                <ul key={listKey} className="motion-settle space-y-2">
                    {preview.lakes.map((lake, index) => {
                      const selected = lake.id === selectedLakeId
                      const icon = lakeIcons.get(lake.id)
                      const statusText =
                        lake.statusLabel?.trim() ||
                        authoritativeStatusLabel(lake.statusLabel, lake.status) ||
                        '—'
                      return (
                        <li
                          key={lake.wbId || lake.id}
                          className={index >= SIDEBAR_INITIAL_LAKE_COUNT ? 'motion-expand' : undefined}
                        >
                          <button
                            type="button"
                            className={cn(
                              'motion-control group relative flex w-full items-center gap-1.5 rounded-[var(--radius-control)] px-1.5 py-1.5 text-left',
                              selected
                                ? 'bg-[var(--color-bg-panel-elevated)] shadow-[0_1px_2px_rgba(0,0,0,0.28)]'
                                : 'hover:bg-[var(--color-bg-hover)]/50',
                            )}
                            aria-current={selected ? 'true' : undefined}
                            aria-label={`${lake.name}. ${lake.province}. Status ${statusText}.`}
                            onClick={() => {
                              setSelectedLakeId(lake.id)
                              navigate(`/lakes/${lake.id}`)
                            }}
                          >
                            {icon ? (
                              <img
                                src={icon.src}
                                alt=""
                                title={icon.credit ? `${lake.name}. ${icon.credit}` : lake.name}
                                className={cn(
                                  'h-6 w-6 shrink-0 rounded-[var(--radius-sm)] object-cover',
                                  icon.crop,
                                )}
                              />
                            ) : (
                              <span
                                className="h-6 w-6 shrink-0 rounded-[var(--radius-sm)] bg-[linear-gradient(160deg,var(--color-border-strong),var(--color-bg-hover))]"
                                title={lake.name}
                                aria-hidden="true"
                              />
                            )}
                            <span className="min-w-0 flex-1">
                              <span
                                className={cn(
                                  'block truncate text-sm leading-snug text-[var(--color-text-primary)]',
                                  selected ? 'font-medium' : 'font-normal',
                                )}
                              >
                                {lake.name}
                              </span>
                              <span className="block truncate text-xs leading-snug text-[var(--color-text-secondary)]">
                                {lake.province}
                              </span>
                            </span>
                            <span
                              className={cn(
                                'h-1.5 w-1.5 shrink-0 rounded-full',
                                lakeConditionDotClass(lake.statusLabel),
                              )}
                              title={statusText}
                            />
                          </button>
                        </li>
                      )
                    })}
                </ul>
              )}
            </DataStatePanel>
            </div>
            <div className="flex shrink-0 flex-col gap-1.5 px-1 pb-3 pt-3">
              {showMore || showLess ? (
                <div className="flex items-center gap-3">
                  {showMore ? (
                    <button
                      type="button"
                      className="text-left text-2xs text-[var(--color-accent)] hover:underline"
                      onClick={() =>
                        setExtraByList((current) => ({
                          ...current,
                          [listKey]: (current[listKey] ?? 0) + SIDEBAR_LAKE_PAGE_SIZE,
                        }))
                      }
                    >
                      View more lakes
                    </button>
                  ) : null}
                  {showLess ? (
                    <button
                      type="button"
                      className={cn(
                        'text-2xs text-[var(--color-accent)] hover:underline',
                        showMore ? 'ml-auto text-right' : 'text-left',
                      )}
                      onClick={() =>
                        setExtraByList((current) => ({
                          ...current,
                          [listKey]: Math.max(0, (current[listKey] ?? 0) - SIDEBAR_LAKE_PAGE_SIZE),
                        }))
                      }
                    >
                      View less
                    </button>
                  ) : null}
                </div>
              ) : null}
              <Link
                to="/lakes"
                className="text-2xs text-[var(--color-accent)] hover:underline"
              >
                View all lakes ({lakeCount})
              </Link>
            </div>
          </section>
        </div>
      ) : null}
    </aside>
  )
}
