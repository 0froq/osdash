import assert from 'node:assert/strict'
import { it } from 'vite-plus/test'
import type { CacheStore } from './cache'
import { clefEnabledForUser, readByok, usesWorkersAiClef, writeByok } from './byok'

const SECRET = 'byok-secret-for-tests'

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

it('enables Workers AI clef only for 0froq', () => {
  assert.equal(usesWorkersAiClef('0froq'), true)
  assert.equal(usesWorkersAiClef('0FroQ'), true)
  assert.equal(usesWorkersAiClef('alice'), false)
})

it('enables clef for 0froq without BYOK and for others only with BYOK', () => {
  assert.equal(clefEnabledForUser('0froq', null), true)
  assert.equal(clefEnabledForUser('alice', null), false)
  assert.equal(
    clefEnabledForUser('alice', {
      baseUrl: 'https://api.example.com/v1',
      apiKey: 'k',
      model: 'm',
    }),
    true,
  )
})

it('stores BYOK settings per login in KV', async () => {
  const store = memoryStore()
  await writeByok(store, SECRET, 'alice', {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: 'sk-test',
    model: 'gpt-4o-mini',
  })
  const alice = await readByok(store, SECRET, 'alice')
  assert.equal(alice?.model, 'gpt-4o-mini')
  assert.equal(await readByok(store, SECRET, 'bob'), null)
})
