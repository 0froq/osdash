import { claimLevel, includeIssueOnBoard } from './claim'
import { contributionTypes } from './contribution'
import { isSelf, viewerLoginOf } from './identity'
import { combineItems } from './timeline'
import { isDroppedBot } from './turn-rules'
import type { Unit, UnitBeat, UnitCategory, UnitHistoryPr, UnitIssue, UnitKind } from './unit'
import {
  firstReplyMs,
  type Activity,
  type Check,
  type ClosingIssue,
  type Item,
  type ItemState,
  type Verdict,
} from './turn'

export const SUPERSEDE_WINDOW_MS = 24 * 60 * 60 * 1000

export type FixedBy = {
  repo: string
  number: number
  url: string
  authorLogin: string
  state: ItemState
  createdAt?: string
  /** Verified targets from this PR's closingIssuesReferences. */
  closes: string[]
}

export type UnitDraft = {
  kind: UnitKind
  category: UnitCategory
  primary: Item
  issues: UnitIssue[]
  history: UnitHistoryPr[]
  fixedBy: FixedBy | null
  members: Item[]
}

type LinkKind = 'closing' | 'mention'

function itemKey(repo: string, number: number): string {
  return `${repo}#${number}`
}

function preferItem(current: Item, incoming: Item): Item {
  const currentStub = current.author.login === 'ghost' && current.activities.length === 0
  const incomingStub = incoming.author.login === 'ghost' && incoming.activities.length === 0
  if (currentStub && !incomingStub) return incoming
  if (!currentStub && incomingStub) return current
  return incoming.activities.length > current.activities.length ? incoming : current
}

function bump(links: Map<string, LinkKind>, key: string, link: LinkKind): void {
  const current = links.get(key)
  if (!current || link === 'closing') links.set(key, link)
}

function issueFromItem(item: Item, link: LinkKind, sharedWith: UnitIssue['sharedWith']): UnitIssue {
  return {
    repo: item.repo,
    number: item.number,
    url: item.url,
    title: item.title,
    state: item.state,
    authorLogin: item.author.login,
    link,
    sharedWith,
  }
}

function issueFromClosing(issue: ClosingIssue, sharedWith: UnitIssue['sharedWith']): UnitIssue {
  return {
    repo: issue.repo,
    number: issue.number,
    url: issue.url,
    title: issue.title,
    state: issue.state,
    authorLogin: issue.authorLogin,
    link: 'closing',
    sharedWith,
  }
}

function claimsFix(issue: Item | undefined): boolean {
  if (!issue) return false
  if (claimLevel(issue)) return true
  const tags = contributionTypes(issue)
  return tags.includes('claim') || tags.includes('proposal')
}

export function unitCategory(
  kind: UnitKind,
  primary: Item,
  issues: ReadonlyArray<{ link: LinkKind; item?: Item }>,
): UnitCategory {
  switch (kind) {
    case 'pr': {
      const claimed = issues.some(issue => issue.link === 'closing' && claimsFix(issue.item))
      return claimed ? 'claimed-fix' : 'direct-pr'
    }
    case 'issue-only':
      return isSelf(primary.author, viewerLoginOf(primary)) ? 'reported' : 'helped'
    default: {
      const exhaustive: never = kind
      return exhaustive
    }
  }
}

function historyOf(pr: Item): UnitHistoryPr | null {
  if (!pr.closedAt) return null
  return {
    repo: pr.repo,
    number: pr.number,
    url: pr.url,
    title: pr.title,
    state: 'closed',
    closedAt: pr.closedAt,
  }
}

/**
 * Group enriched items into contribution drafts.
 * Someone else's pull request never becomes its own card.
 */
