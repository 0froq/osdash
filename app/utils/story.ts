import type { CiGroup, TimelineEntry, UnitEvent } from '#shared/events'
import { isMaintainerAssociation } from '#shared/claim-types'
import { isBot, isSelf } from '#shared/identity'
import type { ReasonCode } from '#shared/reason'
import type { StoryItem, StoryKey } from '#shared/story'
import type { UnitCategory, UnitKind } from '#shared/unit'
import { copy } from '~/copy/en'

/*
 * A card's timeline as a contribution story. Every string comes from event
 * kinds, author_association, claim keywords, closingIssuesReferences and the
 * judge's reasonCode. Branches only change on opened, closed and merged lines,
 * which are always key lines, so folding never changes the rails.
 */

export type StoryTag = 'claim' | 'maintainer'
export type StoryTurn = 'you' | 'waiting' | 'done'

export type StoryLine = {
  id: string
  at: number
  item: StoryKey
  actor: string
  self: boolean
  key: boolean
  reason: boolean
  verb: string
  detail: string | null
  chips: string[]
  quote: string | null
  tags: StoryTag[]
  tone: 'plain' | 'good' | 'bad'
  url: string | null
  start: boolean
  end: 'merged' | 'closed' | null
  /** Issues a PR branches from, on its opened line. */
  fork: StoryKey[]
  /** Issues closed by this merge. */
  joins: StoryKey[]
}

export type StoryFold = { id: string; lines: StoryLine[]; summary: string }

export type StoryBlock = { type: 'line'; line: StoryLine } | { type: 'fold'; fold: StoryFold }

export type StoryNext = { who: string; text: string }

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
  next: StoryNext[]
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

function checksOf(group: CiGroup | UnitEvent): { failed: string[]; passed: number; total: number } {
  const events = group.kind === 'ci-group' ? group.events : [group]
  return {
    failed: events.filter(event => event.ci?.conclusion === 'FAILURE').map(event => event.ci!.name),
    passed: events.filter(event => event.ci?.conclusion === 'SUCCESS').length,
    total: events.length,
  }
}

function eventVerb(event: UnitEvent, viewer: string): Pick<StoryLine, 'verb' | 'tone' | 'detail'> {
  const s = copy.story
  const login = (value: string | undefined) =>
    value && value.toLowerCase() === viewer.toLowerCase() ? 'you' : (value ?? copy.someone)
  switch (event.kind) {
    case 'opened':
      return { verb: s.opened(event.source.kind, event.source.number), tone: 'plain', detail: null }
    case 'comment':
      return { verb: s.commented, tone: 'plain', detail: null }
    case 'review-comment':
      return { verb: s.commentedOnCode, tone: 'plain', detail: null }
    case 'review':
      if (event.reviewState === 'APPROVED') return { verb: s.approved, tone: 'good', detail: null }
      if (event.reviewState === 'CHANGES_REQUESTED')
        return { verb: s.changes, tone: 'bad', detail: null }
      if (event.reviewState === 'DISMISSED')
        return { verb: s.dismissed, tone: 'plain', detail: null }
      return { verb: s.reviewed, tone: 'plain', detail: null }
    case 'commit':
      return {
        verb: s.committed,
        tone: 'plain',
        detail: event.commit?.message.split('\n')[0] || null,
      }
    case 'force-push':
      return { verb: s.forcePushed, tone: 'plain', detail: null }
    case 'ci':
      return { verb: event.ci?.name ?? '', tone: 'plain', detail: null }
    case 'labeled':
      return { verb: s.labeled(event.label?.name ?? ''), tone: 'plain', detail: null }
    case 'unlabeled':
      return { verb: s.unlabeled(event.label?.name ?? ''), tone: 'plain', detail: null }
    case 'assigned':
      return { verb: s.assigned(login(event.targetLogin)), tone: 'plain', detail: null }
    case 'unassigned':
      return { verb: s.unassigned(login(event.targetLogin)), tone: 'plain', detail: null }
    case 'review-requested':
      return { verb: s.reviewRequested(login(event.targetLogin)), tone: 'plain', detail: null }
    case 'cross-ref':
      return { verb: s.crossRef(event.ref?.number ?? 0), tone: 'plain', detail: null }
    case 'connected':
      return { verb: s.connected(event.ref?.number ?? 0), tone: 'plain', detail: null }
    case 'renamed':
      return { verb: s.renamed, tone: 'plain', detail: event.rename?.to ?? null }
    case 'merged':
      return { verb: s.merged(event.source.number), tone: 'good', detail: null }
    case 'closed':
      return { verb: s.closed(event.source.number), tone: 'plain', detail: null }
    case 'reopened':
      return { verb: s.reopened(event.source.number), tone: 'plain', detail: null }
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
    self: false,
    key: false,
    reason: false,
    verb: '',
    detail: null,
    chips: [],
    quote: null,
    tags: [],
    tone: 'plain',
    url: null,
    start: false,
    end: null,
    fork: [],
    joins: [],
  }
}

