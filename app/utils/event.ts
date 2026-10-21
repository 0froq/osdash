import type { CheckConclusion, ReviewState } from '#shared/turn'
import type { EventKind, UnitEvent } from '#shared/events'
import { copy } from '~/copy/zh-CN'

function reviewAction(state: ReviewState | undefined): string {
  switch (state) {
    case 'APPROVED':
      return copy.event.approved
    case 'CHANGES_REQUESTED':
      return copy.event.changes
    case 'COMMENTED':
      return copy.event.commented
    case 'DISMISSED':
      return copy.event.dismissed
    case 'PENDING':
      return copy.event.pending
    case undefined:
      return copy.event.commented
    default: {
      const exhaustive: never = state
      return exhaustive
    }
  }
}

function conclusionAction(conclusion: CheckConclusion): string {
  switch (conclusion) {
    case 'SUCCESS':
      return copy.event.ciSuccess
    case 'FAILURE':
      return copy.event.ciFailure
    case 'CANCELLED':
      return copy.event.ciCancelled
    case 'SKIPPED':
      return copy.event.ciSkipped
    case 'NEUTRAL':
      return copy.event.ciNeutral
    case 'ACTION_REQUIRED':
      return copy.event.ciAction
    case 'TIMED_OUT':
      return copy.event.ciTimedOut
    case 'STALE':
      return copy.event.ciStale
    case null:
      return copy.event.ciNeutral
    default: {
      const exhaustive: never = conclusion
      return exhaustive
    }
  }
}

export function eventAction(event: UnitEvent): string {
  const kind: EventKind = event.kind
  switch (kind) {
    case 'opened':
      return copy.event.opened
    case 'comment':
      return copy.event.comment
    case 'review':
      return reviewAction(event.reviewState)
    case 'review-comment':
      return copy.event.reviewComment
    case 'commit':
      return copy.event.commit
    case 'force-push':
      return copy.event.forcePush
    case 'ci':
      return event.ci
        ? `${copy.event.ci} ${event.ci.name} ${conclusionAction(event.ci.conclusion)}`
        : copy.event.ci
    case 'labeled':
      return event.label ? `${copy.event.labeled} ${event.label.name}` : copy.event.labeled
    case 'unlabeled':
      return event.label ? `${copy.event.unlabeled} ${event.label.name}` : copy.event.unlabeled
    case 'assigned':
      return copy.event.assigned
    case 'unassigned':
      return copy.event.unassigned
    case 'review-requested':
      return copy.event.reviewRequested
    case 'cross-ref':
      return copy.event.crossRef
    case 'connected':
      return copy.event.connected
    case 'renamed':
      return copy.event.renamed
    case 'merged':
      return copy.event.merged
    case 'closed':
      return copy.event.closed
    case 'reopened':
      return copy.event.reopened
    default: {
      const exhaustive: never = kind
      return exhaustive
    }
  }
}

export function actorLabel(login: string, viewer: string): string {
  if (login.toLowerCase() === viewer.toLowerCase()) return copy.preview.you
  return login
}
