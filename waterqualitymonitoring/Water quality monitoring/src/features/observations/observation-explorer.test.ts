import { describe, expect, it } from 'vitest'
import { makeObservation, makeWaterBody } from '@/domain/intelligence/__fixtures__/lakes'
import {
  buildObservationExplorer,
  defaultObservationSelection,
  mapInspectionLabels,
  NO_VALID_WATER_QUALITY_MEASUREMENT,
  observationDateOptionLabel,
  returnToLatestSelection,
  selectExistingObservation,
} from '@/features/observations/observation-explorer'

const overlayPeriod = '25 Jul–17 Sep 2026'

const september = makeObservation({
  id: 'sep-03',
  date: '2026-09-03',
  acquiredAt: '2026-09-03T10:00:00Z',
  qualityLabel: 'Valid',
  turbidity: 1.7,
  ndci: 0.052,
  floatingVegetation: 3.2,
  usablePixelPercentage: 98,
  cloudCover: 4,
  bloomRisk: 'low',
})

const cloudy = makeObservation({
  id: 'sep-08',
  date: '2026-09-08',
  acquiredAt: '2026-09-08T10:00:00Z',
  qualityLabel: 'Cloudy',
  turbidity: null,
  ndci: null,
  floatingVegetation: null,
  usablePixelPercentage: null,
  cloudCover: 80,
  bloomRisk: null,
})

const hazy = makeObservation({
  id: 'aug-31',
  date: '2026-08-31',
  acquiredAt: '2026-08-31T09:00:00Z',
  qualityLabel: 'Hazy or glint',
  turbidity: null,
  ndci: null,
  floatingVegetation: null,
  usablePixelPercentage: 12,
  cloudCover: null,
  bloomRisk: null,
})

const observations = [hazy, september, cloudy]

