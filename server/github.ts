import { enrichIssueClassificationsForEnv, type ClaimClassifierEnv } from './claim-classifier'
import { enrichItemsFromRest } from './github-rest'
import { maybeClassifyTurn } from './turn-classifier'
import { isSelf } from '../shared/identity'
import { combineItems } from '../shared/timeline'
import { buildUnitDrafts, toUnit, type UnitDraft } from '../shared/units'
import type { Unit } from '../shared/unit'
import type { TimelineLink } from '../shared/turn'
import {
  type Activity,
  type Actor,
  type Check,
  type CheckConclusion,
  type CheckStatus,
  type ClosingIssue,
  type Item,
  type ItemState,
  type LinkedPullRequest,
  type ReviewState,
  judge,
} from '../shared/turn'

const PAGE_SIZE = 25
const MAX_PAGES = 5

export function boardSearchQueries(login: string, since: string): string[] {
  const user = login.trim()
  return [
    `author:${user} -user:${user} is:pr is:open`,
    `author:${user} -user:${user} is:pr is:closed closed:>=${since}`,
    `author:${user} -user:${user} is:issue is:open`,
    `author:${user} -user:${user} is:issue is:closed closed:>=${since}`,
    `commenter:${user} -user:${user} is:issue is:open`,
  ]
}

type RawActor = {
  __typename?: string
  login?: string
}

type RawComment = {
  id?: string
  url?: string
  createdAt?: string
  updatedAt?: string
  body?: string
  authorAssociation?: string
  author?: RawActor | null
}

type RawReview = RawComment & {
  state?: string
  submittedAt?: string
}

type RawCheckRun = {
  __typename: 'CheckRun'
  name?: string
  status?: string
  conclusion?: string | null
  detailsUrl?: string | null
}

type RawStatusContext = {
  __typename: 'StatusContext'
  context?: string
  state?: string
  targetUrl?: string | null
}

type RawCommit = {
  oid?: string
  url?: string
  committedDate?: string
  author?: { user?: { login?: string | null } | null; name?: string | null } | null
  statusCheckRollup?: {
    contexts?: { nodes?: Array<RawCheckRun | RawStatusContext | null> | null } | null
  } | null
}

type RawPullRequest = {
  __typename?: 'PullRequest'
  number?: number
  url?: string
  state?: string
  merged?: boolean
  author?: RawActor | null
  repository?: { nameWithOwner?: string }
}

type RawTimelineSubject = {
  __typename?: string
  number?: number
  url?: string
  state?: string
  merged?: boolean
  repository?: { nameWithOwner?: string }
}

type RawTimeline = {
  __typename?: string
  createdAt?: string
  actor?: RawActor | null
  source?: RawPullRequest | null
  subject?: RawTimelineSubject | null
}

type RawNode = {
  __typename?: string
  number?: number
  title?: string
  url?: string
  state?: string
  merged?: boolean
  closedAt?: string | null
  createdAt?: string
  updatedAt?: string
  body?: string
  headRefOid?: string
  repository?: { nameWithOwner?: string }
  author?: RawActor | null
  comments?: { nodes?: Array<RawComment | null> | null }
  reviews?: { nodes?: Array<RawReview | null> | null }
  commits?: { nodes?: Array<{ commit?: RawCommit | null } | null> | null }
  timelineItems?: { nodes?: Array<RawTimeline | null> | null }
  assignees?: { nodes?: Array<RawActor | null> | null }
  closingIssuesReferences?: {
    pageInfo?: { hasNextPage?: boolean }
    nodes?: Array<{
      number?: number
      url?: string
      state?: string
      title?: string
      repository?: { nameWithOwner?: string }
      author?: RawActor | null
    } | null> | null
  }
}

type SearchPayload = {
  search?: {
    pageInfo?: { hasNextPage?: boolean; endCursor?: string | null }
    nodes?: Array<RawNode | null>
  }
}

type GraphPayload = {
  data?: SearchPayload
  errors?: Array<{ message?: string }>
}

