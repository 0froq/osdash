import { timelineSourceKind, type EventKind, type UnitEvent } from '#shared/events'
import type { CheckConclusion, ItemKind, ReviewState } from '#shared/turn'
import type { TFunc } from '#shared/i18n'

export type TimelineSubject = {
  repo: string
  number: number
  kind: ItemKind
}

/** Omit the card's own number. Issue numbers, and a different PR, stay. */
export function eventSourceLabel(
  t: TFunc,
  event: UnitEvent,
  subject: TimelineSubject,
): string | null {
  const kind = timelineSourceKind(event.source, subject)
  switch (kind) {
    case null:
      return null
    case 'pr':
      return t('sourcePr', { number: event.source.number })
    case 'issue':
      return t('sourceIssue', { number: event.source.number })
    default: {
      const exhaustive: never = kind
      return exhaustive
    }
  }
}

function reviewAction(t: TFunc, state: ReviewState | undefined): string {
  switch (state) {
    case 'APPROVED':
      return t('event.approved')
    case 'CHANGES_REQUESTED':
      return t('event.changes')
    case 'COMMENTED':
      return t('event.commented')
    case 'DISMISSED':
      return t('event.dismissed')
    case 'PENDING':
      return t('event.pending')
    case undefined:
      return t('event.commented')
    default: {
      const exhaustive: never = state
      return exhaustive
    }
  }
}

function conclusionAction(t: TFunc, conclusion: CheckConclusion): string {
  switch (conclusion) {
    case 'SUCCESS':
      return t('event.ciSuccess')
    case 'FAILURE':
      return t('event.ciFailure')
    case 'CANCELLED':
      return t('event.ciCancelled')
    case 'SKIPPED':
      return t('event.ciSkipped')
    case 'NEUTRAL':
      return t('event.ciNeutral')
    case 'ACTION_REQUIRED':
      return t('event.ciAction')
    case 'TIMED_OUT':
      return t('event.ciTimedOut')
    case 'STALE':
      return t('event.ciStale')
    case null:
      return t('event.ciNeutral')
    default: {
      const exhaustive: never = conclusion
      return exhaustive
    }
  }
}

export function eventAction(t: TFunc, event: UnitEvent): string {
  const kind: EventKind = event.kind
  switch (kind) {
    case 'opened':
      return t('event.opened')
    case 'comment':
      return t('event.comment')
    case 'review':
      return reviewAction(t, event.reviewState)
    case 'review-comment':
      return t('event.reviewComment')
    case 'commit':
      return t('event.commit')
    case 'force-push':
      return t('event.forcePush')
    case 'ci':
      return t('event.ci')
    case 'labeled':
      return t('event.labeled')
    case 'unlabeled':
      return t('event.unlabeled')
    case 'assigned':
      return t('event.assigned')
    case 'unassigned':
      return t('event.unassigned')
    case 'review-requested':
      return t('event.reviewRequested')
    case 'cross-ref':
      return t('event.crossRef')
    case 'connected':
      return t('event.connected')
    case 'renamed':
      return t('event.renamed')
    case 'merged':
      return t('event.merged')
    case 'closed':
      return t('event.closed')
    case 'reopened':
      return t('event.reopened')
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

function ciMark(t: TFunc, conclusion: CheckConclusion): Pick<EventDetail, 'mark' | 'markTone'> {
  const mark = conclusionAction(t, conclusion)
  if (conclusion === 'FAILURE' || conclusion === 'TIMED_OUT') return { mark, markTone: 'bad' }
  return { mark }
}

export function eventDetail(t: TFunc, event: UnitEvent): EventDetail | null {
  const kind: EventKind = event.kind
  switch (kind) {
    case 'comment':
    case 'review':
    case 'review-comment':
      return event.excerpt ? { text: event.excerpt } : null
    case 'ci':
      return event.ci ? { text: event.ci.name, ...ciMark(t, event.ci.conclusion) } : null
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
