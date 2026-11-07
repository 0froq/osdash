import type { CiGroup, TimelineEntry, UnitEvent } from '#shared/events'
import { excerptOf } from '#shared/events'
import { isMaintainerAssociation } from '#shared/claim-types'
import { isBot, isSelf } from '#shared/identity'
import type { ReasonCode } from '#shared/reason'
import type { StoryItem, StoryKey } from '#shared/story'
import type { UnitCategory, UnitKind } from '#shared/unit'
import type { TFunc } from '#shared/i18n'

/*
 * A card's timeline as a contribution story. Every string comes from event
 * kinds, author_association, claim keywords, closingIssuesReferences and the
 * judge's reasonCode. Branches only change on opened, closed and merged lines,
 * which are always key lines, so folding never changes the rails.
 */

export type StoryTag = 'maintainer'
export type StoryTurn = 'you' | 'waiting' | 'done'

export type StoryLine = {
  id: string
  at: number
  item: StoryKey
  actor: string
  /** GitHub login behind the name, when the line names a person. */
  login: string | null
  avatar: string | null
  profile: string | null
  self: boolean
  key: boolean
  reason: boolean
  verb: string
  detail: string | null
  chips: string[]
  quote: string | null
  body: string | null
  tags: StoryTag[]
  tone: 'plain' | 'good' | 'bad'
  /** CI only. Keeps the node and the verb off ink. */
  mark: 'bad' | 'news' | 'run' | 'wait' | 'good' | null
  url: string | null
  /** The other issue or PR named by a mention, when one is known. */
  ref: { repo: string; number: number; url: string } | null
  /** A label named by this line, painted in its GitHub colour. */
  label: { name: string; color: string } | null
  start: boolean
  end: 'merged' | 'closed' | null
  /** Issues a PR branches from, on its opened line. */
  fork: StoryKey[]
  /** Issues closed by this merge. */
  joins: StoryKey[]
}

export type StoryFold = { id: string; lines: StoryLine[]; summary: string; lane: StoryKey }

export type StoryBlock = { type: 'line'; line: StoryLine } | { type: 'fold'; fold: StoryFold }

export type StoryCard = {
  kind: UnitKind
  category: UnitCategory
  ended: boolean
  myTurn: boolean
  reasonCode: ReasonCode
  reasonActor: string | null
  links: { comment: string | null }
}

export type Story = {
  items: StoryItem[]
  primary: StoryItem
  rails: StoryItem[]
  /** Linked items without a rail: mentions, or explicit links with no loaded history. */
  related: StoryItem[]
  blocks: StoryBlock[]
  lanes: StoryItem[][]
  turn: StoryTurn
  /** The open item containing the reason event, or the card's primary item. */
  nowItem: StoryKey
  /** Presentation only. These paths are not events or promised outcomes. */
  tail: { open: StoryKey[]; converge: StoryKey[] }
}

type Source =
  | { type: 'event'; event: UnitEvent }
  | { type: 'checks'; group: CiGroup | UnitEvent }
  | { type: 'opened'; item: StoryItem }

const MERGE_WINDOW_MS = 2 * 60_000

function keyOf(source: { repo: string; number: number }): StoryKey {
  return `${source.repo}#${source.number}`
}

function atOf(source: Source): number {
  if (source.type === 'opened') return Date.parse(source.item.createdAt!)
  if (source.type === 'checks') return Date.parse(source.group.at)
  return Date.parse(source.event.at)
}

function itemOf(source: Source): StoryKey {
  if (source.type === 'opened') return source.item.key
  if (source.type === 'checks') {
    const first = source.group.kind === 'ci-group' ? source.group.events[0]! : source.group
    return keyOf(first.source)
  }
  return keyOf(source.event.source)
}

function sourcesOf(entries: readonly TimelineEntry[], items: readonly StoryItem[]): Source[] {
  const sources: Source[] = []
  for (const entry of entries) {
    if (entry.kind === 'bot-group') {
      for (const event of entry.events) sources.push({ type: 'event', event })
    } else if (entry.kind === 'ci-group') {
      sources.push({ type: 'checks', group: entry })
    } else if (entry.kind === 'ci') {
      sources.push({ type: 'checks', group: entry })
    } else if (entry.kind !== 'review' || entry.reviewState !== 'PENDING') {
      sources.push({ type: 'event', event: entry })
    }
  }
  for (const item of items) {
    if (item.createdAt && !Number.isNaN(Date.parse(item.createdAt)))
      sources.push({ type: 'opened', item })
  }
  return sources.sort((left, right) => {
    const at = atOf(left) - atOf(right)
    if (at !== 0) return at
    return (left.type === 'opened' ? 0 : 1) - (right.type === 'opened' ? 0 : 1)
  })
}

