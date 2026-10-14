import type { ObservationAvailabilityItem } from '@/domain/observation/types'
import { LAKE_MUHAZI_ID } from '@/data/mock/lakes'

export const muhaziAvailability: ObservationAvailabilityItem[] = [
  {
    id: 'avail-2026-10-03',
    waterBodyId: LAKE_MUHAZI_ID,
    date: '2026-10-03',
    usability: 'usable',
    qualityLabel: 'Valid',
    usablePixelPercentage: 94,
  },
  {
    id: 'avail-2026-09-28',
    waterBodyId: LAKE_MUHAZI_ID,
    date: '2026-09-28',
    usability: 'usable',
    qualityLabel: 'Valid',
    usablePixelPercentage: 89,
  },
  {
    id: 'avail-2026-09-23',
    waterBodyId: LAKE_MUHAZI_ID,
    date: '2026-09-23',
    usability: 'cloudy',
    qualityLabel: 'Cloudy',
    usablePixelPercentage: 32,
  },
  {
    id: 'avail-2026-09-18',
    waterBodyId: LAKE_MUHAZI_ID,
    date: '2026-09-18',
    usability: 'usable',
    qualityLabel: 'Valid',
    usablePixelPercentage: 92,
  },
  {
    id: 'avail-2026-09-13',
    waterBodyId: LAKE_MUHAZI_ID,
    date: '2026-09-13',
    usability: 'cloudy',
    qualityLabel: 'Cloudy',
    usablePixelPercentage: null,
  },
  {
    id: 'avail-2026-09-08',
    waterBodyId: LAKE_MUHAZI_ID,
    date: '2026-09-08',
    usability: 'usable',
    qualityLabel: 'Valid',
    usablePixelPercentage: 88,
  },
  {
    id: 'avail-2026-09-03',
    waterBodyId: LAKE_MUHAZI_ID,
    date: '2026-09-03',
    usability: 'usable',
    qualityLabel: 'Valid',
    usablePixelPercentage: 91,
  },
  {
    id: 'avail-2026-08-29',
    waterBodyId: LAKE_MUHAZI_ID,
    date: '2026-08-29',
    usability: 'cloudy',
    qualityLabel: 'Cloudy',
    usablePixelPercentage: null,
  },
]

export function getAvailabilityForLake(
  waterBodyId: string,
): ObservationAvailabilityItem[] {
  if (waterBodyId === LAKE_MUHAZI_ID) {
    return muhaziAvailability
  }
  return []
}
