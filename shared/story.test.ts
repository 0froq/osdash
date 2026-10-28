import assert from 'node:assert/strict'
import { it } from 'vite-plus/test'
import { storyItems, type StoryUnit } from './story'

const URL = 'https://github.com/acme/app'

function unit(overrides: Partial<StoryUnit>): StoryUnit {
  return {
    repo: 'acme/app',
    number: 20,
    kind: 'pr',
    title: 'fix: tear',
    url: `${URL}/pull/20`,
    state: 'open',
    createdAt: '2026-10-10T00:00:00.000Z',
    closedAt: null,
    issues: [],
    history: [],
    fixedBy: null,
    members: [],
    ...overrides,
  }
}

function issue(number: number, link: 'closing' | 'mention', authorLogin = 'pi0') {
  return {
    repo: 'acme/app',
    number,
    url: `${URL}/issues/${number}`,
    title: `issue ${number}`,
    state: 'open' as const,
    authorLogin,
    link,
    sharedWith: [],
  }
}

it('lists primary, history, closing and mention issues in order', () => {
  const items = storyItems(
    unit({
      issues: [issue(1, 'closing'), issue(2, 'closing'), issue(3, 'mention')],
      history: [
        {
          repo: 'acme/app',
          number: 10,
          url: `${URL}/pull/10`,
          title: 'first try',
          state: 'closed',
          closedAt: '2026-10-09T00:00:00.000Z',
        },
      ],
      members: [
        {
          repo: 'acme/app',
          number: 20,
          kind: 'pr',
          authorLogin: 'octo-dev',
          closes: ['acme/app#1', 'acme/app#2'],
        },
        {
          repo: 'acme/app',
          number: 10,
          kind: 'pr',
          authorLogin: 'octo-dev',
          createdAt: '2026-10-05T00:00:00.000Z',
          closes: ['acme/app#1'],
        },
        {
          repo: 'acme/app',
          number: 1,
          kind: 'issue',
          createdAt: '2026-10-01T00:00:00.000Z',
          closedAt: null,
        },
      ],
    }),
  )
  assert.deepEqual(
    items.map(item => [item.key, item.role, item.link]),
    [
      ['acme/app#20', 'primary', null],
      ['acme/app#10', 'history', null],
      ['acme/app#1', 'issue', 'closing'],
      ['acme/app#2', 'issue', 'closing'],
      ['acme/app#3', 'issue', 'mention'],
    ],
  )
  assert.equal(items[0]?.kind, 'pr')
  assert.equal(items[0]?.authorLogin, 'octo-dev')
  assert.deepEqual(items[0]?.closes, ['acme/app#1', 'acme/app#2'])
  assert.equal(items[0]?.closingEvidence, 'explicit')
  assert.equal(items[1]?.closingEvidence, 'explicit')
  assert.equal(items[1]?.state, 'closed')
  assert.equal(items[1]?.createdAt, '2026-10-05T00:00:00.000Z')
  assert.equal(items[1]?.closedAt, '2026-10-09T00:00:00.000Z')
  assert.equal(items[2]?.createdAt, '2026-10-01T00:00:00.000Z')
})

it('falls back to the unit closing issues for a history PR without a member', () => {
  const items = storyItems(
    unit({
      issues: [issue(1, 'closing'), issue(3, 'mention')],
      history: [
        {
          repo: 'acme/app',
          number: 10,
          url: `${URL}/pull/10`,
          title: 'first try',
          state: 'closed',
          closedAt: '2026-10-09T00:00:00.000Z',
        },
      ],
    }),
  )
  const history = items.find(item => item.role === 'history')
  assert.equal(history?.createdAt, null)
  assert.equal(history?.authorLogin, '')
  assert.deepEqual(history?.closes, ['acme/app#1'])
  assert.equal(history?.closingEvidence, 'inferred')
})

it('builds an issue-only card with a fixed-by PR', () => {
  const items = storyItems(
    unit({
      number: 880,
      kind: 'issue-only',
      url: `${URL}/issues/880`,
      fixedBy: {
        repo: 'acme/app',
        number: 901,
        url: `${URL}/pull/901`,
        authorLogin: 'pi0',
        state: 'merged',
        createdAt: '2026-10-12T00:00:00.000Z',
        closes: ['acme/app#880'],
      },
      members: [{ repo: 'acme/app', number: 880, kind: 'issue', authorLogin: 'octo-dev' }],
    }),
  )
  assert.equal(items.length, 2)
  assert.equal(items[0]?.kind, 'issue')
  assert.equal(items[0]?.role, 'primary')
  const fixed = items[1]!
  assert.equal(fixed.role, 'fixed-by')
  assert.equal(fixed.kind, 'pr')
  assert.deepEqual(fixed.closes, ['acme/app#880'])
  assert.equal(fixed.closingEvidence, 'explicit')
  assert.equal(fixed.createdAt, '2026-10-12T00:00:00.000Z')
  assert.equal(fixed.title, '')
})

it('uses the fixing PR own verified targets instead of copying all card issues', () => {
  const items = storyItems(
    unit({
      issues: [issue(1, 'closing'), issue(3, 'mention')],
      fixedBy: {
        repo: 'acme/app',
        number: 30,
        url: `${URL}/pull/30`,
        authorLogin: 'pi0',
        state: 'merged',
        closes: ['acme/app#1', 'other/repo#99'],
      },
    }),
  )
  const fixed = items.find(item => item.role === 'fixed-by')
  assert.deepEqual(fixed?.closes, ['acme/app#1', 'other/repo#99'])
  assert.equal(fixed?.closingEvidence, 'explicit')
})

it('leaves createdAt null for an issue known only through closingIssuesReferences', () => {
  const items = storyItems(unit({ issues: [issue(7, 'closing')] }))
  assert.equal(items[1]?.createdAt, null)
  assert.equal(items[1]?.closedAt, null)
  assert.equal(items[0]?.authorLogin, '')
  assert.equal(items[0]?.closingEvidence, 'inferred')
})
