import { claimLevel, claimWaitingSince, pendingClaimQuestion, selfClaimedStaleTone } from './claim'
import type { CommentClassification } from './claim-types'
import { isFailingClaCheck } from './checks'
import {
  contributionTypes,
  hasOpenedFix,
  isClearHelpClosure,
  type ContributionType,
} from './contribution'

export { contributionLabel } from './contribution'
import { isBot, isSelf, viewerLoginOf } from './identity'
import {
  asksForPrOrRebase,
  isCoderabbitActionable,
  isDroppedBot,
  isFailingClaComment,
  isMaintainerActivity,
  isPoliteCloser,
  isQuestionText,
  isStatementText,
  isUnclearHelp,
  mentionsSelf,
} from './turn-rules'

export { BOT_LOGINS, isBot, isSelf } from './identity'

export const DAY_MS = 24 * 60 * 60 * 1000
export const RECENT_MS = 14 * DAY_MS

export type Actor = {
  typename: string
  login: string
}

export type ActivityKind = 'create' | 'comment' | 'review' | 'push'

export type ReviewState = 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED' | 'PENDING'

export type Activity = {
  kind: ActivityKind
  at: string
  actor: Actor
  url?: string
  reviewState?: ReviewState
  body?: string
  authorAssociation?: string
  commentId?: string
  updatedAt?: string
  classification?: CommentClassification
}

export type CheckStatus =
  | 'COMPLETED'
  | 'IN_PROGRESS'
  | 'QUEUED'
  | 'PENDING'
  | 'WAITING'
  | 'REQUESTED'

export type CheckConclusion =
  | 'SUCCESS'
  | 'FAILURE'
  | 'CANCELLED'
  | 'SKIPPED'
  | 'NEUTRAL'
  | 'ACTION_REQUIRED'
  | 'TIMED_OUT'
  | 'STALE'
  | null

export type Check = {
  name: string
  status: CheckStatus
  conclusion: CheckConclusion
  url?: string
}

export type ItemState = 'open' | 'merged' | 'closed'

export type ItemKind = 'pr' | 'issue'

export type LinkedPullRequest = {
  repo: string
  number: number
  url: string
  state: ItemState
  author: Actor
}

export type TimelineLink = {
  event: 'cross-referenced' | 'connected'
  repo: string
  number: number
  kind: ItemKind
  url?: string
}

export type ItemPart = {
  kind: ItemKind
  repo: string
  number: number
  url: string
  title: string
  authorLogin: string
  body?: string
}

export type Item = {
  kind: ItemKind
  repo: string
  number: number
  title: string
  url: string
  state: ItemState
  createdAt: string
  closedAt: string | null
  author: Actor
  activities: Activity[]
  checks: Check[]
  assignees?: Actor[]
  linkedPullRequests?: LinkedPullRequest[]
  /** Issue or pull request body. Opening text, not a comment. */
  body?: string
  updatedAt?: string
  headSha?: string
  /** `cross-referenced` and `connected` timeline events only. */
  timelineLinks?: TimelineLink[]
  /** Set when an issue and its pull request were merged into this item. */
  parts?: ItemPart[]
  /** Logged-in GitHub user this board row was judged for. */
  viewerLogin?: string
}

export type Turn = 'mine' | 'maintainer' | 'other' | 'none'

export type { ContributionType } from './contribution'

export type DerivedMark = "said I'd do it but haven't" | 'stalled >14d'

export type Tone = 'none' | 'yellow' | 'red'

export type BoardLabel = 'CI awaiting approval' | 'Self-claimed'

export type Verdict = {
  turn: Turn
  reason: string
  labels: BoardLabel[]
  waitingSince: string
  ageMs: number
  tone: Tone
  links: {
    item: string
    comment: string | null
    ci: string | null
  }
  contributions: ContributionType[]
  marks: DerivedMark[]
  /** Rules could not decide; clef may override `turn` when it is confident. */
  ambiguous: boolean
  quote: string | null
  focusCommentId: string | null
  focusUpdatedAt: string | null
}

