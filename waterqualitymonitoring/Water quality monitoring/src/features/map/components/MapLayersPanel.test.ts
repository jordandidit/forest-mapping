import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { MapZoomControls } from '@/features/lakes/components/MapToolbar'
import { MapLayersPanel } from '@/features/map/components/MapLayersPanel'

const noop = () => {}

function renderPanel(open: boolean) {
  return renderToStaticMarkup(
    createElement(MapLayersPanel, {
      id: 'layers-panel',
      open,
      onClose: noop,
      status: 'ready',
      references: [
        { key: 'waterBodies', label: 'Water bodies', description: 'Lake outlines.', locked: true, visible: true },
        { key: 'districts', label: 'District boundaries', description: 'Districts.', locked: false, visible: false },
      ],
      onToggleReference: noop,
    }),
  )
}

describe('map layers control', () => {
  it('renders the layers toggle as an icon button in the vertical toolbar', () => {
    const html = renderToStaticMarkup(
      createElement(MapZoomControls, {
        layers: { open: false, onToggle: noop, controlsId: 'layers-panel' },
      }),
    )
    expect(html).toContain('aria-label="Map layers"')
    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain('aria-controls="layers-panel"')
    // Icon only — no floating text label.
    expect(html).not.toMatch(/>Layers</)
    // Rendered after the existing zoom/home/fullscreen controls.
    expect(html.indexOf('aria-label="Full screen"')).toBeLessThan(html.indexOf('aria-label="Map layers"'))
  })

  it('reflects the open state on the toggle', () => {
    const html = renderToStaticMarkup(
      createElement(MapZoomControls, {
        layers: { open: true, onToggle: noop, controlsId: 'layers-panel' },
      }),
    )
    expect(html).toContain('aria-expanded="true"')
  })

  it('omits the layers toggle when no layers control is supplied', () => {
    const html = renderToStaticMarkup(createElement(MapZoomControls))
    expect(html).not.toContain('aria-label="Map layers"')
  })

  it('hides the panel when closed and shows its contents when open', () => {
    const closed = renderPanel(false)
    expect(closed).toContain('id="layers-panel"')
    expect(closed).toMatch(/<div[^>]*hidden=""/)
    expect(closed).not.toContain('<summary')

    const open = renderPanel(true)
    expect(open).not.toMatch(/<div[^>]*id="layers-panel"[^>]*hidden=""/)
    expect(open).toContain('District boundaries')
  })

  it('has no satellite/turbidity/chlorophyll controls; the map-mode selector owns them', () => {
    const open = renderPanel(true)
    expect(open).not.toContain('type="radio"')
    expect(open).not.toContain('Investigation overlay')
    expect(open).toContain('switched with the map mode selector')
  })

  it('renders Water bodies locked and boundaries toggleable', () => {
    const open = renderPanel(true)
    expect(open.match(/type="checkbox"/g)).toHaveLength(2)
    expect(open.match(/disabled=""/g)).toHaveLength(1)
    expect(open).toContain('Always on')
    expect(open).not.toContain('Unavailable')
  })
})
