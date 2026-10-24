import { timelineSourceKind, type EventKind, type UnitEvent } from '#shared/events'
import type { CheckConclusion, ItemKind, ReviewState } from '#shared/turn'
import { copy } from '~/copy/en'

export type TimelineSubject = {
  repo: string
  number: number
  kind: ItemKind
}

/** Omit the card's own number. Issue numbers, and a different PR, stay. */
export function eventSourceLabel(event: UnitEvent, subject: TimelineSubject): string | null {
  const kind = timelineSourceKind(event.source, subject)
  switch (kind) {
    case null:
      return null
    case 'pr':
      return copy.sourcePr(event.source.number)
    case 'issue':
      return copy.sourceIssue(event.source.number)
    default: {
      const exhaustive: never = kind
      return exhaustive
    }
  }
}

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
      return copy.event.ci
    case 'labeled':
      return copy.event.labeled
    case 'unlabeled':
      return copy.event.unlabeled
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

export type EventDetail = {
  text: string
  mark?: string
  markTone?: 'bad'
}

function firstLine(value: string): string {
  const line = value.split('\n')[0]?.trim() ?? ''
  if (!line) return ''
  return line.length > 140 ? `${line.slice(0, 139)}…` : line
}

function ciMark(conclusion: CheckConclusion): Pick<EventDetail, 'mark' | 'markTone'> {
  const mark = conclusionAction(conclusion)
  if (conclusion === 'FAILURE' || conclusion === 'TIMED_OUT') return { mark, markTone: 'bad' }
  return { mark }
}

export function eventDetail(event: UnitEvent): EventDetail | null {
  const kind: EventKind = event.kind
  switch (kind) {
    case 'comment':
    case 'review':
    case 'review-comment':
      return event.excerpt ? { text: event.excerpt } : null
    case 'ci':
      return event.ci ? { text: event.ci.name, ...ciMark(event.ci.conclusion) } : null
    case 'commit': {
      const message = event.commit?.message ? firstLine(event.commit.message) : ''
      if (message) return { text: message }
      const sha = event.commit?.sha
      return sha ? { text: sha.slice(0, 7) } : null
    }
    case 'labeled':
    case 'unlabeled':
      return event.label ? { text: event.label.name } : null
    case 'assigned':
    case 'unassigned':
    case 'review-requested':
      return event.targetLogin ? { text: `@${event.targetLogin}` } : null
    case 'cross-ref':
    case 'connected':
      return event.ref?.title ? { text: event.ref.title } : null
    case 'renamed':
      return event.rename ? { text: `${event.rename.from} → ${event.rename.to}` } : null
    case 'opened':
    case 'force-push':
    case 'merged':
    case 'closed':
    case 'reopened':
      return null
    default: {
      const exhaustive: never = kind
      return exhaustive
    }
  }
}