/** An item cannot be mentioned before it exists. */
function placeOpened(lines: StoryLine[]): StoryLine[] {
  const openedAt = new Map<StoryKey, number>()
  for (const line of lines) if (line.start) openedAt.set(line.item, line.at)
  return lines.map(line => {
    const opened = openedAt.get(line.item)
    if (line.start || opened === undefined || line.at >= opened) return line
    return { ...line, at: opened }
  })
}

function checksOf(group: CiGroup | UnitEvent): { failed: string[]; passed: number; total: number } {
  const events = group.kind === 'ci-group' ? group.events : [group]
  return {
    failed: events.filter(event => event.ci?.conclusion === 'FAILURE').map(event => event.ci!.name),
    passed: events.filter(event => event.ci?.conclusion === 'SUCCESS').length,
    total: events.length,
  }
}

function ciMark(
  ci: { conclusion: string | null; status: string } | undefined,
): NonNullable<StoryLine['mark']> {
  const conclusion = ci?.conclusion ?? null
  if (conclusion === 'FAILURE' || conclusion === 'TIMED_OUT') return 'bad'
  if (conclusion === 'SUCCESS') return 'news'
  if (
    conclusion === null ||
    ci?.status === 'IN_PROGRESS' ||
    ci?.status === 'QUEUED' ||
    ci?.status === 'PENDING' ||
    ci?.status === 'WAITING' ||
    ci?.status === 'REQUESTED'
  )
    return 'run'
  return 'wait'
}

function groupCiMark(group: CiGroup | UnitEvent): NonNullable<StoryLine['mark']> {
  const events = group.kind === 'ci-group' ? group.events : [group]
  const marks = events.map(event => ciMark(event.ci))
  if (marks.includes('bad')) return 'bad'
  if (marks.length > 0 && marks.every(mark => mark === 'news')) return 'news'
  if (marks.includes('run')) return 'run'
  return 'wait'
}

function eventVerb(
  t: TFunc,
  event: UnitEvent,
  viewer: string,
): Pick<StoryLine, 'verb' | 'tone' | 'detail'> {
  const login = (value: string | undefined) =>
    value && value.toLowerCase() === viewer.toLowerCase()
      ? t('preview.you')
      : (value ?? t('someone'))
  switch (event.kind) {
    case 'opened':
      return {
        verb: t(event.source.kind === 'pr' ? 'story.openedPr' : 'story.openedIssue', {
          number: event.source.number,
        }),
        tone: 'plain',
        detail: null,
      }
    case 'comment':
      return { verb: t('story.commented'), tone: 'plain', detail: null }
    case 'review-comment':
      return { verb: t('story.commentedOnCode'), tone: 'plain', detail: null }
    case 'review':
      if (event.reviewState === 'APPROVED')
        return { verb: t('story.approved'), tone: 'good', detail: null }
      if (event.reviewState === 'CHANGES_REQUESTED')
        return { verb: t('story.changes'), tone: 'bad', detail: null }
      if (event.reviewState === 'DISMISSED')
        return { verb: t('story.dismissed'), tone: 'plain', detail: null }
      return { verb: t('story.reviewed'), tone: 'plain', detail: null }
    case 'commit':
      return {
        verb: t('story.committed'),
        tone: 'plain',
        detail: event.commit?.message.split('\n')[0] || null,
      }
    case 'force-push':
      return { verb: t('story.forcePushed'), tone: 'plain', detail: null }
    case 'ci':
      return { verb: event.ci?.name ?? '', tone: 'plain', detail: null }
    case 'labeled':
      return { verb: t('story.addedLabel'), tone: 'plain', detail: null }
    case 'unlabeled':
      return { verb: t('story.removedLabel'), tone: 'plain', detail: null }
    case 'assigned':
      return {
        verb: t('story.assigned', { login: login(event.targetLogin) }),
        tone: 'plain',
        detail: null,
      }
    case 'unassigned':
      return {
        verb: t('story.unassigned', { login: login(event.targetLogin) }),
        tone: 'plain',
        detail: null,
      }
    case 'review-requested':
      return {
        verb: t('story.reviewRequested', { login: login(event.targetLogin) }),
        tone: 'plain',
        detail: null,
      }
    case 'cross-ref':
      return { verb: t('story.crossRef'), tone: 'plain', detail: null }
    case 'connected':
      return { verb: t('story.connected'), tone: 'plain', detail: null }
    case 'renamed':
      return { verb: t('story.renamed'), tone: 'plain', detail: event.rename?.to ?? null }
    case 'merged':
      return {
        verb: t('story.merged', { number: event.source.number }),
        tone: 'good',
        detail: null,
      }
    case 'closed':
      return {
        verb: t('story.closed', { number: event.source.number }),
        tone: 'plain',
        detail: null,
      }
    case 'reopened':
      return {
        verb: t('story.reopened', { number: event.source.number }),
        tone: 'plain',
        detail: null,
      }
    default: {
      const exhaustive: never = event.kind
      return exhaustive
    }
  }
}

