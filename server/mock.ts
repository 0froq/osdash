import {
  foldEntries,
  normalizeCheckRuns,
  normalizeRestTimeline,
  normalizeReviewComments,
  type RawCheckRun,
  type RawReviewComment,
  type RawRestTimelineEvent,
  type UnitEvent,
} from '../shared/events'
import { storyItems } from '../shared/story'
import type { TimelinePayload } from './timeline-response'
import { buildUnitDrafts, toUnit } from '../shared/units'
import type { Unit } from '../shared/unit'
import {
  type Activity,
  type Actor,
  type Check,
  type CheckConclusion,
  type Item,
  type ReviewState,
  judge,
} from '../shared/turn'

export const MOCK_VIEWER = 'octo-dev'

const HOUR_MS = 60 * 60 * 1000

type Person = { login: string; type: string }

type CiBatch = {
  sha: string
  hoursAgo: number
  runs: Array<[name: string, conclusion: string]>
}

type Thread = {
  item: Item
  events: RawRestTimelineEvent[]
  reviewComments: RawReviewComment[]
  ci: CiBatch[]
}

function user(login: string, typename = 'User'): Actor {
  return { typename, login }
}

function person(login: string): Person {
  return { login, type: 'User' }
}

function bot(login: string): Person {
  return { login, type: 'Bot' }
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

function keyOf(repo: string, number: number): string {
  return `${repo}#${number}`
}

function urlOf(repo: string, kind: 'issue' | 'pr', number: number): string {
  return `https://github.com/${repo}/${kind === 'pr' ? 'pull' : 'issues'}/${number}`
}

function reviewStateOf(state: string | null | undefined): ReviewState | undefined {
  const upper = state?.toUpperCase()
  if (
    upper === 'APPROVED' ||
    upper === 'CHANGES_REQUESTED' ||
    upper === 'COMMENTED' ||
    upper === 'DISMISSED'
  ) {
    return upper
  }
  return undefined
}

function activitiesOf(events: readonly RawRestTimelineEvent[]): Activity[] {
  const activities: Activity[] = []
  for (const event of events) {
    const login = (event.actor ?? event.user ?? event.author)?.login
    const typename = (event.actor ?? event.user ?? event.author)?.type
    if (!login) continue
    const actor: Actor = {
      typename: typename === 'Bot' || login.endsWith('[bot]') ? 'Bot' : 'User',
      login,
    }
    const when = event.created_at ?? event.submitted_at
    if (!when) continue
    if (event.event === 'commented') {
      activities.push({
        kind: 'comment',
        at: when,
        actor,
        body: event.body ?? undefined,
        url: event.html_url ?? undefined,
        authorAssociation: event.author_association ?? undefined,
      })
    } else if (event.event === 'reviewed') {
      activities.push({
        kind: 'review',
        at: when,
        actor,
        body: event.body ?? undefined,
        url: event.html_url ?? undefined,
        authorAssociation: event.author_association ?? undefined,
        reviewState: reviewStateOf(event.state),
      })
    } else if (event.event === 'committed') {
      activities.push({ kind: 'push', at: when, actor })
    }
  }
  return activities
}

function checksOf(batch: CiBatch | undefined, url: string): Check[] {
  if (!batch) return []
  return batch.runs.map(([name, conclusion]) => ({
    name,
    status: 'COMPLETED',
    conclusion: conclusion.toUpperCase() as CheckConclusion,
    url: `${url}/checks`,
  }))
}

function mockThreads(nowMs: number): Thread[] {
  const at = (hours: number) => new Date(nowMs - hours * HOUR_MS).toISOString()
  const threads: Thread[] = []

  type Spec = Partial<Item> & Pick<Item, 'kind' | 'repo' | 'number' | 'title'> & { agoH: number }

  const thread = (
    spec: Spec,
    build: (e: Emit) => {
      events: RawRestTimelineEvent[]
      ci?: CiBatch[]
      review?: RawReviewComment[]
    },
  ): Item => {
    const { agoH, ...overrides } = spec
    const url = urlOf(overrides.repo, overrides.kind, overrides.number)
    const emit = emitter(`${keyOf(overrides.repo, overrides.number)}`, url, at)
    const built = build(emit)
    const ci = built.ci ?? []
    const lastBatch = [...ci].sort((a, b) => a.hoursAgo - b.hoursAgo)[0]
    const item: Item = {
      url,
      state: 'open',
      createdAt: at(agoH),
      closedAt: null,
      author: user(MOCK_VIEWER),
      activities: activitiesOf(built.events),
      checks: checksOf(lastBatch, url),
      viewerLogin: MOCK_VIEWER,
      ...(lastBatch ? { headSha: lastBatch.sha } : {}),
      ...overrides,
    }
    threads.push({ item, events: built.events, reviewComments: built.review ?? [], ci })
    return item
  }

  // acme/app: split PRs sharing one issue, one earlier attempt folded into history.
  const sharedIssue = thread(
    {
      kind: 'issue',
      repo: 'acme/app',
      number: 100,
      title: 'Paper tears when the theme flips',
      author: user('pi0'),
      agoH: 20 * 24,
    },
    e => ({
      events: [
        e.label(19 * 24, 'pi0', 'bug', 'd73a4a'),
        e.xref(10 * 24, MOCK_VIEWER, 'acme/app', 9, 'pr', 'fix: first attempt at the tear'),
        e.xref(8 * 24, MOCK_VIEWER, 'acme/app', 10, 'pr', 'fix: tear along the other edge'),
      ],
    }),
  )
  thread(
    {
      kind: 'pr',
      repo: 'acme/app',
      number: 9,
      title: 'fix: first attempt at the tear',
      state: 'closed',
      agoH: 10 * 24,
      closedAt: at(2 * 24),
      closingIssues: [closingOf(sharedIssue)],
    },
    e => ({
      events: [
        e.commit(10 * 24 - 0.2, MOCK_VIEWER, 'c1d2e3f4a5b6', 'fix: first attempt at the tear'),
        e.closed(2 * 24, MOCK_VIEWER),
      ],
    }),
  )
  thread(
    {
      kind: 'pr',
      repo: 'acme/app',
      number: 11,
      title: 'fix: retry the tear after review',
      agoH: 2 * 24 - 1,
      closingIssues: [closingOf(sharedIssue)],
    },
    e => ({
      events: [e.commit(2 * 24 - 1.2, MOCK_VIEWER, 'd2e3f4a5b6c7', 'fix: retry the tear')],
      ci: [
        {
          sha: 'd2e3f4a5b6c7',
          hoursAgo: 2 * 24 - 1.4,
          runs: [
            ['lint', 'success'],
            ['test', 'success'],
          ],
        },
      ],
    }),
  )
  thread(
    {
      kind: 'pr',
      repo: 'acme/app',
      number: 10,
      title: 'fix: tear along the other edge',
      agoH: 8 * 24,
      closingIssues: [closingOf(sharedIssue)],
    },
    e => ({
      events: [
        e.commit(8 * 24 - 0.3, MOCK_VIEWER, 'e3f4a5b6c7d8', 'fix: tear along the other edge'),
        e.label(7 * 24, 'pi0', 'needs-review', 'fbca04'),
      ],
    }),
  )

  thread(
    {
      kind: 'pr',
      repo: 'eggjs/egg',
      number: 5410,
      title: 'fix: keep unhandled rejections in the worker',
      agoH: 48,
    },
    e => ({
      events: [
        e.commit(47.5, MOCK_VIEWER, 'f4a5b6c7d8e9', 'fix: keep unhandled rejections'),
        e.comment(
          47.4,
          bot('vercel[bot]'),
          'The latest updates on your projects. Preview is ready.',
        ),
      ],
      ci: [
        {
          sha: 'f4a5b6c7d8e9',
          hoursAgo: 47.2,
          runs: [
            ['lint', 'success'],
            ['test', 'failure'],
          ],
        },
      ],
    }),
  )

  thread(
    {
      kind: 'pr',
      repo: 'nodejs/node',
      number: 60211,
      title: 'lib: clarify diagnostic channel timeouts',
      agoH: 5 * 24,
    },
    e => ({
      events: [
        e.commit(
          5 * 24 - 0.2,
          MOCK_VIEWER,
          'a5b6c7d8e9f0',
          'lib: clarify diagnostic channel timeouts',
        ),
        e.reviewRequested(5 * 24 - 0.1, MOCK_VIEWER, 'fengmk2'),
        e.review(
          24,
          'fengmk2',
          'changes_requested',
          'Please keep the wording closer to the docs.',
          'MEMBER',
        ),
      ],
      ci: [
        {
          sha: 'a5b6c7d8e9f0',
          hoursAgo: 5 * 24 - 0.4,
          runs: [
            ['lint', 'success'],
            ['test', 'success'],
          ],
        },
      ],
    }),
  )

  thread(
    {
      kind: 'issue',
      repo: 'withastro/starlight',
      number: 2204,
      title: 'Add a dark theme and a directory listing for icons',
      author: user('pi0'),
      agoH: 6 * 24,
    },
    e => ({
      events: [
        e.label(6 * 24 - 0.5, 'pi0', 'enhancement', 'a2eeef'),
        e.comment(4 * 24, MOCK_VIEWER, "I'll open a PR", 'CONTRIBUTOR'),
      ],
    }),
  )

  thread(
    {
      kind: 'pr',
      repo: 'vuejs/core',
      number: 9901,
      title: 'fix(reactivity): avoid re-triggering effect during cleanup',
      agoH: 15 * 24,
    },
    e => ({
      events: [
        e.commit(15 * 24 - 0.2, MOCK_VIEWER, 'b6c7d8e9f0a1', 'fix(reactivity): avoid re-trigger'),
        e.reviewRequested(15 * 24 - 0.1, MOCK_VIEWER, 'edison1105'),
      ],
      ci: [
        {
          sha: 'b6c7d8e9f0a1',
          hoursAgo: 15 * 24 - 0.4,
          runs: [
            ['lint', 'success'],
            ['test', 'success'],
          ],
        },
      ],
    }),
  )

  const issue880 = thread(
    {
      kind: 'issue',
      repo: 'unjs/h3',
      number: 880,
      title: 'event.context leaks across parallel requests',
      agoH: 3 * 24,
      linkedPullRequests: [
        {
          repo: 'unjs/h3',
          number: 901,
          url: 'https://github.com/unjs/h3/pull/901',
          state: 'merged',
          author: user('pi0'),
        },
      ],
    },
    e => ({
      events: [
        e.label(3 * 24 - 1, 'pi0', 'bug', 'd73a4a'),
        e.xref(2 * 24, 'pi0', 'unjs/h3', 901, 'pr', 'fix: isolate event.context per request'),
      ],
    }),
  )

  thread(
    {
      kind: 'pr',
      repo: 'unjs/h3',
      number: 901,
      title: 'fix: isolate event.context per request',
      author: user('pi0'),
      state: 'merged',
      agoH: 2 * 24 + 2,
      closedAt: at(2 * 24),
      closingIssues: [closingOf(issue880)],
    },
    e => ({ events: [e.merged(2 * 24, 'pi0')] }),
  )

  thread(
    {
      kind: 'issue',
      repo: 'oxc-project/oxc',
      number: 441,
      title: 'oxlint vue plugin does not report unused template refs',
      state: 'closed',
      agoH: 11 * 24,
      closedAt: at(4 * 24),
    },
    e => ({
      events: [
        e.label(11 * 24 - 1, 'Boshen', 'C-bug', 'd73a4a'),
        e.comment(
          4 * 24 + 0.1,
          'Boshen',
          'Fixed in the latest release, thanks for the report.',
          'OWNER',
        ),
        e.closed(4 * 24, 'Boshen'),
      ],
    }),
  )

  // vitejs/vite: claimed an issue, an earlier PR was closed, a wider PR now has changes requested.
  const issue18790 = thread(
    {
      kind: 'issue',
      repo: 'vitejs/vite',
      number: 18790,
      title: 'Inline module scripts lose the base path in dev',
      author: user('kricsleo'),
      agoH: 9 * 24,
      assignees: [user(MOCK_VIEWER)],
    },
    e => ({
      events: [
        e.label(9 * 24 - 1, 'patak', 'pending triage', 'ededed'),
        e.comment(
          8 * 24 + 8,
          MOCK_VIEWER,
          'I can take this one. The fix probably belongs in the html plugin.',
          'CONTRIBUTOR',
        ),
        e.comment(
          8 * 24 + 4,
          'patak',
          'Sounds good, thanks for taking it. Start with the html plugin.',
          'MEMBER',
        ),
        e.assigned(8 * 24 + 3.9, 'patak', MOCK_VIEWER),
        e.xref(
          6 * 24 + 6,
          MOCK_VIEWER,
          'vitejs/vite',
          18801,
          'pr',
          'fix(html): keep base on inline module scripts',
        ),
        e.xref(
          60,
          MOCK_VIEWER,
          'vitejs/vite',
          18820,
          'pr',
          'fix(html): keep base on inline module scripts, including URL bases',
        ),
      ],
    }),
  )
  const issue18811 = thread(
    {
      kind: 'issue',
      repo: 'vitejs/vite',
      number: 18811,
      title: 'Inline module scripts break when base is a full URL',
      author: user('bluwy'),
      agoH: 5 * 24,
    },
    e => ({
      events: [
        e.comment(
          5 * 24 - 1,
          'bluwy',
          'Same root cause as #18790 when the base is a full URL.',
          'MEMBER',
        ),
        e.xref(
          60,
          MOCK_VIEWER,
          'vitejs/vite',
          18820,
          'pr',
          'fix(html): keep base on inline module scripts, including URL bases',
        ),
      ],
    }),
  )
  const issue18833 = thread(
    {
      kind: 'issue',
      repo: 'vitejs/vite',
      number: 18833,
      title: 'Preload tags ignore base',
      author: user('dominikg'),
      agoH: 3 * 24,
    },
    e => ({
      events: [
        e.label(3 * 24 - 2, 'sapphi-red', 'feat: html', 'c5def5'),
        e.xref(
          59.9,
          MOCK_VIEWER,
          'vitejs/vite',
          18820,
          'pr',
          'fix(html): keep base on inline module scripts, including URL bases',
        ),
      ],
    }),
  )
  thread(
    {
      kind: 'pr',
      repo: 'vitejs/vite',
      number: 18801,
      title: 'fix(html): keep base on inline module scripts',
      state: 'closed',
      agoH: 6 * 24 + 6,
      closedAt: at(62),
      closingIssues: [closingOf(issue18790)],
    },
    e => ({
      events: [
        e.commit(
          6 * 24 + 5.8,
          MOCK_VIEWER,
          'c0ffee1a2b3c',
          'fix(html): keep base on inline module scripts',
        ),
        e.comment(
          6 * 24 + 5.7,
          bot('coldtea-pr-lens[bot]'),
          'PR Lens summary: 2 files changed, risk low.',
        ),
        e.comment(
          6 * 24 + 5.6,
          bot('vercel[bot]'),
          'The latest updates on your projects. Preview is ready.',
        ),
        e.comment(
          100,
          'patak',
          'Nice start. Could you also cover #18811 and keep the diff smaller? The resolver change can be its own PR.',
          'MEMBER',
        ),
        e.comment(
          90,
          MOCK_VIEWER,
          "Makes sense. I'll close this one and open a PR that covers both.",
          'CONTRIBUTOR',
        ),
        e.closed(62, MOCK_VIEWER),
      ],
      ci: [
        {
          sha: 'c0ffee1a2b3c',
          hoursAgo: 6 * 24 + 5.5,
          runs: [
            ['lint', 'success'],
            ['test', 'success'],
            ['build', 'success'],
          ],
        },
      ],
    }),
  )
  thread(
    {
      kind: 'pr',
      repo: 'vitejs/vite',
      number: 18820,
      title: 'fix(html): keep base on inline module scripts, including URL bases',
      agoH: 60,
      closingIssues: [closingOf(issue18790), closingOf(issue18811)],
      timelineLinks: [
        {
          event: 'cross-referenced',
          repo: 'vitejs/vite',
          number: 18833,
          kind: 'issue',
          url: issue18833.url,
        },
        {
          event: 'cross-referenced',
          repo: 'vitejs/vite',
          number: 18801,
          kind: 'pr',
          url: 'https://github.com/vitejs/vite/pull/18801',
        },
      ],
    },
    e => ({
      events: [
        e.commit(
          59.9,
          MOCK_VIEWER,
          'a1b2c3d4e5f6',
          'fix(html): keep base on inline module scripts',
        ),
        e.reviewRequested(59.8, MOCK_VIEWER, 'patak'),
        e.xref(59.7, MOCK_VIEWER, 'vitejs/vite', 18833, 'issue', 'Preload tags ignore base'),
        e.xref(
          59.7,
          MOCK_VIEWER,
          'vitejs/vite',
          18801,
          'pr',
          'fix(html): keep base on inline module scripts',
        ),
        e.comment(59.6, bot('coldtea-pr-lens[bot]'), 'PR Lens summary: 3 files changed, risk low.'),
        e.comment(
          59.5,
          bot('vercel[bot]'),
          'The latest updates on your projects. Preview is ready.',
        ),
        e.comment(
          59.3,
          bot('coderabbitai[bot]'),
          'Walkthrough: the change keeps the configured base on inline module scripts, including full URL bases.',
        ),
        e.commit(58, MOCK_VIEWER, 'a2b3c4d5e6f7', 'fix(html): handle a full URL base'),
        e.comment(
          40,
          'dominikg',
          'This also fixes the preload tag case for me, thanks.',
          'CONTRIBUTOR',
        ),
        e.commit(26, MOCK_VIEWER, 'b2c4e6f8a0b2', 'test: cover both base shapes'),
        e.comment(
          25.8,
          bot('coderabbitai[bot]'),
          'Incremental review finished. No new actionable comments.',
        ),
        e.comment(25, MOCK_VIEWER, 'Pushed a test for the full URL base too.', 'CONTRIBUTOR'),
        e.review(
          24,
          'patak',
          'changes_requested',
          'Can we avoid touching the resolver? A narrower fix in the html plugin would be much easier to land.',
          'MEMBER',
        ),
      ],
      ci: [
        {
          sha: 'a1b2c3d4e5f6',
          hoursAgo: 59.4,
          runs: [
            ['lint', 'success'],
            ['test', 'failure'],
            ['build', 'success'],
          ],
        },
        {
          sha: 'b2c4e6f8a0b2',
          hoursAgo: 25.9,
          runs: [
            ['lint', 'success'],
            ['test', 'success'],
            ['build', 'success'],
          ],
        },
      ],
      review: [
        {
          id: 'vitejs/vite#18820:inline',
          user: bot('coderabbitai[bot]'),
          body: 'Consider extracting the base check into a helper.',
          html_url: 'https://github.com/vitejs/vite/pull/18820#discussion_r1',
          created_at: at(59.2),
          author_association: 'NONE',
        },
      ],
    }),
  )

  // unjs/h3: the viewer's PR was closed because a maintainer's PR fixed the issue.
  const issue912 = thread(
    {
      kind: 'issue',
      repo: 'unjs/h3',
      number: 912,
      title: 'Request body is consumed twice by readBody in middleware',
      author: user('sisou'),
      state: 'closed',
      agoH: 10 * 24,
      closedAt: at(96),
      linkedPullRequests: [
        {
          repo: 'unjs/h3',
          number: 918,
          url: 'https://github.com/unjs/h3/pull/918',
          state: 'merged',
          author: user('pi0'),
        },
      ],
    },
    e => ({
      events: [
        e.comment(10 * 24 - 2, MOCK_VIEWER, "I'll send a PR for this.", 'CONTRIBUTOR'),
        e.comment(10 * 24 - 3, 'pi0', 'Sure, thanks for taking it.', 'MEMBER'),
        e.xref(220, MOCK_VIEWER, 'unjs/h3', 915, 'pr', 'fix: cache the parsed body per request'),
        e.xref(96.1, 'pi0', 'unjs/h3', 918, 'pr', 'fix: read the body once in readBody'),
        e.closed(96, 'pi0'),
      ],
    }),
  )
  thread(
    {
      kind: 'pr',
      repo: 'unjs/h3',
      number: 915,
      title: 'fix: cache the parsed body per request',
      state: 'closed',
      agoH: 220,
      closedAt: at(94.9),
      closingIssues: [closingOf(issue912)],
    },
    e => ({
      events: [
        e.commit(219.5, MOCK_VIEWER, 'd4e5f6a7b8c9', 'fix: cache the parsed body per request'),
        e.comment(200, MOCK_VIEWER, 'Rebased on main.', 'CONTRIBUTOR'),
        e.comment(
          95,
          'pi0',
          'Fixed by #918, which landed a bit earlier with a different approach. Closing this one, thank you for the report and the PR!',
          'MEMBER',
        ),
        e.closed(94.9, 'pi0'),
      ],
      ci: [
        {
          sha: 'd4e5f6a7b8c9',
          hoursAgo: 219.3,
          runs: [
            ['lint', 'success'],
            ['test', 'success'],
          ],
        },
      ],
    }),
  )
  thread(
    {
      kind: 'pr',
      repo: 'unjs/h3',
      number: 918,
      title: 'fix: read the body once in readBody',
      author: user('pi0'),
      state: 'merged',
      agoH: 110,
      closedAt: at(96),
      closingIssues: [closingOf(issue912)],
    },
    e => ({
      events: [
        e.commit(109.8, 'pi0', 'e5f6a7b8c9d0', 'fix: read the body once in readBody'),
        e.merged(96, 'pi0'),
      ],
      ci: [
        {
          sha: 'e5f6a7b8c9d0',
          hoursAgo: 109.5,
          runs: [
            ['lint', 'success'],
            ['test', 'success'],
          ],
        },
      ],
    }),
  )

  // pnpm/pnpm: own issue, own PR, approved and merged.
  const issue9090 = thread(
    {
      kind: 'issue',
      repo: 'pnpm/pnpm',
      number: 9090,
      title: 'catalog: protocol is rewritten on publish',
      state: 'closed',
      agoH: 14 * 24,
      closedAt: at(48),
    },
    e => ({
      events: [
        e.comment(14 * 24 - 1, MOCK_VIEWER, "I'll send a PR for this.", 'CONTRIBUTOR'),
        e.label(13 * 24, 'zkochan', 'type: bug', 'd73a4a'),
        e.xref(300, MOCK_VIEWER, 'pnpm/pnpm', 9104, 'pr', 'fix: keep catalog protocol unchanged'),
        e.closed(48, 'zkochan'),
      ],
    }),
  )
  thread(
    {
      kind: 'pr',
      repo: 'pnpm/pnpm',
      number: 9104,
      title: 'fix: keep catalog protocol unchanged',
      state: 'merged',
      agoH: 300,
      closedAt: at(48),
      closingIssues: [closingOf(issue9090)],
    },
    e => ({
      events: [
        e.commit(299.8, MOCK_VIEWER, 'f6a7b8c9d0e1', 'fix: keep catalog protocol unchanged'),
        e.review(60, 'zkochan', 'approved', 'LGTM. Thanks for the quick fix.', 'MEMBER'),
        e.merged(48, 'zkochan'),
      ],
      ci: [
        {
          sha: 'f6a7b8c9d0e1',
          hoursAgo: 299.5,
          runs: [
            ['lint', 'success'],
            ['test', 'success'],
          ],
        },
      ],
    }),
  )

  // nuxt/nuxt: reported an issue, no PR.
  thread(
    {
      kind: 'issue',
      repo: 'nuxt/nuxt',
      number: 33210,
      title: 'useAsyncData keeps stale data after navigating back',
      agoH: 20 * 24,
    },
    e => ({
      events: [
        e.label(20 * 24 - 0.5, 'danielroe', 'pending triage', 'ededed'),
        e.comment(
          19 * 24 + 12,
          'danielroe',
          'Could you share a minimal reproduction? A StackBlitz link is enough.',
          'OWNER',
        ),
        e.comment(
          12 * 24,
          MOCK_VIEWER,
          'Here is a minimal reproduction: https://stackblitz.com/edit/nuxt-stale-async-data',
          'NONE',
        ),
        e.xref(100, 'ninjaxd', 'nuxt/nuxt', 33305, 'issue', 'Stale payload after back navigation'),
      ],
    }),
  )

  // vuejs/core: helped on someone else's issue.
  thread(
    {
      kind: 'issue',
      repo: 'vuejs/core',
      number: 13540,
      title: 'Watcher keeps firing after stop() inside its own callback',
      author: user('Alfred-Skyblue'),
      agoH: 70,
    },
    e => ({
      events: [
        e.comment(
          68,
          'edison1105',
          'Thanks for the report. Which Vue version is this on?',
          'MEMBER',
        ),
        e.comment(
          50,
          MOCK_VIEWER,
          'This happens when the watcher is stopped inside its own cleanup. The root cause is that the effect scope is detached before the flush runs.',
          'NONE',
        ),
        e.comment(
          24,
          'Alfred-Skyblue',
          'Thanks, that matches what I see. Confirmed on 3.5.13.',
          'NONE',
        ),
      ],
    }),
  )

  return threads
}

type Emit = ReturnType<typeof emitter>

function emitter(scope: string, url: string, at: (hours: number) => string) {
  let counter = 0
  const id = () => `${scope}:${(counter += 1)}`
  const withAssociation = (association: string | undefined) =>
    association ? { author_association: association } : {}
  return {
    comment: (
      hours: number,
      actor: string | Person,
      body: string,
      association?: string,
    ): RawRestTimelineEvent => {
      const who = typeof actor === 'string' ? person(actor) : actor
      const own = id()
      return {
        id: own,
        event: 'commented',
        created_at: at(hours),
        actor: who,
        body,
        html_url: `${url}#issuecomment-${own}`,
        ...withAssociation(association ?? (who.type === 'Bot' ? 'NONE' : undefined)),
      }
    },
    review: (
      hours: number,
      actor: string,
      state: string,
      body: string,
      association: string,
    ): RawRestTimelineEvent => {
      const own = id()
      return {
        id: own,
        event: 'reviewed',
        submitted_at: at(hours),
        actor: person(actor),
        state,
        body,
        html_url: `${url}#pullrequestreview-${own}`,
        author_association: association,
      }
    },
    commit: (hours: number, actor: string, sha: string, message: string): RawRestTimelineEvent => ({
      id: id(),
      event: 'committed',
      created_at: at(hours),
      author: person(actor),
      sha,
      message,
      html_url: `${url}/commits/${sha}`,
    }),
    label: (hours: number, actor: string, name: string, color: string): RawRestTimelineEvent => ({
      id: id(),
      event: 'labeled',
      created_at: at(hours),
      actor: person(actor),
      label: { name, color },
    }),
    assigned: (hours: number, actor: string, assignee: string): RawRestTimelineEvent => ({
      id: id(),
      event: 'assigned',
      created_at: at(hours),
      actor: person(actor),
      assignee: { login: assignee },
    }),
    reviewRequested: (hours: number, actor: string, reviewer: string): RawRestTimelineEvent => ({
      id: id(),
      event: 'review_requested',
      created_at: at(hours),
      actor: person(actor),
      requested_reviewer: { login: reviewer },
    }),
    xref: (
      hours: number,
      actor: string,
      repo: string,
      number: number,
      kind: 'issue' | 'pr',
      title: string,
    ): RawRestTimelineEvent => ({
      id: id(),
      event: 'cross-referenced',
      created_at: at(hours),
      actor: person(actor),
      source: {
        issue: {
          number,
          title,
          html_url: urlOf(repo, kind, number),
          repository_url: `https://api.github.com/repos/${repo}`,
          ...(kind === 'pr' ? { pull_request: {} } : {}),
        },
      },
    }),
    closed: (hours: number, actor: string): RawRestTimelineEvent => ({
      id: id(),
      event: 'closed',
      created_at: at(hours),
      actor: person(actor),
    }),
    merged: (hours: number, actor: string): RawRestTimelineEvent => ({
      id: id(),
      event: 'merged',
      created_at: at(hours),
      actor: person(actor),
    }),
  }
}

function threadFor(threads: readonly Thread[], repo: string, number: number): Thread | undefined {
  return threads.find(entry => entry.item.repo === repo && entry.item.number === number)
}

export function mockUnits(nowMs: number): Unit[] {
  const threads = mockThreads(nowMs)
  const items = threads.map(entry => entry.item)
  return buildUnitDrafts(items).map(draft => toUnit(draft, judge(itemFor(draft), nowMs), nowMs))
}

export function mockTimeline(unitId: string, nowMs: number): TimelinePayload | null {
  const unit = mockUnits(nowMs).find(entry => entry.id === unitId)
  if (!unit) return null
  const threads = mockThreads(nowMs)
  const events: UnitEvent[] = []
  const fix = unit.fixedBy
  const fixer =
    fix && !unit.members.some(member => member.repo === fix.repo && member.number === fix.number)
      ? { repo: fix.repo, number: fix.number, kind: 'pr' as const }
      : null
  for (const member of fixer ? [...unit.members, fixer] : unit.members) {
    const found = threadFor(threads, member.repo, member.number)
    if (!found) continue
    const source = { repo: member.repo, number: member.number, kind: member.kind }
    events.push(...normalizeRestTimeline(found.events, source))
    if (member.kind !== 'pr' || member === fixer) continue
    events.push(...normalizeReviewComments(found.reviewComments, source))
    for (const batch of found.ci) {
      const when = new Date(nowMs - batch.hoursAgo * HOUR_MS).toISOString()
      const runs: RawCheckRun[] = batch.runs.map(([name, conclusion]) => ({
        id: `${batch.sha}:${name}`,
        name,
        status: 'completed',
        conclusion,
        html_url: `${found.item.url}/checks`,
        completed_at: when,
      }))
      events.push(...normalizeCheckRuns(runs, source, batch.sha))
    }
  }
  return {
    id: unit.id,
    generatedAt: new Date(nowMs).toISOString(),
    cached: false,
    entries: foldEntries(events),
    items: storyItems(unit),
    truncated: false,
  }
}

function itemFor(draft: { primary: Item; members: Item[] }): Item {
  return draft.members.length > 1
    ? {
        ...draft.primary,
        activities: draft.members.flatMap(item => item.activities),
        checks: draft.primary.checks,
      }
    : draft.primary
}
