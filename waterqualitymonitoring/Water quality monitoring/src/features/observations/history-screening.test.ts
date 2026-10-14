import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { makeObservation } from '@/domain/intelligence/__fixtures__/lakes'
import { ObservationHistory } from '@/features/observations/components/ObservationHistory'
import {
  presentHistoryScreening,
  storedScreeningLabel,
} from '@/features/observations/history-screening'

const CLASSES = {
  Low: 'text-[var(--color-status-good)]',
  Moderate: 'text-[var(--color-status-moderate)]',
  High: 'text-[var(--color-status-poor)]',
  'Very high': 'text-[var(--color-status-critical)]',
} as const

const NEUTRAL = 'text-[var(--color-status-unknown)]'

describe('observation history screening colors', () => {
  it('colors stored FNU classes with the status palette', () => {
    const cases = [
      { level: 'Low', value: 4.2 },
      { level: 'Moderate', value: 18.4 },
      { level: 'High', value: 31 },
      { level: 'Very high', value: 80 },
    ] as const

    for (const item of cases) {
      const presentation = presentHistoryScreening({
        metric: 'FNU',
        value: item.value,
        level: item.level,
      })
      expect(presentation.className).toBe(CLASSES[item.level])
      expect(presentation.color).toBe(
        item.level === 'Low'
          ? 'var(--color-status-good)'
          : item.level === 'Moderate'
            ? 'var(--color-status-moderate)'
            : item.level === 'High'
              ? 'var(--color-status-poor)'
              : 'var(--color-status-critical)',
      )
      expect(presentation.showDot).toBe(true)
      expect(presentation.className).not.toBe(
        item.level === 'Very high' ? CLASSES.High : undefined,
      )
      expect(presentation.ariaLabel).toBe(`FNU ${presentation.text}, ${item.level}`)
      expect(presentation.title).toBe(`Turbidity ${presentation.text} FNU · ${item.level}`)
    }
  })

  it('colors stored NDCI classes and keeps the value in the accessible name', () => {
    const presentation = presentHistoryScreening({
      metric: 'NDCI',
      value: 0.052,
      level: 'Moderate',
    })
    expect(presentation.text).toBe('0.052')
    expect(presentation.className).toBe(CLASSES.Moderate)
    expect(presentation.showDot).toBe(true)
    expect(presentation.color).toBe('var(--color-status-moderate)')
    expect(presentation.ariaLabel).toBe('NDCI 0.052, Moderate')
    expect(presentation.title).toBe('NDCI 0.052 · Moderate')

    expect(
      presentHistoryScreening({ metric: 'NDCI', value: 0.01, level: 'Low' }).className,
    ).toBe(CLASSES.Low)
    expect(
      presentHistoryScreening({ metric: 'NDCI', value: 0.1, level: 'High' }).className,
    ).toBe(CLASSES.High)
    expect(
      presentHistoryScreening({ metric: 'NDCI', value: 0.2, level: 'Very high' }).className,
    ).toBe(CLASSES['Very high'])
  })

  it('matches the stored label without treating Very high as High', () => {
    expect(storedScreeningLabel(' very   high ')).toBe('Very high')
    expect(storedScreeningLabel('HIGH')).toBe('High')
    expect(storedScreeningLabel('Elevated')).toBeNull()
    expect(storedScreeningLabel('Valid')).toBeNull()
    expect(storedScreeningLabel('Cloudy')).toBeNull()
  })

  it('leaves a missing measurement as an uncolored dash', () => {
    const fnu = presentHistoryScreening({ metric: 'FNU', value: null, level: 'Low' })
    const ndci = presentHistoryScreening({ metric: 'NDCI', value: null, level: 'Very high' })

    expect(fnu.text).toBe('—')
    expect(ndci.text).toBe('—')
    expect(fnu.className).toBe(NEUTRAL)
    expect(fnu.color).toBe('var(--color-status-unknown)')
    expect(ndci.className).toBe(NEUTRAL)
    expect(ndci.color).toBe('var(--color-status-unknown)')
    expect(fnu.showDot).toBe(false)
    expect(ndci.showDot).toBe(false)
    expect(fnu.className).not.toBe(CLASSES.Low)
    expect(ndci.className).not.toBe(CLASSES['Very high'])
    expect(fnu.ariaLabel).toBe('FNU —')
    expect(ndci.ariaLabel).toBe('NDCI —')
    expect(fnu.title).toBeUndefined()
    expect(fnu.ariaLabel).not.toContain('Low')
    expect(ndci.ariaLabel).not.toContain('Very high')
  })

  it('does not invent a class from the number, quality, or a blank level', () => {
    const blank = presentHistoryScreening({ metric: 'FNU', value: 80, level: '   ' })
    const missing = presentHistoryScreening({ metric: 'NDCI', value: 0.2, level: null })

    expect(blank.className).toBeNull()
    expect(blank.color).toBeNull()
    expect(blank.showDot).toBe(false)
    expect(blank.text).toBe('80')
    expect(blank.ariaLabel).toBe('FNU 80')
    expect(blank.title).toBeUndefined()
    expect(missing.className).toBeNull()
    expect(missing.showDot).toBe(false)
    expect(missing.ariaLabel).toBe('NDCI 0.2')
    expect(missing.ariaLabel).not.toContain('Very high')
  })
})

