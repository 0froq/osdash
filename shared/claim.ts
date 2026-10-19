import type { Activity, Item, Tone } from './turn'
import { isBot, isSelf } from './identity'
import { isMaintainerAssociation } from './claim-types'
import {
  canConfirmClaim,
  isAskActivity,
  isClaimActivity,
  isWithdrawActivity,
  maintainerApproved,
  threadComments,
} from './claim-classifier'
export { CLAIM_COMMENT_PATTERNS } from './claim-keywords'
export { isClaimComment, isClaimQuestion, isRelinquishComment } from './claim-keywords'

const DAY_MS = 24 * 60 * 60 * 1000

export type ClaimLevel = 'assigned' | 'confirmed' | 'self-claimed'

export { isMaintainerAssociation, MAINTAINER_ASSOCIATIONS } from './claim-types'

function sortedComments(activities: Activity[]): Activity[] {
  return threadComments(activities)
}

function myClaimComments(activities: Activity[]): Activity[] {
  return sortedComments(activities).filter(
    activity => isSelf(activity.actor) && activity.body && isClaimActivity(activity),
  )
}

function latestClaimActivity(activities: Activity[]): Activity | undefined {
  const claims = sortedComments(activities).filter(
    activity =>
      isSelf(activity.actor) &&
      activity.body &&
      (isClaimActivity(activity) || isAskActivity(activity)),
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
      (maintainerApproved(activity) ||
        (activity.classification?.maintainerOk === undefined &&
          activity.classification?.source !== 'ai' &&
          activity.classification?.source !== 'cache' &&
          isMaintainerAssociation(activity.authorAssociation))),
  )
}

function assignedToSomeoneElse(item: Item): boolean {
  const assignees = item.assignees ?? []
  return assignees.length > 0 && !assignees.some(assignee => isSelf(assignee))
}

export function isClaimInvalidated(item: Item): boolean {
  if (item.kind !== 'issue') return false
  if (item.state === 'closed' || item.state === 'merged') return true

  if (assignedToSomeoneElse(item)) return true

  const othersPr = item.linkedPullRequests?.some(pr => !isSelf(pr.author)) ?? false
  if (othersPr) return true

  return sortedComments(item.activities).some(
    activity => isSelf(activity.actor) && activity.body && isWithdrawActivity(activity),
  )
}

export function claimLevel(item: Item): ClaimLevel | null {
  if (item.kind !== 'issue' || isClaimInvalidated(item)) return null

  if (item.assignees?.some(assignee => isSelf(assignee))) return 'assigned'

  const claims = myClaimComments(item.activities)
  const questionOnly =
    claims.length === 0 &&
    sortedComments(item.activities).some(
      activity => isSelf(activity.actor) && activity.body && isAskActivity(activity),
    )
  if (claims.length === 0 && !questionOnly) return null

  for (const claim of claims) {
    if (canConfirmClaim(claim) && maintainerRepliedAfter(item.activities, claim.at)) {
      return 'confirmed'
    }
  }

  return 'self-claimed'
}

export function pendingClaimQuestion(item: Item): boolean {
  if (item.kind !== 'issue') return false
  if (!claimLevel(item)) return false

  const latest = latestClaimActivity(item.activities)
  if (!latest?.body || !isAskActivity(latest)) return false
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
