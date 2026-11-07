import type { ReasonCode } from '#shared/reason'
import type { TFunc } from '#shared/i18n'

function actorName(t: TFunc, actor: string | null): string {
  return actor && actor.length > 0 ? actor : t('someone')
}

/** Reason line for a card. Clef quotes are shown by the caller when present. */
export function reasonText(t: TFunc, code: ReasonCode, actor: string | null): string {
  const name = actorName(t, actor)
  switch (code) {
    case 'claimed-open-pr':
      return t('reason.claimedOpenPr')
    case 'claim-pending':
      return t('reason.claimPending')
    case 'ci-failed':
      return t('reason.ciFailed')
    case 'ci-lint-failed':
      return t('reason.ciLintFailed')
    case 'cla-failed':
      return t('reason.claFailed')
    case 'changes-requested':
      return t('reason.changesRequested', { actor: name })
    case 'coderabbit':
      return t('reason.coderabbit')
    case 'mentioned':
      return t('reason.mentioned', { actor: name })
    case 'asked-pr-or-rebase':
      return t('reason.askedPr', { actor: name })
    case 'asked-waiting':
      return t('reason.askedWaiting')
    case 'already-fixed':
      return t('reason.alreadyFixed')
    case 'workaround':
      return t('reason.workaround')
    case 'opened-waiting':
      return t('reason.openedWaiting')
    case 'replied-waiting':
      return t('reason.repliedWaiting')
    case 'pushed-waiting':
      return t('reason.pushedWaiting')
    case 'commented':
      return t('reason.commented', { actor: name })
    case 'approved':
      return t('reason.approved', { actor: name })
    case 'review-dismissed':
      return t('reason.reviewDismissed', { actor: name })
    case 'pushed':
      return t('reason.pushed', { actor: name })
    case 'merged':
      return t('reason.merged')
    case 'closed':
      return t('reason.closed')
    case 'clef':
      return t('reason.clef')
    default: {
      const exhaustive: never = code
      return exhaustive
    }
  }
}

/**
 * Short status under an issue card while it is waiting.
 * Does not assign the next actor: an issue may be a question or a self-proposed PR.
 */
export function issueStatus(t: TFunc, code: ReasonCode): string {
  if (code === 'opened-waiting') return t('status.justOpened')
  return t('status.open')
}
