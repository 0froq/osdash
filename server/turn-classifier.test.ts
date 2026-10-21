import assert from 'node:assert/strict'
import { it } from 'vite-plus/test'
import { DAY_MS, judge, type Item } from '../shared/turn'
import { turnCacheKey } from '../shared/turn-classifier'
import { maybeClassifyTurn } from './turn-classifier'
import type { AiBinding } from './claim-classifier-clef'

const NOW = Date.parse('2026-10-19T12:00:00.000Z')

function statementItem(): Item {
  return {
    kind: 'pr',
    repo: 'unjs/h3',
    number: 12,
    title: 'fix: cache key',
    url: 'https://github.com/unjs/h3/pull/12',
    state: 'open',
    createdAt: new Date(NOW - 2 * DAY_MS).toISOString(),
    closedAt: null,
    author: { typename: 'User', login: '0froq' },
    activities: [
      {
        kind: 'comment',
        at: new Date(NOW - 60 * 60 * 1000).toISOString(),
        actor: { typename: 'User', login: '0froq' },
        body: 'I traced this to the cache key.',
        commentId: 'c-statement',
        updatedAt: new Date(NOW - 60 * 60 * 1000).toISOString(),
      },
    ],
    checks: [{ name: 'lint', status: 'COMPLETED', conclusion: 'SUCCESS' }],
  }
}

it('uses clef when the rule is undecided and falls back when confidence is low', async () => {
  let calls = 0
  const ai: AiBinding = {
    run: async () => {
      calls += 1
      return {
        answers: {
          turn: { choice: 'mine', confidence: 0.4 },
          relied_on: { choice: 's0', confidence: 0.9 },
        },
      }
    },
  }
  const item = statementItem()
  const verdict = judge(item, NOW)
  assert.equal(verdict.ambiguous, true)
  assert.equal(verdict.turn, 'maintainer')
  const next = await maybeClassifyTurn(item, verdict, { AI: ai }, NOW)
  assert.equal(calls, 1)
  assert.equal(next.turn, 'maintainer')
  assert.equal(next.quote, null)
})

it('accepts a confident clef turn and the sentence it quoted', async () => {
  const memory = new Map<string, string>()
  let calls = 0
  const ai: AiBinding = {
    run: async () => {
      calls += 1
      return {
        answers: {
          turn: {
            choice: 'other',
            probabilities: { mine: 0.05, maintainer: 0.04, other: 0.9, none: 0.01 },
          },
          relied_on: { choice: 's0', probability: 0.8 },
        },
      }
    },
  }
  const store = {
    get: async (key: string) => memory.get(key) ?? null,
    put: async (key: string, value: string) => {
      memory.set(key, value)
    },
  }
  const item = statementItem()
  const verdict = judge(item, NOW)
  const first = await maybeClassifyTurn(item, verdict, { AI: ai, CACHE: store }, NOW)
  const second = await maybeClassifyTurn(item, verdict, { AI: ai, CACHE: store }, NOW)
  assert.equal(calls, 1)
  assert.equal(first.turn, 'other')
  assert.equal(first.quote, 'I traced this to the cache key.')
  assert.equal(second.turn, 'other')
  assert.equal(memory.has(turnCacheKey('c-statement', verdict.focusUpdatedAt!, '0froq')), true)
})

it('does not call clef when the rules already decided', async () => {
  let calls = 0
  const ai: AiBinding = {
    run: async () => {
      calls += 1
      return { answers: {} }
    },
  }
  const item = statementItem()
  item.activities.push({
    kind: 'review',
    at: new Date(NOW - 30 * 60 * 1000).toISOString(),
    actor: { typename: 'User', login: 'pi0' },
    reviewState: 'CHANGES_REQUESTED',
  })
  const verdict = judge(item, NOW)
  assert.equal(verdict.turn, 'mine')
  assert.equal(verdict.ambiguous, false)
  const next = await maybeClassifyTurn(item, verdict, { AI: ai }, NOW)
  assert.equal(calls, 0)
  assert.equal(next.turn, 'mine')
})

it('rejects a confident turn that relies on Thanks', async () => {
  const ai: AiBinding = {
    run: async () => ({
      answers: {
        turn: { choice: 'none', confidence: 0.95 },
        relied_on: { choice: 's0', confidence: 0.99 },
      },
    }),
  }
  const item = statementItem()
  item.activities[0]!.body = 'Thanks!'
  const verdict = judge(item, NOW)
  assert.equal(verdict.ambiguous, false)
  const overridden = {
    ...verdict,
    ambiguous: true,
    focusCommentId: 'c-thanks',
    focusUpdatedAt: item.activities[0]!.at,
  }
  item.activities[0]!.body = 'Thanks!'
  const next = await maybeClassifyTurn(item, overridden, { AI: ai }, NOW)
  assert.equal(next.turn, 'maintainer')
  assert.equal(next.quote, null)
})
