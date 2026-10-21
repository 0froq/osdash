import assert from 'node:assert/strict'
import { it } from 'vite-plus/test'
import type { CacheStore } from './cache'
import { encryptString } from './crypto'
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

it('reads a legacy session record that has no name', async () => {
  const store = memoryStore()
  const encrypted = await encryptString(
    SECRET,
    JSON.stringify({
      login: 'alice',
      token: 'token-a',
      createdAt: '2026-01-01T00:00:00.000Z',
    }),
  )
  await store.put('session:v1:legacy', encrypted)
  const user = await readSession(store, SECRET, 'legacy')
  assert.equal(user?.login, 'alice')
  assert.equal(user?.token, 'token-a')
  assert.equal(user?.name, undefined)
  assert.equal(user?.avatarUrl, undefined)
})

it('round-trips name and avatar on a new session', async () => {
  const store = memoryStore()
  const id = await createSession(store, SECRET, {
    login: 'alice',
    token: 'token-a',
    name: 'Alice',
    avatarUrl: 'https://avatars.githubusercontent.com/u/1',
  })
  const user = await readSession(store, SECRET, id)
  assert.equal(user?.name, 'Alice')
  assert.equal(user?.avatarUrl, 'https://avatars.githubusercontent.com/u/1')
})
