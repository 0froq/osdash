import { buildUnitDrafts, toUnit } from '../shared/units'
import type { Unit } from '../shared/unit'
import type { SeenState } from './user-state'
import {
  type Actor,
  type Check,
  type Item,
  DAY_MS,
  judge,
  present,
  type BoardItem,
} from '../shared/turn'

export const MOCK_VIEWER = 'octo-dev'

function user(login: string, typename = 'User'): Actor {
  return { typename, login }
}

function success(name: string): Check {
  return {
    name,
    status: 'COMPLETED',
    conclusion: 'SUCCESS',
    url: `https://github.com/checks/${name}`,
  }
}

export function mockItems(nowMs: number): BoardItem[] {
  const at = (ms: number) => new Date(nowMs - ms).toISOString()
  const items: Item[] = [
    {
      kind: 'pr',
      repo: 'eggjs/egg',
      number: 5410,
      title: 'fix: keep unhandled rejections in the worker',
      url: 'https://github.com/eggjs/egg/pull/5410',
      state: 'open',
      createdAt: at(2 * DAY_MS),
      closedAt: null,
      author: user(MOCK_VIEWER),
      activities: [],
      checks: [
        success('test'),
        {
          name: 'lint',
          status: 'COMPLETED',
          conclusion: 'FAILURE',
          url: 'https://github.com/eggjs/egg/actions/runs/5410',
        },
      ],
    },
    {
      kind: 'pr',
      repo: 'nodejs/node',
      number: 60211,
      title: 'lib: clarify diagnostic channel timeouts',
      url: 'https://github.com/nodejs/node/pull/60211',
      state: 'open',
      createdAt: at(5 * DAY_MS),
      closedAt: null,
      author: user(MOCK_VIEWER),
      activities: [
        {
          kind: 'review',
          at: at(1 * DAY_MS),
          actor: user('fengmk2'),
          reviewState: 'CHANGES_REQUESTED',
          url: 'https://github.com/nodejs/node/pull/60211#pullrequestreview-1',
        },
      ],
      checks: [success('lint'), success('test')],
    },
    {
      kind: 'issue',
      repo: 'unjs/h3',
      number: 880,
      title: 'event.context leaks across parallel requests',
      url: 'https://github.com/unjs/h3/issues/880',
      state: 'open',
      createdAt: at(4 * DAY_MS),
      closedAt: null,
      author: user(MOCK_VIEWER),
      body: 'Root cause: event.context is reused across requests. Repro: fire two parallel fetches and read the previous context.',
      activities: [
        {
          kind: 'comment',
          at: at(6 * 60 * 60 * 1000),
          actor: user('someone'),
          authorAssociation: 'CONTRIBUTOR',
          body: 'I hit the same leak locally.',
          url: 'https://github.com/unjs/h3/issues/880#issuecomment-2',
        },
      ],
      checks: [],
    },
    {
      kind: 'pr',
      repo: 'nuxt/nuxt',
      number: 31902,
      title: 'fix(nitro): cloudflare preset must not swallow server routes',
      url: 'https://github.com/nuxt/nuxt/pull/31902',
      state: 'open',
      createdAt: at(30 * 60 * 60 * 1000),
      closedAt: null,
      author: user(MOCK_VIEWER),
      activities: [
        {
          kind: 'comment',
          at: at(20 * 60 * 60 * 1000),
          actor: user('danielroe'),
          url: 'https://github.com/nuxt/nuxt/pull/31902#issuecomment-1',
        },
        {
          kind: 'comment',
          at: at(3 * 60 * 60 * 1000),
          actor: user(MOCK_VIEWER),
          url: 'https://github.com/nuxt/nuxt/pull/31902#issuecomment-2',
        },
      ],
      checks: [success('lint'), success('test')],
    },
    {
      kind: 'pr',
      repo: 'vitejs/vite',
      number: 18820,
      title: 'fix: do not promote optional peers to hard deps in prebundle',
      url: 'https://github.com/vitejs/vite/pull/18820',
      state: 'open',
      createdAt: at(3 * 60 * 60 * 1000),
      closedAt: null,
      author: user(MOCK_VIEWER),
      activities: [],
      checks: [success('lint'), success('unit')],
    },
    {
      kind: 'pr',
      repo: 'withastro/astro',
      number: 14220,
      title: 'fix: do not fail CI for preview auth errors',
      url: 'https://github.com/withastro/astro/pull/14220',
      state: 'open',
      createdAt: at(9 * 60 * 60 * 1000),
      closedAt: null,
      author: user(MOCK_VIEWER),
      activities: [
        {
          kind: 'comment',
          at: at(2 * 60 * 60 * 1000),
          actor: user('vercel[bot]', 'Bot'),
          url: 'https://github.com/withastro/astro/pull/14220#issuecomment-bot',
        },
      ],
      checks: [
        success('lint'),
        {
          name: 'Vercel Preview',
          status: 'COMPLETED',
          conclusion: 'FAILURE',
          url: 'https://vercel.com/astro/preview/14220',
        },
        {
          name: 'workflow approve',
          status: 'WAITING',
          conclusion: 'ACTION_REQUIRED',
          url: 'https://github.com/withastro/astro/actions/runs/14220',
        },
      ],
    },
    {
      kind: 'pr',
      repo: 'nitrojs/nitro',
      number: 2771,
      title: 'fix: KV expirationTtl is seconds, not milliseconds',
      url: 'https://github.com/nitrojs/nitro/pull/2771',
      state: 'open',
      createdAt: at(9 * DAY_MS),
      closedAt: null,
      author: user(MOCK_VIEWER),
      activities: [
        {
          kind: 'comment',
          at: at(8 * DAY_MS),
          actor: user('pi0'),
          url: 'https://github.com/nitrojs/nitro/pull/2771#issuecomment-1',
        },
        {
          kind: 'comment',
          at: at(8 * DAY_MS - 60 * 60 * 1000),
          actor: user(MOCK_VIEWER),
          url: 'https://github.com/nitrojs/nitro/pull/2771#issuecomment-2',
        },
      ],
      checks: [success('lint')],
    },
    {
      kind: 'pr',
      repo: 'vuejs/core',
      number: 9901,
      title: 'fix(reactivity): avoid re-triggering effect during cleanup',
      url: 'https://github.com/vuejs/core/pull/9901',
      state: 'open',
      createdAt: at(20 * DAY_MS),
      closedAt: null,
      author: user(MOCK_VIEWER),
      activities: [
        {
          kind: 'comment',
          at: at(16 * DAY_MS),
          actor: user(MOCK_VIEWER),
          url: 'https://github.com/vuejs/core/pull/9901#issuecomment-1',
        },
      ],
      checks: [success('unit')],
    },
    {
      kind: 'pr',
      repo: 'pnpm/pnpm',
      number: 9104,
      title: 'fix: keep catalog protocol unchanged under frozen lockfile',
      url: 'https://github.com/pnpm/pnpm/pull/9104',
      state: 'merged',
      createdAt: at(12 * DAY_MS),
      closedAt: at(2 * DAY_MS),
      author: user(MOCK_VIEWER),
      activities: [
        {
          kind: 'review',
          at: at(10 * DAY_MS),
          actor: user('zkochan'),
          reviewState: 'APPROVED',
          url: 'https://github.com/pnpm/pnpm/pull/9104#pullrequestreview-1',
        },
      ],
      checks: [success('lint')],
    },
    {
      kind: 'issue',
      repo: 'oxc-project/oxc',
      number: 441,
      title: 'oxlint vue plugin does not report unused template refs',
      url: 'https://github.com/oxc-project/oxc/issues/441',
      state: 'closed',
      createdAt: at(11 * DAY_MS),
      closedAt: at(4 * DAY_MS),
      author: user(MOCK_VIEWER),
      activities: [
        {
          kind: 'comment',
          at: at(6 * DAY_MS),
          actor: user('Boshen'),
          url: 'https://github.com/oxc-project/oxc/issues/441#issuecomment-1',
        },
      ],
      checks: [],
    },
    {
      kind: 'issue',
      repo: 'withastro/starlight',
      number: 2204,
      title: 'Add a dark theme and a directory listing for icons',
      url: 'https://github.com/withastro/starlight/issues/2204',
      state: 'open',
      createdAt: at(3 * DAY_MS),
      closedAt: null,
      author: user(MOCK_VIEWER),
      body: 'Can I take the icon namespace? I would like a directory listing next to the theme files.',
      activities: [
        {
          kind: 'comment',
          at: at(2 * DAY_MS),
          actor: user(MOCK_VIEWER),
          body: "I'll open a PR",
          url: 'https://github.com/withastro/starlight/issues/2204#issuecomment-1',
        },
      ],
      checks: [],
    },
  ]
  return items.map(entry =>
    present({ ...entry, viewerLogin: entry.viewerLogin ?? MOCK_VIEWER }, nowMs),
  )
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
