import { describe, expect, it } from 'vitest'
import {
  clampTemporalPanelHeight,
  resizeTemporalPanelHeight,
  TEMPORAL_PANEL_MIN_PX,
} from '@/features/lakes/temporal-panel-size'

describe('temporal panel resize', () => {
  it('grows the panel when the handle is dragged upward', () => {
    expect(resizeTemporalPanelHeight(320, -80, 1000)).toBe(400)
  })

  it('shrinks the panel when the handle is dragged downward', () => {
    expect(resizeTemporalPanelHeight(400, 50, 1000)).toBe(350)
  })

  it('does not shrink below the minimum chart height', () => {
    expect(resizeTemporalPanelHeight(240, 200, 1000)).toBe(TEMPORAL_PANEL_MIN_PX)
  })

  it('leaves room for the map', () => {
    expect(clampTemporalPanelHeight(5000, 1000)).toBe(720)
  })
})