describe('observation date explorer — WATER-HISTORY-04C', () => {
  it('defaults to Latest', () => {
    const selectedObservationId = defaultObservationSelection()
    const view = buildObservationExplorer({
      observations,
      selectedObservationId,
      currentStatusLabel: 'Fair',
      overlayPeriod,
    })

    expect(selectedObservationId).toBeNull()
    expect(view.mode).toBe('latest')
    expect(view.selectedObservationId).toBeNull()
    expect(view.readout).toBeNull()
    expect(view.map.selectedObservation).toBe('Latest')
    expect(view.options.map(observationDateOptionLabel)).toEqual([
      '08 Sep 2026 · Cloudy',
      '03 Sep 2026 · Valid',
      '31 Aug 2026 · Hazy or glint',
    ])
    expect(view.options.map((option) => option.date)).not.toContain('2026-09-01')
  })

  it('selects an existing observation', () => {
    const selectedObservationId = selectExistingObservation(observations, 'sep-03')
    const view = buildObservationExplorer({
      observations,
      selectedObservationId,
      currentStatusLabel: 'Fair',
      overlayPeriod,
    })

    expect(selectedObservationId).toBe('sep-03')
    expect(selectExistingObservation(observations, 'not-a-date')).toBeNull()
    expect(view.mode).toBe('observation')
    expect(view.readout?.date).toBe('2026-09-03')
    expect(view.readout?.qualityLabel).toBe('Valid')
    expect(view.readout?.display.turbidityFnu).toBe('1.7 FNU')
    expect(view.readout?.display.ndci).toBe('0.052')
    expect(view.readout?.display.floatingVegetation).toBe('3.2%')
    expect(view.readout?.display.clear).toBe('98%')
    expect(view.readout?.display.cloud).toBe('4%')
    expect(view.readout?.display.bloomRisk).toBe('low')
    expect(view.readout?.notice).toBeNull()
    expect(view.readout?.overallLakeStatus).toBeNull()
    expect(view.map.selectedObservation).toBe('03 Sep 2026')
  })

  it('keeps the date selector and history on the same selection', () => {
    const fromSelector = selectExistingObservation(observations, 'aug-31')
    const fromHistory = selectExistingObservation(observations, 'aug-31')

    expect(fromSelector).toBe(fromHistory)
    expect(fromSelector).toBe('aug-31')

    const selectorView = buildObservationExplorer({
      observations,
      selectedObservationId: fromSelector,
      currentStatusLabel: 'Fair',
      overlayPeriod,
    })
    const historyView = buildObservationExplorer({
      observations,
      selectedObservationId: fromHistory,
      currentStatusLabel: 'Fair',
      overlayPeriod,
    })

    expect(selectorView).toEqual(historyView)
    expect(selectorView.readout?.qualityLabel).toBe('Hazy or glint')
    expect(selectorView.readout?.notice).toBe(NO_VALID_WATER_QUALITY_MEASUREMENT)
  })

  it('displays null measurements as dashes', () => {
    const sparse = makeObservation({
      id: 'sparse',
      date: '2026-09-03',
      qualityLabel: 'Valid',
      turbidity: null,
      ndci: null,
      floatingVegetation: null,
      usablePixelPercentage: null,
      cloudCover: null,
      bloomRisk: null,
    })
    const view = buildObservationExplorer({
      observations: [sparse],
      selectedObservationId: 'sparse',
      currentStatusLabel: 'Fair',
    })
    const zero = makeObservation({
      id: 'zero',
      date: '2026-08-21',
      qualityLabel: 'Valid',
      turbidity: 0,
      ndci: 0,
      floatingVegetation: 0,
      usablePixelPercentage: 0,
      cloudCover: 0,
      bloomRisk: null,
    })
    const zeroView = buildObservationExplorer({
      observations: [zero],
      selectedObservationId: 'zero',
    })

    expect(view.readout?.turbidity).toBeNull()
    expect(view.readout?.ndci).toBeNull()
    expect(view.readout?.floatingVegetation).toBeNull()
    expect(view.readout?.clearPercent).toBeNull()
    expect(view.readout?.cloudPercent).toBeNull()
    expect(view.readout?.display.turbidityFnu).toBe('—')
    expect(view.readout?.display.ndci).toBe('—')
    expect(view.readout?.display.floatingVegetation).toBe('—')
    expect(view.readout?.display.clear).toBe('—')
    expect(view.readout?.display.cloud).toBe('—')
    expect(view.readout?.display.quality).toBe('Valid')
    expect(view.readout?.display.bloomRisk).toBeNull()
    expect(view.readout?.display.turbidityFnu).not.toBe('0')
    expect(zeroView.readout?.turbidity).toBe(0)
    expect(zeroView.readout?.display.turbidityFnu).toBe('0 FNU')
    expect(zeroView.readout?.display.ndci).toBe('0')
  })

  it('does not copy previous measurements onto a cloudy observation', () => {
    const view = buildObservationExplorer({
      observations,
      selectedObservationId: selectExistingObservation(observations, 'sep-08'),
      currentStatusLabel: 'Fair',
      overlayPeriod,
    })

    expect(view.mode).toBe('observation')
    expect(view.readout?.qualityLabel).toBe('Cloudy')
    expect(view.readout?.notice).toBe(NO_VALID_WATER_QUALITY_MEASUREMENT)
    expect(view.readout?.turbidity).toBeNull()
    expect(view.readout?.ndci).toBeNull()
    expect(view.readout?.floatingVegetation).toBeNull()
    expect(view.readout?.clearPercent).toBeNull()
    expect(view.readout?.bloomRisk).toBeNull()
    expect(view.readout?.display.turbidityFnu).toBe('—')
    expect(view.readout?.display.ndci).toBe('—')
    expect(view.readout?.display.cloud).toBe('80%')
    expect(view.readout?.display.turbidityFnu).not.toContain('1.7')
    expect(view.readout?.display.ndci).not.toContain('0.052')
    expect(view.readout?.previousValidDate).toBe('2026-09-03')
    expect(view.readout?.overallLakeStatus).toBeNull()
  })

  it('does not change the current water body status', () => {
    const lake = makeWaterBody({
      status: 'poor',
      statusLabel: 'Fair',
      statusNote: 'Pipeline note',
    })
    const view = buildObservationExplorer({
      observations,
      selectedObservationId: 'sep-08',
      currentStatusLabel: lake.statusLabel,
      overlayPeriod,
    })

    expect(lake.status).toBe('poor')
    expect(lake.statusLabel).toBe('Fair')
    expect(lake.statusNote).toBe('Pipeline note')
    expect(view.currentConditionLabel).toBe('Fair')
    expect(view.readout?.overallLakeStatus).toBeNull()
    expect(view.readout?.qualityLabel).toBe('Cloudy')
    expect(view.readout?.qualityLabel).not.toBe(lake.statusLabel)
    expect(view.currentConditionLabel).not.toBe('Poor')
  })

  it('does not treat the selected observation date as the raster overlay', () => {
    const latest = mapInspectionLabels(null, overlayPeriod)
    const historical = mapInspectionLabels('2026-09-03', overlayPeriod)
    const view = buildObservationExplorer({
      observations,
      selectedObservationId: 'sep-03',
      overlayPeriod,
    })

    expect(latest.mapOverlay).toBe(overlayPeriod)
    expect(historical.selectedObservation).toBe('03 Sep 2026')
    expect(historical.mapOverlay).toBe(overlayPeriod)
    expect(historical.mapOverlay).toBe(latest.mapOverlay)
    expect(historical.mapOverlay).not.toBe(historical.selectedObservation)
    expect(view.map).toEqual(historical)
  })

  it('clears the selection when returning to latest', () => {
    let selectedObservationId: string | null = selectExistingObservation(observations, 'sep-08')
    expect(
      buildObservationExplorer({ observations, selectedObservationId }).mode,
    ).toBe('observation')

    selectedObservationId = returnToLatestSelection()
    const view = buildObservationExplorer({
      observations,
      selectedObservationId,
      currentStatusLabel: 'Fair',
      overlayPeriod,
    })

    expect(selectedObservationId).toBeNull()
    expect(view.mode).toBe('latest')
    expect(view.selectedObservationId).toBeNull()
    expect(view.readout).toBeNull()
    expect(view.map.selectedObservation).toBe('Latest')
    expect(view.map.mapOverlay).toBe(overlayPeriod)
    expect(view.currentConditionLabel).toBe('Fair')
  })
})
