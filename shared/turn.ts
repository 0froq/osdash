export const SELF = '0froq'

export const BOT_LOGINS = [
  'coderabbitai',
  'codecov',
  'netlify',
  'vercel',
  'coldtea-pr-lens',
  'chatgpt-codex-connector',
] as const

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
}

export type Turn = 'me' | 'maintainer' | 'done'

export type Tone = 'none' | 'yellow' | 'red'

export type Verdict = {
  turn: Turn
  reason: string
  labels: Array<'CI pending approval'>
  waitingSince: string
  ageMs: number
  tone: Tone
  links: {
    item: string
    comment: string | null
    ci: string | null
  }
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
}

export type BoardStats = {
  merged: number
  open: number
  averageFirstReplyMs: number | null
}

export function isBot(actor: Actor): boolean {
  if (actor.typename === 'Bot') return true
  if (actor.login.endsWith('[bot]')) return true
  const login = actor.login.toLowerCase()
  return BOT_LOGINS.some(name => name === login)
}

export function isSelf(actor: Actor): boolean {
  return actor.login.toLowerCase() === SELF
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

function pushedBySelfAfter(activities: Activity[], at: string): boolean {
  const moment = Date.parse(at)
  return activities.some(
    activity =>
      activity.kind === 'push' &&
      isSelf(activity.actor) &&
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

function humanReason(activity: Activity): string {
  switch (activity.kind) {
    case 'create':
      return 'Opened, waiting on maintainer'
    case 'comment':
      return isSelf(activity.actor)
        ? 'Replied, waiting on maintainer'
        : `${activity.actor.login} commented`
    case 'review':
      return isSelf(activity.actor)
        ? 'Replied, waiting on maintainer'
        : reviewReason(activity.actor.login, activity.reviewState ?? 'COMMENTED')
    case 'push':
      return isSelf(activity.actor)
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
  const human = [...comments].reverse().find(activity => !isBot(activity.actor) && activity.url)
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

export function judge(item: Item, nowMs: number): Verdict {
  const activities = withCreation(item)
  const humans = activities.filter(activity => !isBot(activity.actor))
  const lastHuman = humans.at(-1) ?? activities[0]!
  const waitingSince = lastHuman.at
  const ageMs = Math.max(0, nowMs - Date.parse(waitingSince))
  const labels: Array<'CI pending approval'> = awaitingCi(item.checks)
    ? ['CI pending approval']
    : []
  const links = {
    item: item.url,
    comment: commentUrl(activities),
    ci: ciUrl(item.checks),
  }

  if (item.state === 'merged' || item.state === 'closed') {
    return {
      turn: 'done',
      reason: item.state === 'merged' ? 'Merged' : 'Closed',
      labels,
      waitingSince,
      ageMs,
      tone: 'none',
      links,
    }
  }

  const failed = realFailures(item.checks)
  if (failed.length > 0) {
    const lint = failed.find(check => /lint/i.test(check.name))
    return {
      turn: 'me',
      reason: failureReason(lint ?? failed[0]!),
      labels,
      waitingSince,
      ageMs,
      tone: 'none',
      links,
    }
  }

  const review = latestDecidedReview(activities)
  if (review?.reviewState === 'CHANGES_REQUESTED' && !pushedBySelfAfter(activities, review.at)) {
    return {
      turn: 'me',
      reason: reviewReason(review.actor.login, 'CHANGES_REQUESTED'),
      labels,
      waitingSince,
      ageMs,
      tone: 'none',
      links,
    }
  }

  if (!isSelf(lastHuman.actor)) {
    return {
      turn: 'me',
      reason: humanReason(lastHuman),
      labels,
      waitingSince,
      ageMs,
      tone: 'none',
      links,
    }
  }

  const turn: Turn = 'maintainer'
  return {
    turn,
    reason: humanReason(lastHuman),
    labels,
    waitingSince,
    ageMs,
    tone: waitingTone(turn, ageMs),
    links,
  }
}

export function firstReplyMs(item: Item): number | null {
  const created = Date.parse(item.createdAt)
  const reply = withCreation(item).find(
    activity => activity.kind !== 'create' && !isBot(activity.actor) && !isSelf(activity.actor),
  )
  if (!reply) return null
  return Date.parse(reply.at) - created
}

export function present(item: Item, nowMs: number): BoardItem {
  return {
    id: `${item.repo}#${item.number}`,
    kind: item.kind,
    repo: item.repo,
    number: item.number,
    title: item.title,
    state: item.state,
    closedAt: item.closedAt,
    firstReplyMs: firstReplyMs(item),
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