function blankLine(id: string, at: number, item: StoryKey): StoryLine {
  return {
    id,
    at,
    item,
    actor: '',
    login: null,
    avatar: null,
    profile: null,
    self: false,
    key: false,
    reason: false,
    verb: '',
    detail: null,
    chips: [],
    quote: null,
    body: null,
    tags: [],
    tone: 'plain',
    url: null,
    ref: null,
    label: null,
    start: false,
    end: null,
    fork: [],
    joins: [],
    mark: null,
  }
}

/** Bots, mentions and everything else fold apart, and each rail folds on its own. */
function foldKind(line: StoryLine, sources: ReadonlyMap<string, Source>): string {
  const source = sources.get(line.id)
  if (source?.type === 'event' && isBot(source.event.actor)) return 'bot'
  if (source?.type === 'event' && source.event.kind === 'cross-ref') return 'mention'
  return 'rest'
}

function summaryOf(
  t: TFunc,
  lines: readonly StoryLine[],
  sources: ReadonlyMap<string, Source>,
): string {
  let comments = 0
  let commits = 0
  let reviews = 0
  let labels = 0
  let bots = 0
  let other = 0
  let checks: 'passed' | 'failed' | null = null
  let requested = false
  const mentions: number[] = []
  for (const line of lines) {
    const source = sources.get(line.id)
    if (!source || source.type === 'opened') continue
    if (source.type === 'checks') {
      if (checksOf(source.group).failed.length) checks = 'failed'
      else checks ??= 'passed'
      continue
    }
    const event = source.event
    if (isBot(event.actor) && (event.kind === 'comment' || event.kind === 'review-comment')) {
      bots += 1
      continue
    }
    switch (event.kind) {
      case 'comment':
      case 'review-comment':
        comments += 1
        break
      case 'review':
        reviews += 1
        break
      case 'commit':
      case 'force-push':
        commits += 1
        break
      case 'labeled':
      case 'unlabeled':
        labels += 1
        break
      case 'review-requested':
        requested = true
        break
      case 'cross-ref':
        if (event.ref) mentions.push(event.ref.number)
        break
      default:
        other += 1
    }
  }
  const parts = [
    comments ? t('story.summary.comments', { count: comments }, comments) : '',
    reviews ? t('story.summary.reviews', { count: reviews }, reviews) : '',
    commits ? t('story.summary.commits', { count: commits }, commits) : '',
    checks === 'failed'
      ? t('story.summary.checksFailed')
      : checks === 'passed'
        ? t('story.summary.checksPassed')
        : '',
    requested ? t('story.summary.reviewRequested') : '',
    labels ? t('story.summary.labels', { count: labels }, labels) : '',
    mentions.length
      ? t('story.summary.mentions', {
          numbers: [...new Set(mentions)].map(number => `#${number}`).join(', '),
        })
      : '',
    bots ? t('story.summary.bots', { count: bots }, bots) : '',
    other ? t('story.summary.other', { count: other }) : '',
  ].filter(Boolean)
  return parts.join(' · ')
}

function turnOf(card: StoryCard): StoryTurn {
  if (card.ended) return 'done'
  return card.myTurn ? 'you' : 'waiting'
}

function reasonLine(
  card: StoryCard,
  lines: readonly StoryLine[],
  sources: ReadonlyMap<string, Source>,
) {
  const url = card.links.comment
  const byUrl = () => (url ? lines.findLast(line => line.url === url) : undefined)
  const actor = card.reasonActor?.toLowerCase()
  const last = (match: (line: StoryLine, event: UnitEvent | null) => boolean) =>
    lines.findLast(line => {
      const source = sources.get(line.id)
      return match(line, source?.type === 'event' ? source.event : null)
    })
  switch (card.reasonCode) {
    case 'changes-requested':
      return last(
        (_, e) =>
          e?.reviewState === 'CHANGES_REQUESTED' &&
          (!actor || e.actor.login.toLowerCase() === actor),
      )
    case 'approved':
      return last((_, e) => e?.reviewState === 'APPROVED')
    case 'review-dismissed':
      return last((_, e) => e?.reviewState === 'DISMISSED')
    case 'merged':
      return last(line => line.end === 'merged')
    case 'closed':
      return last(line => line.end === 'closed')
    case 'ci-failed':
    case 'ci-lint-failed':
      return last(line => line.tone === 'bad' && sources.get(line.id)?.type === 'checks')
    case 'mentioned':
    case 'commented':
    case 'asked-pr-or-rebase':
    case 'already-fixed':
    case 'workaround':
      return (
        byUrl() ??
        last((_, e) => e?.kind === 'comment' && (!actor || e.actor.login.toLowerCase() === actor))
      )
    case 'pushed':
      return last((_, e) => e?.kind === 'commit' || e?.kind === 'force-push')
    default:
      return byUrl()
  }
}