export type BoardItem = Verdict & {
  id: string
  kind: ItemKind
  repo: string
  number: number
  title: string
  state: ItemState
  closedAt: string | null
  firstReplyMs: number | null
  parts: ItemPart[]
}

export type BoardStats = {
  merged: number
  open: number
  averageFirstReplyMs: number | null
}

function byTime(first: Activity, second: Activity): number {
  return Date.parse(first.at) - Date.parse(second.at)
}

function withCreation(item: Item): Activity[] {
  const created = item.activities.some(activity => activity.kind === 'create')
  const activities = created
    ? item.activities
    : [
        ...item.activities,
        { kind: 'create' as const, at: item.createdAt, actor: item.author, url: item.url },
      ]
  return [...activities].sort(byTime)
}

function isPreviewAuthFailure(check: Check): boolean {
  if (!isFailure(check)) return false
  const name = check.name.toLowerCase()
  const host = name.includes('vercel') || name.includes('netlify')
  if (!host) return false
  if (
    /lint|typecheck|test|unit|e2e/.test(name) &&
    !/preview|deploy|authori[sz]|protection/.test(name)
  )
    return false
  return (
    /preview|deploy|authori[sz]|protection|comment/.test(name) ||
    name === 'vercel' ||
    name === 'netlify'
  )
}

function isFailure(check: Check): boolean {
  return check.conclusion === 'FAILURE' || check.conclusion === 'TIMED_OUT'
}

function realFailures(checks: Check[]): Check[] {
  return checks.filter(check => isFailure(check) && !isPreviewAuthFailure(check))
}

export function awaitingCi(checks: Check[]): boolean {
  return checks.some(check => {
    if (check.conclusion === 'ACTION_REQUIRED') return true
    switch (check.status) {
      case 'COMPLETED':
        return false
      case 'IN_PROGRESS':
      case 'QUEUED':
      case 'PENDING':
      case 'WAITING':
      case 'REQUESTED':
        return true
      default: {
        const exhaustive: never = check.status
        return exhaustive
      }
    }
  })
}

function latestDecidedReview(activities: Activity[]): Activity | undefined {
  return activities
    .filter(activity => activity.kind === 'review' && activity.reviewState !== 'PENDING')
    .at(-1)
}

function pushedBySelfAfter(activities: Activity[], at: string, viewer: string): boolean {
  const moment = Date.parse(at)
  return activities.some(
    activity =>
      activity.kind === 'push' &&
      isSelf(activity.actor, viewer) &&
      !isBot(activity.actor) &&
      Date.parse(activity.at) > moment,
  )
}

function reviewReason(login: string, state: ReviewState): string {
  switch (state) {
    case 'CHANGES_REQUESTED':
      return `${login} requested changes`
    case 'APPROVED':
      return `${login} approved`
    case 'COMMENTED':
      return `${login} commented`
    case 'DISMISSED':
      return `${login} dismissed review`
    case 'PENDING':
      return `${login} has a pending review`
    default: {
      const exhaustive: never = state
      return exhaustive
    }
  }
}

function humanReason(activity: Activity, viewer: string): string {
  switch (activity.kind) {
    case 'create':
      return 'Opened, waiting on maintainer'
    case 'comment':
      return isSelf(activity.actor, viewer)
        ? 'Replied, waiting on maintainer'
        : `${activity.actor.login} commented`
    case 'review':
      return isSelf(activity.actor, viewer)
        ? 'Replied, waiting on maintainer'
        : reviewReason(activity.actor.login, activity.reviewState ?? 'COMMENTED')
    case 'push':
      return isSelf(activity.actor, viewer)
        ? 'Pushed, waiting on maintainer'
        : `${activity.actor.login} pushed commits`
    default: {
      const exhaustive: never = activity.kind
      return exhaustive
    }
  }
}

