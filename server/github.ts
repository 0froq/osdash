import {
  type Activity,
  type Actor,
  type Check,
  type CheckConclusion,
  type CheckStatus,
  type Item,
  type ReviewState,
  present,
  type BoardItem,
} from '../shared/turn'

const PAGE_SIZE = 20
const MAX_PAGES = 5

type RawActor = {
  __typename?: string
  login?: string
}

type RawComment = {
  url?: string
  createdAt?: string
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

type RawTimeline = {
  __typename?: string
  createdAt?: string
  actor?: RawActor | null
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
  repository?: { nameWithOwner?: string }
  author?: RawActor | null
  comments?: { nodes?: Array<RawComment | null> | null }
  reviews?: { nodes?: Array<RawReview | null> | null }
  commits?: { nodes?: Array<{ commit?: RawCommit | null } | null> | null }
  timelineItems?: { nodes?: Array<RawTimeline | null> | null }
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

const QUERY = `
  query Board($query: String!, $cursor: String) {
    search(query: $query, type: ISSUE, first: ${PAGE_SIZE}, after: $cursor) {
      pageInfo { hasNextPage endCursor }
      nodes {
        __typename
        ... on PullRequest {
          number
          title
          url
          state
          merged
          closedAt
          createdAt
          repository { nameWithOwner }
          author { __typename login }
          comments(last: 30) {
            nodes { url createdAt author { __typename login } }
          }
          reviews(last: 20) {
            nodes { url state submittedAt author { __typename login } }
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
          timelineItems(last: 20, itemTypes: [HEAD_REF_FORCE_PUSHED_EVENT]) {
            nodes {
              __typename
              ... on HeadRefForcePushedEvent {
                createdAt
                actor { __typename login }
              }
            }
          }
        }
        ... on Issue {
          number
          title
          url
          state
          closedAt
          createdAt
          repository { nameWithOwner }
          author { __typename login }
          comments(last: 30) {
            nodes { url createdAt author { __typename login } }
          }
        }
      }
    }
  }
`

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

export function mapNode(node: RawNode): Item | null {
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

export async function loadBoard(
  token: string,
  now: Date,
): Promise<{ items: BoardItem[]; truncated: boolean }> {
  const since = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const queries = [
    // GraphQL search ignores parenthesised OR groups and returns 0, so split them.
    `author:0froq -user:0froq is:pr is:open`,
    `author:0froq -user:0froq is:pr is:closed closed:>=${since}`,
    `author:0froq -user:0froq is:issue is:open`,
    `author:0froq -user:0froq is:issue is:closed closed:>=${since}`,
  ]
  const seen = new Set<string>()
  const items: BoardItem[] = []
  let truncated = false

  for (const query of queries) {
    let cursor: string | null = null
    for (let page = 0; page < MAX_PAGES; page++) {
      const data = await graphql(token, query, cursor)
      for (const node of data.search?.nodes ?? []) {
        if (!node) continue
        const mapped = mapNode(node)
        if (!mapped || seen.has(`${mapped.repo}#${mapped.number}`)) continue
        seen.add(`${mapped.repo}#${mapped.number}`)
        items.push(present(mapped, now.getTime()))
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

  return { items, truncated }
}