export function buildStory(
  t: TFunc,
  entries: readonly TimelineEntry[],
  items: readonly StoryItem[],
  card: StoryCard,
  viewer: string,
): Story | null {
  const primary = items.find(item => item.role === 'primary')
  if (!primary) return null
  const byKey = new Map(items.map(item => [item.key, item]))
  const seen = new Set(
    entries.flatMap(entry =>
      entry.kind === 'bot-group' || entry.kind === 'ci-group'
        ? entry.events.map(event => keyOf(event.source))
        : [keyOf(entry.source)],
    ),
  )
  const rails = items.filter(
    item =>
      item.role === 'primary' ||
      ((item.kind === 'pr' || item.link === 'closing') &&
        (item.createdAt !== null || seen.has(item.key))),
  )
  const railKeys = new Set(rails.map(item => item.key))
  const related = items.filter(item => !railKeys.has(item.key))
  const mentions = related.filter(item => item.link === 'mention')
  const issueOnly = card.kind === 'issue-only'

  const sources = sourcesOf(entries, rails)
  const bySource = new Map<string, Source>()
  const lines: StoryLine[] = []

  const finalClose = new Map<StoryKey, string>()
  for (const source of sources) {
    if (source.type !== 'event') continue
    const event = source.event
    const item = byKey.get(keyOf(event.source))
    if (!item || item.state === 'open') continue
    if (
      (event.kind === 'closed' && item.state === 'closed') ||
      (event.kind === 'merged' && item.state === 'merged')
    )
      finalClose.set(item.key, event.id)
  }

  const merges = sources.flatMap(source =>
    source.type === 'event' && source.event.kind === 'merged' ? [source.event] : [],
  )
  const absorbed = new Set<string>()
  const joinsOf = new Map<string, StoryKey[]>()
  for (const merge of merges) {
    const pr = byKey.get(keyOf(merge.source))
    if (!pr || finalClose.get(pr.key) !== merge.id) continue
    const joins: StoryKey[] = []
    for (const issueKey of pr.closes) {
      const issue = byKey.get(issueKey)
      if (!issue || !railKeys.has(issueKey) || issue.state !== 'closed') continue
      joins.push(issueKey)
      const closeId = finalClose.get(issueKey)
      const close = sources.find(src => src.type === 'event' && src.event.id === closeId)
      if (
        close?.type === 'event' &&
        Math.abs(Date.parse(close.event.at) - Date.parse(merge.at)) <= MERGE_WINDOW_MS
      ) {
        absorbed.add(close.event.id)
      }
      finalClose.set(issueKey, merge.id)
    }
    joinsOf.set(merge.id, joins)
  }

  let lastChecks: string | null = null
  for (const source of sources) {
    if (source.type === 'checks' && itemOf(source) === primary.key) lastChecks = source.group.id
  }

  for (const source of sources) {
    const at = atOf(source)
    const itemKey = itemOf(source)
    if (source.type === 'opened') {
      const item = source.item
      const line = blankLine(`opened:${item.key}`, at, item.key)
      line.actor = item.authorLogin
      line.login = item.authorLogin || null
      line.self =
        Boolean(item.authorLogin) && item.authorLogin.toLowerCase() === viewer.toLowerCase()
      line.verb = t(item.kind === 'pr' ? 'story.openedPr' : 'story.openedIssue', {
        number: item.number,
      })
      line.url = item.url
      line.key = true
      line.start = true
      const opening = item.body?.trim()
      if (opening) {
        line.body = opening
        line.quote = excerptOf(opening) ?? null
      }
      if (item.kind === 'pr') {
        line.fork = item.closes.filter(key => railKeys.has(key))
        const closes = item.closes.flatMap(key => {
          const issue = byKey.get(key)
          return issue ? [t('story.closes', { number: issue.number })] : []
        })
        const mentioned =
          item.role === 'primary'
            ? mentions.map(issue => t('story.mentions', { number: issue.number }))
            : []
        line.chips = [...closes, ...mentioned]
      }
      bySource.set(line.id, source)
      lines.push(line)
      continue
    }

    if (source.type === 'checks') {
      const result = checksOf(source.group)
      const id = source.group.id
      const line = blankLine(id, at, itemKey)
      line.actor = 'checks'
      line.url =
        (source.group.kind === 'ci-group' ? source.group.events[0]?.url : source.group.url) ?? null
      if (result.failed.length) {
        line.verb = t('story.checksFailed', { names: result.failed.join(', ') })
        line.tone = 'bad'
        line.key = id === lastChecks && !card.ended
      } else if (result.passed === result.total) {
        line.verb = t('story.checksPassed', { count: result.passed }, result.passed)
      } else {
        line.verb = t('story.checksOther', { count: result.total }, result.total)
      }
      line.mark = groupCiMark(source.group)
      bySource.set(line.id, source)
      lines.push(line)
      continue
    }

    const event = source.event
    if (absorbed.has(event.id)) continue
    if (!railKeys.has(itemKey)) continue
    // A PR that closes an issue is mentioned from both timelines. Keep it on the opened line.
    if (
      event.kind === 'cross-ref' &&
      event.ref &&
      railKeys.has(`${event.ref.repo}#${event.ref.number}`) &&
      (byKey.get(itemKey)?.closes.includes(`${event.ref.repo}#${event.ref.number}`) ||
        byKey.get(`${event.ref.repo}#${event.ref.number}`)?.closes.includes(itemKey))
    )
      continue
    const item = byKey.get(itemKey)
    const line = blankLine(event.id, at, itemKey)
    const bot = isBot(event.actor)
    line.actor = event.actor.login
    line.login = event.actor.login === 'ghost' ? null : event.actor.login
    line.avatar = event.actor.avatarUrl ?? null
    line.profile = event.actor.url ?? null
    line.self = isSelf(event.actor, viewer)
    line.url = event.url ?? null
    if (event.ref?.url)
      line.ref = { repo: event.ref.repo, number: event.ref.number, url: event.ref.url }
    if (event.label) line.label = event.label
    Object.assign(line, eventVerb(t, event, viewer))
    if (event.kind === 'ci') line.mark = ciMark(event.ci)
    if (event.kind === 'comment' || event.kind === 'review' || event.kind === 'review-comment') {
      line.quote = event.excerpt ?? null
      line.body = event.body ?? null
    }

    switch (event.kind) {
      case 'merged':
      case 'closed':
        if (finalClose.get(itemKey) === event.id) line.end = event.kind
        line.joins = joinsOf.get(event.id) ?? []
        line.chips = line.joins.map(key => t('story.closes', { number: byKey.get(key)!.number }))
        line.key = true
        break
      case 'reopened':
        line.key = true
        break
      case 'assigned':
      case 'unassigned':
        line.key = event.targetLogin?.toLowerCase() === viewer.toLowerCase()
        break
      case 'review':
        line.key =
          event.reviewState === 'APPROVED' ||
          event.reviewState === 'CHANGES_REQUESTED' ||
          (!line.self &&
            !bot &&
            Boolean(event.excerpt) &&
            isMaintainerAssociation(event.association))
        if (!line.self && !bot && isMaintainerAssociation(event.association))
          line.tags.push('maintainer')
        break
      case 'comment':
        if (event.bot === 'keep') {
          line.key = true
          line.tone = 'bad'
        } else if (bot) {
          line.key = false
        } else if (line.self && issueOnly) {
          line.key = true
        } else if (!line.self && isMaintainerAssociation(event.association)) {
          line.key = true
          line.tags.push('maintainer')
        }
        break
      default:
        break
    }
    if (item && !railKeys.has(item.key) && !line.self) line.key = false
    bySource.set(line.id, source)
    lines.push(line)
  }

  const reason = reasonLine(card, lines, bySource)
  if (reason) {
    reason.reason = true
    reason.key = true
  }

  const ordered = placeOpened(lines).sort((left, right) => left.at - right.at)
  const blocks: StoryBlock[] = []
  const runs = new Map<string, StoryLine[]>()
  const flush = () => {
    const groups = [...runs.values()].sort((left, right) => left[0]!.at - right[0]!.at)
    for (const group of groups) {
      if (group.length === 1) blocks.push({ type: 'line', line: group[0]! })
      else
        blocks.push({
          type: 'fold',
          fold: {
            id: `fold:${group[0]!.id}`,
            lines: group,
            summary: summaryOf(t, group, bySource),
            lane: group[0]!.item,
          },
        })
    }
    runs.clear()
  }
  for (const line of ordered) {
    if (line.key) {
      flush()
      blocks.push({ type: 'line', line })
      continue
    }
    const run = `${line.item}:${foldKind(line, bySource)}`
    const group = runs.get(run) ?? []
    group.push(line)
    runs.set(run, group)
  }
  flush()

  const active = card.ended ? [] : rails.filter(item => item.state === 'open')
  const closing =
    primary.kind === 'pr' && primary.state === 'open' && primary.closingEvidence === 'explicit'
      ? active.filter(
          item =>
            item.kind === 'issue' && item.link === 'closing' && primary.closes.includes(item.key),
        )
      : []

  return {
    items: [...items],
    primary,
    rails,
    related,
    blocks,
    lanes: lanesOf(rails, lines),
    turn: turnOf(card),
    nowItem:
      primary.kind === 'pr'
        ? primary.key
        : reason && active.some(item => item.key === reason.item)
          ? reason.item
          : primary.key,
    tail: {
      open: active.map(item => item.key),
      converge: closing.length ? [primary.key, ...closing.map(item => item.key)] : [],
    },
  }
}

