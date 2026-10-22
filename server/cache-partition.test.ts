import assert from 'node:assert/strict'
import { it } from 'vite-plus/test'
import type { CacheStore } from './cache'
import { enrichItemsFromRest, eventsCacheKey } from './github-rest'
import { mockUnits } from './mock'
import { assembleTimeline, reviewCommentsCacheKey } from './timeline-response'
import type { UnitEvent } from '../shared/events'
import type { Item } from '../shared/turn'
import type { Unit } from '../shared/unit'

const NOW = Date.parse('2026-10-19T12:00:00.000Z')
const UPDATED = '2026-10-18T00:00:00.000Z'

function recordingStore(seed?: Iterable<[string, string]>): CacheStore & {
  data: Map<string, string>
  reads: string[]
} {
  const data = new Map(seed)
  const reads: string[] = []
  return {
    data,
    reads,
    async get(key) {
      reads.push(key)
      return data.get(key) ?? null
    },
    async put(key, value) {
      if (value === '') data.delete(key)
      else data.set(key, value)
    },
  }
}

function leakEvent(): UnitEvent {
  return {
    id: 'alice-private',
    kind: 'comment',
    at: UPDATED,
    actor: { typename: 'User', login: 'alice' },
    source: { repo: 'private/repo', number: 7, kind: 'pr' },
    excerpt: 'alice-private',
    bot: null,
  }
}

function privateUnit(): Unit {
  const base = mockUnits(NOW).find(entry => entry.kind === 'pr')!
  return {
    ...structuredClone(base),
    id: 'pr:private/repo#7',
    repo: 'private/repo',
    number: 7,
    members: [{ repo: 'private/repo', number: 7, kind: 'pr', updatedAt: UPDATED, headSha: 'abc' }],
  }
}

function item(): Item {
  return {
    kind: 'pr',
    repo: 'private/repo',
    number: 7,
    title: 'secret',
    url: 'https://github.com/private/repo/pull/7',
    state: 'open',
    createdAt: '2026-10-01T00:00:00.000Z',
    closedAt: null,
    author: { typename: 'User', login: 'alice' },
    activities: [],
    checks: [],
    updatedAt: UPDATED,
    headSha: 'abc',
    viewerLogin: 'alice',
    timelineLinks: [],
  }
}

it('includes the viewer login in events and review-comment keys', () => {
  assert.equal(
    eventsCacheKey('Octo-Dev', 'private/repo', 7, UPDATED),
    `events:v1:octo-dev:private/repo#7:${UPDATED}`,
  )
  assert.equal(
    reviewCommentsCacheKey('Octo-Dev', 'private/repo', 7, UPDATED),
    `revcomments:v1:octo-dev:private/repo#7:${UPDATED}`,
  )
  assert.notEqual(
    eventsCacheKey('alice', 'private/repo', 7, UPDATED),
    eventsCacheKey('bob', 'private/repo', 7, UPDATED),
  )
  assert.notEqual(
    reviewCommentsCacheKey('alice', 'private/repo', 7, UPDATED),
    reviewCommentsCacheKey('bob', 'private/repo', 7, UPDATED),
  )
  assert.throws(() => eventsCacheKey(' ', 'private/repo', 7, UPDATED), /viewerLogin missing/)
  assert.throws(
    () => reviewCommentsCacheKey('', 'private/repo', 7, undefined),
    /viewerLogin missing/,
  )
})

it('writes timeline events under the viewer key only', async () => {
  const original = globalThis.fetch
  globalThis.fetch = async input => {
    const url = String(input)
    if (url.includes('/timeline')) {
      return new Response(
        JSON.stringify([
          {
            id: 1,
            event: 'commented',
            created_at: UPDATED,
            actor: { login: 'alice', type: 'User' },
            body: 'alice-private',
          },
        ]),
        { status: 200 },
      )
    }
    return new Response(JSON.stringify({ check_runs: [] }), { status: 200 })
  }
  const store = recordingStore()
  try {
    await enrichItemsFromRest('token-alice', 'Alice', [item()], store, NOW, false)
  } finally {
    globalThis.fetch = original
  }
  const aliceKey = eventsCacheKey('alice', 'private/repo', 7, UPDATED)
  const eventKeys = [...store.data.keys()].filter(key => key.startsWith('events:v1:'))
  assert.deepEqual(eventKeys, [aliceKey])
  assert.match(store.data.get(aliceKey) ?? '', /alice-private/)
  assert.equal(store.data.has(`events:v1:private/repo#7:${UPDATED}`), false)
})

it('does not read another viewer or an unscoped timeline cache', async () => {
  const aliceEvents = eventsCacheKey('alice', 'private/repo', 7, UPDATED)
  const aliceReviews = reviewCommentsCacheKey('alice', 'private/repo', 7, UPDATED)
  const sharedEvents = `events:v1:private/repo#7:${UPDATED}`
  const sharedReviews = `revcomments:v1:private/repo#7:${UPDATED}`
  const leak = JSON.stringify([leakEvent()])
  const store = recordingStore([
    [aliceEvents, leak],
    [aliceReviews, leak],
    [sharedEvents, leak],
    [sharedReviews, leak],
    ['ciev:v1:alice:private/repo:abc', '[]'],
  ])
  const urls: string[] = []
  const original = globalThis.fetch
  globalThis.fetch = async input => {
    const url = String(input)
    urls.push(url)
    if (url.includes('/timeline')) {
      return new Response(
        JSON.stringify([
          {
            id: 9,
            event: 'commented',
            created_at: UPDATED,
            actor: { login: 'bob', type: 'User' },
            body: 'bob-visible',
          },
        ]),
        { status: 200 },
      )
    }
    if (url.includes('/comments')) {
      return new Response(JSON.stringify([]), { status: 200 })
    }
    return new Response(JSON.stringify({ check_runs: [] }), { status: 200 })
  }
  try {
    const asAlice = await assembleTimeline({
      token: 'token-alice',
      login: 'Alice',
      unit: privateUnit(),
      store,
      nowMs: NOW,
      fresh: false,
    })
    assert.ok(asAlice)
    assert.match(JSON.stringify(asAlice.entries), /alice-private/)
    assert.deepEqual(
      urls.map(url => new URL(url).pathname),
      [],
    )

    urls.length = 0
    store.reads.length = 0
    const asBob = await assembleTimeline({
      token: 'token-bob',
      login: 'bob',
      unit: privateUnit(),
      store,
      nowMs: NOW,
      fresh: false,
    })
    assert.ok(asBob)
    const body = JSON.stringify(asBob.entries)
    assert.match(body, /bob-visible/)
    assert.equal(body.includes('alice-private'), false)
    assert.equal(store.reads.includes(aliceEvents), false)
    assert.equal(store.reads.includes(aliceReviews), false)
    assert.equal(store.reads.includes(sharedEvents), false)
    assert.equal(store.reads.includes(sharedReviews), false)
    assert.equal(store.data.get(aliceEvents), leak)
    assert.equal(store.data.has(eventsCacheKey('bob', 'private/repo', 7, UPDATED)), true)
    assert.equal(store.data.has(reviewCommentsCacheKey('bob', 'private/repo', 7, UPDATED)), true)
  } finally {
    globalThis.fetch = original
  }
})
