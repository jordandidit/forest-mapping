import { describe, expect, it } from 'vitest'
import { makeObservation, makeWaterBody } from '@/domain/intelligence/__fixtures__/lakes'
import { buildObservationExplorer } from '@/features/observations/observation-explorer'
import {
  HISTORICAL_OVERLAY_NOTE,
  HISTORICAL_RASTER_UNAVAILABLE,
  historicalSentinelMosaic,
  isHistoricalObservation,
  layerToRestore,
  mapLayerWhileViewing,
  observationSceneDay,
  rasterModeAvailability,
  resolveSentinelMosaic,
  unavailableSentinelMosaic,
} from '@/features/map/historical-sentinel'

const PRODUCTION_WHERE =
  "category = 1 AND cloudcover <= 20 AND acquisitiondate >= timestamp '2026-07-07 00:00:00'"

const august = makeObservation({
  id: 'aug-29',
  date: '2026-08-29',
  acquisitionDay: '2026-08-29',
  acquiredAt: '2026-08-29T00:00:00Z',
  qualityLabel: 'Valid',
  tiles: ['T35MRT', 'T35MRU'],
})

const cloudy = makeObservation({
  id: 'sep-20',
  date: '2026-09-20',
  acquisitionDay: '2026-09-20',
  acquiredAt: '2026-09-20T00:00:00Z',
  qualityLabel: 'Cloudy',
  turbidity: null,
  ndci: null,
  tiles: ['T35MQU'],
})

describe('historical sentinel mode — WATER-HISTORY-04E', () => {
  it('treats a selected observation as historical mode and null as Latest', () => {
    expect(isHistoricalObservation(null)).toBe(false)
    expect(isHistoricalObservation(august)).toBe(true)
  })

  it('switches the map to Satellite while a historical observation is selected', () => {
    expect(mapLayerWhileViewing(true, 'turbidity')).toBe('true_colour')
    expect(mapLayerWhileViewing(true, 'ndci')).toBe('true_colour')
    expect(mapLayerWhileViewing(false, 'turbidity')).toBe('turbidity')
  })

  it('sends the selected acquisition day to the Sentinel mosaic', () => {
    const choice = resolveSentinelMosaic(PRODUCTION_WHERE, august)
    expect(choice.status).toBe('scene')
    if (choice.status !== 'scene') return
    expect(choice.spec.sortField).toBe('acquisitiondate')
    expect(choice.spec.sortValue).toBe('2026/08/29')
    expect(choice.spec.method).toBe('attribute')
    expect(choice.spec.where).toContain("timestamp '2026-08-29 00:00:00'")
    expect(choice.spec.where).toContain("timestamp '2026-08-30 00:00:00'")
    expect(choice.spec.where).toContain("tilename IN ('T35MRT','T35MRU')")
    expect(choice.spec.where).not.toContain('cloudcover')
    expect(choice.spec.where).not.toContain('2026-09-20')
  })

  it('prefers acq_day over obs_date', () => {
    expect(
      observationSceneDay({
        acquisitionDay: '2026-08-29',
        date: '2026-08-28',
      }),
    ).toBe('2026-08-29')
    expect(observationSceneDay({ acquisitionDay: null, date: '2026-08-29' })).toBe('2026-08-29')
  })

  it('disables turbidity and chlorophyll spatial modes historically', () => {
    expect(rasterModeAvailability(true, 'satellite')).toEqual({ enabled: true })
    expect(rasterModeAvailability(true, 'turbidity')).toEqual({
      enabled: false,
      reason: HISTORICAL_RASTER_UNAVAILABLE,
    })
    expect(rasterModeAvailability(true, 'chlorophyll')).toEqual({
      enabled: false,
      reason: HISTORICAL_RASTER_UNAVAILABLE,
    })
    expect(rasterModeAvailability(false, 'turbidity')).toEqual({ enabled: true })
  })

  it('does not present the current overlay period as the selected-date raster', () => {
    const view = buildObservationExplorer({
      observations: [august],
      selectedObservationId: august.id,
      currentStatusLabel: 'Good',
      overlayPeriod: '2026-07-25 to 2026-09-17',
    })
    const scene = historicalSentinelMosaic(august)
    expect(view.currentConditionLabel).toBe('Good')
    expect(view.readout?.overallLakeStatus).toBeNull()
    expect(view.readout?.qualityLabel).toBe('Valid')
    expect(scene?.where).not.toContain('2026-07-25')
    expect(scene?.where).not.toContain(view.map.mapOverlay)
    expect(HISTORICAL_OVERLAY_NOTE).toMatch(/unavailable/i)
  })

  it('restores the production mosaic where-clause for Latest', () => {
    const latest = resolveSentinelMosaic(PRODUCTION_WHERE, null)
    expect(latest).toEqual({ status: 'production', where: PRODUCTION_WHERE })
    expect(layerToRestore('turbidity')).toBe('turbidity')
    expect(layerToRestore(null)).toBe('true_colour')
  })

  it('keeps a cloudy observation on its own scene', () => {
    const spec = historicalSentinelMosaic(cloudy)
    expect(spec?.where).toContain("timestamp '2026-09-20 00:00:00'")
    expect(spec?.where).toContain("tilename IN ('T35MQU')")
    expect(spec?.where).not.toContain('2026-08-29')
    expect(spec?.where).not.toContain('cloudcover')
    expect(cloudy.turbidity).toBeNull()
    expect(cloudy.ndci).toBeNull()
  })

  it('does not fall back to the production mosaic when the scene day is missing', () => {
    const choice = resolveSentinelMosaic(PRODUCTION_WHERE, {
      date: 'not-a-day',
      acquisitionDay: null,
    })
    expect(choice.status).toBe('unavailable')
    expect(unavailableSentinelMosaic(null).where).toBe('1 = 0')
    expect(unavailableSentinelMosaic(null).where).not.toBe(PRODUCTION_WHERE)
  })

  it('leaves WaterBodies status on the lake, not the historical observation', () => {
    const lake = makeWaterBody({ status: 'good', statusLabel: 'Good' })
    const view = buildObservationExplorer({
      observations: [cloudy],
      selectedObservationId: cloudy.id,
      currentStatusLabel: lake.statusLabel,
    })
    expect(lake.statusLabel).toBe('Good')
    expect(view.currentConditionLabel).toBe('Good')
    expect(view.readout?.qualityLabel).toBe('Cloudy')
    expect(view.readout?.overallLakeStatus).toBeNull()
  })
})
