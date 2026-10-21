import assert from 'node:assert/strict'
import { it } from 'vite-plus/test'
import {
  BOT_LOGINS,
  DAY_MS,
  type Activity,
  type Actor,
  type Check,
  type Item,
  firstReplyMs,
  isBot,
  judge,
  summarize,
  present,
  withResolvedTurn,
} from './turn'

const NOW = Date.parse('2026-10-19T12:00:00.000Z')

function ago(ms: number): string {
  return new Date(NOW - ms).toISOString()
}

function user(login: string, typename = 'User'): Actor {
  return { typename, login }
}

function item(overrides: Partial<Item> = {}): Item {
  return {
    kind: 'pr',
    repo: 'eggjs/egg',
    number: 12,
    title: 'fix: keep the paper dark',
    url: 'https://github.com/eggjs/egg/pull/12',
    state: 'open',
    createdAt: ago(2 * DAY_MS),
    closedAt: null,
    author: user('0froq'),
    activities: [],
    checks: [],
    viewerLogin: '0froq',
    ...overrides,
  }
}

function check(overrides: Partial<Check> = {}): Check {
  return {
    name: 'lint',
    status: 'COMPLETED',
    conclusion: 'SUCCESS',
    url: 'https://github.com/eggjs/egg/runs/1',
    ...overrides,
  }
}

function activity(overrides: Partial<Activity> & Pick<Activity, 'kind' | 'actor'>): Activity {
  return {
    at: ago(DAY_MS),
    ...overrides,
  }
}

it('when 0froq replied last, it is the maintainer turn', () => {
  const verdict = judge(
    item({
      checks: [check()],
      activities: [
        activity({
          kind: 'comment',
          actor: user('fengmk2'),
          at: ago(6 * 60 * 60 * 1000),
          url: 'https://github.com/eggjs/egg/pull/12#issuecomment-1',
        }),
        activity({
          kind: 'comment',
          actor: user('0froq'),
          at: ago(60 * 60 * 1000),
          url: 'https://github.com/eggjs/egg/pull/12#issuecomment-2',
        }),
      ],
    }),
    NOW,
  )
  assert.equal(verdict.turn, 'maintainer')
  assert.equal(verdict.reason, 'Replied, waiting on maintainer')
  assert.deepEqual(verdict.labels, [])
  assert.equal(verdict.tone, 'none')
})

it('bot-only comment, Vercel preview failed, workflow awaiting approve: maintainer turn with CI awaiting approval', () => {
  const verdict = judge(
    item({
      activities: [
        activity({
          kind: 'comment',
          actor: user('coderabbitai', 'Bot'),
          at: ago(3 * 60 * 60 * 1000),
          url: 'https://github.com/eggjs/egg/pull/12#issuecomment-bot',
        }),
      ],
      checks: [
        check({
          name: 'Vercel Preview',
          conclusion: 'FAILURE',
          url: 'https://vercel.com/preview/12',
        }),
        check({
          name: 'workflow approve',
          status: 'WAITING',
          conclusion: 'ACTION_REQUIRED',
          url: 'https://github.com/eggjs/egg/actions/runs/9',
        }),
      ],
    }),
    NOW,
  )
  assert.equal(verdict.turn, 'maintainer')
  assert.deepEqual(verdict.labels, ['CI awaiting approval'])
  assert.equal(verdict.links.ci, 'https://github.com/eggjs/egg/actions/runs/9')
})

it('green CI, no review, only PR creation: maintainer turn', () => {
  const verdict = judge(
    item({
      checks: [
        check({ name: 'lint' }),
        check({ name: 'test', url: 'https://github.com/eggjs/egg/runs/2' }),
      ],
    }),
    NOW,
  )
  assert.equal(verdict.turn, 'maintainer')
  assert.equal(verdict.reason, 'Opened, waiting on maintainer')
  assert.equal(verdict.waitingSince, ago(2 * DAY_MS))
  assert.deepEqual(verdict.labels, [])
})

it('filters the bot list, [bot] suffix, and Bot typename', () => {
  for (const login of BOT_LOGINS) assert.equal(isBot(user(login)), true)
  assert.equal(isBot(user('renovate[bot]')), true)
  assert.equal(isBot(user('someone', 'Bot')), true)
  assert.equal(isBot(user('fengmk2')), false)

  const verdict = judge(
    item({
      activities: BOT_LOGINS.map((login, index) =>
        activity({
          kind: 'comment',
          actor: user(login),
          at: ago((index + 1) * 60 * 1000),
        }),
      ),
    }),
    NOW,
  )
  assert.equal(verdict.turn, 'maintainer')
  assert.equal(verdict.reason, 'Opened, waiting on maintainer')
})