/** Lane reuse: an ended item frees its column for the next item that opens. */
function lanesOf(rails: readonly StoryItem[], lines: readonly StoryLine[]): StoryItem[][] {
  const lanes: StoryItem[][] = []
  const busy: (StoryKey | null)[] = []
  const take = (item: StoryItem) => {
    let lane = busy.indexOf(null)
    if (lane < 0) {
      lane = busy.length
      busy.push(null)
      lanes.push([])
    }
    busy[lane] = item.key
    lanes[lane]!.push(item)
  }
  const railKeys = new Set(rails.map(item => item.key))
  const ordered = [...rails].sort((left, right) =>
    left.role === 'primary' ? -1 : right.role === 'primary' ? 1 : 0,
  )
  for (const item of ordered) if (!item.createdAt) take(item)
  for (const line of lines) {
    if (line.start && railKeys.has(line.item)) {
      const item = rails.find(rail => rail.key === line.item)!
      if (item.createdAt) take(item)
    }
    for (const key of [line.end ? line.item : null, ...line.joins]) {
      const lane = key ? busy.indexOf(key) : -1
      if (lane >= 0) busy[lane] = null
    }
  }
  return lanes
}

export function relationOf(t: TFunc, item: StoryItem, story: Story, viewer: string): string {
  const self = item.authorLogin.toLowerCase() === viewer.toLowerCase()
  if (item.role === 'primary') {
    if (item.kind === 'pr') return t('story.relation.yourPr')
    return self ? t('story.relation.yourIssue') : t('story.relation.theirIssue')
  }
  if (item.role === 'history') return t('story.relation.history')
  if (item.role === 'fixed-by')
    return item.authorLogin
      ? t('story.relation.fixedBy', { login: item.authorLogin })
      : t('story.relation.fixedByAnon')
  if (item.link === 'mention') return t('story.relation.mention')
  const closer = story.rails.find(
    rail => rail.kind === 'pr' && rail.role === 'primary' && rail.closes.includes(item.key),
  )
  return closer
    ? t('story.relation.closes', { number: closer.number })
    : t('story.relation.mention')
}

