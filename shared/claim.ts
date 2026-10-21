import type { Activity, Item, Tone } from './turn'
import { isBot, isSelf, viewerLoginOf } from './identity'
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

function myClaimComments(activities: Activity[], viewer: string): Activity[] {
  return sortedComments(activities).filter(
    activity => isSelf(activity.actor, viewer) && activity.body && isClaimActivity(activity),
  )
}

function latestClaimActivity(activities: Activity[], viewer: string): Activity | undefined {
  const claims = sortedComments(activities).filter(
    activity =>
      isSelf(activity.actor, viewer) &&
      activity.body &&
      (isClaimActivity(activity) || isAskActivity(activity)),
  )
  return claims.at(-1)
}

function maintainerRepliedAfter(activities: Activity[], at: string, viewer: string): boolean {
  const moment = Date.parse(at)
  return sortedComments(activities).some(
    activity =>
      Date.parse(activity.at) > moment &&
      !isSelf(activity.actor, viewer) &&
      !isBot(activity.actor) &&
      (maintainerApproved(activity) ||
        (activity.classification?.maintainerOk === undefined &&
          activity.classification?.source !== 'ai' &&
          activity.classification?.source !== 'cache' &&
          isMaintainerAssociation(activity.authorAssociation))),
  )
}

function assignedToSomeoneElse(item: Item, viewer: string): boolean {
  const assignees = item.assignees ?? []
  return assignees.length > 0 && !assignees.some(assignee => isSelf(assignee, viewer))
}

export function isClaimInvalidated(item: Item): boolean {
  const viewer = viewerLoginOf(item)
  if (item.kind !== 'issue') return false
  if (item.state === 'closed' || item.state === 'merged') return true

  if (assignedToSomeoneElse(item, viewer)) return true

  const othersPr = item.linkedPullRequests?.some(pr => !isSelf(pr.author, viewer)) ?? false
  if (othersPr) return true

  return sortedComments(item.activities).some(
    activity => isSelf(activity.actor, viewer) && activity.body && isWithdrawActivity(activity),
  )
}

export function claimLevel(item: Item): ClaimLevel | null {
  const viewer = viewerLoginOf(item)
  if (item.kind !== 'issue' || isClaimInvalidated(item)) return null

  if (item.assignees?.some(assignee => isSelf(assignee, viewer))) return 'assigned'

  const claims = myClaimComments(item.activities, viewer)
  const questionOnly =
    claims.length === 0 &&
    sortedComments(item.activities).some(
      activity => isSelf(activity.actor, viewer) && activity.body && isAskActivity(activity),
    )
  if (claims.length === 0 && !questionOnly) return null

  for (const claim of claims) {
    if (canConfirmClaim(claim) && maintainerRepliedAfter(item.activities, claim.at, viewer)) {
      return 'confirmed'
    }
  }

  return 'self-claimed'
}

export function pendingClaimQuestion(item: Item): boolean {
  const viewer = viewerLoginOf(item)
  if (item.kind !== 'issue') return false
  if (!claimLevel(item)) return false

  const latest = latestClaimActivity(item.activities, viewer)
  if (!latest?.body || !isAskActivity(latest)) return false
  return !maintainerRepliedAfter(item.activities, latest.at, viewer)
}

export function hideIssueForLinkedPr(item: Item): boolean {
  const viewer = viewerLoginOf(item)
  if (item.kind !== 'issue') return false
  return (
    item.linkedPullRequests?.some(pr => isSelf(pr.author, viewer) && pr.state === 'open') ?? false
  )
}

export function includeIssueOnBoard(item: Item): boolean {
  const viewer = viewerLoginOf(item)
  if (item.kind !== 'issue') return true
  if (isSelf(item.author, viewer)) return true
  if (isClaimInvalidated(item)) return false
  return claimLevel(item) !== null
}

export function selfClaimedStaleTone(ageMs: number): Tone {
  if (ageMs > 14 * DAY_MS) return 'red'
  if (ageMs > 7 * DAY_MS) return 'yellow'
  return 'none'
}

export function claimWaitingSince(item: Item): string {
  const latest = latestClaimActivity(item.activities, viewerLoginOf(item))
  if (latest) return latest.at
  return item.createdAt
}
