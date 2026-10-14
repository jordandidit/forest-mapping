import { describe, expect, it } from 'vitest'
import * as methodology from '@/domain/methodology/water-quality-methodology'
import {
  METHODOLOGY_REFERENCE_TYPES,
  currentMeasurementUpdate,
  externalStandards,
  methodologyEntries,
  pipelineCitations,
  rasterBands,
} from '@/domain/methodology/water-quality-methodology'

const EXPECTED_KEYS = [
  'turbidity',
  'ndci',
  'chlorophyll-a',
  'bloom-risk',
  'floating-vegetation',
  'lake-condition',
  'observation-quality',
  'turb_base',
  'ndci_base',
]

describe('water-quality methodology inventory — WATER-METHOD-05A', () => {
  it('loads definitions and the expected indicator keys', () => {
    expect(methodologyEntries.length).toBeGreaterThan(0)
    expect(methodologyEntries.map((entry) => entry.key)).toEqual(EXPECTED_KEYS)
    expect(rasterBands.map((band) => band.bandId)).toEqual([0, 1, 2, 3])
  })

  it('marks every entry with an explicit reference type', () => {
    for (const entry of methodologyEntries) {
      expect(METHODOLOGY_REFERENCE_TYPES).toContain(entry.referenceType)
    }
    expect(methodologyEntries.find((entry) => entry.key === 'turb_base')?.referenceType).toBe(
      'historical-baseline',
    )
    expect(methodologyEntries.find((entry) => entry.key === 'ndci_base')?.referenceType).toBe(
      'historical-baseline',
    )
    expect(methodologyEntries.find((entry) => entry.key === 'turbidity')?.referenceType).toBe(
      'pipeline-screening',
    )
  })

  it('does not claim an external standard without a source', () => {
    expect(externalStandards).toEqual([])
    for (const standard of externalStandards) {
      expect(standard.referenceType).toBe('external-standard')
      expect(standard.source.path.trim().length).toBeGreaterThan(0)
      expect(standard.source.detail.trim().length).toBeGreaterThan(0)
    }
    expect(methodologyEntries.some((entry) => entry.referenceType === 'external-standard')).toBe(
      false,
    )
  })

  it('does not export a status calculation', () => {
    expect(Object.values(methodology).some((value) => typeof value === 'function')).toBe(false)
    expect(
      Object.keys(methodology).some((name) => /calculat|classify|deriveStatus/i.test(name)),
    ).toBe(false)
  })

  it('records pipeline screening rules recovered from executable notebook code', () => {
    const turbidity = methodologyEntries.find((entry) => entry.key === 'turbidity')
    const ndci = methodologyEntries.find((entry) => entry.key === 'ndci')
    const bloom = methodologyEntries.find((entry) => entry.key === 'bloom-risk')
    const vegetation = methodologyEntries.find((entry) => entry.key === 'floating-vegetation')
    const condition = methodologyEntries.find((entry) => entry.key === 'lake-condition')
    const quality = methodologyEntries.find((entry) => entry.key === 'observation-quality')

    expect(turbidity?.classes?.map((item) => item.label)).toEqual([
      'Low',
      'Moderate',
      'High',
      'Very high',
    ])
    expect(turbidity?.classes?.[0]?.bounds).toBe('turbidity_fnu < 10')
    expect(ndci?.classes?.[3]?.bounds).toBe('0.15 <= ndci < 9')
    expect(bloom?.explanation).toContain('ndci')
    expect(bloom?.explanation).toContain('fai')
    expect(bloom?.classes?.map((item) => item.label)).toEqual(['High', 'Elevated', 'Low'])
    expect(vegetation?.classes?.[0]).toEqual({ label: 'Yes', bounds: 'floating_veg_pct >= 10' })
    expect(condition?.classes?.map((item) => item.label)).toEqual([
      'Pending',
      'No recent data',
      'Poor',
      'Fair',
      'Good',
    ])
    expect(condition?.classes?.find((item) => item.label === 'No recent data')?.bounds).toContain(
      'days_since_obs > 45',
    )
    expect(quality?.knownLabels).toEqual([
      'Valid',
      'Cloudy',
      'Hazy or glint',
      'Too few water pixels',
    ])
    expect(currentMeasurementUpdate.rule).toContain('Valid')
    expect(pipelineCitations.map((item) => item.topic)).toEqual([
      'Turbidity conversion',
      'NDCI',
      'Chlorophyll estimate',
      'Bloom thresholds',
      'FAI',
      'NDTI',
      'Water masking',
      'Classification thresholds and status',
    ])
    expect(JSON.stringify(pipelineCitations).includes('WHO')).toBe(false)
  })
})