export function buildUnitDrafts(items: readonly Item[]): UnitDraft[] {
  if (items.length === 0) return []

  const byKey = new Map<string, Item>()
  for (const item of items) {
    const key = itemKey(item.repo, item.number)
    const current = byKey.get(key)
    byKey.set(key, current ? preferItem(current, item) : item)
  }
  const unique = [...byKey.values()]

  const viewerPrs = unique.filter(
    item => item.kind === 'pr' && isSelf(item.author, viewerLoginOf(item)),
  )
  const prByKey = new Map(viewerPrs.map(pr => [itemKey(pr.repo, pr.number), pr]))
  const viewerPrKeys = new Set(prByKey.keys())

  const edges = new Map<string, Map<string, LinkKind>>()
  const ensureEdges = (prKey: string): Map<string, LinkKind> => {
    const existing = edges.get(prKey)
    if (existing) return existing
    const created = new Map<string, LinkKind>()
    edges.set(prKey, created)
    return created
  }

  for (const pr of viewerPrs) {
    const prKey = itemKey(pr.repo, pr.number)
    const links = ensureEdges(prKey)
    for (const issue of pr.closingIssues ?? [])
      bump(links, itemKey(issue.repo, issue.number), 'closing')
    for (const link of pr.timelineLinks ?? []) {
      if (link.kind !== 'issue') continue
      bump(
        links,
        itemKey(link.repo, link.number),
        link.event === 'connected' ? 'closing' : 'mention',
      )
    }
  }

  for (const item of unique) {
    if (item.kind !== 'issue') continue
    const issueKey = itemKey(item.repo, item.number)
    for (const link of item.timelineLinks ?? []) {
      if (link.kind !== 'pr') continue
      const prKey = itemKey(link.repo, link.number)
      if (!viewerPrKeys.has(prKey)) continue
      bump(ensureEdges(prKey), issueKey, link.event === 'connected' ? 'closing' : 'mention')
    }
    for (const pull of item.linkedPullRequests ?? []) {
      if (!isSelf(pull.author, viewerLoginOf(item))) continue
      const prKey = itemKey(pull.repo, pull.number)
      if (!viewerPrKeys.has(prKey)) continue
      bump(ensureEdges(prKey), issueKey, 'mention')
    }
  }

  const issueToPrs = new Map<string, Set<string>>()
  for (const [prKey, links] of edges) {
    for (const issueKey of links.keys()) {
      const set = issueToPrs.get(issueKey)
      if (set) set.add(prKey)
      else issueToPrs.set(issueKey, new Set([prKey]))
    }
  }

  const supersededBy = new Map<string, string>()
  for (const prKeys of issueToPrs.values()) {
    const group = [...prKeys].flatMap(key => {
      const pr = prByKey.get(key)
      return pr ? [pr] : []
    })
    for (const older of group) {
      if (older.state !== 'closed' || !older.closedAt) continue
      const closedAt = Date.parse(older.closedAt)
      const olderCreated = Date.parse(older.createdAt)
      const successors = group.filter(other => {
        if (other === older) return false
        if (Date.parse(other.createdAt) <= olderCreated) return false
        return closedAt <= Date.parse(other.createdAt) + SUPERSEDE_WINDOW_MS
      })
      if (successors.length === 0) continue
      successors.sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
      const winner = successors[0]!
      const olderKey = itemKey(older.repo, older.number)
      const winnerKey = itemKey(winner.repo, winner.number)
      const existing = supersededBy.get(olderKey)
      const existingPr = existing ? prByKey.get(existing) : undefined
      if (!existingPr || Date.parse(winner.createdAt) > Date.parse(existingPr.createdAt)) {
        supersededBy.set(olderKey, winnerKey)
      }
    }
  }

  const rootOf = (start: string): string => {
    const seen = new Set<string>()
    let current = start
    while (supersededBy.has(current) && !seen.has(current)) {
      seen.add(current)
      current = supersededBy.get(current)!
    }
    return current
  }

  const historyKeys = new Map<string, string[]>()
  for (const pr of viewerPrs) {
    const key = itemKey(pr.repo, pr.number)
    const root = rootOf(key)
    if (root === key) continue
    const list = historyKeys.get(root)
    if (list) list.push(key)
    else historyKeys.set(root, [key])
  }

  const roots = viewerPrs.filter(
    pr => rootOf(itemKey(pr.repo, pr.number)) === itemKey(pr.repo, pr.number),
  )

  const linkedIssueKeys = new Set<string>()
  for (const links of edges.values()) {
    for (const issueKey of links.keys()) linkedIssueKeys.add(issueKey)
  }

  const drafts: UnitDraft[] = []

  for (const pr of roots) {
    const prKey = itemKey(pr.repo, pr.number)
    const folded = [prKey, ...(historyKeys.get(prKey) ?? [])]
    const issueLinks = new Map<string, LinkKind>()
    for (const key of folded) {
      for (const [issueKey, link] of edges.get(key) ?? []) bump(issueLinks, issueKey, link)
    }

    const issues: UnitIssue[] = []
    const issueItems: Array<{ link: LinkKind; item?: Item }> = []
    const memberItems: Item[] = [pr]
    for (const [issueKey, link] of issueLinks) {
      const item = byKey.get(issueKey)
      const sharedWith = sharedPulls(issueKey, prKey, roots, issueToPrs, prByKey)
      if (item && item.kind === 'issue') {
        issues.push(issueFromItem(item, link, sharedWith))
        issueItems.push({ link, item })
        memberItems.push(item)
      } else {
        const closing = folded
          .flatMap(key => prByKey.get(key)?.closingIssues ?? [])
          .find(issue => itemKey(issue.repo, issue.number) === issueKey)
        if (!closing) continue
        issues.push(issueFromClosing(closing, sharedWith))
        issueItems.push({ link: 'closing' })
      }
    }

    const history = (historyKeys.get(prKey) ?? [])
      .flatMap(key => {
        const old = prByKey.get(key)
        return old ? [old] : []
      })
      .sort((left, right) => Date.parse(left.createdAt) - Date.parse(right.createdAt))
      .flatMap(old => {
        memberItems.push(old)
        const entry = historyOf(old)
        return entry ? [entry] : []
      })

    drafts.push({
      kind: 'pr',
      category: unitCategory('pr', pr, issueItems),
      primary: pr,
      issues,
      history,
      fixedBy: mergedFixFor(issueItems, byKey),
      members: memberItems,
    })
  }

  for (const item of unique) {
    if (item.kind !== 'issue') continue
    if (linkedIssueKeys.has(itemKey(item.repo, item.number))) continue
    if (!includeIssueOnBoard(item) && !contributionTypes(item).includes('help')) continue
    drafts.push({
      kind: 'issue-only',
      category: unitCategory('issue-only', item, []),
      primary: item,
      issues: [],
      history: [],
      fixedBy: fixedByFor(item, byKey),
      members: [item],
    })
  }

  return drafts
}

