import type { Activity, Item, Tone } from './turn'
import { isBot, isSelf } from './identity'

const DAY_MS = 24 * 60 * 60 * 1000

export type ClaimLevel = 'assigned' | 'confirmed' | 'self-claimed'

export const MAINTAINER_ASSOCIATIONS = new Set(['OWNER', 'MEMBER', 'COLLABORATOR'])

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

export function isMaintainerAssociation(association?: string): boolean {
  return association !== undefined && MAINTAINER_ASSOCIATIONS.has(association)
}

function sortedComments(activities: Activity[]): Activity[] {
  return activities
    .filter(activity => activity.kind === 'comment')
    .sort((first, second) => Date.parse(first.at) - Date.parse(second.at))
}

function myClaimComments(activities: Activity[]): Activity[] {
  return sortedComments(activities).filter(
    activity => isSelf(activity.actor) && activity.body && isClaimComment(activity.body),
  )
}

function latestClaimActivity(activities: Activity[]): Activity | undefined {
  const claims = sortedComments(activities).filter(
    activity =>
      isSelf(activity.actor) &&
      activity.body &&
      (isClaimComment(activity.body) || isClaimQuestion(activity.body)),
  )
  return claims.at(-1)
}

function maintainerRepliedAfter(activities: Activity[], at: string): boolean {
  const moment = Date.parse(at)
  return sortedComments(activities).some(
    activity =>
      Date.parse(activity.at) > moment &&
      !isSelf(activity.actor) &&
      !isBot(activity.actor) &&
      isMaintainerAssociation(activity.authorAssociation),
  )
}

export function isClaimInvalidated(item: Item): boolean {
  if (item.kind !== 'issue') return false
  if (item.state === 'closed' || item.state === 'merged') return true

  const othersPr = item.linkedPullRequests?.some(pr => !isSelf(pr.author)) ?? false
  if (othersPr) return true

  return sortedComments(item.activities).some(
    activity => isSelf(activity.actor) && activity.body && isRelinquishComment(activity.body),
  )
}

export function claimLevel(item: Item): ClaimLevel | null {
  if (item.kind !== 'issue' || isClaimInvalidated(item)) return null

  if (item.assignees?.some(assignee => isSelf(assignee))) return 'assigned'

  const claims = myClaimComments(item.activities)
  const questionOnly =
    claims.length === 0 &&
    sortedComments(item.activities).some(
      activity => isSelf(activity.actor) && activity.body && isClaimQuestion(activity.body),
    )
  if (claims.length === 0 && !questionOnly) return null

  for (const claim of claims) {
    if (maintainerRepliedAfter(item.activities, claim.at)) return 'confirmed'
  }

  return 'self-claimed'
}

export function pendingClaimQuestion(item: Item): boolean {
  if (item.kind !== 'issue') return false
  if (!claimLevel(item)) return false

  const latest = latestClaimActivity(item.activities)
  if (!latest?.body || !isClaimQuestion(latest.body)) return false
  return !maintainerRepliedAfter(item.activities, latest.at)
}

export function hideIssueForLinkedPr(item: Item): boolean {
  if (item.kind !== 'issue') return false
  return item.linkedPullRequests?.some(pr => isSelf(pr.author) && pr.state === 'open') ?? false
}

export function includeIssueOnBoard(item: Item): boolean {
  if (item.kind !== 'issue') return true
  if (isSelf(item.author)) return true
  if (isClaimInvalidated(item)) return false
  return claimLevel(item) !== null
}

export function selfClaimedStaleTone(ageMs: number): Tone {
  if (ageMs > 14 * DAY_MS) return 'red'
  if (ageMs > 7 * DAY_MS) return 'yellow'
  return 'none'
}

export function claimWaitingSince(item: Item): string {
  const latest = latestClaimActivity(item.activities)
  if (latest) return latest.at
  return item.createdAt
}
