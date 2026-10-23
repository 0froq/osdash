import type { ReasonCode } from '#shared/reason'
import { copy } from '~/copy/en'

function actorName(actor: string | null): string {
  return actor && actor.length > 0 ? actor : copy.someone
}

/** Reason line for a card. Clef quotes are shown by the caller when present. */
export function reasonText(code: ReasonCode, actor: string | null): string {
  const name = actorName(actor)
  switch (code) {
    case 'claimed-open-pr':
      return copy.reason.claimedOpenPr
    case 'claim-pending':
      return copy.reason.claimPending
    case 'ci-failed':
      return copy.reason.ciFailed
    case 'ci-lint-failed':
      return copy.reason.ciLintFailed
    case 'cla-failed':
      return copy.reason.claFailed
    case 'changes-requested':
      return copy.reason.changesRequested(name)
    case 'coderabbit':
      return copy.reason.coderabbit
    case 'mentioned':
      return copy.reason.mentioned(name)
    case 'asked-pr-or-rebase':
      return copy.reason.askedPr(name)
    case 'asked-waiting':
      return copy.reason.askedWaiting
    case 'already-fixed':
      return copy.reason.alreadyFixed
    case 'workaround':
      return copy.reason.workaround
    case 'opened-waiting':
      return copy.reason.openedWaiting
    case 'replied-waiting':
      return copy.reason.repliedWaiting
    case 'pushed-waiting':
      return copy.reason.pushedWaiting
    case 'commented':
      return copy.reason.commented(name)
    case 'approved':
      return copy.reason.approved(name)
    case 'review-dismissed':
      return copy.reason.reviewDismissed(name)
    case 'pushed':
      return copy.reason.pushed(name)
    case 'merged':
      return copy.reason.merged
    case 'closed':
      return copy.reason.closed
    case 'clef':
      return copy.reason.clef
    default: {
      const exhaustive: never = code
      return exhaustive
    }
  }
}

/**
 * Short status under an issue card in "Not my turn".
 * Does not assign the next actor: an issue may be a question or a self-proposed PR.
 */
export function issueStatus(code: ReasonCode): string {
  if (code === 'opened-waiting') return copy.status.justOpened
  return copy.status.open
}
