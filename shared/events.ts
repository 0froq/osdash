import { isBot } from './identity'
import { isCoderabbitActionable, isFailingClaComment } from './turn-rules'
import type { Actor, CheckConclusion, CheckStatus, ItemKind, ReviewState } from './turn'

export type EventKind =
  | 'opened'
  | 'comment'
  | 'review'
  | 'review-comment'
  | 'commit'
  | 'force-push'
  | 'ci'
  | 'labeled'
  | 'unlabeled'
  | 'assigned'
  | 'unassigned'
  | 'review-requested'
  | 'cross-ref'
  | 'connected'
  | 'renamed'
  | 'merged'
  | 'closed'
  | 'reopened'

export type UnitEvent = {
  id: string
  kind: EventKind
  at: string
  actor: Actor
  source: { repo: string; number: number; kind: ItemKind }
  url?: string
  excerpt?: string
  reviewState?: ReviewState
  ci?: { name: string; conclusion: CheckConclusion; status: CheckStatus }
  label?: { name: string; color: string }
  ref?: { repo: string; number: number; kind: ItemKind; url: string; title?: string }
  rename?: { from: string; to: string }
  commit?: { sha: string; message: string }
  bot: 'keep' | 'noise' | null
}

export type BotGroup = {
  kind: 'bot-group'
  id: string
  count: number
  actors: string[]
  from: string
  to: string
  events: UnitEvent[]
}

export type CiGroup = {
  kind: 'ci-group'
  id: string
  at: string
  sha: string
  passed: number
  failed: number
  events: UnitEvent[]
}

export type TimelineEntry = UnitEvent | BotGroup | CiGroup

export type RawRestTimelineEvent = {
  id?: number | string
  node_id?: string
  event?: string
  created_at?: string
  submitted_at?: string
  actor?: { login?: string; type?: string } | null
  user?: { login?: string; type?: string } | null
  author?: { login?: string; type?: string } | null
  body?: string | null
  html_url?: string | null
  state?: string | null
  label?: { name?: string; color?: string } | null
  assignee?: { login?: string } | null
  requested_reviewer?: { login?: string } | null
  rename?: { from?: string; to?: string } | null
  sha?: string | null
  message?: string | null
  source?: {
    issue?: {
      number?: number
      html_url?: string
      title?: string
      pull_request?: unknown
      repository_url?: string
    }
  } | null
}

export type RawReviewComment = {
  id?: number | string
  user?: { login?: string; type?: string } | null
  body?: string | null
  html_url?: string | null
  created_at?: string
  updated_at?: string
}

export type RawCheckRun = {
  id?: number | string
  name?: string
  status?: string
  conclusion?: string | null
  html_url?: string | null
  started_at?: string | null
  completed_at?: string | null
}

const KNOWN_EVENTS = [
  'commented',
  'reviewed',
  'committed',
  'head_ref_force_pushed',
  'labeled',
  'unlabeled',
  'assigned',
  'unassigned',
  'review_requested',
  'cross-referenced',
  'connected',
  'renamed',
  'merged',
  'closed',
  'reopened',
] as const

type KnownEvent = (typeof KNOWN_EVENTS)[number]

function isKnownEvent(event: string): event is KnownEvent {
  return (KNOWN_EVENTS as readonly string[]).includes(event)
}

function eventKind(event: KnownEvent): EventKind {
  switch (event) {
    case 'commented':
      return 'comment'
    case 'reviewed':
      return 'review'
    case 'committed':
      return 'commit'
    case 'head_ref_force_pushed':
      return 'force-push'
    case 'labeled':
      return 'labeled'
    case 'unlabeled':
      return 'unlabeled'
    case 'assigned':
      return 'assigned'
    case 'unassigned':
      return 'unassigned'
    case 'review_requested':
      return 'review-requested'
    case 'cross-referenced':
      return 'cross-ref'
    case 'connected':
      return 'connected'
    case 'renamed':
      return 'renamed'
    case 'merged':
      return 'merged'
    case 'closed':
      return 'closed'
    case 'reopened':
      return 'reopened'
    default: {
      const exhaustive: never = event
      return exhaustive
    }
  }
}