it('after CHANGES_REQUESTED, a 0froq push moves it off my turn', () => {
  const requested = activity({
    kind: 'review',
    actor: user('fengmk2'),
    at: ago(10 * 60 * 60 * 1000),
    reviewState: 'CHANGES_REQUESTED',
    url: 'https://github.com/eggjs/egg/pull/12#pullrequestreview-1',
  })
  const waiting = judge(item({ activities: [requested], checks: [check()] }), NOW)
  assert.equal(waiting.turn, 'mine')
  assert.equal(waiting.reason, 'fengmk2 requested changes')

  const pushed = judge(
    item({
      activities: [
        requested,
        activity({ kind: 'push', actor: user('0froq'), at: ago(2 * 60 * 60 * 1000) }),
      ],
      checks: [check()],
    }),
    NOW,
  )
  assert.equal(pushed.turn, 'maintainer')
  assert.equal(pushed.reason, 'Pushed, waiting on maintainer')
})

it('a real lint failure is my turn', () => {
  const verdict = judge(
    item({
      checks: [
        check({
          name: 'lint',
          conclusion: 'FAILURE',
          url: 'https://github.com/eggjs/egg/runs/lint',
        }),
        check({
          name: 'Vercel Preview',
          conclusion: 'FAILURE',
          url: 'https://vercel.com/preview/12',
        }),
      ],
    }),
    NOW,
  )
  assert.equal(verdict.turn, 'mine')
  assert.equal(verdict.reason, 'CI lint failed')
  assert.equal(verdict.links.ci, 'https://github.com/eggjs/egg/runs/lint')
  assert.equal(verdict.tone, 'none')
})

it('only colors maintainer-waiting items past 7 and 14 days', () => {
  const open = item()
  assert.equal(judge(open, Date.parse(open.createdAt) + 7 * DAY_MS).tone, 'none')
  assert.equal(judge(open, Date.parse(open.createdAt) + 7 * DAY_MS + 1).tone, 'yellow')
  assert.equal(judge(open, Date.parse(open.createdAt) + 14 * DAY_MS).tone, 'yellow')
  assert.equal(judge(open, Date.parse(open.createdAt) + 14 * DAY_MS + 1).tone, 'red')

  const mine = judge(
    item({ checks: [check({ conclusion: 'FAILURE' })] }),
    Date.parse(open.createdAt) + 20 * DAY_MS,
  )
  assert.equal(mine.turn, 'mine')
  assert.equal(mine.tone, 'none')
})

it('averages the first reply from someone other than 0froq', () => {
  const replied = item({
    number: 1,
    activities: [activity({ kind: 'comment', actor: user('fengmk2'), at: ago(DAY_MS) })],
  })
  const silent = item({ number: 2 })
  const merged = item({
    number: 3,
    state: 'merged',
    closedAt: ago(DAY_MS),
    activities: [activity({ kind: 'comment', actor: user('fengmk2'), at: ago(DAY_MS) })],
  })
  assert.equal(firstReplyMs(replied), DAY_MS)
  assert.equal(firstReplyMs(silent), null)
  const stats = summarize([present(replied, NOW), present(silent, NOW), present(merged, NOW)])
  assert.equal(stats.open, 2)
  assert.equal(stats.merged, 1)
  assert.equal(stats.averageFirstReplyMs, DAY_MS)
})

it('drops bot comments except a failing CLA check and an actionable CodeRabbit note', () => {
  const cla = judge(
    item({
      activities: [
        activity({
          kind: 'comment',
          actor: user('cla-assistant[bot]', 'Bot'),
          at: ago(60 * 60 * 1000),
          body: 'You need to sign the CLA before this pull request can be merged.',
        }),
      ],
      checks: [check()],
    }),
    NOW,
  )
  assert.equal(cla.turn, 'mine')
  assert.equal(cla.reason, 'CLA check failed')
  assert.equal(cla.ambiguous, false)

  const summary = judge(
    item({
      activities: [
        activity({
          kind: 'comment',
          actor: user('coderabbitai', 'Bot'),
          at: ago(60 * 60 * 1000),
          body: 'Review summary. Actionable comments posted: 0',
        }),
      ],
    }),
    NOW,
  )
  assert.equal(summary.turn, 'maintainer')
  assert.equal(summary.reason, 'Opened, waiting on maintainer')

  const rabbit = judge(
    item({
      activities: [
        activity({
          kind: 'comment',
          actor: user('coderabbitai[bot]', 'Bot'),
          at: ago(60 * 60 * 1000),
          body: 'Actionable comments posted: 1. Potential issue: the cache key ignores the host.',
        }),
      ],
      checks: [check()],
    }),
    NOW,
  )
  assert.equal(rabbit.turn, 'mine')
  assert.equal(rabbit.reason, 'CodeRabbit asked for changes')
})