/* Rows and gutter cells. */

export type StoryRow =
  | {
      type: 'line'
      id: string
      line: StoryLine
      minor: boolean
      fold: string | null
      first: boolean
      last: boolean
    }
  | { type: 'fold'; id: string; fold: StoryFold; open: boolean }
  | { type: 'now'; id: 'now' }
  | { type: 'future'; id: 'future' }

export type StoryNode =
  | 'open'
  | 'dot'
  | 'minor'
  | 'closed'
  | 'merged'
  | 'join'
  | 'stack'
  | 'group'
  | 'now'
  | null

export type StoryCell = {
  lane: number
  up: boolean
  down: boolean
  node: StoryNode
  hl: boolean
  hr: boolean
  /** The connector crosses this lane's rail. */
  cross: boolean
  link: 'mine' | 'other' | 'good' | null
  dashed: boolean
  mine: boolean
  primary: boolean
  /** Rail starts above the first loaded event. */
  fade: boolean
  /** A dashed, conditional connector. Never styled as an actual merge. */
  projected: boolean
  mark: 'bad' | 'news' | 'run' | 'wait' | 'good' | null
}

export function storyRows(story: Story, open: ReadonlySet<string>): StoryRow[] {
  const rows: StoryRow[] = []
  for (const block of story.blocks) {
    if (block.type === 'line') {
      rows.push({
        type: 'line',
        id: block.line.id,
        line: block.line,
        minor: !block.line.key,
        fold: null,
        first: false,
        last: false,
      })
      continue
    }
    const isOpen = open.has(block.fold.id)
    rows.push({ type: 'fold', id: block.fold.id, fold: block.fold, open: isOpen })
    if (!isOpen) continue
    block.fold.lines.forEach((line, index) =>
      rows.push({
        type: 'line',
        id: line.id,
        line,
        minor: true,
        fold: block.fold.id,
        first: index === 0,
        last: index === block.fold.lines.length - 1,
      }),
    )
  }
  if (story.turn !== 'done') rows.push({ type: 'now', id: 'now' }, { type: 'future', id: 'future' })
  return rows
}