function sharedPulls(
  issueKey: string,
  selfKey: string,
  roots: readonly Item[],
  issueToPrs: ReadonlyMap<string, Set<string>>,
  prByKey: ReadonlyMap<string, Item>,
): UnitIssue['sharedWith'] {
  const linked = issueToPrs.get(issueKey)
  if (!linked) return []
  return roots
    .filter(pr => {
      const key = itemKey(pr.repo, pr.number)
      return key !== selfKey && linked.has(key)
    })
    .map(pr => prByKey.get(itemKey(pr.repo, pr.number)) ?? pr)
    .sort((left, right) => left.number - right.number)
    .map(pr => ({ repo: pr.repo, number: pr.number, url: pr.url }))
}

function combinedItem(items: readonly Item[]): Item | null {
  if (items.length === 0) return null
  if (items.length === 1) return items[0] ?? null
  return combineItems([...items])
}

function checkMovesUnread(check: Check): boolean {
  return check.conclusion === 'FAILURE' || check.conclusion === 'SUCCESS'
}

export function lastOtherActivityAt(items: readonly Item[], nowMs: number): string | null {
  const combined = combinedItem(items)
  if (!combined) return null
  const viewer = viewerLoginOf(combined)
  let latest = Number.NEGATIVE_INFINITY
  for (const activity of combined.activities) {
    if (isSelf(activity.actor, viewer) || isDroppedBot(activity)) continue
    const at = Date.parse(activity.at)
    if (at > latest) latest = at
  }
  if (combined.checks.some(checkMovesUnread) && nowMs > latest) latest = nowMs
  if (!Number.isFinite(latest)) return null
  return new Date(latest).toISOString()
}

/** The viewer's own latest action across the card's members. Creation counts. */
export function lastOwnActivityAt(items: readonly Item[]): string | null {
  const combined = combinedItem(items)
  if (!combined) return null
  const viewer = viewerLoginOf(combined)
  let latest = Number.NEGATIVE_INFINITY
  for (const activity of combined.activities) {
    if (!isSelf(activity.actor, viewer) || isDroppedBot(activity)) continue
    const at = Date.parse(activity.at)
    if (at > latest) latest = at
  }
  if (!Number.isFinite(latest)) return null
  return new Date(latest).toISOString()
}

/** How many beats a card shows. The preview carries the rest. */
export const BEAT_LIMIT = 2

function beatVerb(activity: Activity): string | null {
  switch (activity.kind) {
    case 'create':
      return null
    case 'comment':
      return 'commented'
    case 'review':
      switch (activity.reviewState) {
        case 'APPROVED':
          return 'approved'
        case 'CHANGES_REQUESTED':
          return 'requested changes'
        case 'DISMISSED':
          return 'review dismissed'
        default:
          return 'reviewed'
      }
    case 'push':
      return 'pushed commits'
    default: {
      const exhaustive: never = activity.kind
      return exhaustive
    }
  }
}

/**
 * Only the newest beat carries a full node. Older beats are the small ones, the
 * same way the preview dims everything that is not the current position.
 */
function beatNode(_activity: Activity, isLast: boolean): UnitBeat['node'] {
  return isLast ? 'dot' : 'minor'
}

/**
 * The newest few beats of a card, drawn from the same activities the preview
 * renders. Opening, closing and merging are structural and stay out of the
 * preview strip: they are what the card header already says.
 */
