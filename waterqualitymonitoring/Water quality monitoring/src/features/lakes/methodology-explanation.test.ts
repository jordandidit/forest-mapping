import { describe, expect, it } from 'vitest'
import { makeObservation, makeWaterBody } from '@/domain/intelligence/__fixtures__/lakes'
import {
  HISTORICAL_COMPARISON,
  PIPELINE_SCREENING_BENCHMARK,
  buildMethodologyExplanation,
  methodologyDrawerOpen,
} from '@/features/lakes/methodology-explanation'

describe('methodology explanation — WATER-METHOD-05B', () => {
  it('opens from the methodology action and closes from close or escape', () => {
    expect(methodologyDrawerOpen(false, 'open')).toBe(true)
    expect(methodologyDrawerOpen(true, 'close')).toBe(false)
    expect(methodologyDrawerOpen(true, 'escape')).toBe(false)
  })

  it('takes the current condition from the stored WaterBodies status label', () => {
    const explanation = buildMethodologyExplanation({
      lakeName: 'Lake Muhazi',
      statusLabel: 'Fair',
      metrics: makeWaterBody({
        status: 'poor',
        statusLabel: 'Fair',
        metrics: { turbidity: 80, turbidityLevel: 'Very high', chlorophyllLevel: 'Low', ndci: 0.01 },
      }).metrics,
    })

    expect(explanation.conditionLabel).toBe('Fair')
    expect(explanation.title).toBe('Why is Lake Muhazi Fair?')
    expect(explanation.traces.every((trace) => trace.condition === 'Fair')).toBe(true)
    expect(explanation.drivers.some((driver) => driver.title.startsWith('Turbidity'))).toBe(false)
  })

  it('shows the stored chlorophyll class and its inventory range', () => {
    const explanation = buildMethodologyExplanation({
      lakeName: 'Lake Muhazi',
      statusLabel: 'Fair',
      metrics: makeWaterBody().metrics,
    })
    const chlorophyll = explanation.drivers.find((driver) => driver.title.includes('Chlorophyll'))
    const trace = explanation.traces.find((item) => item.measurementName === 'NDCI')

    expect(chlorophyll?.title).toBe('Chlorophyll condition · Moderate')
    expect(chlorophyll?.reference).toBe(PIPELINE_SCREENING_BENCHMARK)
    expect(trace?.measurementValue).toBe('0.052')
    expect(trace?.classification).toBe('Moderate')
    expect(trace?.range).toBe('0.02–0.08')
    expect(trace?.condition).toBe('Fair')
    expect(explanation.ndciScale.find((row) => row.label === 'Moderate')?.current).toBe(true)
    expect(explanation.turbidityScale.map((row) => row.range)).toEqual([
      '<10 FNU',
      '10–25 FNU',
      '25–60 FNU',
      '≥60 FNU',
    ])
  })

  it('labels screening rules as a pipeline benchmark', () => {
    const explanation = buildMethodologyExplanation({
      lakeName: 'Lake Muhazi',
      statusLabel: 'Fair',
      metrics: makeWaterBody().metrics,
    })
    const text = JSON.stringify(explanation)

    expect(explanation.referenceLabel).toBe(PIPELINE_SCREENING_BENCHMARK)
    expect(explanation.disclaimer).toMatch(/not regulatory/i)
    expect(text).not.toMatch(/WHO|Rwanda standard|legal limit|safety limit/i)
  })

  it('identifies the 14-month baseline as historical', () => {
    const explanation = buildMethodologyExplanation({
      lakeName: 'Lake Muhazi',
      statusLabel: 'Fair',
      metrics: makeWaterBody().metrics,
      baselineComparisons: ['44% below 14-month mean'],
    })

    expect(explanation.baseline.referenceLabel).toBe(HISTORICAL_COMPARISON)
    expect(explanation.baseline.summary).toMatch(/14-month/)
    expect(explanation.baseline.turbBase).toMatch(/mean of monthly turbidity means/)
    expect(explanation.baseline.ndciBase).toMatch(/mean of monthly NDCI means/)
    expect(explanation.baseline.notAnEnvironmentalStandard).toMatch(/not an environmental standard/i)
    expect(explanation.baseline.comparisons).toEqual(['44% below 14-month mean'])
  })

  it('does not give a historical observation the current overall status', () => {
    const explanation = buildMethodologyExplanation({
      lakeName: 'Lake Muhazi',
      statusLabel: 'Fair',
      observation: makeObservation({
        turbidityLevel: 'Low',
        chlorophyllLevel: 'Moderate',
        ndci: 0.052,
      }),
    })

    expect(explanation.mode).toBe('observation')
    expect(explanation.title).toBe('How is this observation interpreted?')
    expect(explanation.title).not.toMatch(/Why is/)
    expect(explanation.conditionLabel).toBe('Fair')
    expect(explanation.traces.every((trace) => trace.condition === null)).toBe(true)
    expect(explanation.traces.some((trace) => trace.classification === 'Moderate')).toBe(true)
  })

  it('does not manufacture classifications for a cloudy observation', () => {
    const explanation = buildMethodologyExplanation({
      lakeName: 'Lake Muhazi',
      statusLabel: 'Fair',
      observation: makeObservation({
        qualityLabel: 'Cloudy',
        turbidity: null,
        ndci: null,
        floatingVegetation: null,
        bloomRisk: null,
        turbidityLevel: null,
        chlorophyllLevel: null,
      }),
    })

    expect(explanation.traces).toEqual([])
    expect(explanation.drivers).toEqual([])
    expect(explanation.ndciScale.every((row) => row.current === false)).toBe(true)
    expect(explanation.observation?.rows.find((row) => row.label === 'Turbidity')?.value).toBe('—')
    expect(explanation.observation?.rows.find((row) => row.label === 'NDCI')?.value).toBe('—')
    expect(explanation.observation?.notice).toMatch(/no valid water-quality measurement/i)
    expect(explanation.title).not.toMatch(/Why is/)
  })

  it('keeps null measurements as an em dash', () => {
    const explanation = buildMethodologyExplanation({
      lakeName: 'Lake Muhazi',
      statusLabel: 'Fair',
      metrics: makeWaterBody({
        metrics: { turbidity: null, turbidityLevel: 'Moderate', ndci: null, chlorophyllLevel: 'Moderate' },
      }).metrics,
    })

    expect(explanation.traces.find((trace) => trace.measurementName === 'Turbidity')?.measurementValue).toBe(
      '—',
    )
    expect(explanation.traces.find((trace) => trace.measurementName === 'NDCI')?.measurementValue).toBe('—')
  })
})
