import type { ClaimIntent } from './claim-types'

/** Case-insensitive English claim phrases; tolerant of I will / a fix / this one. */
export const CLAIM_COMMENT_PATTERNS: readonly RegExp[] = [
  /\bi['']?ll\s+open\s+(?:a\s+)?pr\b/i,
  /\bi\s+will\s+open\s+(?:a\s+)?pr\b/i,
  /\bi['']?ll\s+send\s+(?:a\s+)?pr\b/i,
  /\bi\s+will\s+send\s+(?:a\s+)?pr\b/i,
  /\bi['']?d\s+like\s+to\s+work\s+on\s+this(?:\s+one)?\b/i,
  /\bi\s+can\s+take\s+this(?:\s+one)?\b/i,
  /\bhappy\s+to\s+submit\s+(?:a\s+)?pr\b/i,
  /\bi['']?m\s+working\s+on\s+(?:a\s+)?fix\b/i,
  /\bi\s+am\s+working\s+on\s+(?:a\s+)?fix\b/i,
]

const RELINQUISH_COMMENT_PATTERNS: readonly RegExp[] = [/\bgo\s+ahead\b/i, /\bunassign\s+me\b/i]

export function isClaimComment(body: string): boolean {
  const text = body.trim()
  if (!text) return false
  return CLAIM_COMMENT_PATTERNS.some(pattern => pattern.test(text))
}

export function isClaimQuestion(body: string): boolean {
  const text = body.trim()
  if (!text.endsWith('?')) return false
  if (isClaimComment(text)) return true
  return /\bcan\s+i\s+take\b/i.test(text) || /\bmay\s+i\s+(?:work\s+on|take)\b/i.test(text)
}

export function isRelinquishComment(body: string): boolean {
  const text = body.trim()
  if (!text) return false
  return RELINQUISH_COMMENT_PATTERNS.some(pattern => pattern.test(text))
}

export function classifyIntentKeyword(body: string): {
  intent: ClaimIntent
  intentConfidence: number
} {
  if (isRelinquishComment(body)) return { intent: 'withdraw', intentConfidence: 1 }
  if (isClaimQuestion(body)) return { intent: 'ask', intentConfidence: 1 }
  if (isClaimComment(body)) return { intent: 'claim', intentConfidence: 1 }
  return { intent: 'none', intentConfidence: 1 }
}
