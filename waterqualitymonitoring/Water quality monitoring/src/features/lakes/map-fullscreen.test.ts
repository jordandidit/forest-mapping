import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MapZoomControls } from '@/features/lakes/components/MapToolbar'
import { fullscreenAction } from '@/features/lakes/map-fullscreen'

describe('map full screen', () => {
  it('enters full screen when the map is not already displayed that way', () => {
    const map = {}
    expect(fullscreenAction(null, map)).toBe('enter')
    expect(fullscreenAction(map, map)).toBe('exit')
  })

  it('renders a full screen button with the zoom controls', () => {
    const html = renderToStaticMarkup(createElement(MapZoomControls))
    expect(html).toContain('aria-label="Full screen"')
    expect(html).toContain('aria-label="Zoom in"')
    expect(html).toContain('aria-pressed="false"')
  })
})
