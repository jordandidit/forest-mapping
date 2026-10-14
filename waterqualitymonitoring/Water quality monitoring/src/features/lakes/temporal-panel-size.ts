/** Smallest useful chart strip, including the observation history. */
export const TEMPORAL_PANEL_MIN_PX = 220

/** Leave the map and lake header some of the viewport. */
export const TEMPORAL_PANEL_MAX_RATIO = 0.72

export function clampTemporalPanelHeight(height: number, viewportHeight: number): number {
  const max = Math.max(TEMPORAL_PANEL_MIN_PX, Math.round(viewportHeight * TEMPORAL_PANEL_MAX_RATIO))
  return Math.min(max, Math.max(TEMPORAL_PANEL_MIN_PX, Math.round(height)))
}

/**
 * Dragging the handle upward grows the bottom panel.
 * `deltaY` is the pointer's vertical movement (down is positive).
 */
export function resizeTemporalPanelHeight(
  startHeight: number,
  deltaY: number,
  viewportHeight: number,
): number {
  return clampTemporalPanelHeight(startHeight - deltaY, viewportHeight)
}