function failureReason(check: Check): string {
  return /lint/i.test(check.name) ? 'CI lint failed' : `CI ${check.name} failed`
}

function commentUrl(activities: Activity[]): string | null {
  const comments = activities.filter(
    activity => activity.kind === 'comment' || activity.kind === 'review',
  )
  const human = [...comments].reverse().find(activity => !isDroppedBot(activity) && activity.url)
  return human?.url ?? [...comments].reverse().find(activity => activity.url)?.url ?? null
}

function ciUrl(checks: Check[]): string | null {
  const failed = realFailures(checks).find(check => check.url)
  if (failed?.url) return failed.url
  const waiting = checks.find(
    check => check.url && (check.conclusion === 'ACTION_REQUIRED' || check.status !== 'COMPLETED'),
  )
  if (waiting?.url) return waiting.url
  return checks.find(check => check.url)?.url ?? null
}

export function waitingTone(turn: Turn, ageMs: number): Tone {
  if (turn !== 'maintainer') return 'none'
  if (ageMs > 14 * DAY_MS) return 'red'
  if (ageMs > 7 * DAY_MS) return 'yellow'
  return 'none'
}

type CoreVerdict = Omit<Verdict, 'contributions' | 'marks' | 'quote'>

function derivedMarks(
  turn: Turn,
  ageMs: number,
  types: readonly ContributionType[],
  item: Item,
): DerivedMark[] {
  const marks: DerivedMark[] = []
  if (turn === 'mine' && types.includes('claim') && !hasOpenedFix(item)) {
    marks.push("said I'd do it but haven't")
  }
  if (turn !== 'none' && ageMs > 14 * DAY_MS) marks.push('stalled >14d')
  return marks
}

function relevantActivities(activities: Activity[]): Activity[] {
  return activities.filter(activity => !isDroppedBot(activity))
}

function withoutPoliteTail(activities: Activity[], viewer: string): Activity[] {
  const copy = [...activities]
  while (copy.length > 0) {
    const last = copy.at(-1)
    if (
      last &&
      last.kind === 'comment' &&
      isSelf(last.actor, viewer) &&
      last.body &&
      isPoliteCloser(last.body)
    ) {
      copy.pop()
      continue
    }
    break
  }
  return copy
}

function selfActedAfter(activities: Activity[], at: string, viewer: string): boolean {
  const moment = Date.parse(at)
  return activities.some(
    activity =>
      isSelf(activity.actor, viewer) &&
      !isBot(activity.actor) &&
      Date.parse(activity.at) > moment &&
      (activity.kind === 'comment' || activity.kind === 'review' || activity.kind === 'push'),
  )
}