const PULL_REQUEST_FIELDS = `
          number
          title
          url
          state
          merged
          closedAt
          createdAt
          updatedAt
          body
          headRefOid
          repository { nameWithOwner }
          author { __typename login }
          comments(last: 30) {
            nodes {
              id
              url
              createdAt
              updatedAt
              body
              authorAssociation
              author { __typename login }
            }
          }
          reviews(last: 20) {
            nodes {
              id
              url
              state
              submittedAt
              updatedAt
              body
              authorAssociation
              author { __typename login }
            }
          }
          commits(last: 20) {
            nodes {
              commit {
                oid
                url
                committedDate
                author { user { login } name }
                statusCheckRollup {
                  contexts(first: 40) {
                    nodes {
                      __typename
                      ... on CheckRun { name status conclusion detailsUrl }
                      ... on StatusContext { context state targetUrl }
                    }
                  }
                }
              }
            }
          }
          closingIssuesReferences(first: 10) {
            nodes {
              number
              url
              state
              title
              repository { nameWithOwner }
              author { __typename login }
            }
          }
          timelineItems(
            last: 30
            itemTypes: [HEAD_REF_FORCE_PUSHED_EVENT, CROSS_REFERENCED_EVENT, CONNECTED_EVENT]
          ) {
            nodes {
              __typename
              ... on HeadRefForcePushedEvent {
                createdAt
                actor { __typename login }
              }
              ... on CrossReferencedEvent {
                source {
                  __typename
                  ... on PullRequest {
                    number
                    url
                    state
                    merged
                    repository { nameWithOwner }
                  }
                  ... on Issue {
                    number
                    url
                    state
                    repository { nameWithOwner }
                  }
                }
              }
              ... on ConnectedEvent {
                subject {
                  __typename
                  ... on PullRequest {
                    number
                    url
                    state
                    merged
                    repository { nameWithOwner }
                  }
                  ... on Issue {
                    number
                    url
                    state
                    repository { nameWithOwner }
                  }
                }
              }
            }
          }
`

export const QUERY = `
  query Board($query: String!, $cursor: String) {
    search(query: $query, type: ISSUE, first: ${PAGE_SIZE}, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes {
        __typename
        ... on PullRequest {
          __typename
${PULL_REQUEST_FIELDS}
        }
        ... on Issue {
          number
          title
          url
          state
          closedAt
          createdAt
          updatedAt
          body
          repository { nameWithOwner }
          author { __typename login }
          assignees(first: 10) {
            nodes { __typename login }
          }
          comments(last: 30) {
            nodes {
              id
              url
              createdAt
              updatedAt
              body
              authorAssociation
              author { __typename login }
            }
          }
          timelineItems(last: 40, itemTypes: [CROSS_REFERENCED_EVENT, CONNECTED_EVENT]) {
            nodes {
              __typename
              ... on CrossReferencedEvent {
                source {
                  __typename
                  ... on PullRequest {
                    number
                    url
                    state
                    merged
                    author { __typename login }
                    repository { nameWithOwner }
                  }
                  ... on Issue {
                    number
                    url
                    state
                    repository { nameWithOwner }
                  }
                }
              }
              ... on ConnectedEvent {
                subject {
                  __typename
                  ... on PullRequest {
                    number
                    url
                    state
                    merged
                    author { __typename login }
                    repository { nameWithOwner }
                  }
                  ... on Issue {
                    number
                    url
                    state
                    repository { nameWithOwner }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`

const ISSUE_FIELDS = `
          number
          title
          url
          state
          closedAt
          createdAt
          updatedAt
          body
          repository { nameWithOwner }
          author { __typename login }
          assignees(first: 10) {
            nodes { __typename login }
          }
          comments(last: 30) {
            nodes {
              id
              url
              createdAt
              updatedAt
              body
              authorAssociation
              author { __typename login }
            }
          }
          timelineItems(last: 40, itemTypes: [CROSS_REFERENCED_EVENT, CONNECTED_EVENT]) {
            nodes {
              __typename
              ... on CrossReferencedEvent {
                source {
                  __typename
                  ... on PullRequest {
                    number
                    url
                    state
                    merged
                    author { __typename login }
                    repository { nameWithOwner }
                  }
                  ... on Issue {
                    number
                    url
                    state
                    repository { nameWithOwner }
                  }
                }
              }
              ... on ConnectedEvent {
                subject {
                  __typename
                  ... on PullRequest {
                    number
                    url
                    state
                    merged
                    author { __typename login }
                    repository { nameWithOwner }
                  }
                  ... on Issue {
                    number
                    url
                    state
                    repository { nameWithOwner }
                  }
                }
              }
            }
          }
`

