/** Matching lakes shown before "View more lakes". */
export const SIDEBAR_INITIAL_LAKE_COUNT = 10

/** Lakes added or removed by one "View more" / "View less" click. */
export const SIDEBAR_LAKE_PAGE_SIZE = 10

export interface SidebarLakePreview<T> {
  lakes: T[]
  /** Matching lakes still outside the current window. */
  hiddenCount: number
}

/**
 * Window an already-filtered lake list.
 * Condition and search must be applied before this runs.
 * Does not change the open lake or return a route.
 * When the selected lake matches but sits past the window, it is
 * appended so it stays visible.
 */
export function previewSidebarLakes<T extends { id: string }>(
  matchingLakes: readonly T[],
  options: { visibleCount?: number; selectedLakeId?: string | null },
): SidebarLakePreview<T> {
  const limit = Math.max(
    SIDEBAR_INITIAL_LAKE_COUNT,
    options.visibleCount ?? SIDEBAR_INITIAL_LAKE_COUNT,
  )
  if (matchingLakes.length <= limit) {
    return { lakes: [...matchingLakes], hiddenCount: 0 }
  }

  const head = matchingLakes.slice(0, limit)
  const selectedId = options.selectedLakeId
  const selectedInHead = selectedId != null && head.some((lake) => lake.id === selectedId)
  if (selectedId == null || selectedInHead) {
    return {
      lakes: head,
      hiddenCount: matchingLakes.length - head.length,
    }
  }

  const selected = matchingLakes.find((lake) => lake.id === selectedId)
  const lakes = selected ? [...head, selected] : head
  return {
    lakes,
    hiddenCount: matchingLakes.length - lakes.length,
  }
}
