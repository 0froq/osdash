import assert from 'node:assert/strict'
import { it } from 'vite-plus/test'
import { inboxCacheKey, readInboxCache } from './inbox-response'

it('ignores inbox caches that predate verified fixing targets', async () => {
  const old = JSON.stringify({ generatedAt: '2026-10-25T00:00:00Z', units: [], truncated: false })
  const data = new Map([['inbox:v1:alice', old]])
  const store = {
    get: async (key: string) => data.get(key) ?? null,
    put: async (key: string, value: string) => {
      data.set(key, value)
    },
  }
  assert.equal(inboxCacheKey('Alice'), 'inbox:v2:alice')
  assert.equal(await readInboxCache(store, 'Alice', Date.now()), null)
  data.set(inboxCacheKey('Alice'), old)
  assert.equal((await readInboxCache(store, 'Alice', Date.now()))?.truncated, false)
})
