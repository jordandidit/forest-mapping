/** Sentences kept in the first visible condition explanation. */
export const CONDITION_EXPLANATION_PREVIEW_SENTENCES = 2

/**
 * About two lines in the insights column. Longer existing prose stays behind
 * "View more details" instead of being rewritten.
 */
const PREVIEW_LINE_BUDGET = 110

export interface ConditionExplanationDisclosure {
  /** Prefix of the existing summary. No new wording. */
  preview: string
  /** Existing summary, unchanged. */
  summary: string
  /** Existing status note. Shown only after expand. */
  note: string | null
  hasMore: boolean
}

function splitSentences(text: string): string[] {
  const trimmed = text.trim()
  if (!trimmed) return []

  const parts: string[] = []
  let start = 0
  for (let index = 0; index < trimmed.length; index += 1) {
    const char = trimmed[index]
    if (char !== '.' && char !== '!' && char !== '?') continue
    const previous = trimmed[index - 1]
    const next = trimmed[index + 1]
    if (char === '.' && previous && next && /\d/.test(previous) && /\d/.test(next)) continue
    if (next && !/\s/.test(next)) continue
    const sentence = trimmed.slice(start, index + 1).trim()
    if (sentence) parts.push(sentence)
    start = index + 1
  }

  const rest = trimmed.slice(start).trim()
  if (rest) parts.push(rest)
  return parts
}

/**
 * Window the existing condition summary and status note.
 * Does not rewrite, classify, or add a sentence.
 */
export function discloseConditionExplanation(
  summary: string,
  note: string | null | undefined,
): ConditionExplanationDisclosure {
  const full = summary.trim()
  const statusNote = note?.trim() ? note.trim() : null
  const sentences = splitSentences(full).slice(0, CONDITION_EXPLANATION_PREVIEW_SENTENCES)
  let preview = ''
  for (const sentence of sentences) {
    const next = preview ? `${preview} ${sentence}` : sentence
    if (preview && next.length > PREVIEW_LINE_BUDGET) break
    preview = next
  }
  const hasMore =
    preview !== full || statusNote != null || preview.length > PREVIEW_LINE_BUDGET

  return {
    preview,
    summary: full,
    note: statusNote,
    hasMore,
  }
}
