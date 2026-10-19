import assert from 'node:assert/strict'
import { it } from 'vite-plus/test'
import { claimLevel } from '../shared/claim'
import { judge } from '../shared/turn'
import { cacheKeyForComment } from '../shared/claim-classifier'
import { CLEF_MODEL } from '../shared/claim-types'
import { DAY_MS, type Activity, type Actor, type Item } from '../shared/turn'
import { createCachingClaimClassifier, enrichIssueClassifications } from './claim-classifier'
import type { AiBinding } from './claim-classifier-clef'

const NOW = Date.parse('2026-10-19T12:00:00.000Z')

function ago(ms: number): string {
  return new Date(NOW - ms).toISOString()
}

function user(login: string): Actor {
  return { typename: 'User', login }
}

function issue(activities: Activity[]): Item {
  return {
    kind: 'issue',
    repo: 'unjs/h3',
    number: 100,
    title: 'sample issue',
    url: 'https://github.com/unjs/h3/issues/100',
    state: 'open',
    createdAt: ago(5 * DAY_MS),
    closedAt: null,
    author: user('pi0'),
    activities,
    checks: [],
    assignees: [],
    linkedPullRequests: [],
  }
}

let commentSeq = 0

function selfComment(body: string, overrides: Partial<Activity> = {}): Activity {
  const id = overrides.commentId ?? `comment-self-${++commentSeq}`
  const at = overrides.at ?? ago(DAY_MS)
  return {
    kind: 'comment',
    at,
    actor: user('0froq'),
    body,
    commentId: id,
    updatedAt: overrides.updatedAt ?? at,
    url: `https://github.com/unjs/h3/issues/100#issuecomment-${id}`,
    ...overrides,
  }
}

it('classifies claim intent via clef-flash', async () => {
  const runs: unknown[] = []
  const ai: AiBinding = {
    run: async (model, input) => {
      runs.push({ model, input })
      return {
        answers: {
          intent: {
            choice: 'claim',
            probabilities: { claim: 0.92, ask: 0.03, withdraw: 0.01, none: 0.04 },
          },
        },
      }
    },
  }
  const classifier = createCachingClaimClassifier({ AI: ai }, NOW)
  const items = [issue([selfComment("I'll open a PR")])]
  await enrichIssueClassifications(items, classifier)
  assert.equal(items[0]!.activities[0]!.classification?.intent, 'claim')
  assert.equal(items[0]!.activities[0]!.classification?.intentConfidence, 0.92)
  assert.equal(runs.length, 1)
  assert.equal((runs[0] as { model: string }).model, CLEF_MODEL)
})

it('classifies ask intent for permission questions', async () => {
  const ai: AiBinding = {
    run: async () => ({
      answers: {
        intent: {
          probabilities: { claim: 0.05, ask: 0.88, withdraw: 0.01, none: 0.06 },
        },
      },
    }),
  }
  const classifier = createCachingClaimClassifier({ AI: ai }, NOW)
  const items = [issue([selfComment('Can I take this?')])]
  await enrichIssueClassifications(items, classifier)
  const verdict = judge(items[0]!, NOW)
  assert.equal(verdict.turn, 'maintainer')
})

it('classifies withdraw intent and invalidates the claim', async () => {
  const ai: AiBinding = {
    run: async () => ({
      answers: {
        intent: {
          probabilities: { claim: 0.02, ask: 0.01, withdraw: 0.9, none: 0.07 },
        },
      },
    }),
  }
  const classifier = createCachingClaimClassifier({ AI: ai }, NOW)
  const items = [issue([selfComment('go ahead without me')])]
  await enrichIssueClassifications(items, classifier)
  assert.equal(claimLevel(items[0]!), null)
})

it('caps confirmed claims when intent confidence is below 0.7', async () => {
  const ai: AiBinding = {
    run: async (_model, input) => {
      const role = (input.state as { focus_comment?: { role?: string } }).focus_comment?.role
      if (role === 'maintainer') {
        return { answers: { maintainer_ok: 0.95 } }
      }
      return {
        answers: {
          intent: {
            probabilities: { claim: 0.55, ask: 0.1, withdraw: 0.05, none: 0.3 },
          },
        },
      }
    },
  }
  const classifier = createCachingClaimClassifier({ AI: ai }, NOW)
  const items = [
    issue([
      selfComment("I'll open a PR", {
        at: ago(2 * DAY_MS),
        commentId: 'c1',
        updatedAt: ago(2 * DAY_MS),
      }),
      {
        kind: 'comment',
        at: ago(DAY_MS),
        actor: user('pi0'),
        body: 'Sounds good',
        authorAssociation: 'MEMBER',
        commentId: 'c2',
        updatedAt: ago(DAY_MS),
        url: 'https://github.com/unjs/h3/issues/100#issuecomment-2',
      },
    ]),
  ]
  await enrichIssueClassifications(items, classifier)
  assert.equal(claimLevel(items[0]!), 'self-claimed')
})

it('falls back to keyword rules when the model errors', async () => {
  const ai: AiBinding = {
    run: async () => {
      throw new Error('Workers AI unavailable')
    },
  }
  const classifier = createCachingClaimClassifier(
    { AI: ai, CACHE: { get: async () => null, put: async () => {} } },
    NOW,
  )
  const items = [issue([selfComment("I'll open a PR")])]
  await enrichIssueClassifications(items, classifier)
  assert.equal(items[0]!.activities[0]!.classification?.source, 'keyword')
  assert.equal(claimLevel(items[0]!), 'self-claimed')
})

it('reuses KV cache entries keyed by comment id and updated_at', async () => {
  let calls = 0
  const memory = new Map<string, string>()
  const store = {
    get: async (key: string) => memory.get(key) ?? null,
    put: async (key: string, value: string) => {
      memory.set(key, value)
    },
  }
  const ai: AiBinding = {
    run: async () => {
      calls += 1
      return {
        answers: {
          intent: {
            probabilities: { claim: 0.91, ask: 0.02, withdraw: 0.01, none: 0.06 },
          },
        },
      }
    },
  }
  const classifier = createCachingClaimClassifier({ AI: ai, CACHE: store }, NOW)
  const comment = selfComment("I'll open a PR")
  const items = [issue([comment])]
  await enrichIssueClassifications(items, classifier)
  await enrichIssueClassifications(items, classifier)
  assert.equal(calls, 1)
  const key = cacheKeyForComment(comment.commentId!, comment.updatedAt!)
  assert.equal(memory.has(key), true)
  assert.equal(items[0]!.activities[0]!.classification?.source, 'cache')
})