const PULL_BY_NUMBER = `
  query LinkedPull($owner: String!, $name: String!, $number: Int!) {
    repository(owner: $owner, name: $name) {
      pullRequest(number: $number) {
        __typename
${PULL_REQUEST_FIELDS}
      }
    }
  }
`

// Fix candidates need identity and closing targets, not reviews, CI or inline comments.
const FIXING_PULL_BY_NUMBER = `
  query FixingPull($owner: String!, $name: String!, $number: Int!) {
    repository(owner: $owner, name: $name) {
      pullRequest(number: $number) {
        __typename number title url state merged createdAt closedAt
        author { __typename login }
        repository { nameWithOwner }
        closingIssuesReferences(first: 100) {
          pageInfo { hasNextPage }
          nodes {
            number url state title
            repository { nameWithOwner }
            author { __typename login }
          }
        }
      }
    }
  }
`

const ISSUE_BY_NUMBER = `
  query ClosingIssue($owner: String!, $name: String!, $number: Int!) {
    repository(owner: $owner, name: $name) {
      issue(number: $number) {
        __typename
${ISSUE_FIELDS}
      }
    }
  }
`

type PullByNumberPayload = {
  data?: {
    repository?: { pullRequest?: RawNode | null } | null
  }
  errors?: Array<{ message?: string }>
}

type IssueByNumberPayload = {
  data?: {
    repository?: { issue?: RawNode | null } | null
  }
  errors?: Array<{ message?: string }>
}

const MAX_CLOSING_ISSUE_HYDRATIONS = 20
const MAX_FIXING_PULL_HYDRATIONS = 20

function parseRepo(nameWithOwner: string): { owner: string; name: string } | null {
  const slash = nameWithOwner.indexOf('/')
  if (slash <= 0 || slash === nameWithOwner.length - 1) return null
  return { owner: nameWithOwner.slice(0, slash), name: nameWithOwner.slice(slash + 1) }
}

async function fetchLinkedPullRequest(
  token: string,
  repo: string,
  number: number,
  viewerLogin?: string,
  query = PULL_BY_NUMBER,
): Promise<Item | null> {
  const parts = parseRepo(repo)
  if (!parts) return null
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'osdash',
    },
    body: JSON.stringify({
      query,
      variables: { owner: parts.owner, name: parts.name, number },
    }),
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) return null
  const payload = (await response.json()) as PullByNumberPayload
  if (payload.errors?.length) return null
  const node = payload.data?.repository?.pullRequest
  if (!node) return null
  // Incomplete target metadata cannot establish a fixing relationship.
  if (query === FIXING_PULL_BY_NUMBER && node.closingIssuesReferences?.pageInfo?.hasNextPage)
    return null
  return mapNode(node, viewerLogin)
}

function collectMissingLinkedPulls(
  items: readonly Item[],
  seen: ReadonlySet<string>,
  viewerLogin: string,
): LinkedPullRequest[] {
  const links: LinkedPullRequest[] = []
  const queued = new Set<string>()
  for (const item of items) {
    for (const link of item.linkedPullRequests ?? []) {
      if (!isSelf(link.author, viewerLogin) && link.state !== 'merged') continue
      const key = `${link.repo}#${link.number}`
      if (seen.has(key) || queued.has(key)) continue
      queued.add(key)
      links.push(link)
    }
  }
  return links
}

async function fetchIssueByNumber(
  token: string,
  repo: string,
  number: number,
  viewerLogin: string,
): Promise<Item | null> {
  const parts = parseRepo(repo)
  if (!parts) return null
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'osdash',
    },
    body: JSON.stringify({
      query: ISSUE_BY_NUMBER,
      variables: { owner: parts.owner, name: parts.name, number },
    }),
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) return null
  const payload = (await response.json()) as IssueByNumberPayload
  if (payload.errors?.length) return null
  const node = payload.data?.repository?.issue
  if (!node) return null
  return mapNode({ ...node, __typename: 'Issue' }, viewerLogin)
}