function lineNode(row: Extract<StoryRow, { type: 'line' }>): StoryNode {
  if (row.line.end === 'closed') return 'closed'
  if (row.line.end === 'merged') return 'merged'
  if (row.line.start) return 'open'
  if (row.minor) return row.line.body ? 'minor' : 'open'
  return 'dot'
}

export function storyGrid(
  story: Story,
  rows: readonly StoryRow[],
  viewer: string,
  spine: boolean,
): StoryCell[][] {
  const nowAt = rows.findIndex(row => row.type === 'now')
  const nowRow = nowAt < 0 ? rows.length - 1 : nowAt
  const lastRow = rows.length - 1
  const self = (item: StoryItem) => item.authorLogin.toLowerCase() === viewer.toLowerCase()
  const blank = (lane: number): StoryCell => ({
    lane,
    up: false,
    down: false,
    node: null,
    hl: false,
    hr: false,
    cross: false,
    link: null,
    dashed: false,
    mine: true,
    primary: false,
    fade: false,
    projected: false,
    mark: null,
  })

  if (spine) {
    return rows.map((row, r) => {
      const cell = blank(0)
      cell.up = r > 0
      cell.down = r < lastRow
      cell.dashed = r > nowRow
      cell.primary = true
      cell.fade = r === 0 && !story.primary.createdAt
      if (row.type === 'line') {
        cell.node = lineNode(row)
        cell.mark = row.line.mark
        const item = story.items.find(i => i.key === row.line.item)
        cell.mine = item ? self(item) : true
      } else if (row.type === 'fold') cell.node = row.open ? 'group' : 'stack'
      else if (row.type === 'now') cell.node = 'now'
      return [cell]
    })
  }

  const spans = new Map<StoryKey, { start: number; end: number }>()
  for (const item of story.rails) {
    const startRow = rows.findIndex(
      row => row.type === 'line' && row.line.item === item.key && row.line.start,
    )
    const endRow = rows.findIndex(
      row =>
        row.type === 'line' &&
        ((row.line.item === item.key && row.line.end) || row.line.joins.includes(item.key)),
    )
    const start = startRow >= 0 ? startRow : 0
    const lastKnown = rows.findLastIndex(row => row.type === 'line' && row.line.item === item.key)
    let end = Math.max(start, lastKnown)
    if (story.tail.open.includes(item.key)) end = lastRow
    if (endRow >= 0) end = endRow
    spans.set(item.key, { start, end })
  }
  const laneOf = (key: StoryKey) =>
    story.lanes.findIndex(lane => lane.some(item => item.key === key))

  return rows.map((row, r) => {
    const cells = story.lanes.map((lane, l): StoryCell => {
      const cell = blank(l)
      const item = lane.find(i => {
        const span = spans.get(i.key)!
        return r >= span.start && r <= span.end
      })
      if (!item) return cell
      const span = spans.get(item.key)!
      cell.up = r > span.start || (r === 0 && !item.createdAt)
      cell.down =
        r < span.end ||
        (row.type === 'future' &&
          story.tail.converge.length > 0 &&
          !story.tail.converge.includes(item.key))
      cell.fade = r === span.start && !item.createdAt
      cell.dashed = r > nowRow
      cell.mine = self(item)
      cell.primary = item.role === 'primary'
      if (row.type === 'line' && row.line.item === item.key) {
        cell.node = lineNode(row)
        cell.mark = row.line.mark
      }
      if (row.type === 'line' && row.line.joins.includes(item.key)) cell.node = 'join'
      if (row.type === 'fold' && row.fold.lines.some(line => line.item === item.key))
        cell.node = row.open ? 'group' : 'stack'
      if (row.type === 'now' && item.key === story.nowItem) cell.node = 'now'
      return cell
    })
    if (row.type === 'line' || row.type === 'future') {
      const projected = row.type === 'future'
      const fromKey = row.type === 'line' ? row.line.item : story.primary.key
      const targets =
        row.type === 'line' ? [...row.line.fork, ...row.line.joins] : story.tail.converge
      const from = laneOf(fromKey)
      const source = story.items.find(i => i.key === fromKey)
      let tone: StoryCell['link'] = 'other'
      if (row.type === 'line') {
        if (row.line.joins.length) tone = 'good'
        else if (source && self(source)) tone = 'mine'
      }
      for (const target of targets) {
        const to = laneOf(target)
        if (from < 0 || to < 0 || to === from) continue
        const lo = Math.min(from, to)
        const hi = Math.max(from, to)
        for (let l = lo; l <= hi; l += 1) {
          const cell = cells[l]!
          if (l > lo) cell.hl = true
          if (l < hi) cell.hr = true
          if (l > lo && l < hi && (cell.up || cell.down) && !cell.node) cell.cross = true
          cell.link = tone
          cell.projected = projected
        }
      }
    }
    return cells
  })
}