it('a maintainer mention or a rebase request is mine, and a third party is other', () => {
  const mention = judge(
    item({
      activities: [
        activity({
          kind: 'comment',
          actor: user('fengmk2'),
          at: ago(2 * 60 * 60 * 1000),
          body: '@0froq can you take another look?',
          authorAssociation: 'OWNER',
        }),
      ],
      checks: [check()],
    }),
    NOW,
  )
  assert.equal(mention.turn, 'mine')
  assert.equal(mention.reason, 'fengmk2 mentioned you')
  assert.equal(mention.ambiguous, false)

  const rebase = judge(
    item({
      activities: [
        activity({
          kind: 'comment',
          actor: user('pi0'),
          at: ago(2 * 60 * 60 * 1000),
          body: 'Could you rebase onto main?',
          authorAssociation: 'MEMBER',
        }),
      ],
      checks: [check()],
    }),
    NOW,
  )
  assert.equal(rebase.turn, 'mine')
  assert.equal(rebase.reason, 'pi0 asked for a PR or rebase')

  const other = judge(
    item({
      activities: [
        activity({
          kind: 'comment',
          actor: user('someone'),
          at: ago(2 * 60 * 60 * 1000),
          body: 'I hit the same crash on Linux.',
          authorAssociation: 'CONTRIBUTOR',
        }),
      ],
      checks: [check()],
    }),
    NOW,
  )
  assert.equal(other.turn, 'other')
  assert.equal(other.ambiguous, false)
})

it('sends froQ questions, unanswered issues, and clean pull requests to the maintainer', () => {
  const question = judge(
    item({
      activities: [
        activity({
          kind: 'comment',
          actor: user('0froq'),
          at: ago(60 * 60 * 1000),
          body: 'Should this guard be optional?',
        }),
      ],
      checks: [check()],
    }),
    NOW,
  )
  assert.equal(question.turn, 'maintainer')
  assert.equal(question.reason, 'Asked, waiting on maintainer')
  assert.equal(question.ambiguous, false)

  const unanswered = judge(
    item({
      kind: 'issue',
      author: user('0froq'),
      activities: [],
      checks: [],
    }),
    NOW,
  )
  assert.equal(unanswered.turn, 'maintainer')
  assert.equal(unanswered.reason, 'Opened, waiting on maintainer')

  const clean = judge(item({ checks: [check()] }), NOW)
  assert.equal(clean.turn, 'maintainer')
  assert.equal(clean.ambiguous, false)
})

it('leaves a statement and an unclear help comment for clef, and ignores Thanks', () => {
  const statement = judge(
    item({
      activities: [
        activity({
          kind: 'comment',
          actor: user('0froq'),
          at: ago(3 * 60 * 60 * 1000),
          body: 'I traced this to the cache key.',
          commentId: 'c-statement',
          updatedAt: ago(3 * 60 * 60 * 1000),
        }),
      ],
      checks: [check()],
    }),
    NOW,
  )
  assert.equal(statement.ambiguous, true)
  assert.equal(statement.turn, 'maintainer')
  assert.equal(statement.focusCommentId, 'c-statement')

  const help =
    'The root cause is a leaked listener on the worker. Repro: fire two parallel requests and watch the context stick. '.repeat(
      4,
    )
  const unclear = judge(
    item({
      kind: 'issue',
      activities: [
        activity({
          kind: 'comment',
          actor: user('0froq'),
          at: ago(2 * 60 * 60 * 1000),
          body: help,
          commentId: 'c-help',
          updatedAt: ago(2 * 60 * 60 * 1000),
        }),
      ],
      checks: [],
    }),
    NOW,
  )
  assert.equal(unclear.ambiguous, true)
  assert.equal(unclear.contributions.includes('help'), true)

  const thanks = judge(
    item({
      activities: [
        activity({
          kind: 'comment',
          actor: user('0froq'),
          at: ago(60 * 60 * 1000),
          body: 'Thanks!',
        }),
      ],
      checks: [check()],
    }),
    NOW,
  )
  assert.equal(thanks.ambiguous, false)
  assert.equal(thanks.turn, 'maintainer')
  assert.equal(thanks.reason, 'Opened, waiting on maintainer')

  const fixed = judge(
    item({
      kind: 'issue',
      activities: [
        activity({
          kind: 'comment',
          actor: user('0froq'),
          at: ago(60 * 60 * 1000),
          body: 'This is already fixed on main.',
        }),
      ],
      checks: [],
    }),
    NOW,
  )
  assert.equal(fixed.ambiguous, false)
  assert.equal(fixed.turn, 'maintainer')
  assert.equal(fixed.reason, 'Already fixed, waiting on maintainer')
  assert.equal(fixed.contributions.includes('help'), true)
})