async function hydrateMissingClosingIssues(
  token: string,
  viewerLogin: string,
  items: Item[],
  seen: Set<string>,
): Promise<void> {
  const missing: Array<{ repo: string; number: number }> = []
  const queued = new Set<string>()
  for (const item of items) {
    if (item.kind !== 'pr' || !isSelf(item.author, viewerLogin)) continue
    for (const issue of item.closingIssues ?? []) {
      const key = `${issue.repo}#${issue.number}`
      if (seen.has(key) || queued.has(key)) continue
      queued.add(key)
      missing.push({ repo: issue.repo, number: issue.number })
      if (missing.length >= MAX_CLOSING_ISSUE_HYDRATIONS) break
    }
    if (missing.length >= MAX_CLOSING_ISSUE_HYDRATIONS) break
  }
  for (const issue of missing) {
    const key = `${issue.repo}#${issue.number}`
    const fetched = await fetchIssueByNumber(token, issue.repo, issue.number, viewerLogin)
    if (!fetched || seen.has(key)) continue
    seen.add(key)
    items.push(fetched)
  }
}

function itemForJudge(draft: UnitDraft): Item {
  const combined = draft.members.length > 1 ? combineItems([...draft.members]) : draft.primary
  return {
    ...draft.primary,
    activities: combined.activities,
    checks: draft.primary.checks.length > 0 ? draft.primary.checks : combined.checks,
    linkedPullRequests: combined.linkedPullRequests ?? draft.primary.linkedPullRequests,
    timelineLinks: combined.timelineLinks ?? draft.primary.timelineLinks,
    parts: combined.parts,
    viewerLogin: draft.primary.viewerLogin ?? combined.viewerLogin,
  }
}

export async function hydrateMissingLinkedPullRequests(
  token: string,
  viewerLogin: string,
  items: Item[],
  seen: Set<string>,
): Promise<void> {
  const missing = collectMissingLinkedPulls(items, seen, viewerLogin)
  let fixingPulls = 0
  for (const link of missing) {
    const self = isSelf(link.author, viewerLogin)
    if (!self && fixingPulls++ >= MAX_FIXING_PULL_HYDRATIONS) continue
    const key = `${link.repo}#${link.number}`
    const fetched = await fetchLinkedPullRequest(
      token,
      link.repo,
      link.number,
      viewerLogin,
      self ? PULL_BY_NUMBER : FIXING_PULL_BY_NUMBER,
    ).catch(() => null)
    if (!fetched || seen.has(key)) continue
    seen.add(key)
    items.push(fetched)
  }
}

function actorOf(raw: RawActor | null | undefined, fallback = 'ghost'): Actor {
  return {
    typename: raw?.__typename ?? 'User',
    login: raw?.login || fallback,
  }
}

function reviewState(value: string | undefined): ReviewState | undefined {
  switch (value) {
    case 'APPROVED':
    case 'CHANGES_REQUESTED':
    case 'COMMENTED':
    case 'DISMISSED':
    case 'PENDING':
      return value
    default:
      return undefined
  }
}

function checkStatus(value: string | undefined): CheckStatus {
  switch (value) {
    case 'COMPLETED':
    case 'IN_PROGRESS':
    case 'QUEUED':
    case 'PENDING':
    case 'WAITING':
    case 'REQUESTED':
      return value
    default:
      return 'PENDING'
  }
}

function checkConclusion(value: string | null | undefined): CheckConclusion {
  switch (value) {
    case 'SUCCESS':
    case 'FAILURE':
    case 'CANCELLED':
    case 'SKIPPED':
    case 'NEUTRAL':
    case 'ACTION_REQUIRED':
    case 'TIMED_OUT':
    case 'STALE':
      return value
    default:
      return null
  }
}

function mapContext(node: RawCheckRun | RawStatusContext): Check | null {
  switch (node.__typename) {
    case 'StatusContext': {
      const failed = node.state === 'FAILURE' || node.state === 'ERROR'
      const success = node.state === 'SUCCESS'
      return {
        name: node.context || 'status',
        status: success || failed ? 'COMPLETED' : 'PENDING',
        conclusion: success ? 'SUCCESS' : failed ? 'FAILURE' : null,
        url: node.targetUrl ?? undefined,
      }
    }
    case 'CheckRun': {
      if (!node.name) return null
      return {
        name: node.name,
        status: checkStatus(node.status),
        conclusion: checkConclusion(node.conclusion),
        url: node.detailsUrl ?? undefined,
      }
    }
    default: {
      const exhaustive: never = node
      return exhaustive
    }
  }
}