export function recentBeats(items: readonly Item[], limit = BEAT_LIMIT): UnitBeat[] {
  const combined = combinedItem(items)
  if (!combined) return []
  const viewer = viewerLoginOf(combined)
  const beats = combined.activities
    .filter(activity => activity.kind !== 'create' && !isDroppedBot(activity))
    .map(activity => ({ activity, at: Date.parse(activity.at) }))
    .filter(entry => Number.isFinite(entry.at))
    .sort((left, right) => left.at - right.at)
    .slice(-limit)
  return beats.map(({ activity }, index) => ({
    at: activity.at,
    actor: activity.actor.login,
    what: beatVerb(activity) ?? 'updated',
    node: beatNode(activity, index === beats.length - 1),
    // Only the newest beat can still be asking something of the viewer. An
    // older changes-requested review has since been answered.
    wants:
      index === beats.length - 1 &&
      !isSelf(activity.actor, viewer) &&
      activity.kind === 'review' &&
      activity.reviewState === 'CHANGES_REQUESTED',
  }))
}

export function toUnit(draft: UnitDraft, verdict: Verdict, nowMs: number): Unit {
  const primary = draft.primary
  const ended = primary.state !== 'open'
  const prefix = draft.kind === 'pr' ? 'pr' : 'issue'
  return {
    id: `${prefix}:${primary.repo}#${primary.number}`,
    kind: draft.kind,
    category: draft.category,
    tags: verdict.contributions,
    repo: primary.repo,
    number: primary.number,
    title: primary.title,
    url: primary.url,
    state: primary.state,
    createdAt: primary.createdAt,
    closedAt: primary.closedAt,
    issues: draft.issues,
    history: draft.history,
    fixedBy: draft.fixedBy,
    myTurn: !ended && verdict.turn === 'mine',
    ended,
    reason: verdict.reason,
    reasonCode: verdict.reasonCode,
    reasonActor: verdict.reasonActor,
    quote: verdict.quote,
    labels: verdict.labels,
    marks: verdict.marks,
    tone: verdict.tone,
    lastActivityAt: verdict.waitingSince,
    lastOtherActivityAt: lastOtherActivityAt(draft.members, nowMs),
    lastOwnActivityAt: lastOwnActivityAt(draft.members),
    ageMs: verdict.ageMs,
    firstReplyMs: firstReplyMs(combinedItem(draft.members) ?? primary),
    links: verdict.links,
    beats: recentBeats(draft.members),
    members: draft.members.map(item => ({
      repo: item.repo,
      number: item.number,
      kind: item.kind,
      updatedAt: item.updatedAt,
      headSha: item.headSha,
      title: item.title,
      url: item.url,
      state: item.state,
      authorLogin: item.author.login,
      createdAt: item.createdAt,
      closedAt: item.closedAt,
      ...(item.body?.trim() ? { body: item.body.trim() } : {}),
      closes: closesOf(item),
    })),
  }
}

function closesOf(item: Item): string[] {
  const keys = new Set<string>()
  for (const issue of item.closingIssues ?? []) keys.add(itemKey(issue.repo, issue.number))
  for (const link of item.timelineLinks ?? []) {
    if (link.event === 'connected' && link.kind === 'issue') {
      keys.add(itemKey(link.repo, link.number))
    }
  }
  return [...keys]
}

/** Someone else's merged PR that closes one of this PR card's issues. */
function mergedFixFor(
  issues: ReadonlyArray<{ link: LinkKind; item?: Item }>,
  byKey: ReadonlyMap<string, Item>,
): FixedBy | null {
  for (const { link, item } of issues) {
    if (link !== 'closing' || !item) continue
    const fix = fixedByFor(item, byKey)
    if (fix?.state === 'merged') return fix
  }
  return null
}

function fixedByFor(issue: Item, byKey: ReadonlyMap<string, Item>): FixedBy | null {
  const viewer = viewerLoginOf(issue)
  const candidates = [...byKey.values()].filter(
    pull =>
      pull.kind === 'pr' &&
      pull.state === 'merged' &&
      !isSelf(pull.author, viewer) &&
      // A mention or an unhydrated stub is not evidence of a fix.
      pull.closingIssues?.some(
        target => target.repo === issue.repo && target.number === issue.number,
      ),
  )
  candidates.sort((left, right) => {
    const leftAt = Date.parse(left.createdAt)
    const rightAt = Date.parse(right.createdAt)
    if (Number.isFinite(leftAt) && Number.isFinite(rightAt) && leftAt !== rightAt)
      return rightAt - leftAt
    return right.number - left.number
  })
  const best = candidates[0]
  if (!best) return null
  return {
    repo: best.repo,
    number: best.number,
    url: best.url,
    authorLogin: best.author.login,
    state: best.state,
    createdAt: best.createdAt,
    closes: (best.closingIssues ?? []).map(target => itemKey(target.repo, target.number)),
  }
}
