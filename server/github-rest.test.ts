import assert from 'node:assert/strict'
import { it } from 'vite-plus/test'
import type { CacheStore } from './cache'
import { enrichItemsFromRest, eventsCacheKey } from './github-rest'
import type { Item } from '../shared/turn'

const NOW = Date.parse('2026-10-19T12:00:00.000Z')

function memoryStore(): CacheStore & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    async get(key) {
      return data.get(key) ?? null
    },
    async put(key, value) {
      data.set(key, value)
    },
  }
}

function item(overrides: Partial<Item> = {}): Item {
  return {
    kind: 'pr',
    repo: 'acme/app',
    number: 12,
    title: 'fix',
    url: 'https://github.com/acme/app/pull/12',
    state: 'open',
    createdAt: '2026-10-01T00:00:00.000Z',
    closedAt: null,
    author: { typename: 'User', login: 'octo-dev' },
    activities: [],
    checks: [],
    updatedAt: '2026-10-18T00:00:00.000Z',
    headSha: 'abc',
    viewerLogin: 'octo-dev',
    ...overrides,
  }
}

it('does not add a fetch when GraphQL already returned timeline links', async () => {
  let calls = 0
  const original = globalThis.fetch
  globalThis.fetch = async () => {
    calls += 1
    return new Response(JSON.stringify({ check_runs: [] }), { status: 200 })
  }
  try {
    await enrichItemsFromRest(
      'token',
      'octo-dev',
      [
        item({
          timelineLinks: [
            { event: 'cross-referenced', repo: 'acme/app', number: 4, kind: 'issue' },
          ],
        }),
      ],
      memoryStore(),
      NOW,
      false,
    )
  } finally {
    globalThis.fetch = original
  }
  assert.equal(calls, 1)
})

it('writes normalized events from the same timeline fetch', async () => {
  let calls = 0
  const original = globalThis.fetch
  globalThis.fetch = async input => {
    calls += 1
    const url = String(input)
    if (url.includes('/timeline')) {
      return new Response(
        JSON.stringify([
          {
            id: 1,
            event: 'commented',
            created_at: '2026-10-18T00:00:00.000Z',
            actor: { login: 'patak', type: 'User' },
            body: 'Hello',
          },
        ]),
        { status: 200 },
      )
    }
    return new Response(JSON.stringify({ check_runs: [] }), { status: 200 })
  }
  const store = memoryStore()
  try {
    await enrichItemsFromRest('token', 'octo-dev', [item({ timelineLinks: [] })], store, NOW, false)
  } finally {
    globalThis.fetch = original
  }
  assert.equal(calls, 2)
  const key = eventsCacheKey('octo-dev', 'acme/app', 12, '2026-10-18T00:00:00.000Z')
  const cached = store.data.get(key)
  assert.ok(cached)
  const events = JSON.parse(cached) as Array<{ kind: string }>
  assert.equal(events[0]?.kind, 'comment')
})