it('records claim, proposal, help, and non-code independently', () => {
  const verdict = judge(
    item({
      kind: 'issue',
      title: 'Add a dark theme namespace and a directory listing',
      body: 'Can I take this? The root cause is a missing namespace export. Repro: import the theme from the package root.',
      activities: [
        activity({
          kind: 'comment',
          actor: user('0froq'),
          at: ago(2 * DAY_MS),
          body: 'Can I take this?',
        }),
        activity({
          kind: 'comment',
          actor: user('0froq'),
          at: ago(DAY_MS),
          body: "I'll open a PR",
        }),
      ],
      checks: [],
    }),
    NOW,
  )
  assert.deepEqual(verdict.contributions, ['claim', 'proposal', 'help', 'non-code'])
  assert.equal(verdict.turn, 'mine')
})

it('derives stalled from the timer past 14 days and not on the boundary', () => {
  const open = item()
  const atBoundary = judge(open, Date.parse(open.createdAt) + 14 * DAY_MS)
  assert.equal(atBoundary.marks.includes('stalled >14d'), false)
  const past = judge(open, Date.parse(open.createdAt) + 14 * DAY_MS + 1)
  assert.equal(past.turn, 'maintainer')
  assert.equal(past.marks.includes('stalled >14d'), true)

  const closed = judge(item({ state: 'merged', closedAt: ago(20 * DAY_MS) }), NOW)
  assert.equal(closed.turn, 'none')
  assert.deepEqual(closed.marks, [])
})

it('treats a CLA action_required check as mine and a workflow action_required check as maintainer', () => {
  const cla = judge(
    item({
      checks: [
        check({
          name: 'CLA',
          status: 'COMPLETED',
          conclusion: 'ACTION_REQUIRED',
        }),
      ],
    }),
    NOW,
  )
  assert.equal(cla.turn, 'mine')
  assert.equal(cla.reason, 'CLA check failed')

  const workflow = judge(
    item({
      checks: [
        check({
          name: 'workflow approve',
          status: 'WAITING',
          conclusion: 'ACTION_REQUIRED',
        }),
      ],
    }),
    NOW,
  )
  assert.equal(workflow.turn, 'maintainer')
  assert.deepEqual(workflow.labels, ['CI awaiting approval'])
})

it('assigns a reason code for CI, review, mention, claim, and merge', () => {
  const ci = judge(item({ checks: [check({ name: 'test', conclusion: 'FAILURE' })] }), NOW)
  assert.equal(ci.reason, 'CI test failed')
  assert.equal(ci.reasonCode, 'ci-failed')
  assert.equal(ci.reasonActor, null)

  const changes = judge(
    item({
      activities: [
        activity({
          kind: 'review',
          actor: user('fengmk2'),
          at: ago(60 * 60 * 1000),
          reviewState: 'CHANGES_REQUESTED',
        }),
      ],
      checks: [check()],
    }),
    NOW,
  )
  assert.equal(changes.reasonCode, 'changes-requested')
  assert.equal(changes.reasonActor, 'fengmk2')

  const mention = judge(
    item({
      activities: [
        activity({
          kind: 'comment',
          actor: user('fengmk2'),
          at: ago(2 * 60 * 60 * 1000),
          body: '@0froq can you take another look?',
          authorAssociation: 'OWNER',
        }),
      ],
      checks: [check()],
    }),
    NOW,
  )
  assert.equal(mention.reasonCode, 'mentioned')
  assert.equal(mention.reasonActor, 'fengmk2')

  const claimed = judge(
    item({
      kind: 'issue',
      author: user('pi0'),
      activities: [
        activity({
          kind: 'comment',
          actor: user('0froq'),
          at: ago(DAY_MS),
          body: "I'll open a PR",
        }),
      ],
    }),
    NOW,
  )
  assert.equal(claimed.reason, 'Claimed, open a PR')
  assert.equal(claimed.reasonCode, 'claimed-open-pr')

  const merged = judge(item({ state: 'merged', closedAt: ago(DAY_MS) }), NOW)
  assert.equal(merged.reason, 'Merged')
  assert.equal(merged.reasonCode, 'merged')

  const resolved = withResolvedTurn(item(), changes, 'maintainer', 'Please split the commit.')
  assert.equal(resolved.reasonCode, 'clef')
  assert.equal(resolved.reason, 'Please split the commit.')
})
