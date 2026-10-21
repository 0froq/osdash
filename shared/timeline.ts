import { isSelf, viewerLoginOf } from './identity'
import type {
  Activity,
  Check,
  Item,
  ItemPart,
  ItemState,
  LinkedPullRequest,
  TimelineLink,
} from './turn'

export type RawTimelineSourceIssue = {
  number?: number
  html_url?: string
  state?: string
  pull_request?: unknown
  repository_url?: string
}

export type RawTimelineEvent = {
  event?: string
  created_at?: string
  source?: {
    type?: string
    issue?: RawTimelineSourceIssue
  }
}

function repoFromSource(issue: RawTimelineSourceIssue): string | null {
  const fromApi = issue.repository_url?.match(/\/repos\/([^/]+\/[^/]+?)(?:\/|$)/)
  if (fromApi?.[1]) return fromApi[1]
  const fromHtml = issue.html_url?.match(/github\.com\/([^/]+\/[^/]+)\/(?:issues|pull)\//)
  return fromHtml?.[1] ?? null
}

export function linksFromTimeline(events: readonly RawTimelineEvent[]): TimelineLink[] {
  const links: TimelineLink[] = []
  for (const event of events) {
    if (event.event !== 'cross-referenced' && event.event !== 'connected') continue
    const issue = event.source?.issue
    if (!issue?.number) continue
    const repo = repoFromSource(issue)
    if (!repo) continue
    const kind = issue.pull_request || issue.html_url?.includes('/pull/') ? 'pr' : 'issue'
    links.push({
      event: event.event,
      repo,
      number: issue.number,
      kind,
      url: issue.html_url,
    })
  }
  return links
}

function itemKey(repo: string, number: number): string {
  return `${repo}#${number}`
}

export function itemFromLinkedPull(link: LinkedPullRequest, viewerLogin: string): Item {
  return {
    kind: 'pr',
    repo: link.repo,
    number: link.number,
    title: `Pull request #${link.number}`,
    url: link.url,
    state: link.state,
    createdAt: '1970-01-01T00:00:00.000Z',
    closedAt: link.state === 'open' ? null : '1970-01-01T00:00:00.000Z',
    author: link.author,
    activities: [],
    checks: [],
    viewerLogin,
  }
}

function itemFromTimelinePull(link: TimelineLink, viewerLogin: string): Item {
  const url = link.url ?? `https://github.com/${link.repo}/pull/${link.number}`
  return {
    kind: 'pr',
    repo: link.repo,
    number: link.number,
    title: `Pull request #${link.number}`,
    url,
    state: 'open',
    createdAt: '1970-01-01T00:00:00.000Z',
    closedAt: null,
    author: { typename: 'User', login: 'ghost' },
    activities: [],
    checks: [],
    viewerLogin,
  }
}

/** Pull requests referenced by an issue but missing from the search result set. */
export function expandMissingLinkedPulls(items: readonly Item[]): Item[] {
  const byKey = new Map(items.map(item => [itemKey(item.repo, item.number), item]))
  const extras: Item[] = []
  for (const item of items) {
    const viewer = viewerLoginOf(item)
    for (const link of item.linkedPullRequests ?? []) {
      if (!isSelf(link.author, viewer)) continue
      const key = itemKey(link.repo, link.number)
      if (byKey.has(key)) continue
      const stub = itemFromLinkedPull(link, viewer)
      byKey.set(key, stub)
      extras.push(stub)
    }
    for (const link of item.timelineLinks ?? []) {
      if (link.kind !== 'pr') continue
      const key = itemKey(link.repo, link.number)
      if (byKey.has(key)) continue
      const stub = itemFromTimelinePull(link, viewer)
      byKey.set(key, stub)
      extras.push(stub)
    }
  }
  return extras.length > 0 ? [...items, ...extras] : [...items]
}

function linkEdges(item: Item): Array<{ repo: string; number: number }> {
  const edges: Array<{ repo: string; number: number }> = []
  for (const link of item.timelineLinks ?? []) {
    edges.push({ repo: link.repo, number: link.number })
  }
  for (const pull of item.linkedPullRequests ?? []) {
    edges.push({ repo: pull.repo, number: pull.number })
  }
  return edges
}

function toPart(item: Item): ItemPart {
  return {
    kind: item.kind,
    repo: item.repo,
    number: item.number,
    url: item.url,
    title: item.title,
    authorLogin: item.author.login,
    body: item.body,
  }
}

function primaryRank(item: Item): number {
  if (item.kind === 'pr' && item.state === 'open') return 0
  if (item.kind === 'pr' && item.state === 'merged') return 1
  if (item.kind === 'issue' && item.state === 'open') return 2
  if (item.kind === 'pr') return 3
  if (item.state === 'merged') return 4
  return 5
}

function combinedState(items: readonly Item[]): ItemState {
  const pulls = items.filter(item => item.kind === 'pr')
  if (pulls.some(item => item.state === 'open')) return 'open'
  const openIssue = items.some(item => item.kind === 'issue' && item.state === 'open')
  const everyPullMerged = pulls.length > 0 && pulls.every(item => item.state === 'merged')
  if (openIssue && !everyPullMerged) return 'open'
  if (items.some(item => item.state === 'merged')) return 'merged'
  return 'closed'
}

function activityKey(activity: Activity): string {
  return [
    activity.kind,
    activity.at,
    activity.actor.login,
    activity.url ?? '',
    activity.reviewState ?? '',
    activity.commentId ?? '',
  ].join('|')
}

function dedupeActivities(activities: readonly Activity[]): Activity[] {
  const seen = new Set<string>()
  const unique: Activity[] = []
  const ordered = [...activities].sort(
    (first, second) => Date.parse(first.at) - Date.parse(second.at),
  )
  for (const activity of ordered) {
    const key = activityKey(activity)
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(activity)
  }
  return unique
}

function mergeChecks(items: readonly Item[]): Check[] {
  const byName = new Map<string, Check>()
  for (const item of items) {
    for (const check of item.checks) byName.set(check.name, check)
  }
  return [...byName.values()]
}

export function combineItems(cluster: Item[]): Item {
  const parts = cluster.map(toPart)
  if (cluster.length === 1) {
    const only = cluster[0]!
    return only.parts ? only : { ...only, parts }
  }

  const ordered = [...cluster].sort((first, second) => {
    const rank = primaryRank(first) - primaryRank(second)
    if (rank !== 0) return rank
    return Date.parse(second.createdAt) - Date.parse(first.createdAt)
  })
  const primary = ordered[0]!
  const state = combinedState(cluster)
  const createdAt = cluster
    .map(item => item.createdAt)
    .sort((first, second) => Date.parse(first) - Date.parse(second))[0]!
  const closedAt =
    state === 'open'
      ? null
      : (cluster
          .map(item => item.closedAt)
          .filter((value): value is string => Boolean(value))
          .sort((first, second) => Date.parse(second) - Date.parse(first))[0] ?? null)

  const timelineLinks: TimelineLink[] = []
  const seenLinks = new Set<string>()
  for (const item of cluster) {
    for (const link of item.timelineLinks ?? []) {
      const key = `${link.event}|${link.repo}#${link.number}`
      if (seenLinks.has(key)) continue
      seenLinks.add(key)
      timelineLinks.push(link)
    }
  }

  const linkedPullRequests = cluster.flatMap(item => item.linkedPullRequests ?? [])
  const assignees = cluster.flatMap(item => item.assignees ?? [])

  return {
    ...primary,
    state,
    createdAt,
    closedAt,
    activities: dedupeActivities(cluster.flatMap(item => item.activities)),
    checks: mergeChecks(ordered),
    assignees,
    linkedPullRequests,
    timelineLinks,
    parts,
    headSha: ordered.find(item => item.headSha)?.headSha ?? primary.headSha,
    updatedAt: ordered.find(item => item.updatedAt)?.updatedAt ?? primary.updatedAt,
  }
}

/**
 * Collapse an issue and a pull request into one item when a timeline
 * `cross-referenced` or `connected` event points at the other.
 * Comment text such as "Fixes #123" is not a link.
 */
export function mergeLinkedItems(items: readonly Item[]): Item[] {
  const expanded = expandMissingLinkedPulls(items)
  const byKey = new Map(expanded.map(item => [itemKey(item.repo, item.number), item]))
  const parent = new Map<string, string>()

  function find(key: string): string {
    const current = parent.get(key) ?? key
    if (current === key) return key
    const root = find(current)
    parent.set(key, root)
    return root
  }

  function union(left: string, right: string): void {
    if (!byKey.has(left) || !byKey.has(right) || left === right) return
    const leftRoot = find(left)
    const rightRoot = find(right)
    if (leftRoot !== rightRoot) parent.set(rightRoot, leftRoot)
  }

  for (const item of expanded) {
    const key = itemKey(item.repo, item.number)
    for (const edge of linkEdges(item)) union(key, itemKey(edge.repo, edge.number))
  }

  const groups = new Map<string, Item[]>()
  for (const item of expanded) {
    const root = find(itemKey(item.repo, item.number))
    const group = groups.get(root)
    if (group) group.push(item)
    else groups.set(root, [item])
  }

  return [...groups.values()].map(cluster => combineItems(cluster))
}
