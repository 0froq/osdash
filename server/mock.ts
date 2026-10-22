import { foldEntries, normalizeRestTimeline } from '../shared/events'
import type { TimelinePayload } from './timeline-response'
import { buildUnitDrafts, toUnit } from '../shared/units'
import type { Unit } from '../shared/unit'
import type { SeenState } from './user-state'
import { type Actor, type Item, DAY_MS, judge } from '../shared/turn'

export const MOCK_VIEWER = 'octo-dev'

function user(login: string, typename = 'User'): Actor {
  return { typename, login }
}

export function mockSeen(nowMs: number): SeenState {
  return { baselineAt: new Date(nowMs - 30 * DAY_MS).toISOString(), at: {} }
}

function closingOf(issue: Item) {
  return {
    repo: issue.repo,
    number: issue.number,
    url: issue.url,
    state: issue.state,
    title: issue.title,
    authorLogin: issue.author.login,
  }
}

export function mockUnits(nowMs: number): Unit[] {
  const at = (ms: number) => new Date(nowMs - ms).toISOString()
  const hour = 60 * 60 * 1000
  const base = (
    overrides: Partial<Item> & Pick<Item, 'kind' | 'repo' | 'number' | 'title'>,
  ): Item => {
    const path = overrides.kind === 'pr' ? 'pull' : 'issues'
    return {
      url: `https://github.com/${overrides.repo}/${path}/${overrides.number}`,
      state: 'open',
      createdAt: at(DAY_MS),
      closedAt: null,
      author: user(MOCK_VIEWER),
      activities: [],
      checks: [],
      viewerLogin: MOCK_VIEWER,
      ...overrides,
    }
  }

  const sharedIssue = base({
    kind: 'issue',
    repo: 'acme/app',
    number: 100,
    title: 'Paper tears when the theme flips',
    author: user('pi0'),
    createdAt: at(20 * DAY_MS),
  })
  const replaced = base({
    kind: 'pr',
    repo: 'acme/app',
    number: 9,
    title: 'fix: first attempt at the tear',
    state: 'closed',
    createdAt: at(10 * DAY_MS),
    closedAt: at(2 * DAY_MS),
    closingIssues: [closingOf(sharedIssue)],
  })
  const splitRecent = base({
    kind: 'pr',
    repo: 'acme/app',
    number: 11,
    title: 'fix: retry the tear after review',
    createdAt: at(2 * DAY_MS - hour),
    closingIssues: [closingOf(sharedIssue)],
  })
  const splitOlder = base({
    kind: 'pr',
    repo: 'acme/app',
    number: 10,
    title: 'fix: tear along the other edge',
    createdAt: at(8 * DAY_MS),
    closingIssues: [closingOf(sharedIssue)],
  })
  const ciFailed = base({
    kind: 'pr',
    repo: 'eggjs/egg',
    number: 5410,
    title: 'fix: keep unhandled rejections in the worker',
    createdAt: at(2 * DAY_MS),
    checks: [
      {
        name: 'test',
        status: 'COMPLETED',
        conclusion: 'FAILURE',
        url: 'https://github.com/eggjs/egg/actions/runs/5410',
      },
    ],
  })
  const changes = base({
    kind: 'pr',
    repo: 'nodejs/node',
    number: 60211,
    title: 'lib: clarify diagnostic channel timeouts',
    createdAt: at(5 * DAY_MS),
    activities: [
      {
        kind: 'review',
        at: at(DAY_MS),
        actor: user('fengmk2'),
        reviewState: 'CHANGES_REQUESTED',
        url: 'https://github.com/nodejs/node/pull/60211#pullrequestreview-1',
      },
    ],
  })
  const claimed = base({
    kind: 'issue',
    repo: 'withastro/starlight',
    number: 2204,
    title: 'Add a dark theme and a directory listing for icons',
    author: user('pi0'),
    createdAt: at(6 * DAY_MS),
    activities: [
      {
        kind: 'comment',
        at: at(4 * DAY_MS),
        actor: user(MOCK_VIEWER),
        body: "I'll open a PR",
        url: 'https://github.com/withastro/starlight/issues/2204#issuecomment-1',
      },
    ],
  })
  const activity = base({
    kind: 'pr',
    repo: 'vitejs/vite',
    number: 18820,
    title: 'fix: do not promote optional peers',
    createdAt: at(DAY_MS),
    activities: [
      {
        kind: 'comment',
        at: at(3 * hour),
        actor: user('patak'),
        authorAssociation: 'OWNER',
        body: 'Can you check the other platform?',
        url: 'https://github.com/vitejs/vite/pull/18820#issuecomment-1',
      },
    ],
  })
  const waitingLong = base({
    kind: 'pr',
    repo: 'vuejs/core',
    number: 9901,
    title: 'fix(reactivity): avoid re-triggering effect during cleanup',
    createdAt: at(15 * DAY_MS),
  })
  const fixedIssue = base({
    kind: 'issue',
    repo: 'unjs/h3',
    number: 880,
    title: 'event.context leaks across parallel requests',
    createdAt: at(3 * DAY_MS),
    linkedPullRequests: [
      {
        repo: 'unjs/h3',
        number: 901,
        url: 'https://github.com/unjs/h3/pull/901',
        state: 'merged',
        author: user('pi0'),
      },
    ],
  })
  const merged = base({
    kind: 'pr',
    repo: 'pnpm/pnpm',
    number: 9104,
    title: 'fix: keep catalog protocol unchanged',
    state: 'merged',
    createdAt: at(12 * DAY_MS),
    closedAt: at(2 * DAY_MS),
  })
  const closedIssue = base({
    kind: 'issue',
    repo: 'oxc-project/oxc',
    number: 441,
    title: 'oxlint vue plugin does not report unused template refs',
    state: 'closed',
    createdAt: at(11 * DAY_MS),
    closedAt: at(4 * DAY_MS),
  })

  const items = [
    sharedIssue,
    replaced,
    splitRecent,
    splitOlder,
    ciFailed,
    changes,
    claimed,
    activity,
    waitingLong,
    fixedIssue,
    merged,
    closedIssue,
  ]
  return buildUnitDrafts(items).map(draft => toUnit(draft, judge(itemFor(draft), nowMs), nowMs))
}

