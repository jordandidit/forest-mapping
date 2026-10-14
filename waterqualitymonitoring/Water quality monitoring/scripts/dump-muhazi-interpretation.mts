import { interpretLakeCondition } from '@/domain/intelligence/lake-condition'
import { makeObservation, makeWaterBody } from '@/domain/intelligence/__fixtures__/lakes'

const waterBody = makeWaterBody({
  id: 'lake-muhazi',
  name: 'Lake Muhazi',
  status: 'moderate',
  statusLabel: 'Fair',
  statusNote: 'Monitoring note from production.',
  turbidityTrendLabel: 'Stable',
  chlorophyllTrendLabel: 'Stable',
})

const observation = makeObservation({
  qualityLabel: 'Valid',
  usablePixelPercentage: 71,
})

const result = interpretLakeCondition({
  waterBody,
  latestObservation: observation,
})

console.log(JSON.stringify(result, null, 2))