function timelineSubjectToLink(
  event: 'cross-referenced' | 'connected',
  subject: RawTimelineSubject | null | undefined,
): TimelineLink | null {
  if (!subject?.number || !subject.repository?.nameWithOwner || !subject.state) return null
  const kind =
    subject.__typename === 'PullRequest' || subject.url?.includes('/pull/') ? 'pr' : 'issue'
  return {
    event,
    repo: subject.repository.nameWithOwner,
    number: subject.number,
    kind,
    url: subject.url,
  }
}

function timelineLinksFromNode(node: RawNode): TimelineLink[] {
  const links: TimelineLink[] = []
  for (const event of node.timelineItems?.nodes ?? []) {
    if (!event) continue
    if (event.__typename === 'CrossReferencedEvent') {
      const source = event.source
      if (source?.__typename === 'PullRequest' || source?.__typename === 'Issue') {
        const link = timelineSubjectToLink('cross-referenced', source)
        if (link) links.push(link)
      }
      continue
    }
    if (event.__typename === 'ConnectedEvent') {
      const link = timelineSubjectToLink('connected', event.subject)
      if (link) links.push(link)
    }
  }
  return links
}

export function mapNode(node: RawNode, viewerLogin?: string): Item | null {
  if (node.__typename !== 'PullRequest' && node.__typename !== 'Issue') return null
  if (
    !node.number ||
    !node.title ||
    !node.url ||
    !node.createdAt ||
    !node.repository?.nameWithOwner
  )
    return null

  const author = actorOf(node.author)
  const activities: Activity[] = []
  for (const comment of node.comments?.nodes ?? []) {
    if (!comment?.createdAt) continue
    activities.push({
      kind: 'comment',
      at: comment.createdAt,
      actor: actorOf(comment.author),
      url: comment.url,
      body: comment.body,
      authorAssociation: comment.authorAssociation,
      commentId: comment.id ?? comment.url ?? comment.createdAt,
      updatedAt: comment.updatedAt ?? comment.createdAt,
    })
  }
  for (const review of node.reviews?.nodes ?? []) {
    const at = review?.submittedAt ?? review?.createdAt
    const state = reviewState(review?.state)
    if (!review || !at || !state) continue
    activities.push({
      kind: 'review',
      at,
      actor: actorOf(review.author),
      url: review.url,
      reviewState: state,
      body: review.body,
      authorAssociation: review.authorAssociation,
      commentId: review.id ?? review.url ?? at,
      updatedAt: review.updatedAt ?? at,
    })
  }

  const commits = (node.commits?.nodes ?? []).flatMap(entry =>
    entry?.commit ? [entry.commit] : [],
  )
  const ordered = [...commits].sort(
    (first, second) =>
      Date.parse(first.committedDate ?? '') - Date.parse(second.committedDate ?? ''),
  )
  for (const commit of ordered) {
    if (!commit.committedDate) continue
    const login = commit.author?.user?.login || commit.author?.name || 'ghost'
    activities.push({
      kind: 'push',
      at: commit.committedDate,
      actor: {
        typename: login.endsWith('[bot]') ? 'Bot' : 'User',
        login,
      },
      url: commit.url,
    })
  }
  for (const event of node.timelineItems?.nodes ?? []) {
    if (event?.__typename !== 'HeadRefForcePushedEvent' || !event.createdAt) continue
    activities.push({
      kind: 'push',
      at: event.createdAt,
      actor: actorOf(event.actor),
    })
  }

  const head = ordered.at(-1)
  const checks = (head?.statusCheckRollup?.contexts?.nodes ?? []).flatMap(context => {
    if (!context) return []
    const mapped = mapContext(context)
    return mapped ? [mapped] : []
  })

  const merged = node.__typename === 'PullRequest' && node.merged === true
  const state = merged ? 'merged' : node.state === 'CLOSED' ? 'closed' : 'open'

  const assignees =
    node.__typename === 'Issue'
      ? (node.assignees?.nodes ?? []).flatMap(raw => (raw?.login ? [actorOf(raw)] : []))
      : []

  const closingIssues: ClosingIssue[] = []
  if (node.__typename === 'PullRequest') {
    for (const issue of node.closingIssuesReferences?.nodes ?? []) {
      if (!issue?.number || !issue.url || !issue.title || !issue.repository?.nameWithOwner) continue
      const issueState: ItemState =
        issue.state === 'CLOSED' ? 'closed' : issue.state === 'MERGED' ? 'merged' : 'open'
      closingIssues.push({
        repo: issue.repository.nameWithOwner,
        number: issue.number,
        url: issue.url,
        state: issueState,
        title: issue.title,
        authorLogin: issue.author?.login ?? 'ghost',
      })
    }
  }

  const linkedPullRequests: LinkedPullRequest[] = []
  if (node.__typename === 'Issue') {
    for (const event of node.timelineItems?.nodes ?? []) {
      if (event?.__typename !== 'CrossReferencedEvent') continue
      const source = event.source
      if (source?.__typename !== 'PullRequest') continue
      if (!source.number || !source.url || !source.repository?.nameWithOwner || !source.state)
        continue
      const prMerged = source.merged === true
      const prState = prMerged ? 'merged' : source.state === 'CLOSED' ? 'closed' : 'open'
      linkedPullRequests.push({
        repo: source.repository.nameWithOwner,
        number: source.number,
        url: source.url,
        state: prState,
        author: actorOf(source.author),
      })
    }
  }

  return {
    kind: node.__typename === 'PullRequest' ? 'pr' : 'issue',
    repo: node.repository.nameWithOwner,
    number: node.number,
    title: node.title,
    url: node.url,
    state,
    createdAt: node.createdAt,
    closedAt: node.closedAt ?? null,
    author,
    activities,
    checks,
    assignees,
    linkedPullRequests,
    closingIssues,
    body: node.body,
    updatedAt: node.updatedAt,
    headSha: node.headRefOid,
    timelineLinks: timelineLinksFromNode(node),
    viewerLogin,
  }
}

