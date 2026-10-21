import assert from 'node:assert/strict'
import { it } from 'vite-plus/test'
import type { CacheStore } from './cache'
import { createSession, destroySession, readSession } from './session-store'

const SECRET = 'session-secret-for-tests'

function memoryStore(): CacheStore {
  const data = new Map<string, string>()
  return {
    async get(key) {
      return data.get(key) ?? null
    },
    async put(key, value) {
      if (value === '') data.delete(key)
      else data.set(key, value)
    },
  }
}

it('stores encrypted sessions per id and isolates users', async () => {
  const store = memoryStore()
  const aliceId = await createSession(store, SECRET, { login: 'alice', token: 'token-a' })
  const bobId = await createSession(store, SECRET, { login: 'bob', token: 'token-b' })

  const alice = await readSession(store, SECRET, aliceId)
  const bob = await readSession(store, SECRET, bobId)
  assert.deepEqual(alice, { login: 'alice', token: 'token-a' })
  assert.deepEqual(bob, { login: 'bob', token: 'token-b' })

  await destroySession(store, aliceId)
  assert.equal(await readSession(store, SECRET, aliceId), null)
  assert.deepEqual(await readSession(store, SECRET, bobId), { login: 'bob', token: 'token-b' })
})