function summaryOf(lines: readonly StoryLine[], sources: ReadonlyMap<string, Source>): string {
  const s = copy.story.summary
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
    comments ? s.comments(comments) : '',
    reviews ? s.reviews(reviews) : '',
    commits ? s.commits(commits) : '',
    checks === 'failed' ? s.checksFailed : checks === 'passed' ? s.checksPassed : '',
    requested ? s.reviewRequested : '',
    labels ? s.labels(labels) : '',
    mentions.length ? s.mentions([...new Set(mentions)]) : '',
    bots ? s.bots(bots) : '',
    other ? s.other(other) : '',
  ].filter(Boolean)
  return parts.join(' · ')
}

function turnOf(card: StoryCard): StoryTurn {
  if (card.ended) return 'done'
  return card.myTurn ? 'you' : 'waiting'
}

function nextOf(card: StoryCard, primary: StoryItem): StoryNext[] {
  const n = copy.story.next
  const number = primary.number
  const actor = card.reasonActor ?? n.reviewer
  switch (card.reasonCode) {
    case 'changes-requested':
      return [
        { who: n.you, text: n.push(number) },
        { who: actor, text: n.reviewAgain },
      ]
    case 'ci-failed':
    case 'ci-lint-failed':
      return [{ who: n.you, text: n.fixCheck(number) }]
    case 'cla-failed':
      return [{ who: n.you, text: n.signCla(number) }]
    case 'coderabbit':
      return [{ who: n.you, text: n.answerBot }]
    case 'mentioned':
    case 'commented':
    case 'asked-pr-or-rebase':
      return [{ who: n.you, text: n.reply(number) }]
    case 'claimed-open-pr':
      return [{ who: n.you, text: n.openPr(number) }]
    case 'claim-pending':
      return [{ who: n.maintainers, text: n.confirmClaim(number) }]
    case 'approved':
      return [{ who: n.maintainers, text: n.merge(number) }]
    case 'pushed':
      return [{ who: n.you, text: n.reviewCommits }]
    case 'review-dismissed':
      return [{ who: actor, text: n.reviewAgain }]
    case 'opened-waiting':
    case 'replied-waiting':
    case 'asked-waiting':
    case 'pushed-waiting':
      return card.category === 'reported'
        ? [
            { who: n.maintainers, text: n.reply(number) },
            { who: n.anyone, text: n.openClosingPr(number) },
          ]
        : [{ who: n.maintainers, text: n.reply(number) }]
    case 'already-fixed':
    case 'workaround':
    case 'merged':
    case 'closed':
    case 'clef':
      return []
    default: {
      const exhaustive: never = card.reasonCode
      return exhaustive
    }
  }
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
  const s = copy.story

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
      line.self =
        Boolean(item.authorLogin) && item.authorLogin.toLowerCase() === viewer.toLowerCase()
      line.verb = s.opened(item.kind, item.number)
      line.url = item.url
      line.key = true
      line.start = true
      if (item.kind === 'pr') {
        line.fork = item.closes.filter(key => railKeys.has(key))
        const closes = item.closes.flatMap(key => {
          const issue = byKey.get(key)
          return issue ? [s.closes(issue.number)] : []
        })
        const mentioned =
          item.role === 'primary' ? mentions.map(issue => s.mentions(issue.number)) : []
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
        line.verb = s.checksFailed(result.failed)
        line.tone = 'bad'
        line.key = id === lastChecks && !card.ended
      } else if (result.passed === result.total) {
        line.verb = s.checksPassed(result.passed)
      } else {
        line.verb = s.checksOther(result.total)
      }
      bySource.set(line.id, source)
      lines.push(line)
      continue
    }

    const event = source.event
    if (absorbed.has(event.id)) continue
    const item = byKey.get(itemKey)
    const line = blankLine(event.id, at, itemKey)
    const bot = isBot(event.actor)
    line.actor = event.actor.login
    line.self = isSelf(event.actor, viewer)
    line.url = event.url ?? null
    Object.assign(line, eventVerb(event, viewer))
    if (event.kind === 'comment' || event.kind === 'review' || event.kind === 'review-comment')
      line.quote = event.excerpt ?? null

    switch (event.kind) {
      case 'merged':
      case 'closed':
        if (finalClose.get(itemKey) === event.id) line.end = event.kind
        line.joins = joinsOf.get(event.id) ?? []
        line.chips = line.joins.map(key => s.closes(byKey.get(key)!.number))
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
        } else if (line.self && event.claim) {
          line.key = true
          line.tags.push('claim')
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

  const blocks: StoryBlock[] = []
  let pending: StoryLine[] = []
  const flush = () => {
    if (pending.length === 1) blocks.push({ type: 'line', line: pending[0]! })
    else if (pending.length > 1)
      blocks.push({
        type: 'fold',
        fold: {
          id: `fold:${pending[0]!.id}`,
          lines: pending,
          summary: summaryOf(pending, bySource),
        },
      })
    pending = []
  }
  for (const line of lines) {
    if (line.key) {
      flush()
      blocks.push({ type: 'line', line })
    } else {
      pending.push(line)
    }
  }
  flush()

  return {
    items: [...items],
    primary,
    rails,
    related,
    blocks,
    lanes: lanesOf(rails, lines),
    turn: turnOf(card),
    next: nextOf(card, primary),
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

export function relationOf(item: StoryItem, story: Story, viewer: string): string {
  const r = copy.story.relation
  const self = item.authorLogin.toLowerCase() === viewer.toLowerCase()
  if (item.role === 'primary') {
    if (item.kind === 'pr') return r.yourPr
    return self ? r.yourIssue : r.theirIssue
  }
  if (item.role === 'history') return r.history
  if (item.role === 'fixed-by') return r.fixedBy(item.authorLogin)
  if (item.link === 'mention') return r.mention
  const closer = story.rails.find(
    rail => rail.kind === 'pr' && rail.role === 'primary' && rail.closes.includes(item.key),
  )
  return closer ? r.closes(closer.number) : r.mention
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
  | { type: 'next'; id: string; next: StoryNext }

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
  | 'next'
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
  if (story.turn !== 'done') rows.push({ type: 'now', id: 'now' })
  story.next.forEach((next, index) => rows.push({ type: 'next', id: `next:${index}`, next }))
  return rows
}

function lineNode(row: Extract<StoryRow, { type: 'line' }>): StoryNode {
  if (row.line.end === 'closed') return 'closed'
  if (row.line.end === 'merged') return 'merged'
  if (row.line.start) return 'open'
  return row.minor ? 'minor' : 'dot'
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
        const item = story.items.find(i => i.key === row.line.item)
        cell.mine = item ? self(item) : true
      } else if (row.type === 'fold') cell.node = row.open ? 'group' : 'stack'
      else cell.node = row.type
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
    const end = endRow >= 0 ? endRow : item.role === 'primary' ? lastRow : nowRow
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
      cell.down = r < span.end
      cell.fade = r === span.start && !item.createdAt
      cell.dashed = r > nowRow
      cell.mine = self(item)
      cell.primary = item.role === 'primary'
      if (row.type === 'line' && row.line.item === item.key) cell.node = lineNode(row)
      if (row.type === 'line' && row.line.joins.includes(item.key)) cell.node = 'join'
      if (row.type === 'fold' && row.fold.lines.some(line => line.item === item.key))
        cell.node = row.open ? 'group' : 'stack'
      if (row.type === 'now' && item.role === 'primary') cell.node = 'now'
      if (row.type === 'next' && item.role === 'primary') cell.node = 'next'
      return cell
    })
    if (row.type === 'line') {
      const from = laneOf(row.line.item)
      const source = story.items.find(i => i.key === row.line.item)
      const tone = row.line.joins.length ? 'good' : source && self(source) ? 'mine' : 'other'
      for (const target of [...row.line.fork, ...row.line.joins]) {
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
        }
      }
    }
    return cells
  })
}