async function graphql(
  token: string,
  query: string,
  cursor: string | null,
): Promise<SearchPayload> {
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'osdash',
    },
    body: JSON.stringify({ query: QUERY, variables: { query, cursor } }),
    signal: AbortSignal.timeout(20_000),
  })
  if (!response.ok) throw new Error(`GitHub search failed: HTTP ${response.status}`)
  const payload = (await response.json()) as GraphPayload
  const message = payload.errors?.find(error => error.message)?.message
  if (message) throw new Error(`GitHub search failed: ${message}`)
  return payload.data ?? {}
}

export async function loadUnits(
  token: string,
  viewerLogin: string,
  now: Date,
  classifierEnv: ClaimClassifierEnv = {},
  options: { fresh?: boolean } = {},
): Promise<{ units: Unit[]; truncated: boolean }> {
  const since = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const queries = boardSearchQueries(viewerLogin, since)
  const env = { ...classifierEnv, viewerLogin }
  const seen = new Set<string>()
  const raw: Item[] = []
  let truncated = false

  for (const query of queries) {
    let cursor: string | null = null
    for (let page = 0; page < MAX_PAGES; page++) {
      const data = await graphql(token, query, cursor)
      for (const node of data.search?.nodes ?? []) {
        if (!node) continue
        const mapped = mapNode(node, viewerLogin)
        if (!mapped || seen.has(`${mapped.repo}#${mapped.number}`)) continue
        seen.add(`${mapped.repo}#${mapped.number}`)
        raw.push(mapped)
      }
      const pageInfo = data.search?.pageInfo
      if (!pageInfo?.hasNextPage) break
      if (page === MAX_PAGES - 1) {
        truncated = true
        break
      }
      cursor = pageInfo.endCursor ?? null
      if (!cursor) break
    }
  }

  await hydrateMissingClosingIssues(token, viewerLogin, raw, seen)
  await hydrateMissingLinkedPullRequests(token, viewerLogin, raw, seen)
  await hydrateMissingClosingIssues(token, viewerLogin, raw, seen)
  await enrichItemsFromRest(
    token,
    viewerLogin,
    raw.filter(item => item.kind !== 'pr' || isSelf(item.author, viewerLogin)),
    classifierEnv.CACHE,
    now.getTime(),
    options.fresh === true,
  )
  await enrichIssueClassificationsForEnv(raw, env, now.getTime())

  const units: Unit[] = []
  for (const draft of buildUnitDrafts(raw)) {
    const judged = itemForJudge(draft)
    const verdict = await maybeClassifyTurn(
      judged,
      judge(judged, now.getTime()),
      env,
      now.getTime(),
      options.fresh === true,
    )
    units.push(toUnit(draft, verdict, now.getTime()))
  }

  return { units, truncated }
}