function coreVerdict(item: Item, nowMs: number): CoreVerdict {
  const viewer = viewerLoginOf(item)
  const activities = withCreation(item)
  const relevant = relevantActivities(activities)
  const lastRelevant = relevant.at(-1) ?? activities[0]!
  const lastHuman = withoutPoliteTail(relevant, viewer).at(-1) ?? lastRelevant
  const waitingSince = lastRelevant.at
  const ageMs = Math.max(0, nowMs - Date.parse(waitingSince))
  const labels: BoardLabel[] = awaitingCi(item.checks) ? ['CI awaiting approval'] : []
  const links = {
    item: item.url,
    comment: commentUrl(activities),
    ci: ciUrl(item.checks),
  }
  const quiet = {
    labels,
    waitingSince,
    ageMs,
    links,
    ambiguous: false,
    focusCommentId: null,
    focusUpdatedAt: null,
  }

  if (item.kind === 'issue' && item.state === 'open' && claimLevel(item)) {
    const claimSince = claimWaitingSince(item)
    const claimAge = Math.max(0, nowMs - Date.parse(claimSince))
    if (pendingClaimQuestion(item)) {
      const turn: Turn = 'maintainer'
      return {
        ...quiet,
        turn,
        reason: 'Claim pending approval',
        waitingSince: claimSince,
        ageMs: claimAge,
        tone: waitingTone(turn, claimAge),
      }
    }
    const level = claimLevel(item)!
    const claimLabels: BoardLabel[] =
      level === 'self-claimed' ? [...labels, 'Self-claimed'] : labels
    return {
      ...quiet,
      turn: 'mine',
      reason: 'Claimed, open a PR',
      labels: claimLabels,
      waitingSince: claimSince,
      ageMs: claimAge,
      tone: level === 'self-claimed' ? selfClaimedStaleTone(claimAge) : 'none',
    }
  }

  if (item.state === 'merged' || item.state === 'closed') {
    return {
      ...quiet,
      turn: 'none',
      reason: item.state === 'merged' ? 'Merged' : 'Closed',
      tone: 'none',
    }
  }

  const failed = realFailures(item.checks)
  if (failed.length > 0) {
    const lint = failed.find(check => /lint/i.test(check.name))
    return {
      ...quiet,
      turn: 'mine',
      reason: failureReason(lint ?? failed[0]!),
      tone: 'none',
    }
  }

  const claCheck = item.checks.find(isFailingClaCheck)
  if (claCheck?.conclusion === 'ACTION_REQUIRED') {
    return { ...quiet, turn: 'mine', reason: 'CLA check failed', tone: 'none' }
  }

  const claComment = [...relevant].reverse().find(isFailingClaComment)
  if (claComment && !selfActedAfter(relevant, claComment.at, viewer)) {
    return { ...quiet, turn: 'mine', reason: 'CLA check failed', tone: 'none' }
  }

  const review = latestDecidedReview(activities)
  if (
    review?.reviewState === 'CHANGES_REQUESTED' &&
    !pushedBySelfAfter(activities, review.at, viewer)
  ) {
    return {
      ...quiet,
      turn: 'mine',
      reason: reviewReason(review.actor.login, 'CHANGES_REQUESTED'),
      tone: 'none',
    }
  }

  const rabbit = [...relevant].reverse().find(isCoderabbitActionable)
  if (rabbit && !selfActedAfter(relevant, rabbit.at, viewer)) {
    return { ...quiet, turn: 'mine', reason: 'CodeRabbit asked for changes', tone: 'none' }
  }

  const lastMaintainer = relevant
    .filter(
      activity =>
        (activity.kind === 'comment' || activity.kind === 'review') &&
        Boolean(activity.body) &&
        isMaintainerActivity(activity, viewer),
    )
    .at(-1)
  if (lastMaintainer?.body && !selfActedAfter(relevant, lastMaintainer.at, viewer)) {
    if (mentionsSelf(lastMaintainer.body, viewer)) {
      return {
        ...quiet,
        turn: 'mine',
        reason: `${lastMaintainer.actor.login} mentioned you`,
        tone: 'none',
      }
    }
    if (asksForPrOrRebase(lastMaintainer.body)) {
      return {
        ...quiet,
        turn: 'mine',
        reason: `${lastMaintainer.actor.login} asked for a PR or rebase`,
        tone: 'none',
      }
    }
  }

  if (lastHuman.kind === 'comment' && lastHuman.body && isSelf(lastHuman.actor, viewer)) {
    if (isQuestionText(lastHuman.body)) {
      const turn: Turn = 'maintainer'
      return {
        ...quiet,
        turn,
        reason: 'Asked, waiting on maintainer',
        tone: waitingTone(turn, ageMs),
      }
    }
    if (isClearHelpClosure(lastHuman.body)) {
      const turn: Turn = 'maintainer'
      const reason = /\balready fixed\b/i.test(lastHuman.body)
        ? 'Already fixed, waiting on maintainer'
        : 'Workaround noted, waiting on maintainer'
      return { ...quiet, turn, reason, tone: waitingTone(turn, ageMs) }
    }
    if (isStatementText(lastHuman.body) || isUnclearHelp(lastHuman.body)) {
      const turn: Turn = 'maintainer'
      return {
        ...quiet,
        turn,
        reason: humanReason(lastHuman, viewer),
        tone: waitingTone(turn, ageMs),
        ambiguous: true,
        focusCommentId: lastHuman.commentId ?? lastHuman.url ?? null,
        focusUpdatedAt: lastHuman.updatedAt ?? lastHuman.at,
      }
    }
  }

  if (!isSelf(lastHuman.actor, viewer)) {
    if (isMaintainerActivity(lastHuman, viewer)) {
      const turn: Turn = 'maintainer'
      return {
        ...quiet,
        turn,
        reason: humanReason(lastHuman, viewer),
        tone: waitingTone(turn, ageMs),
      }
    }
    return { ...quiet, turn: 'other', reason: humanReason(lastHuman, viewer), tone: 'none' }
  }

  const turn: Turn = 'maintainer'
  return {
    ...quiet,
    turn,
    reason: humanReason(lastHuman, viewer),
    tone: waitingTone(turn, ageMs),
  }
}