describe('observation history row', () => {
  it('colors stored classes in the table and keeps invalid rows as dashes', () => {
    const html = renderToStaticMarkup(
      createElement(ObservationHistory, {
        selectedId: null,
        onSelect: () => undefined,
        observations: [
          makeObservation({
            id: 'valid',
            date: '2026-09-03',
            qualityLabel: 'Valid',
            turbidity: 18.4,
            turbidityLevel: 'Moderate',
            ndci: 0.052,
            chlorophyllLevel: 'Low',
          }),
          makeObservation({
            id: 'cloudy',
            date: '2026-08-21',
            quality: 'unusable',
            qualityLabel: 'Cloudy',
            turbidity: null,
            ndci: null,
            turbidityLevel: 'Low',
            chlorophyllLevel: 'Low',
          }),
          makeObservation({
            id: 'hazy',
            date: '2026-08-01',
            quality: 'fair',
            qualityLabel: 'Hazy or glint',
            turbidity: null,
            ndci: null,
            turbidityLevel: null,
            chlorophyllLevel: null,
          }),
          makeObservation({
            id: 'few-pixels',
            date: '2026-07-20',
            quality: 'fair',
            qualityLabel: 'Too few water pixels',
            turbidity: null,
            ndci: null,
            turbidityLevel: 'High',
            chlorophyllLevel: 'Very high',
          }),
        ],
      }),
    )

    expect(html).toContain('aria-label="FNU 18.4, Moderate"')
    expect(html).toContain('aria-label="NDCI 0.052, Low"')
    expect(html).toContain(CLASSES.Moderate)
    expect(html).toContain(CLASSES.Low)
    expect(html).toContain('style="color:var(--color-status-moderate)"')
    expect(html).toContain('style="color:var(--color-status-good)"')
    expect(html).toContain('style="background-color:currentColor"')
    expect(html).toContain('title="Turbidity 18.4 FNU · Moderate"')
    expect(html).toContain('title="NDCI 0.052 · Low"')
    expect(html).toContain('rounded-full')
    expect(html).toContain('<button')
    expect(html).toContain(NEUTRAL)
    expect(html).toContain('aria-label="FNU —"')
    expect(html).toContain('aria-label="NDCI —"')
    expect(html).not.toContain('aria-label="FNU —, Low"')
    expect(html).not.toContain('aria-label="NDCI —, Low"')
    expect(html).not.toContain('aria-label="Turbidity —')
    expect(html.match(/aria-label="FNU —"/g)).toHaveLength(3)
    expect(html.split(CLASSES.Low).length - 1).toBe(1)
  })
})