export function excerptOf(body: string | null | undefined): string | undefined {
  if (!body) return undefined
  const noQuotes = body
    .split('\n')
    .filter(line => !line.trim().startsWith('>'))
    .join('\n')
  const plain = noQuotes
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[[^\]]*]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~]/g, '')
  const collapsed = plain.replace(/\s+/g, ' ').trim()
  if (!collapsed) return undefined
  return collapsed.slice(0, 140)
}

function actorFrom(raw: {
  actor?: { login?: string; type?: string } | null
  user?: { login?: string; type?: string } | null
  author?: { login?: string; type?: string } | null
}): Actor {
  const person = raw.actor ?? raw.user ?? raw.author
  const login = person?.login || 'ghost'
  const bot = person?.type === 'Bot' || login.endsWith('[bot]')
  return { typename: bot ? 'Bot' : 'User', login }
}

function botMark(
  actor: Actor,
  body: string | undefined,
  reviewState?: ReviewState,
): UnitEvent['bot'] {
  const activity = {
    kind: 'comment' as const,
    at: '',
    actor,
    body,
    reviewState,
  }
  if (!isBot(actor)) return null
  if (isFailingClaComment(activity) || isCoderabbitActionable(activity)) return 'keep'
  return 'noise'
}

function reviewStateOf(state: string | null | undefined): ReviewState | undefined {
  switch (state?.toUpperCase()) {
    case 'APPROVED':
    case 'CHANGES_REQUESTED':
    case 'COMMENTED':
    case 'DISMISSED':
    case 'PENDING':
      return state?.toUpperCase() as ReviewState
    default:
      return undefined
  }
}

