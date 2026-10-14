import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { makeObservation, makeWaterBody } from '@/domain/intelligence/__fixtures__/lakes'
import { interpretLakeCondition } from '@/domain/intelligence/lake-condition'
import {
  ConditionExplanation,
  LakeConditionPanel,
} from '@/features/lakes/components/LakeConditionPanel'
import {
  discloseConditionExplanation,
  CONDITION_EXPLANATION_PREVIEW_SENTENCES,
} from '@/features/lakes/condition-hierarchy'

describe('condition explanation disclosure', () => {
  it('keeps the first two sentences of the existing summary and hides the status note', () => {
    const summary =
      'Current monitoring status for Lake Kivu is Fair. Bloom risk is Elevated. Turbidity is classified as Low.'
    const note = 'Full production status note that should stay collapsed.'
    const disclosure = discloseConditionExplanation(summary, note)

    expect(CONDITION_EXPLANATION_PREVIEW_SENTENCES).toBe(2)
    expect(disclosure.preview).toBe(
      'Current monitoring status for Lake Kivu is Fair. Bloom risk is Elevated.',
    )
    expect(disclosure.summary).toBe(summary)
    expect(disclosure.note).toBe(note)
    expect(disclosure.hasMore).toBe(true)
    expect(disclosure.preview).not.toContain('status note')
    expect(disclosure.preview).not.toContain('Turbidity')
  })

  it('does not split a decimal inside an existing sentence', () => {
    const summary = 'Latest turbidity is 1.7 FNU. Current bloom risk is Low.'
    expect(discloseConditionExplanation(summary, null).preview).toBe(summary)
  })

  it('stops the lead before a sentence that would run past two lines', () => {
    const summary =
      'Current monitoring status for Lake Muhazi is Fair. Turbidity is classified as Low, while chlorophyll conditions are classified as Moderate and remain above the usual seasonal reading for this lake.'
    const disclosure = discloseConditionExplanation(summary, null)
    expect(disclosure.preview).toBe('Current monitoring status for Lake Muhazi is Fair.')
    expect(disclosure.summary).toBe(summary)
    expect(disclosure.hasMore).toBe(true)
  })

  it('hides the control when the existing explanation already fits and there is no note', () => {
    const summary = 'Current monitoring status for Lake Kivu is Fair. Bloom risk is Elevated.'
    const disclosure = discloseConditionExplanation(summary, '  ')
    expect(disclosure.preview).toBe(summary)
    expect(disclosure.note).toBeNull()
    expect(disclosure.hasMore).toBe(false)
  })
})

describe('lake condition hierarchy', () => {
  const lake = makeWaterBody({
    name: 'Lake Kivu',
    status: 'good',
    statusLabel: 'Fair',
    statusNote: 'Production status note stays behind view more.',
    metrics: {
      turbidityLevel: 'High',
      chlorophyllLevel: 'Moderate',
      bloomRisk: 'elevated',
      floatingVegetationFlag: false,
    },
  })
  const observation = makeObservation({ qualityLabel: 'Valid', date: '2026-09-03' })

  function panelHtml() {
    return renderToStaticMarkup(
      createElement(LakeConditionPanel, { lake, observation }),
    )
  }

  it('shows the authoritative status before a short explanation and view more', () => {
    const interpretation = interpretLakeCondition({ waterBody: lake, latestObservation: observation })
    const disclosure = discloseConditionExplanation(
      interpretation.condition.summary,
      interpretation.condition.note,
    )
    const html = panelHtml()
    const condition = html.slice(0, html.indexOf('<dialog'))

    expect(interpretation.condition.status).toBe('Fair')
    expect(condition).toContain('Lake Condition')
    expect(condition.indexOf('Lake Condition')).toBeLessThan(condition.indexOf('Fair'))
    expect(condition).not.toContain('is Good')
    expect(condition).toContain(disclosure.preview)
    expect(condition).toContain('View more details')
    expect(condition).not.toContain('Production status note stays behind view more.')
    if (disclosure.summary.length > disclosure.preview.length) {
      const hidden = disclosure.summary.slice(disclosure.preview.length).trim()
      expect(hidden.length).toBeGreaterThan(0)
      expect(condition).not.toContain(hidden)
    }
  })

  it('reveals the existing summary and status note from view more', () => {
    const interpretation = interpretLakeCondition({ waterBody: lake, latestObservation: observation })
    const closed = renderToStaticMarkup(
      createElement(ConditionExplanation, {
        summary: interpretation.condition.summary,
        note: interpretation.condition.note,
        open: false,
        onToggle: () => undefined,
      }),
    )
    const open = renderToStaticMarkup(
      createElement(ConditionExplanation, {
        summary: interpretation.condition.summary,
        note: interpretation.condition.note,
        open: true,
        onToggle: () => undefined,
      }),
    )

    expect(closed).toContain('View more details')
    expect(closed).not.toContain('Production status note stays behind view more.')
    expect(open).toContain(interpretation.condition.summary)
    expect(open).toContain('Production status note stays behind view more.')
    expect(open).toContain('Hide details')
    expect(open).not.toContain('polluted')
  })

  it('keeps condition, attention, signals, change, and quality in that order', () => {
    const html = panelHtml()
    const condition = html.indexOf('Lake Condition')
    const attention = html.indexOf('>Attention<')
    const signals = html.indexOf('Current Signals')
    const changed = html.indexOf('What Changed')
    const quality = html.indexOf('Observation Quality')

    expect(condition).toBeGreaterThan(-1)
    expect(condition).toBeLessThan(attention)
    expect(attention).toBeLessThan(signals)
    expect(signals).toBeLessThan(changed)
    expect(changed).toBeLessThan(quality)
  })

  it('keeps one methodology action and collapsed evidence controls', () => {
    const html = panelHtml()
    expect(html.match(/How is this determined\?/g)).toHaveLength(1)
    expect(html).toContain('View evidence')
    expect(html).toContain('aria-expanded="false">View evidence')
    expect(html).toContain('View Evidence')
    expect(html).toContain('Turbidity is currently classified as High.')
    expect(html).toContain('Chlorophyll conditions are currently classified as Moderate.')
  })

  it('keeps historical observation mode on the selected scene without replacing lake status', () => {
    const historical = makeObservation({
      id: 'hist-1',
      date: '2026-08-01',
      qualityLabel: 'Cloudy',
    })
    const html = renderToStaticMarkup(
      createElement(LakeConditionPanel, {
        lake,
        observation,
        selectedObservation: historical,
        observations: [observation, historical],
      }),
    )

    expect(html).toContain('Observation')
    expect(html).toContain('Cloudy')
    expect(html).toContain('Current condition: Fair')
    expect(html).toContain('How is this determined?')
    expect(html).not.toContain('Current Signals')
    expect(html).not.toContain('What Changed')
    expect(html).not.toContain('View more details')
    expect(html).not.toContain('Production status note stays behind view more.')
  })
})