export function judge(item: Item, nowMs: number): Verdict {
  const core = coreVerdict(item, nowMs)
  const contributions = contributionTypes(item)
  return {
    ...core,
    contributions,
    marks: derivedMarks(core.turn, core.ageMs, contributions, item),
    quote: null,
  }
}

export function withResolvedTurn<T extends Verdict>(
  item: Item,
  verdict: T,
  turn: Turn,
  quote: string | null,
): T {
  return {
    ...verdict,
    turn,
    quote,
    ambiguous: false,
    reason: quote ?? verdict.reason,
    tone: waitingTone(turn, verdict.ageMs),
    marks: derivedMarks(turn, verdict.ageMs, verdict.contributions, item),
  }
}

export function firstReplyMs(item: Item): number | null {
  const viewer = viewerLoginOf(item)
  const created = Date.parse(item.createdAt)
  const reply = withCreation(item).find(
    activity =>
      activity.kind !== 'create' && !isBot(activity.actor) && !isSelf(activity.actor, viewer),
  )
  if (!reply) return null
  return Date.parse(reply.at) - created
}

export function present(item: Item, nowMs: number): BoardItem {
  const parts = item.parts ?? [
    {
      kind: item.kind,
      repo: item.repo,
      number: item.number,
      url: item.url,
      title: item.title,
      authorLogin: item.author.login,
      body: item.body,
    },
  ]
  return {
    id: `${item.repo}#${item.number}`,
    kind: item.kind,
    repo: item.repo,
    number: item.number,
    title: item.title,
    state: item.state,
    closedAt: item.closedAt,
    firstReplyMs: firstReplyMs(item),
    parts,
    ...judge(item, nowMs),
  }
}

export function summarize(items: readonly BoardItem[]): BoardStats {
  const replies = items.flatMap(item => (item.firstReplyMs === null ? [] : [item.firstReplyMs]))
  return {
    merged: items.filter(item => item.state === 'merged').length,
    open: items.filter(item => item.state === 'open').length,
    averageFirstReplyMs:
      replies.length === 0 ? null : replies.reduce((sum, ms) => sum + ms, 0) / replies.length,
  }
}

export function turnLabel(turn: Turn): string {
  switch (turn) {
    case 'mine':
      return 'Mine'
    case 'maintainer':
      return 'Maintainer'
    case 'other':
      return 'Other'
    case 'none':
      return 'None'
    default: {
      const exhaustive: never = turn
      return exhaustive
    }
  }
}

export function formatTimer(ms: number): string {
  if (ms < DAY_MS) return formatDuration(ms)
  const days = Math.floor(ms / DAY_MS)
  return `${days}d`
}

export function formatDuration(ms: number): string {
  if (ms < 60_000) return 'just now'
  const minutes = Math.floor(ms / 60_000)
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  const rest = hours % 24
  if (rest === 0) return `${days}d`
  return `${days}d ${rest}h`
}