export function mockTimeline(unitId: string, nowMs: number): TimelinePayload | null {
  const unit = mockUnits(nowMs).find(entry => entry.id === unitId)
  if (!unit) return null
  const source = {
    repo: unit.repo,
    number: unit.number,
    kind: unit.kind === 'issue-only' ? ('issue' as const) : ('pr' as const),
  }
  const at = (hours: number) => new Date(nowMs - hours * 60 * 60 * 1000).toISOString()
  const issueEvents = unit.issues.slice(0, 1).flatMap(issue =>
    normalizeRestTimeline(
      [
        {
          id: `${unitId}:issue`,
          event: 'commented',
          created_at: at(6),
          actor: { login: issue.authorLogin, type: 'User' },
          body: 'Still happens on the issue.',
          html_url: issue.url,
        },
      ],
      { repo: issue.repo, number: issue.number, kind: 'issue' },
    ),
  )
  const events = [
    ...normalizeRestTimeline(
      [
        {
          id: `${unitId}:open`,
          event: 'commented',
          created_at: at(48),
          actor: { login: MOCK_VIEWER, type: 'User' },
          body: 'Opened the thread.',
        },
        {
          id: `${unitId}:reply`,
          event: 'commented',
          created_at: at(5),
          actor: { login: 'patak', type: 'User' },
          body: 'Thanks, looking.',
          html_url: unit.url,
        },
        ...(unitId === 'pr:vitejs/vite#18820'
          ? [
              {
                id: `${unitId}:bot-a`,
                event: 'commented',
                created_at: at(4),
                actor: { login: 'vercel[bot]', type: 'Bot' },
                body: 'Preview deployed.',
              },
              {
                id: `${unitId}:bot-b`,
                event: 'commented',
                created_at: at(3),
                actor: { login: 'vercel[bot]', type: 'Bot' },
                body: 'Preview updated.',
              },
              {
                id: `${unitId}:cla`,
                event: 'commented',
                created_at: at(2),
                actor: { login: 'cla-assistant[bot]', type: 'Bot' },
                body: 'CLA not signed. Please sign the CLA.',
                html_url: unit.url,
              },
            ]
          : []),
      ],
      source,
    ),
    ...issueEvents,
  ]
  return {
    id: unit.id,
    generatedAt: new Date(nowMs).toISOString(),
    cached: false,
    entries: foldEntries(events),
    truncated: false,
  }
}

function itemFor(draft: { primary: Item; members: Item[] }): Item {
  const combined =
    draft.members.length > 1
      ? {
          ...draft.primary,
          activities: draft.members.flatMap(item => item.activities),
          checks: draft.primary.checks,
        }
      : draft.primary
  return combined
}