function repoFromUrl(url: string | undefined): string | null {
  const fromApi = url?.match(/\/repos\/([^/]+\/[^/]+?)(?:\/|$)/)
  if (fromApi?.[1]) return fromApi[1]
  const fromHtml = url?.match(/github\.com\/([^/]+\/[^/]+)\/(?:issues|pull)\//)
  return fromHtml?.[1] ?? null
}

function sourceOf(event: RawRestTimelineEvent): UnitEvent['ref'] | undefined {
  const issue = event.source?.issue
  if (!issue?.number) return undefined
  const repo = repoFromUrl(issue.repository_url) ?? repoFromUrl(issue.html_url)
  if (!repo) return undefined
  const kind = issue.pull_request || issue.html_url?.includes('/pull/') ? 'pr' : 'issue'
  return {
    repo,
    number: issue.number,
    kind,
    url:
      issue.html_url ??
      `https://github.com/${repo}/${kind === 'pr' ? 'pull' : 'issues'}/${issue.number}`,
    title: issue.title,
  }
}

export function normalizeRestTimeline(
  raw: readonly RawRestTimelineEvent[],
  source: UnitEvent['source'],
): UnitEvent[] {
  const events: UnitEvent[] = []
  for (const entry of raw) {
    if (!entry.event || !isKnownEvent(entry.event)) continue
    const at = entry.created_at ?? entry.submitted_at
    if (!at) continue
    const kind = eventKind(entry.event)
    const actor = actorFrom(entry)
    const reviewState = kind === 'review' ? reviewStateOf(entry.state) : undefined
    const body = entry.body ?? undefined
    const ref = kind === 'cross-ref' || kind === 'connected' ? sourceOf(entry) : undefined
    events.push({
      id: String(
        entry.id ?? entry.node_id ?? `${kind}:${at}:${actor.login}:${source.repo}#${source.number}`,
      ),
      kind,
      at,
      actor,
      source,
      url: entry.html_url ?? undefined,
      excerpt: excerptOf(body),
      reviewState,
      label: entry.label?.name
        ? { name: entry.label.name, color: entry.label.color ?? 'cccccc' }
        : undefined,
      ref,
      rename:
        entry.rename?.from && entry.rename.to
          ? { from: entry.rename.from, to: entry.rename.to }
          : undefined,
      commit:
        kind === 'commit' && entry.sha
          ? { sha: entry.sha, message: entry.message ?? '' }
          : undefined,
      bot: botMark(actor, body ?? undefined, reviewState),
    })
  }
  return events
}

export function normalizeReviewComments(
  raw: readonly RawReviewComment[],
  source: UnitEvent['source'],
): UnitEvent[] {
  const events: UnitEvent[] = []
  for (const comment of raw) {
    const at = comment.created_at ?? comment.updated_at
    if (!at) continue
    const actor = actorFrom({ user: comment.user })
    const body = comment.body ?? undefined
    events.push({
      id: String(comment.id ?? `review-comment:${at}:${actor.login}`),
      kind: 'review-comment',
      at,
      actor,
      source,
      url: comment.html_url ?? undefined,
      excerpt: excerptOf(body),
      bot: botMark(actor, body),
    })
  }
  return events
}

function conclusionOf(value: string | null | undefined): CheckConclusion {
  switch (value?.toUpperCase()) {
    case 'SUCCESS':
    case 'FAILURE':
    case 'CANCELLED':
    case 'SKIPPED':
    case 'NEUTRAL':
    case 'ACTION_REQUIRED':
    case 'TIMED_OUT':
    case 'STALE':
      return value.toUpperCase() as CheckConclusion
    default:
      return null
  }
}

function statusOf(value: string | undefined): CheckStatus {
  switch (value?.toUpperCase()) {
    case 'COMPLETED':
    case 'IN_PROGRESS':
    case 'QUEUED':
    case 'PENDING':
    case 'WAITING':
    case 'REQUESTED':
      return value.toUpperCase() as CheckStatus
    default:
      return 'PENDING'
  }
}

export function normalizeCheckRuns(
  raw: readonly RawCheckRun[],
  source: UnitEvent['source'],
  sha: string,
): UnitEvent[] {
  const events: UnitEvent[] = []
  for (const run of raw) {
    if (statusOf(run.status) !== 'COMPLETED' || !run.name) continue
    const at = run.completed_at ?? run.started_at
    if (!at) continue
    events.push({
      id: `ci:${sha}:${run.id ?? run.name}`,
      kind: 'ci',
      at,
      actor: { typename: 'Bot', login: 'github-actions' },
      source,
      url: run.html_url ?? undefined,
      ci: { name: run.name, conclusion: conclusionOf(run.conclusion), status: 'COMPLETED' },
      commit: { sha, message: '' },
      bot: null,
    })
  }
  return events
}

function minuteOf(at: string): number {
  return Math.floor(Date.parse(at) / 60_000)
}

function botGroup(events: UnitEvent[]): BotGroup {
  const actors = [...new Set(events.map(event => event.actor.login))]
  return {
    kind: 'bot-group',
    id: `bot:${events.map(event => event.id).join(',')}`,
    count: events.length,
    actors,
    from: events[0]!.at,
    to: events.at(-1)!.at,
    events,
  }
}

function ciGroup(events: UnitEvent[]): CiGroup {
  return {
    kind: 'ci-group',
    id: `ci-group:${events.map(event => event.id).join(',')}`,
    at: events[0]!.at,
    sha: events[0]!.commit?.sha ?? '',
    passed: events.filter(event => event.ci?.conclusion === 'SUCCESS').length,
    failed: events.filter(event => event.ci?.conclusion === 'FAILURE').length,
    events,
  }
}

export function foldEntries(events: readonly UnitEvent[]): TimelineEntry[] {
  const sorted = [...events].sort((left, right) => {
    const at = Date.parse(left.at) - Date.parse(right.at)
    if (at !== 0) return at
    return left.id.localeCompare(right.id)
  })
  const folded: TimelineEntry[] = []
  let index = 0
  while (index < sorted.length) {
    const current = sorted[index]!
    if (current.bot === 'noise') {
      const group = [current]
      let next = index + 1
      while (next < sorted.length && sorted[next]!.bot === 'noise') {
        group.push(sorted[next]!)
        next += 1
      }
      folded.push(botGroup(group))
      index = next
      continue
    }
    if (current.kind === 'ci') {
      const minute = minuteOf(current.at)
      const sha = current.commit?.sha ?? ''
      const group = [current]
      let next = index + 1
      while (
        next < sorted.length &&
        sorted[next]!.kind === 'ci' &&
        minuteOf(sorted[next]!.at) === minute &&
        (sorted[next]!.commit?.sha ?? '') === sha
      ) {
        group.push(sorted[next]!)
        next += 1
      }
      folded.push(group.length > 1 ? ciGroup(group) : current)
      index = next
      continue
    }
    folded.push(current)
    index += 1
  }
  return folded
}