export type RailStroke = {
  key: string
  lane: number
  /** 1-based grid row where this stroke's box starts. */
  row: number
  span: number
  y0: string
  y1: string
  /** bottom: run to the box bottom. extend: stop y1 past the box. same: one row, from y0 to y1. */
  end: 'bottom' | 'extend' | 'same'
  dashed: boolean
  fade: boolean
  tail: boolean
  mine: boolean
  shift: string
}

export function rowNodeY(row: StoryRow, futureY = '16px'): string {
  if (row.type === 'now') return '19px'
  if (row.type === 'fold') return '14px'
  if (row.type === 'future') return futureY
  if (row.type === 'line' && row.minor) return '11px'
  return '14px'
}

/**
 * One stroke per continuous run of a lane. Colour does not change along it.
 * The future tail is the same rail, only dashed, and it starts at the Now node.
 */
export function railStrokes(
  rows: readonly StoryRow[],
  grid: readonly (readonly StoryCell[])[],
  futureY = '16px',
): RailStroke[] {
  const strokes: RailStroke[] = []
  const lanes = grid[0]?.length ?? 0

  const emit = (
    lane: number,
    run: { a: number; b: number; dashed: boolean; mine: boolean; fade: boolean; fromTop: boolean },
    end: 'node' | 'bottom',
  ) => {
    const y0 = run.fromTop ? '0px' : rowNodeY(rows[run.a]!, futureY)
    const y1 = rowNodeY(rows[run.b]!, futureY)
    if (run.a === run.b && end === 'node' && y0 === y1) return
    const last = grid[run.b]![lane]!
    const same = run.a === run.b
    strokes.push({
      key: `${lane}:${run.a}:${run.dashed ? 'd' : 's'}`,
      lane,
      row: run.a + 1,
      span: end === 'bottom' || same ? run.b - run.a + 1 : run.b - run.a,
      y0,
      y1,
      end: end === 'bottom' ? 'bottom' : same ? 'same' : 'extend',
      dashed: run.dashed,
      fade: run.fade,
      tail: run.dashed && last.node === null && !last.projected,
      mine: run.mine,
      shift: run.dashed && grid[run.a]![lane]!.node === 'now' ? '10px' : '0px',
    })
  }

  for (let lane = 0; lane < lanes; lane += 1) {
    let run: {
      a: number
      b: number
      dashed: boolean
      mine: boolean
      fade: boolean
      fromTop: boolean
    } | null = null
    const close = (end: 'node' | 'bottom') => {
      if (!run) return
      emit(lane, run, end)
      run = null
    }
    for (let r = 0; r < grid.length; r += 1) {
      const cell = grid[r]![lane]!
      if (!cell.up && !cell.down) {
        const through: boolean = run ? grid[run.b]![lane]!.down : false
        close(through ? 'bottom' : 'node')
        continue
      }
      if (!run) {
        run = {
          a: r,
          b: r,
          dashed: cell.dashed,
          mine: cell.mine,
          fade: cell.fade,
          fromTop: cell.up,
        }
        continue
      }
      if (cell.dashed !== run.dashed) {
        if (!run.dashed && cell.dashed) {
          const at: number = run.b
          const mine: boolean = run.mine
          close('node')
          run = { a: at, b: r, dashed: true, mine, fade: false, fromTop: false }
        } else {
          close('bottom')
          run = {
            a: r,
            b: r,
            dashed: cell.dashed,
            mine: cell.mine,
            fade: cell.fade,
            fromTop: cell.up,
          }
        }
        continue
      }
      run.b = r
    }
    close(run && grid[run.b]![lane]!.down ? 'bottom' : 'node')
  }
  return strokes
}
