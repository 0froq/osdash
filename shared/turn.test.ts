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

it('bot-only comment, Vercel preview failed, workflow awaiting approve: maintainer turn with CI pending approval', () => {
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
  assert.deepEqual(verdict.labels, ['CI pending approval'])
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
  assert.equal(waiting.turn, 'me')
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
  assert.equal(verdict.turn, 'me')
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
  assert.equal(mine.turn, 'me')
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
