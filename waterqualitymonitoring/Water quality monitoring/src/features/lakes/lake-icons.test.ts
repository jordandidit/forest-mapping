import { describe, expect, it } from 'vitest'
import { assignLakeIcons } from '@/features/lakes/lake-icons'

const named = [
  'Lake Muhazi',
  'Lake Kivu',
  'Lake Ihema',
  'Lake Mpanga',
  'Lake Mihindi',
  'Lake Rweru',
  'Lake Burera',
  'Lake Ruhondo',
]

function row(name: string, id = name.toLowerCase().replace(/\s+/g, '-')) {
  return { id, name }
}

describe('lake sidebar icons', () => {
  it('keeps a photograph on the lake it belongs to', () => {
    const lakes = named.map((name) => row(name))
    const icons = assignLakeIcons(lakes)
    const kivu = icons.get('lake-kivu')
    const muhazi = icons.get('lake-muhazi')
    expect(kivu?.src).toBeTruthy()
    expect(kivu?.src).not.toBe(muhazi?.src)
    expect(kivu?.credit).toBe('Lake Kivu')
    expect(muhazi?.credit).toContain('CC BY-SA')
  })

  it('fills unnamed lakes from the supplied photographs without a repeating stripe', () => {
    const lakes = [
      ...named.map((name) => row(name)),
      ...Array.from({ length: 24 }, (_, index) =>
        row(`Lake ${String.fromCharCode(65 + (index % 26))}${index}`, `gap-${index}`),
      ),
    ]
    const icons = assignLakeIcons(lakes)
    const sources = lakes.map((lake) => icons.get(lake.id)?.src)
    expect(sources.every(Boolean)).toBe(true)

    for (let index = 1; index < sources.length; index += 1) {
      expect(sources[index]).not.toBe(sources[index - 1])
    }

    const fillerSources = lakes
      .filter((lake) => lake.id.startsWith('gap-'))
      .map((lake) => icons.get(lake.id)?.src)
    const counts = new Map<string, number>()
    for (const src of fillerSources) {
      counts.set(src ?? '', (counts.get(src ?? '') ?? 0) + 1)
    }
    expect(counts.size).toBe(5)
    const tally = [...counts.values()]
    expect(Math.max(...tally) - Math.min(...tally)).toBeLessThanOrEqual(1)

    const sequence = fillerSources.join('|')
    const period = fillerSources.slice(0, 5).join('|')
    expect(sequence.includes(`${period}|${period}`)).toBe(false)
  })
})
