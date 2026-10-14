import lakeBureraIcon from '@/assets/lake-burera.jpg'
import lakeIhemaIcon from '@/assets/lake-ihema.jpg'
import lakeKivuIcon from '@/assets/lake-icon.jpg'
import lakeMihindiIcon from '@/assets/lake-mihindi.jpg'
import lakeMpangaIcon from '@/assets/lake-mpanga.jpg'
import lakeMuhaziIcon from '@/assets/lake-muhazi.jpg'
import lakeRuhondoIcon from '@/assets/lake-ruhondo.jpg'
import lakeRweruIcon from '@/assets/lake-rweru.jpg'

export interface LakeIcon {
  src: string
  crop: string
  credit: string
}

/**
 * Photos that belong to a named lake stay on that lake.
 * Kivu, Ihema, Mpanga, Mihindi, and Rweru are the supplied photographs.
 * Muhazi, Burera, and Ruhondo are their own pictures.
 */
const NAMED_ICONS: Record<string, LakeIcon> = {
  muhazi: {
    src: lakeMuhaziIcon,
    crop: 'object-[72%_64%]',
    credit: 'Reneplee, CC BY-SA 4.0',
  },
  kivu: {
    src: lakeKivuIcon,
    crop: 'object-[68%_42%]',
    credit: 'Lake Kivu',
  },
  ihema: {
    src: lakeIhemaIcon,
    crop: 'object-[50%_58%]',
    credit: 'Lake Ihema',
  },
  mpanga: {
    src: lakeMpangaIcon,
    crop: 'object-[50%_78%]',
    credit: 'Lake Mpanga',
  },
  mihindi: {
    src: lakeMihindiIcon,
    crop: 'object-[50%_46%]',
    credit: 'Lake Mihindi',
  },
  rweru: {
    src: lakeRweruIcon,
    crop: 'object-[42%_58%]',
    credit: 'Lake Rweru',
  },
  burera: {
    src: lakeBureraIcon,
    crop: 'object-[46%_58%]',
    credit: 'Johnlove TUYIRINGIRE, CC BY-SA 4.0',
  },
  ruhondo: {
    src: lakeRuhondoIcon,
    crop: 'object-[42%_58%]',
    credit: 'Muremi, CC BY-SA 4.0',
  },
}

/** Supplied photographs, each with crops that read differently at thumbnail size. */
const FILLER_PHOTOS: { src: string; crops: string[] }[] = [
  { src: lakeKivuIcon, crops: ['object-[68%_42%]', 'object-[18%_28%]', 'object-[50%_80%]'] },
  { src: lakeIhemaIcon, crops: ['object-[12%_62%]', 'object-[50%_38%]', 'object-[88%_64%]'] },
  { src: lakeMpangaIcon, crops: ['object-[50%_78%]', 'object-[28%_32%]', 'object-[74%_60%]'] },
  { src: lakeMihindiIcon, crops: ['object-[50%_72%]', 'object-[36%_42%]', 'object-[64%_28%]'] },
  { src: lakeRweruIcon, crops: ['object-[42%_58%]', 'object-[16%_36%]', 'object-[70%_78%]'] },
]

function lakeKey(lake: { id: string; name: string }): string {
  const fromName = lake.name.replace(/^lake\s+/i, '').trim().toLowerCase()
  const fromId = lake.id.replace(/^lake-/, '').trim().toLowerCase()
  if (NAMED_ICONS[fromName]) return fromName
  if (NAMED_ICONS[fromId]) return fromId
  if (NAMED_ICONS[lake.id.toLowerCase()]) return lake.id.toLowerCase()
  return ''
}

function hashString(value: string): number {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function shuffle<T>(items: T[], seed: number): T[] {
  const copy = [...items]
  let state = seed || 1
  const random = () => {
    state = Math.imul(state ^ (state >>> 15), state | 1)
    state ^= state + Math.imul(state ^ (state >>> 7), state | 61)
    return ((state ^ (state >>> 14)) >>> 0) / 4294967296
  }
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    const swap = copy[i]!
    copy[i] = copy[j]!
    copy[j] = swap
  }
  return copy
}

function fillerDeck(count: number, seed: number): LakeIcon[] {
  const deck: LakeIcon[] = []
  const rounds = Math.ceil(count / FILLER_PHOTOS.length)
  for (let copy = 0; copy < rounds && deck.length < count; copy += 1) {
    for (const photo of FILLER_PHOTOS) {
      if (deck.length >= count) break
      deck.push({
        src: photo.src,
        crop: photo.crops[copy % photo.crops.length] ?? '',
        credit: '',
      })
    }
  }
  return shuffle(deck, seed)
}

/**
 * Named lakes keep their own photograph. Every other lake gets one of the
 * supplied photographs. The fill is shuffled, then adjusted so neighboring
 * rows do not repeat the same picture.
 */
export function assignLakeIcons(lakes: { id: string; name: string }[]): Map<string, LakeIcon> {
  const missing = lakes.filter((lake) => !lakeKey(lake)).length
  const seed = lakes.reduce((sum, lake) => (sum + hashString(`${lake.id}|${lake.name}`)) >>> 0, 1)
  const deck = fillerDeck(missing, seed)
  const assigned = new Map<string, LakeIcon>()
  let deckIndex = 0
  let previousSrc = ''

  for (const lake of lakes) {
    const named = NAMED_ICONS[lakeKey(lake)]
    if (named) {
      assigned.set(lake.id, named)
      previousSrc = named.src
      continue
    }

    let swapAt = deckIndex
    while (swapAt < deck.length && deck[swapAt]!.src === previousSrc) swapAt += 1
    if (swapAt < deck.length && swapAt !== deckIndex) {
      const swap = deck[deckIndex]!
      deck[deckIndex] = deck[swapAt]!
      deck[swapAt] = swap
    }
    const icon = deck[deckIndex]
    if (!icon) continue
    deckIndex += 1
    assigned.set(lake.id, icon)
    previousSrc = icon.src
  }

  return assigned
}
